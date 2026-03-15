import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { readFile } from 'fs/promises'
import path from 'path'
import { fetchMonthlyStats, fetchYearlyStats } from '@/lib/github'
import { MONTHS, getTheme, Theme } from '@/lib/themes'
import React from 'react'

// ─── Card dimensions ──────────────────────────────────────────────────────
const CARD_W = 1080
const CARD_H = 1920
const CARD_RADIUS = 24
const BOX_SHADOW = '0 4px 12px rgba(0,0,0,0.02)'

// ─── Font cache ───────────────────────────────────────────────────────────
let fonts: { regular: Buffer; bold: Buffer; extrabold: Buffer } | null = null

async function loadFonts() {
  if (fonts) return fonts
  const dir = path.join(process.cwd(), 'public/fonts')
  const [regular, bold, extrabold] = await Promise.all([
    readFile(path.join(dir, 'Inter-Regular.ttf')),
    readFile(path.join(dir, 'Inter-Bold.ttf')),
    readFile(path.join(dir, 'Inter-ExtraBold.ttf')),
  ])
  fonts = { regular, bold, extrabold }
  return fonts
}

// ─── Shared card element builders ─────────────────────────────────────────
const ce = React.createElement

function accentBar(t: Theme) {
  return ce('div', { style: { position: 'absolute', top: 0, left: 0, width: CARD_W, height: 6, background: t.accent } })
}

function topBar(t: Theme, rightLabel: string) {
  const s = { color: t.subtext, fontSize: 24, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '4px', opacity: 0.8 }
  return ce('div',
    { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } },
    ce('span', { style: s }, 'github wrapped'),
    ce('span', { style: s }, rightLabel),
  )
}

function userHeader(t: Theme, avatarBuffer: Buffer | null, fullName: string | null, username: string) {
  return ce('div',
    { style: { display: 'flex', flexDirection: 'column', marginBottom: 32 } },
    ce('div',
      { style: { display: 'flex', alignItems: 'center', gap: 24 } },
      avatarBuffer && ce('img', {
        src: `data:image/png;base64,${avatarBuffer.toString('base64')}`,
        width: 140, height: 140,
        style: { borderRadius: 70, border: `3px solid ${t.accent}`, opacity: 0.9 },
      } as React.ImgHTMLAttributes<HTMLImageElement>),
      ce('div',
        { style: { display: 'flex', flexDirection: 'column' } },
        fullName && ce('span', { style: { color: t.text, fontSize: 64, fontWeight: 700, lineHeight: 1.1 } }, fullName),
        ce('span', { style: { color: t.subtext, fontSize: 42, fontWeight: 400, marginTop: 4 } }, `@${username}`),
      )
    )
  )
}

function dividerEl(t: Theme) {
  return ce('div', { style: { height: 1, background: t.divider, opacity: 0.5, marginBottom: 40 } })
}

function heroStat(t: Theme, value: number, label: string) {
  return ce('div',
    { style: { display: 'flex', flexDirection: 'column', marginBottom: 40, borderLeft: `6px solid ${t.accent}`, paddingLeft: 32 } },
    ce('span', { style: { fontSize: 180, fontWeight: 800, color: t.text, lineHeight: 1, letterSpacing: '-6px' } }, value.toLocaleString()),
    ce('span', { style: { color: t.accent, fontSize: 42, marginTop: 8, fontWeight: 400, opacity: 0.8 } }, label),
  )
}

function statCard(t: Theme, value: string, label: string) {
  return ce('div',
    { style: { display: 'flex', flexDirection: 'column', flex: 1, background: t.cardBg, border: `1px solid ${t.divider}`, borderRadius: CARD_RADIUS, padding: '20px 24px', boxShadow: BOX_SHADOW } },
    ce('span', { style: { fontSize: 48, fontWeight: 700, color: t.text, lineHeight: 1 } }, value),
    ce('span', { style: { color: t.subtext, fontSize: 20, marginTop: 8 } }, label),
  )
}

function statsGrid(t: Theme, pullRequests: number, reposContributed: number, totalStars: number, followers: number) {
  const fmt = (n: number) => n > 999 ? `${(n / 1000).toFixed(1)}k` : String(n)
  return ce('div',
    { style: { display: 'flex', gap: 16, marginBottom: 48, width: '100%' } },
    statCard(t, String(pullRequests), 'pull requests'),
    statCard(t, String(reposContributed), 'repos'),
    statCard(t, fmt(totalStars), 'total stars'),
    statCard(t, fmt(followers), 'followers'),
  )
}

