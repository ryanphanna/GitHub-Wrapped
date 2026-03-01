'use client'

import { useState } from 'react'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const now = new Date()
const CURRENT_MONTH = now.getMonth() + 1
const CURRENT_YEAR = now.getFullYear()
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]

export default function Home() {
  const [username, setUsername] = useState('')
  const [month, setMonth] = useState(CURRENT_MONTH)
  const [year, setYear] = useState(CURRENT_YEAR)
  const [cardUrl, setCardUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    if (!username.trim()) return
    setLoading(true)
    setError(null)
    setCardUrl(null)

    const url = `/api/card?username=${encodeURIComponent(username.trim())}&month=${month}&year=${year}`
    try {
      const res = await fetch(url)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to generate card')
      }
      setCardUrl(url)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function download() {
    if (!cardUrl) return
    const a = document.createElement('a')
    a.href = cardUrl
    a.download = `github-wrapped-${username}-${MONTHS[month - 1]}-${year}.png`
    a.click()
  }

  return (
    <main className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <svg height="28" viewBox="0 0 16 16" className="fill-[#39d353]" aria-hidden="true">
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
            </svg>
            <span className="text-[#39d353] font-bold text-lg tracking-wide">GitHub Wrapped</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Your month in code</h1>
          <p className="text-[#7d8590] text-sm">Generate a shareable card for any month</p>
        </div>

        {/* Form */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 mb-6">
          <div className="mb-5">
            <label className="block text-xs font-semibold text-[#7d8590] uppercase tracking-widest mb-2">
              GitHub Username
            </label>
            <div className="flex items-center bg-[#0d1117] border border-[#30363d] rounded-lg focus-within:border-[#39d353] transition-colors">
              <span className="pl-4 text-[#484f58] select-none">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generate()}
                placeholder="your-username"
                className="flex-1 bg-transparent px-3 py-3 text-[#e6edf3] placeholder-[#484f58] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="block text-xs font-semibold text-[#7d8590] uppercase tracking-widest mb-2">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-3 text-[#e6edf3] focus:outline-none focus:border-[#39d353] transition-colors cursor-pointer"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#7d8590] uppercase tracking-widest mb-2">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-3 text-[#e6edf3] focus:outline-none focus:border-[#39d353] transition-colors cursor-pointer"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={!username.trim() || loading}
            className="w-full bg-[#238636] hover:bg-[#2ea043] active:bg-[#238636] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating...
              </span>
            ) : (
              'Generate Card'
            )}
          </button>

          {error && (
            <p className="mt-4 text-red-400 text-sm text-center bg-red-400/10 rounded-lg py-2 px-3">{error}</p>
          )}
        </div>

        {/* Card Preview */}
        {cardUrl && (
          <div className="flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cardUrl}
              alt="GitHub Wrapped Card"
              className="w-full rounded-2xl shadow-2xl border border-[#30363d]"
            />
            <button
              onClick={download}
              className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] hover:border-[#39d353] hover:text-[#39d353] text-[#e6edf3] font-semibold px-8 py-3 rounded-lg transition-colors text-sm"
            >
              <svg height="16" viewBox="0 0 16 16" className="fill-current" aria-hidden="true">
                <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z" />
                <path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.97a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.779a.749.749 0 1 1 1.06-1.06l1.97 1.97Z" />
              </svg>
              Save Image
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
