'use client'

import { useState, useEffect } from 'react'
import { MONTHS, THEMES } from '@/lib/themes'

const now = new Date()
const CURRENT_MONTH = now.getMonth() + 1
const CURRENT_YEAR = now.getFullYear()
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]
// Only offer yearly recap for completed years
const YEARLY_YEARS = YEARS.filter(y => y < CURRENT_YEAR)

export default function Home() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'monthly' | 'yearly'>('monthly')
  const [month, setMonth] = useState(CURRENT_MONTH)
  const [year, setYear] = useState(CURRENT_YEAR)
  const [theme, setTheme] = useState('daylight')
  const [step, setStep] = useState(1)
  const [copied, setCopied] = useState(false)

  const [cardUrl, setCardUrl] = useState<string | null>(null)

  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/card?username=${username}&month=${month}&year=${year}&theme=${theme}` : ''

  async function generate() {
    if (!username.trim()) return
    setLoading(true)
    setError(null)

    const url = mode === 'yearly'
      ? `/api/card?username=${encodeURIComponent(username.trim())}&year=${year}&theme=${theme}&mode=yearly&_t=${Date.now()}`
      : `/api/card?username=${encodeURIComponent(username.trim())}&month=${month}&year=${year}&theme=${theme}&mode=monthly&_t=${Date.now()}`
    try {
      const res = await fetch(url)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to generate card')
      }
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)

      // Cleanup previous blob URL if it exists
      if (cardUrl && cardUrl.startsWith('blob:')) {
        URL.revokeObjectURL(cardUrl)
      }

      setCardUrl(objectUrl)
      setStep(2)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
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

      if (window.navigator.share && window.navigator.canShare && window.navigator.canShare({ files: [file] })) {
        await window.navigator.share({
          files: [file],
          title: 'GitHub Wrapped',
          text: `Check out my GitHub Wrapped for ${MONTHS[month - 1]} ${year}! 🚀`,
        })
      } else {
        download()
      }
    } catch (e) {
      console.error('Error sharing:', e)
      download()
    }
  }

  function copyLink() {
    if (typeof window !== 'undefined') {
      window.navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareText = mode === 'yearly'
    ? `Check out my GitHub Wrapped for ${year}! 🚀`
    : `Check out my GitHub Wrapped for ${MONTHS[month - 1]} ${year}! 🚀`
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(baseUrl)}`
  const threadsShareUrl = `https://www.threads.net/intent/post?text=${encodeURIComponent(shareText)}%20${encodeURIComponent(baseUrl)}`
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}%20${encodeURIComponent(baseUrl)}`
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(baseUrl)}`

  return (
    <main className="min-h-screen text-[#1F2328] flex flex-col items-center lg:justify-center p-4 lg:p-6 relative overflow-x-hidden bg-[#F6F8FA]">
      {/* Soft Light Mode Ambient Glow */}
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
            {/* Step 1: Username */}
            <div className="mb-4">
              <label className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[#8c959f] uppercase tracking-wider">GitHub Username</span>
              </label>
              <div className="flex items-center bg-[#F6F8FA] border border-[#d0d7de] rounded-lg focus-within:border-[#2da44e] focus-within:ring-2 focus-within:ring-[#2da44e]/20 transition-all">
                <span className="pl-3 text-[#57606a] font-medium select-none">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    if (step === 2) setStep(1)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && generate()}
                  placeholder="your-username"
                  className="flex-1 bg-transparent px-3 py-2 text-[#1F2328] font-medium placeholder-[#8c959f] focus:outline-none"
                />
              </div>
            </div>

            {/* Step 2: Customization (Only shown after first submission) */}
            <div className={`${step === 2 ? 'max-h-[1000px] opacity-100 mt-3' : 'max-h-0 opacity-0 overflow-hidden'} transition-all duration-500`}>
              <div className="pt-2 border-t border-[#d0d7de]/50 mb-3">

                {/* Mode toggle */}
                <div className="mb-4">
                  <label className="block text-[10px] font-bold text-[#8c959f] uppercase tracking-wider mb-2">Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['monthly', 'yearly'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          setMode(m)
                          if (m === 'yearly' && year === CURRENT_YEAR) {
                            setYear(YEARLY_YEARS[0] ?? CURRENT_YEAR - 1)
                          }
                          if (m === 'monthly' && !YEARS.includes(year)) {
                            setYear(CURRENT_YEAR)
                          }
                        }}
                        className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${mode === m ? 'bg-[#2da44e] border-[#2da44e] text-white' : 'bg-[#f6f8fa] border-[#d0d7de] text-[#57606a] hover:border-[#8c959f]'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`grid gap-3 mb-3 ${mode === 'monthly' ? 'grid-cols-2' : 'grid-cols-1'}`}>
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

                <div className="mb-1">
                  <label className="block text-[10px] font-bold text-[#8c959f] uppercase tracking-[0.2em] mb-2">Theme</label>
                  <div className="flex flex-wrap gap-3">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        title={t.label}
                        className={`group relative w-10 h-10 rounded-full transition-all duration-300 shadow-sm ${theme === t.id ? 'ring-2 ring-offset-2 ring-[#2da44e] scale-110' : 'hover:scale-105 border border-black/10'}`}
                        style={{ background: t.isDark ? t.bg : t.accent }}
                      >
                        {theme === t.id && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-sm">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={generate}
              disabled={!username.trim() || loading}
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all text-sm shadow-[0_4px_12px_rgba(45,164,78,0.2)] hover:shadow-[0_6px_16px_rgba(45,164,78,0.3)] active:scale-[0.98]"
              style={{ background: 'linear-gradient(180deg, #2ea043 0%, #238636 100%)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {step === 1 ? 'Finding profile...' : 'Regenerating...'}
                </span>
              ) : (
                step === 1 ? 'Find My Profile' : mode === 'yearly' ? 'Update My Year' : 'Update My Wrapped'
              )}
            </button>

            {error && (
              <p className="mt-3 text-[#cf222e] text-sm font-medium text-center bg-[#ffebe9] rounded-lg py-2 px-3 border border-[#ff8182]/50">{error}</p>
            )}
          </div>

          {/* Action Grid (Only shown after user generates their own card) */}
          {cardUrl && !loading && step === 2 && (
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
                {copied ? 'Link Copied!' : 'Copy Website URL'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Preview & Sharing */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-center lg:sticky lg:top-4 lg:pt-[104px]">
          {cardUrl ? (
            <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative group w-full flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cardUrl}
                  alt="GitHub Wrapped Card"
                  className={`w-auto h-auto max-w-full max-h-[65vh] block rounded-[32px] border border-black/5 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}
                  style={{ boxShadow: '0 32px 64px -16px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.02)' }}
                />
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
