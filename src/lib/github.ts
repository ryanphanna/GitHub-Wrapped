import { MONTHS } from '@/lib/themes'
import type { MonthlyStats, YearlyStats } from '@/lib/types'
import LANGUAGE_COLORS_JSON from '@/lib/language-colors.json'

const LANGUAGE_COLORS: Record<string, string> = LANGUAGE_COLORS_JSON

export type { MonthlyStats, YearlyStats }

const GITHUB_API = 'https://api.github.com'
const GITHUB_USERNAME_PATTERN = /^[a-z\d](?:[a-z\d-]{0,38})$/i

export function isValidGitHubUsername(username: string): boolean {
  return GITHUB_USERNAME_PATTERN.test(username)
}

function normalizeGitHubUsername(username: string): string {
  const normalized = username.trim()
  if (!isValidGitHubUsername(normalized)) {
    throw new Error('Invalid GitHub username')
  }
  return normalized
}

function githubUrl(pathname: string, params?: Record<string, string>): URL {
  const url = new URL(pathname, GITHUB_API)
  if (url.origin !== GITHUB_API) {
    throw new Error('Invalid GitHub API URL')
  }
  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value)
  }
  return url
}

// In-memory cache for monthly and yearly stats. Module-level state persists
// between requests on the same Next.js server instance.
const MONTHLY_STATS_TTL = 60 * 60 * 1000 // 1 hour in ms
const monthlyStatsCache = new Map<string, { data: MonthlyStats; cachedAt: number }>()

const YEARLY_STATS_TTL = 60 * 60 * 1000 // 1 hour in ms
const yearlyStatsCache = new Map<string, { data: YearlyStats; cachedAt: number }>()

function dateRange(month: number, year: number) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { from, to }
}

async function ghFetch(url: URL, token?: string, extraInit?: RequestInit) {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'github-wrapped-app',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { headers, ...extraInit })
  return res
}

async function ghFetchWithBackoff(
  url: URL,
  token?: string,
  extraInit?: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let delay = 1000
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await ghFetch(url, token, extraInit)
    if (res.status !== 429 && res.status !== 403) return res
    if (attempt === maxRetries) return res
    const retryAfter = res.headers.get('retry-after')
    const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay
    await new Promise(resolve => setTimeout(resolve, waitMs))
    delay *= 2
  }
  // unreachable, but satisfies TypeScript
  return ghFetch(url, token, extraInit)
}

