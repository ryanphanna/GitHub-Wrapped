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
}

function dateRange(month: number, year: number) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { from, to }
}

async function ghFetch(url: string, token?: string) {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'github-wrapped-app',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { headers })
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
  const userRes = await ghFetch(`${GITHUB_API}/users/${username}`, token)
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

  const [commitsRes, prsRes, commitsDetailRes] = await Promise.all([
    fetch(
      `${GITHUB_API}/search/commits?q=author:${username}+committer-date:${from}..${to}&per_page=1`,
      { headers: commitSearchHeaders }
    ),
    ghFetch(
      `${GITHUB_API}/search/issues?q=author:${username}+type:pr+created:${from}..${to}&per_page=1`,
      token
    ),
    fetch(
      `${GITHUB_API}/search/commits?q=author:${username}+committer-date:${from}..${to}&per_page=30&sort=author-date&order=desc`,
      { headers: commitSearchHeaders }
    ),
  ])

  const [commitsData, prsData, commitsDetail] = await Promise.all([
    commitsRes.json(),
    prsRes.json(),
    commitsDetailRes.json(),
  ])

  const commits: number = commitsData.total_count ?? 0
  const pullRequests: number = prsData.total_count ?? 0

  // Tally commits per repo from search results
  const repoCommits: Record<string, { count: number; fullName: string }> = {}
  for (const item of commitsDetail.items ?? []) {
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
    const langRes = await ghFetch(`${GITHUB_API}/repos/${topRepoFullName}/languages`, token)
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
