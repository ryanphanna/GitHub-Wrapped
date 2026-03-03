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
  const [theme, setTheme] = useState('midnight')
  const [cardUrl, setCardUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    if (!username.trim()) return
    setLoading(true)
    setError(null)
    setCardUrl(null)

    const url = `/api/card?username=${encodeURIComponent(username.trim())}&month=${month}&year=${year}&theme=${theme}`
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
    a.download = `github-wrapped-${username}-${MONTHS[month - 1]}-${year}-${theme}.png`
    a.click()
  }

  const shareText = `Check out my GitHub Wrapped for ${MONTHS[month - 1]} ${year}! 🚀`
  // Social share URLs - we points to the current URL, but ideally it would be the card image if hosted
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`

  return (
    <main className="min-h-screen text-[#e6edf3] flex flex-col items-center justify-center p-6" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(57, 211, 83, 0.09) 0%, transparent 65%), #0d1117' }}>
      <div className="w-full max-w-md my-12">
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
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 mb-6" style={{ boxShadow: '0 0 0 1px rgba(57, 211, 83, 0.04), 0 24px 64px rgba(0,0,0,0.5)' }}>
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

          <div className="mb-6">
            <label className="block text-xs font-semibold text-[#7d8590] uppercase tracking-widest mb-3">Theme</label>
            <div className="flex gap-3">
              {[
                { id: 'midnight', color: '#39d353', label: 'Midnight' },
                { id: 'gold', color: '#ffd700', label: 'Gold' },
                { id: 'cyberpunk', color: '#ff00ff', label: 'Cyber' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex-1 flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all ${theme === t.id ? 'border-[#39d353] bg-[#39d353]/5' : 'border-transparent bg-[#0d1117] hover:border-[#30363d]'}`}
                >
                  <div className="w-8 h-8 rounded-full shadow-inner" style={{ background: t.color }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={!username.trim() || loading}
            className="w-full disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all text-sm"
            style={{ background: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)' }}
            onMouseEnter={(e) => { if (username.trim() && !loading) (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #2ea043 0%, #3fb950 100%)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #238636 0%, #2ea043 100%)' }}
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
          <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cardUrl}
              alt="GitHub Wrapped Card"
              className="w-full rounded-2xl border border-[#30363d]"
              style={{ boxShadow: '0 0 60px rgba(57, 211, 83, 0.15), 0 24px 64px rgba(0,0,0,0.6)' }}
            />

            <div className="flex flex-col w-full gap-3">
              <button
                onClick={download}
                className="flex items-center justify-center gap-2 bg-[#39d353] hover:bg-[#47e462] text-[#0d1117] font-bold w-full py-4 rounded-xl transition-all shadow-lg active:scale-[0.98]"
              >
                <svg height="20" viewBox="0 0 16 16" className="fill-current" aria-hidden="true">
                  <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z" />
                  <path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.97a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.779a.749.749 0 1 1 1.06-1.06l1.97 1.97Z" />
                </svg>
                Download PNG
              </button>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href={xShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#161b22] border border-[#30363d] hover:border-[#7d8590] text-white py-3 rounded-xl transition-all text-sm font-semibold"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Share on X
                </a>
                <a
                  href={linkedinShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#161b22] border border-[#30363d] hover:border-[#7d8590] text-white py-3 rounded-xl transition-all text-sm font-semibold"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