function bottomRow(t: Theme, topLanguage: string | null, topLanguageColor: string | null, topRepo: string | null) {
  const cardStyle = { display: 'flex', flexDirection: 'column' as const, background: t.cardBg, border: `1px solid ${t.divider}`, borderRadius: CARD_RADIUS, padding: '32px 36px', flex: 1, boxShadow: BOX_SHADOW }
  const labelStyle = { color: t.subtext, fontSize: 20, letterSpacing: '2px', fontWeight: 600, marginBottom: 16 }

  const langEl = topLanguage
    ? ce('div', { style: cardStyle },
        ce('span', { style: labelStyle }, 'TOP LANGUAGE'),
        ce('div', { style: { display: 'flex', alignItems: 'center', gap: 16 } },
          ce('div', { style: { width: 24, height: 24, borderRadius: '50%', background: topLanguageColor ?? t.accent, flexShrink: 0 } }),
          ce('span', { style: { fontSize: 44, fontWeight: 700, color: t.text, lineHeight: 1 } }, topLanguage),
        )
      )
    : ce('div', { style: { flex: 1 } })

  const repoEl = topRepo
    ? ce('div', { style: cardStyle },
        ce('span', { style: labelStyle }, 'TOP REPO'),
        ce('span', { style: { fontSize: 36, fontWeight: 700, color: t.text, lineHeight: 1.1 } }, topRepo.length > 20 ? topRepo.slice(0, 18) + '\u2026' : topRepo)
      )
    : ce('div', { style: { flex: 1 } })

  return ce('div', { style: { display: 'flex', gap: 16, width: '100%' } }, langEl, repoEl)
}

function cardFooter(t: Theme, username: string) {
  const s = { color: t.subtext, opacity: 0.5, fontSize: 24, fontWeight: 400 }
  return ce('div',
    { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
    ce('span', { style: s }, `github.com/${username}`),
    ce('span', { style: s }, 'github wrapped'),
  )
}

function monthlyHeatmap(t: Theme, dailyCommits: number[], year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = dailyCommits.length
  const rows: number[][] = []
  let row: number[] = []
  for (let i = 0; i < firstDay; i++) row.push(-1)
  for (let d = 1; d <= daysInMonth; d++) {
    row.push(d)
    if (row.length === 7) { rows.push(row); row = [] }
  }
  if (row.length > 0) {
    while (row.length < 7) row.push(-1)
    rows.push(row)
  }

  return ce('div',
    { style: { display: 'flex', flexDirection: 'column', marginBottom: 48, background: t.cardBg, border: `1px solid ${t.divider}`, borderRadius: CARD_RADIUS, padding: '32px', alignItems: 'center', boxShadow: BOX_SHADOW } },
    ce('div', { style: { width: '100%', display: 'flex' } },
      ce('span', { style: { color: t.subtext, fontSize: 24, letterSpacing: '4px', fontWeight: 700, marginBottom: 36 } }, 'CONTRIBUTION INTENSITY')
    ),
    ce('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
      rows.map((r, ri) =>
        ce('div', { key: ri, style: { display: 'flex', flexDirection: 'row', gap: 12 } },
          r.map((day, ci) => {
            let bg = 'transparent'
            if (day !== -1) {
              const count = dailyCommits[day - 1] || 0
              const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 10 ? 3 : 4
              bg = t.heatmap[level]
            }
            return ce('div', { key: ci, style: { width: 84, height: 84, borderRadius: 12, background: bg } })
          })
        )
      )
    )
  )
}

function yearlyHeatmap(t: Theme, dailyCommits: number[], year: number) {
  const CELL = 13
  const GAP = 3
  const startOffset = new Date(year, 0, 1).getDay()
  const cells: { day: number | null }[] = []
  for (let i = 0; i < startOffset; i++) cells.push({ day: null })
  for (let i = 0; i < dailyCommits.length; i++) cells.push({ day: i })
  while (cells.length % 7 !== 0) cells.push({ day: null })

  const weeks: { day: number | null }[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  return ce('div',
    { style: { display: 'flex', flexDirection: 'column', marginBottom: 48, background: t.cardBg, border: `1px solid ${t.divider}`, borderRadius: CARD_RADIUS, padding: '32px', boxShadow: BOX_SHADOW } },
    ce('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 } },
      ce('span', { style: { color: t.subtext, fontSize: 24, letterSpacing: '4px', fontWeight: 700 } }, 'CONTRIBUTION INTENSITY'),
      ce('span', { style: { color: t.subtext, fontSize: 22, fontWeight: 400, opacity: 0.6 } }, String(year)),
    ),
    ce('div', { style: { display: 'flex', flexDirection: 'row', gap: GAP } },
      weeks.map((week, wi) =>
        ce('div', { key: wi, style: { display: 'flex', flexDirection: 'column', gap: GAP } },
          week.map((cell, di) => {
            let bg = 'transparent'
            if (cell.day !== null) {
              const count = dailyCommits[cell.day] ?? 0
              const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 10 ? 3 : 4
              bg = t.heatmap[level]
            }
            return ce('div', { key: di, style: { width: CELL, height: CELL, borderRadius: 2, background: bg } })
          })
        )
      )
    )
  )
}

function bestMonthStat(t: Theme, bestMonth: number, bestMonthCommits: number) {
  return ce('div',
    { style: { display: 'flex', flexDirection: 'column', marginBottom: 48, background: t.cardBg, border: `1px solid ${t.accent}`, borderRadius: CARD_RADIUS, padding: '28px 36px', boxShadow: BOX_SHADOW } },
    ce('span', { style: { color: t.subtext, fontSize: 20, letterSpacing: '2px', fontWeight: 600, marginBottom: 12 } }, 'BEST MONTH'),
    ce('div', { style: { display: 'flex', alignItems: 'baseline', gap: 20 } },
      ce('span', { style: { fontSize: 56, fontWeight: 700, color: t.text, lineHeight: 1 } }, MONTHS[bestMonth - 1]),
      ce('span', { style: { fontSize: 36, fontWeight: 400, color: t.accent, opacity: 0.8 } }, `${bestMonthCommits} commits`),
    )
  )
}

async function renderPng(element: React.ReactElement, fontData: { regular: Buffer; bold: Buffer; extrabold: Buffer }) {
  const svg = await satori(element, {
    width: CARD_W,
    height: CARD_H,
    fonts: [
      { name: 'Inter', data: fontData.regular, weight: 400, style: 'normal' },
      { name: 'Inter', data: fontData.bold, weight: 700, style: 'normal' },
      { name: 'Inter', data: fontData.extrabold, weight: 800, style: 'normal' },
    ],
  })
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: CARD_W } })
  return new Uint8Array(resvg.render().asPng())
}

