const GITHUB_API = 'https://api.github.com'

export interface MonthlyStats {
  username: string
  avatarUrl: string
  name: string
  month: number
  year: number
  commits: number
  pullRequests: number
  reposContributed: number
  topLanguage: string | null
  topLanguageColor: string | null
  topRepo: string | null
  followers: number
  totalStars: number
  dailyCommits: number[]
}

function dateRange(month: number, year: number) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { from, to }
}

async function ghFetch(url: string, token?: string, extraInit?: RequestInit) {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'github-wrapped-app',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { headers, ...extraInit })
  return res
}

export async function fetchMonthlyStats(
  username: string,
  month: number,
  year: number,
  token?: string
): Promise<MonthlyStats> {
  const { from, to } = dateRange(month, year)

  // Fetch user profile
  const userRes = await ghFetch(`${GITHUB_API}/users/${username}`, token, { cache: 'no-store' })
  if (!userRes.ok) {
    if (userRes.status === 404) throw new Error(`GitHub user "${username}" not found`)
    throw new Error(`GitHub API error: ${userRes.status}`)
  }
  const user = await userRes.json()

  // Commits via search (needs special Accept header)
  const commitSearchHeaders: Record<string, string> = {
    Accept: 'application/vnd.github.cloak-preview+json',
    'User-Agent': 'github-wrapped-app',
  }
  if (token) commitSearchHeaders['Authorization'] = `Bearer ${token}`

  const [commitsRes, prsRes, commitsDetailRes, reposRes] = await Promise.all([
    fetch(
      `${GITHUB_API}/search/commits?q=author:${username}+committer-date:${from}..${to}&per_page=1`,
      { headers: commitSearchHeaders, cache: 'no-store' }
    ),
    ghFetch(
      `${GITHUB_API}/search/issues?q=author:${username}+type:pr+created:${from}..${to}&per_page=1`,
      token
    ),
    fetch(
      `${GITHUB_API}/search/commits?q=author:${username}+committer-date:${from}..${to}&per_page=100&sort=author-date&order=desc`,
      { headers: commitSearchHeaders, cache: 'no-store' }
    ),
    ghFetch(`${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated`, token, { cache: 'no-store' })
  ])

  const [commitsDataBody, prsDataBody, commitsDetailBody, reposData] = await Promise.all([
    commitsRes.json(),
    prsRes.json(),
    commitsDetailRes.json(),
    reposRes.ok ? reposRes.json() : []
  ])

  const commits: number = commitsDataBody.total_count ?? 0
  const pullRequests: number = prsDataBody.total_count ?? 0
  const followers: number = user.followers ?? 0
  const totalStars: number = (reposData as { stargazers_count?: number }[]).reduce((acc, repo) => acc + (repo.stargazers_count ?? 0), 0)

  // Calculate daily commits for the heatmap - Fetch ALL commits for the month by paginating if necessary
  const lastDay = new Date(year, month, 0).getDate()
  const dailyCommits = new Array(lastDay).fill(0)

  // We already fetched the first page of up to 100 commits.
  let allItems = commitsDetailBody.items ?? []

  // If there are more than 100 commits, we need to fetch the rest to get an accurate heatmap
  const totalCommits = commitsDataBody.total_count ?? 0;
  if (totalCommits > 100) {
    const totalPages = Math.ceil(totalCommits / 100);
    // Fetch up to 5 pages (500 commits max) to avoid hitting rate limits too hard
    const pagesToFetch = Math.min(totalPages, 5);
    const fetchPromises = [];
    for (let p = 2; p <= pagesToFetch; p++) {
      fetchPromises.push(
        fetch(
          `${GITHUB_API}/search/commits?q=author:${username}+committer-date:${from}..${to}&per_page=100&page=${p}&sort=author-date&order=desc`,
          { headers: commitSearchHeaders, cache: 'no-store' }
        ).then(res => res.json())
      );
    }
    const extraPages = await Promise.all(fetchPromises);
    for (const pageBody of extraPages) {
      if (pageBody.items) {
        allItems = allItems.concat(pageBody.items);
      }
    }
  }

  for (const item of allItems) {
    const dateStr = item.commit?.author?.date
    if (dateStr) {
      const d = new Date(dateStr)
      // Check if it falls within the requested month/year
      if (d.getMonth() + 1 === month && d.getFullYear() === year) {
        const day = d.getDate()
        if (day >= 1 && day <= lastDay) {
          dailyCommits[day - 1]++
        }
      }
    }
  }

  // Tally commits per repo from search results
  const repoCommits: Record<string, { count: number; fullName: string }> = {}
  for (const item of allItems) {
    const name: string = item.repository?.name
    const fullName: string = item.repository?.full_name
    if (name && fullName) {
      if (!repoCommits[name]) repoCommits[name] = { count: 0, fullName }
      repoCommits[name].count++
    }
  }

  const reposContributed = Object.keys(repoCommits).length
  const topRepoEntry = Object.entries(repoCommits).sort(([, a], [, b]) => b.count - a.count)[0]
  const topRepo = topRepoEntry?.[0] ?? null
  const topRepoFullName = topRepoEntry?.[1].fullName ?? null

  // Get top language from the top repo
  let topLanguage: string | null = null
  let topLanguageColor: string | null = null

  if (topRepoFullName) {
    const langRes = await ghFetch(`${GITHUB_API}/repos/${topRepoFullName}/languages`, token, { cache: 'no-store' })
    if (langRes.ok) {
      const langs = await langRes.json()
      const top = Object.entries(langs).sort(([, a], [, b]) => (b as number) - (a as number))[0]
      if (top) {
        topLanguage = top[0]
        topLanguageColor = LANGUAGE_COLORS[topLanguage] ?? '#6e7681'
      }
    }
  }

  return {
    username: user.login,
    avatarUrl: user.avatar_url,
    name: user.name ?? user.login,
    month,
    year,
    commits,
    pullRequests,
    reposContributed,
    topLanguage,
    topLanguageColor,
    topRepo,
    followers,
    totalStars,
    dailyCommits,
  }
}

export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  PHP: '#4F5D95',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Dart: '#00B4AB',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Scala: '#c22d40',
  Lua: '#000080',
  R: '#198CE7',
  Zig: '#ec915c',
}
