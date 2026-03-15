'use client'

import { useState, useEffect } from 'react'
import { MONTHS, THEMES } from '@/lib/themes'

const now = new Date()
const CURRENT_MONTH = now.getMonth() + 1
const CURRENT_YEAR = now.getFullYear()
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]
const YEARLY_YEARS = YEARS.filter(y => y < CURRENT_YEAR)

export default function Home() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'monthly' | 'yearly'>('monthly')
  const [month, setMonth] = useState(CURRENT_MONTH)
  const [year, setYear] = useState(CURRENT_YEAR)
  const [theme, setTheme] = useState('daylight')
  const [cardUrl, setCardUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [justUpdated, setJustUpdated] = useState(false)
  const [token, setToken] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const hasCard = cardUrl !== null

  // Pre-fill form from URL params (enables shareable links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const u = params.get('username')
    const m = params.get('mode')
    const mo = params.get('month')
    const y = params.get('year')
    const th = params.get('theme')
    if (u) setUsername(u)
    if (m === 'yearly' || m === 'monthly') setMode(m)
    if (mo) setMonth(Number(mo))
    if (y) setYear(Number(y))
    if (th) setTheme(th)
  }, [])

  const cardApiUrl = typeof window !== 'undefined'
    ? mode === 'yearly'
      ? `${window.location.origin}/api/card?username=${encodeURIComponent(username)}&year=${year}&theme=${theme}&mode=yearly`
      : `${window.location.origin}/api/card?username=${encodeURIComponent(username)}&month=${month}&year=${year}&theme=${theme}&mode=monthly`
    : ''

  async function generate() {
    if (!username.trim()) return
    setLoading(true)
    setError(null)

    const url = `${cardApiUrl}&_t=${Date.now()}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const headers: Record<string, string> = {}
      if (token.trim()) headers['X-GitHub-Token'] = token.trim()

      const res = await fetch(url, { signal: controller.signal, headers })
      clearTimeout(timeoutId)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to generate card')
      }
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      if (cardUrl?.startsWith('blob:')) URL.revokeObjectURL(cardUrl)
      setCardUrl(objectUrl)
      setJustUpdated(true)
      setTimeout(() => setJustUpdated(false), 2000)
    } catch (e: unknown) {
      clearTimeout(timeoutId)
      if (e instanceof Error && e.name === 'AbortError') {
        setError('Request timed out. GitHub may be slow — please try again.')
      } else {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  function download() {
    if (!cardUrl || typeof document === 'undefined') return
    const a = document.createElement('a')
    a.href = cardUrl
    a.download = mode === 'yearly'
      ? `github-wrapped-${username}-${year}-${theme}.png`
      : `github-wrapped-${username}-${MONTHS[month - 1]}-${year}-${theme}.png`
    a.click()
  }

  async function shareToStory() {
    if (!cardUrl || typeof window === 'undefined') return
    try {
      const response = await fetch(cardUrl)
      const blob = await response.blob()
      const file = new window.File([blob], `github-wrapped-${username}.png`, { type: 'image/png' })
      const shareText = mode === 'yearly'
        ? `Check out my GitHub Wrapped for ${year}! 🚀`
        : `Check out my GitHub Wrapped for ${MONTHS[month - 1]} ${year}! 🚀`
      if (window.navigator.share && window.navigator.canShare?.({ files: [file] })) {
        await window.navigator.share({ files: [file], title: 'GitHub Wrapped', text: shareText })
      } else {
        download()
      }
    } catch (e) {
      console.error('Error sharing:', e)
      download()
    }
  }

  function copyLink() {
    if (typeof window === 'undefined' || !username.trim()) return
    const params = new URLSearchParams({
      username: username.trim(),
      mode,
      month: String(month),
      year: String(year),
      theme,
    })
    window.navigator.clipboard.writeText(`${window.location.origin}?${params.toString()}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen text-[#1F2328] flex flex-col items-center lg:justify-center p-4 lg:p-6 relative overflow-x-hidden bg-[#F6F8FA]">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-60 pointer-events-none" style={{ background: 'radial-gradient(circle 400px at 50% 0%, rgba(45, 164, 78, 0.15) 0%, transparent 100%)' }} />

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-start relative z-10">
        {/* Left Column: Form & Header */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          {/* Header */}
          <div className="mb-4 lg:mb-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 mb-2">
              <svg height="20" viewBox="0 0 16 16" className="fill-[#1a7f37]" aria-hidden="true">
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
              </svg>
              <span className="text-[#1a7f37] font-bold text-sm tracking-wide uppercase">GitHub Wrapped</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#111822] mb-1 tracking-tight drop-shadow-sm leading-tight">Your month in code</h1>
            <p className="text-[#57606a] text-xs max-w-sm">Beautiful summaries of your contributions.</p>
          </div>

          {/* Form */}
          <div className="bg-white border border-[#d0d7de] rounded-2xl p-4 lg:p-5" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.02)' }}>
            {/* Username */}
            <div className="mb-4">
              <label className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[#8c959f] uppercase tracking-wider">GitHub Username</span>
              </label>
              <div className="flex items-center bg-[#F6F8FA] border border-[#d0d7de] rounded-lg focus-within:border-[#2da44e] focus-within:ring-2 focus-within:ring-[#2da44e]/20 transition-all">
                <span className="pl-3 text-[#57606a] font-medium select-none">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && generate()}
                  placeholder="your-username"
                  className="flex-1 bg-transparent px-3 py-2 text-[#1F2328] font-medium placeholder-[#8c959f] focus:outline-none"
                />
              </div>
            </div>

            {/* Customization — always visible so you can set options before generating */}
            <div className="pt-3 border-t border-[#d0d7de]/50 mb-3">
              {/* Mode toggle */}
              <div className="mb-4">
                <label className="block text-[10px] font-bold text-[#8c959f] uppercase tracking-wider mb-2">Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['monthly', 'yearly'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMode(m)
                        if (m === 'yearly' && year === CURRENT_YEAR) setYear(YEARLY_YEARS[0] ?? CURRENT_YEAR - 1)
                        if (m === 'monthly' && !YEARS.includes(year)) setYear(CURRENT_YEAR)
                      }}
                      className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${mode === m ? 'bg-[#2da44e] border-[#2da44e] text-white' : 'bg-[#f6f8fa] border-[#d0d7de] text-[#57606a] hover:border-[#8c959f]'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Month + Year */}
              <div className={`grid gap-3 mb-4 ${mode === 'monthly' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {mode === 'monthly' && (
                  <div>
                    <label className="block text-[10px] font-bold text-[#8c959f] uppercase tracking-wider mb-2">Month</label>
                    <select
                      value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}
                      className="w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-lg px-3 py-2 text-[#1F2328] font-medium focus:outline-none focus:border-[#2da44e] focus:ring-2 focus:ring-[#2da44e]/20 transition-all cursor-pointer text-sm"
                    >
                      {MONTHS.map((m, i) => (
                        <option key={m} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-[#8c959f] uppercase tracking-wider mb-2">Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-lg px-3 py-2 text-[#1F2328] font-medium focus:outline-none focus:border-[#2da44e] focus:ring-2 focus:ring-[#2da44e]/20 transition-all cursor-pointer text-sm"
                  >
                    {(mode === 'yearly' ? YEARLY_YEARS : YEARS).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Theme — accent swatch + label so you know what you're picking */}
              <div>
                <label className="block text-[10px] font-bold text-[#8c959f] uppercase tracking-[0.2em] mb-2">Theme</label>
                <div className="grid grid-cols-4 gap-1">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl transition-all ${theme === t.id ? 'bg-[#f0fdf4] ring-1 ring-[#2da44e]' : 'hover:bg-[#f6f8fa]'}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full transition-all ${theme === t.id ? 'ring-2 ring-offset-1 ring-[#2da44e] scale-110' : 'border border-black/10'}`}
                        style={{ background: t.accent }}
                      />
                      <span className={`text-[9px] font-bold tracking-wide leading-none ${theme === t.id ? 'text-[#2da44e]' : 'text-[#8c959f]'}`}>
                        {t.label.toUpperCase()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={generate}
              disabled={!username.trim() || loading}
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all text-sm shadow-[0_4px_12px_rgba(45,164,78,0.2)] hover:shadow-[0_6px_16px_rgba(45,164,78,0.3)] active:scale-[0.98] mb-3"
              style={{ background: 'linear-gradient(180deg, #2ea043 0%, #238636 100%)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {hasCard ? 'Updating...' : 'Finding profile...'}
                </span>
              ) : (
                hasCard
                  ? (mode === 'yearly' ? 'Update My Year' : 'Update My Wrapped')
                  : 'Generate My Wrapped'
              )}
            </button>

            {/* Advanced: GitHub token input */}
            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-[10px] font-bold text-[#8c959f] uppercase tracking-wider py-1 hover:text-[#57606a] transition-colors"
              >
                <span>Advanced</span>
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {showAdvanced && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="block text-[10px] font-bold text-[#8c959f] uppercase tracking-wider mb-1.5">
                    GitHub Personal Access Token
                  </label>
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-lg px-3 py-2 text-[#1F2328] font-mono text-xs placeholder-[#8c959f] focus:outline-none focus:border-[#2da44e] focus:ring-2 focus:ring-[#2da44e]/20 transition-all"
                  />
                  <p className="mt-1.5 text-[10px] text-[#8c959f] leading-relaxed">
                    Increases API rate limits. Token is sent directly to GitHub and never stored.
                  </p>
                </div>
              )}
            </div>

            {error && (
              <p className="mt-3 text-[#cf222e] text-sm font-medium text-center bg-[#ffebe9] rounded-lg py-2 px-3 border border-[#ff8182]/50">{error}</p>
            )}
          </div>

          {/* Action buttons — shown after first generation */}
          {hasCard && !loading && (
            <div className="mt-4 flex flex-col gap-2 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                <button
                  onClick={shareToStory}
                  className="flex items-center justify-center gap-2 bg-[#2da44e] hover:bg-[#2c974b] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-[0_4px_12px_rgba(45,164,78,0.1)] active:scale-[0.98] text-sm group"
                >
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center transition-transform group-hover:scale-110">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  </div>
                  Share
                </button>
                <button
                  onClick={download}
                  className="flex items-center justify-center gap-2 bg-white border border-[#d0d7de] hover:border-[#8c959f] hover:bg-[#f6f8fa] text-[#24292f] font-bold py-3 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98] text-sm group"
                >
                  <div className="w-6 h-6 rounded-full bg-[#f6f8fa] flex items-center justify-center transition-transform group-hover:scale-110">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </div>
                  Download
                </button>
              </div>

              <button
                onClick={copyLink}
                className="w-full flex items-center justify-center gap-2 bg-white border border-[#d0d7de] hover:border-[#8c959f] text-[#57606a] hover:text-[#24292f] py-1.5 rounded-xl transition-all text-[11px] font-bold shadow-sm group"
              >
                <div className={`transition-all duration-300 ${copied ? 'scale-110 text-green-600' : 'group-hover:rotate-12'}`}>
                  {!copied ? (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
                {copied ? 'Link Copied!' : 'Copy Shareable Link'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Card Preview */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-center lg:sticky lg:top-4 lg:pt-[104px]">
          {cardUrl ? (
            <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative group w-full flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cardUrl}
                  alt="GitHub Wrapped Card"
                  className={`w-auto h-auto max-w-full max-h-[65vh] block rounded-[32px] border border-black/5 transition-opacity duration-300 ${loading ? 'opacity-40' : 'opacity-100'}`}
                  style={{ boxShadow: '0 32px 64px -16px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.02)' }}
                />
                {/* Updating overlay */}
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/60 backdrop-blur-sm text-white rounded-2xl px-5 py-3 flex items-center gap-2.5 text-sm font-bold shadow-lg">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Updating card...
                    </div>
                  </div>
                )}
                {/* Updated confirmation badge */}
                {justUpdated && (
                  <div className="absolute top-3 right-3 bg-[#2da44e] text-white rounded-full px-3 py-1 text-[11px] font-bold animate-in fade-in slide-in-from-top-2 duration-300 flex items-center gap-1.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Updated
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-full max-h-[82vh] aspect-[1/1.6] bg-white border border-black/5 rounded-[32px] overflow-hidden p-8 flex flex-col items-center justify-center text-center space-y-6 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-[#f6f8fa] animate-pulse flex items-center justify-center">
                <svg height="32" viewBox="0 0 16 16" className="fill-[#d0d7de]">
                  <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
                </svg>
              </div>
              <div className="space-y-2">
                <div className="h-6 w-32 bg-[#f6f8fa] animate-pulse rounded-full mx-auto" />
                <div className="h-4 w-48 bg-[#f6f8fa] animate-pulse rounded-full mx-auto" />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