// ─── API Route ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')?.trim()
  const month = parseInt(searchParams.get('month') ?? '0')
  const year = parseInt(searchParams.get('year') ?? '0')
  const theme = searchParams.get('theme') ?? 'daylight'
  const mode = searchParams.get('mode') ?? 'monthly'
  // Accept token via header (never logged in URL) or fall back to server env var
  const token = request.headers.get('X-GitHub-Token') ?? process.env.GITHUB_TOKEN

  if (!username || !year) {
    return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 })
  }
  if (mode === 'monthly' && (!month || month < 1 || month > 12)) {
    return NextResponse.json({ error: 'Missing or invalid month' }, { status: 400 })
  }

  const t = getTheme(theme)
  const rootStyle = {
    width: CARD_W, height: CARD_H,
    background: t.bg,
    display: 'flex', flexDirection: 'column' as const,
    padding: '90px 80px',
    fontFamily: 'Inter',
    position: 'relative' as const,
  }

  try {
    const [stats, fontData] = await Promise.all([
      mode === 'yearly'
        ? fetchYearlyStats(username, year, token)
        : fetchMonthlyStats(username, month, year, token),
      loadFonts(),
    ])

    let avatarBuffer: Buffer | null = null
    try {
      const avatarRes = await fetch(stats.avatarUrl)
      if (avatarRes.ok) avatarBuffer = Buffer.from(await avatarRes.arrayBuffer())
    } catch (e) {
      console.error('Failed to fetch avatar:', e)
    }

    const pngHeaders = { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache, no-store, must-revalidate' }

    if (mode === 'yearly') {
      const { commits, pullRequests, reposContributed, topLanguage, topLanguageColor, topRepo, name: fullName, totalStars, followers, dailyCommits, bestMonth, bestMonthCommits, username: uname } = stats as import('@/lib/github').YearlyStats
      const card = ce('div', { style: rootStyle },
        accentBar(t),
        topBar(t, String(year)),
        ce('div', { style: { flex: 1 } }),
        userHeader(t, avatarBuffer, fullName, uname),
        dividerEl(t),
        heroStat(t, commits, 'commits this year'),
        yearlyHeatmap(t, dailyCommits, year),
        bestMonthStat(t, bestMonth, bestMonthCommits),
        statsGrid(t, pullRequests, reposContributed, totalStars, followers),
        bottomRow(t, topLanguage, topLanguageColor, topRepo),
        ce('div', { style: { flex: 1 } }),
        cardFooter(t, uname),
      )
      return new NextResponse(await renderPng(card, fontData), { headers: pngHeaders })
    }

    // Monthly card
    const { commits, pullRequests, reposContributed, topLanguage, topLanguageColor, topRepo, name: fullName, totalStars, followers, dailyCommits, username: uname } = stats as import('@/lib/github').MonthlyStats
    const card = ce('div', { style: rootStyle },
      accentBar(t),
      topBar(t, `${MONTHS[month - 1]} ${year}`),
      ce('div', { style: { flex: 1 } }),
      userHeader(t, avatarBuffer, fullName, uname),
      dividerEl(t),
      heroStat(t, commits, 'commits this month'),
      statsGrid(t, pullRequests, reposContributed, totalStars, followers),
      monthlyHeatmap(t, dailyCommits, year, month),
      bottomRow(t, topLanguage, topLanguageColor, topRepo),
      ce('div', { style: { flex: 1 } }),
      cardFooter(t, uname),
    )
    return new NextResponse(await renderPng(card, fontData), { headers: pngHeaders })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate card'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