export async function fetchMonthlyStats(
  username: string,
  month: number,
  year: number,
  token?: string,
  timezone = 'UTC'
): Promise<MonthlyStats> {
  const safeUsername = normalizeGitHubUsername(username)
  const encodedUsername = encodeURIComponent(safeUsername)
  const cacheKey = `${safeUsername}-${year}-${month}`
  const cached = monthlyStatsCache.get(cacheKey)
  if (cached && Date.now() - cached.cachedAt < MONTHLY_STATS_TTL) {
    return cached.data
  }

  const { from, to } = dateRange(month, year)

  // Fetch user profile
  const userRes = await ghFetchWithBackoff(githubUrl(`/users/${encodedUsername}`), token, { cache: 'no-store' })
  if (!userRes.ok) {
    if (userRes.status === 404) throw new Error(`GitHub user "${username}" not found`)
    if (userRes.status === 403) throw new Error('GitHub API rate limit reached — add a GitHub token to increase your limit')
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
    fetch(githubUrl('/search/commits', {
      q: `author:${safeUsername} committer-date:${from}..${to}`,
      per_page: '1',
    }), { headers: commitSearchHeaders, cache: 'no-store' }),
    ghFetchWithBackoff(githubUrl('/search/issues', {
      q: `author:${safeUsername} type:pr created:${from}..${to}`,
      per_page: '1',
    }), token),
    fetch(githubUrl('/search/commits', {
      q: `author:${safeUsername} committer-date:${from}..${to}`,
      per_page: '100',
      sort: 'author-date',
      order: 'desc',
    }), { headers: commitSearchHeaders, cache: 'no-store' }),
    ghFetchWithBackoff(githubUrl(`/users/${encodedUsername}/repos`, {
      per_page: '100',
      sort: 'updated',
    }), token, { cache: 'no-store' })
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
        fetch(githubUrl('/search/commits', {
          q: `author:${safeUsername} committer-date:${from}..${to}`,
          per_page: '100',
          page: String(p),
          sort: 'author-date',
          order: 'desc',
        }), { headers: commitSearchHeaders, cache: 'no-store' }).then(res => res.json())
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
      // Convert the UTC instant to the requested timezone to get the local date
      const localParts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(d)
      const localYear = parseInt(localParts.find(p => p.type === 'year')!.value, 10)
      const localMonth = parseInt(localParts.find(p => p.type === 'month')!.value, 10)
      const localDay = parseInt(localParts.find(p => p.type === 'day')!.value, 10)
      if (localMonth === month && localYear === year) {
        if (localDay >= 1 && localDay <= lastDay) {
          dailyCommits[localDay - 1]++
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
    const [owner, repo] = topRepoFullName.split('/')
    if (owner && repo && isValidGitHubUsername(owner) && /^[a-zA-Z0-9_.-]+$/.test(repo)) {
      const langRes = await ghFetchWithBackoff(
        githubUrl(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`),
        token,
        { cache: 'no-store' }
      )
      if (langRes.ok) {
        const langs = await langRes.json()
        const top = (Object.entries(langs) as [string, number][]).sort(([, a], [, b]) => b - a)[0]
        if (top) {
          topLanguage = top[0]
          topLanguageColor = LANGUAGE_COLORS[topLanguage] ?? '#6e7681'
        }
      }
    }
  }

  if (commits === 0 && pullRequests === 0) {
    throw new Error(`No GitHub activity found for ${username} in ${MONTHS[month - 1]} ${year}`)
  }

  const result: MonthlyStats = {
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

  monthlyStatsCache.set(cacheKey, { data: result, cachedAt: Date.now() })
  return result
}

export async function fetchYearlyStats(
  username: string,
  year: number,
  token?: string
): Promise<YearlyStats> {
  const cacheKey = `${username}-${year}`
  const cached = yearlyStatsCache.get(cacheKey)
  if (cached && Date.now() - cached.cachedAt < YEARLY_STATS_TTL) {
    return cached.data
  }

  const months = await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      fetchMonthlyStats(username, i + 1, year, token).catch(() => null)
    )
  )

  const validMonths = months.filter(Boolean) as MonthlyStats[]
  if (validMonths.length === 0) throw new Error(`No data found for ${username} in ${year}`)

  const first = validMonths[0]

  const commits = validMonths.reduce((sum, m) => sum + m.commits, 0)
  const pullRequests = validMonths.reduce((sum, m) => sum + m.pullRequests, 0)
  const reposContributed = validMonths.reduce((sum, m) => sum + m.reposContributed, 0)

  // Best month by commit count
  const bestMonthIndex = validMonths.reduce(
    (best, m, i) => (m.commits > validMonths[best].commits ? i : best),
    0
  )
  const bestMonth = validMonths[bestMonthIndex].month
  const bestMonthCommits = validMonths[bestMonthIndex].commits

  // Top language — pick whichever appeared most across months
  const langCounts: Record<string, number> = {}
  for (const m of validMonths) {
    if (m.topLanguage) langCounts[m.topLanguage] = (langCounts[m.topLanguage] ?? 0) + 1
  }
  const topLanguageEntry = Object.entries(langCounts).sort(([, a], [, b]) => b - a)[0]
  const topLanguage = topLanguageEntry?.[0] ?? null
  const topLanguageColor = topLanguage ? (LANGUAGE_COLORS[topLanguage] ?? '#6e7681') : null

  // Top repo — pick by total commits across all months
  const repoCounts: Record<string, number> = {}
  for (const m of validMonths) {
    if (m.topRepo) repoCounts[m.topRepo] = (repoCounts[m.topRepo] ?? 0) + m.commits
  }
  const topRepo = Object.entries(repoCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null

  // Build 365-element dailyCommits array (Jan 1 = index 0)
  const dailyCommits: number[] = []
  for (let m = 1; m <= 12; m++) {
    const monthStats = months[m - 1]
    const daysInMonth = new Date(year, m, 0).getDate()
    if (monthStats) {
      for (let d = 0; d < daysInMonth; d++) {
        dailyCommits.push(monthStats.dailyCommits[d] ?? 0)
      }
    } else {
      for (let d = 0; d < daysInMonth; d++) {
        dailyCommits.push(0)
      }
    }
  }

  const result: YearlyStats = {
    username: first.username,
    avatarUrl: first.avatarUrl,
    name: first.name,
    year,
    commits,
    pullRequests,
    reposContributed,
    topLanguage,
    topLanguageColor,
    topRepo,
    followers: first.followers,
    totalStars: first.totalStars,
    dailyCommits,
    bestMonth,
    bestMonthCommits,
  }

  yearlyStatsCache.set(cacheKey, { data: result, cachedAt: Date.now() })
  return result
}

export { LANGUAGE_COLORS }
