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

export interface YearlyStats {
  username: string
  avatarUrl: string
  name: string
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
  bestMonth: number
  bestMonthCommits: number
}
