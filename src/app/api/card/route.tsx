import { NextRequest, NextResponse } from 'next/server'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { readFile } from 'fs/promises'
import path from 'path'
import { fetchMonthlyStats } from '@/lib/github'
import React from 'react'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')?.trim()
  const month = parseInt(searchParams.get('month') ?? '0')
  const year = parseInt(searchParams.get('year') ?? '0')
  const theme = searchParams.get('theme') ?? 'midnight'
  const token = process.env.GITHUB_TOKEN

  if (!username || !month || !year || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 })
  }

  // Theme definitions
  const themes: Record<string, { bg: string; accent: string; cardBg: string; text: string; subtext: string }> = {
    midnight: {
      bg: 'linear-gradient(170deg, #0d1117 0%, #0d1117 55%, #0b1d10 100%)',
      accent: '#39d353',
      cardBg: '#161b22',
      text: '#e6edf3',
      subtext: '#7d8590',
    },
    gold: {
      bg: 'linear-gradient(170deg, #1a1600 0%, #2c2500 55%, #3d3300 100%)',
      accent: '#ffd700',
      cardBg: '#2d2600',
      text: '#fff9e6',
      subtext: '#b3a77d',
    },
    cyberpunk: {
      bg: 'linear-gradient(170deg, #050005 0%, #150015 55%, #250025 100%)',
      accent: '#ff00ff',
      cardBg: '#250025',
      text: '#ffe6ff',
      subtext: '#b37db3',
    },
  }

  const activeTheme = themes[theme] ?? themes.midnight

  try {
    const [stats, { regular, bold, extrabold }] = await Promise.all([
      fetchMonthlyStats(username, month, year, token),
      loadFonts(),
    ])

    const monthName = MONTHS[month - 1].toUpperCase()
    // Scale font size to fit the month name — short months get HUGE text
    const monthFontSize = Math.max(100, Math.min(220, Math.floor(1050 / monthName.length)))

    const { commits, pullRequests, reposContributed, topLanguage, topLanguageColor, topRepo, avatarUrl, name: fullName, totalStars, followers } = stats

    // Fetch avatar image
    let avatarBuffer: Buffer | null = null
    try {
      const avatarRes = await fetch(avatarUrl)
      if (avatarRes.ok) {
        avatarBuffer = Buffer.from(await avatarRes.arrayBuffer())
      }
    } catch (e) {
      console.error('Failed to fetch avatar:', e)
    }

    const card = React.createElement(
      'div',
      {
        style: {
          width: 1080,
          height: 1920,
          background: activeTheme.bg,
          display: 'flex',
          flexDirection: 'column',
          padding: '90px 80px',
          fontFamily: 'Inter',
          position: 'relative',
        },
      },

      // Accent bar at top
      React.createElement('div', {
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1080,
          height: 6,
          background: activeTheme.accent,
        },
      }),

      // Top bar
      React.createElement(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        React.createElement('span', { style: { color: activeTheme.subtext, fontSize: 28, fontWeight: 400 } }, 'github wrapped'),
        React.createElement('span', { style: { color: activeTheme.subtext, fontSize: 28, fontWeight: 400 } }, String(year)),
      ),

      // Spacer
      React.createElement('div', { style: { flex: 1 } }),

      // User Profile Header (Hero)
      React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', marginBottom: 20 } },
        React.createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: 32, marginBottom: 24 } },
          avatarBuffer && React.createElement('img', {
            src: `data:image/png;base64,${avatarBuffer.toString('base64')}`,
            width: 120,
            height: 120,
            style: {
              borderRadius: 60,
              border: `4px solid ${activeTheme.accent}`,
              opacity: 0.9,
            }
          } as any),
          React.createElement(
            'div',
            { style: { display: 'flex', flexDirection: 'column' } },
            fullName && React.createElement(
              'span',
              { style: { color: activeTheme.text, fontSize: 54, fontWeight: 700, lineHeight: 1.1 } },
              fullName
            ),
            React.createElement(
              'span',
              { style: { color: activeTheme.subtext, fontSize: 38, fontWeight: 400, marginTop: 4 } },
              `@${stats.username}`
            ),
          )
        ),
        React.createElement(
          'span',
          {
            style: {
              fontSize: monthFontSize,
              fontWeight: 800,
              color: activeTheme.accent,
              lineHeight: 1,
              letterSpacing: '-3px',
            },
          },
          monthName,
        ),
      ),

      // Divider
      React.createElement('div', { style: { height: 1, background: '#21262d', opacity: 0.3, marginBottom: 56 } }),

      // Commits — the hero stat
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            marginBottom: 64,
            borderLeft: `6px solid ${activeTheme.accent}`,
            paddingLeft: 32,
          },
        },
        React.createElement(
          'span',
          {
            style: {
              fontSize: 180,
              fontWeight: 800,
              color: activeTheme.text,
              lineHeight: 1,
              letterSpacing: '-6px',
            },
          },
          commits.toLocaleString(),
        ),
        React.createElement(
          'span',
          { style: { color: activeTheme.accent, fontSize: 38, marginTop: 12, fontWeight: 400, opacity: 0.8 } },
          'commits this month',
        ),
      ),

      // Secondary stats row — stat cards
      React.createElement(
        'div',
        { style: { display: 'flex', gap: 20, marginBottom: 20 } },
        // PRs card
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              background: activeTheme.cardBg,
              border: '1px solid #30363d',
              borderRadius: 20,
              padding: '32px 36px',
            },
          },
          React.createElement(
            'span',
            { style: { fontSize: 80, fontWeight: 700, color: activeTheme.text, lineHeight: 1 } },
            String(pullRequests),
          ),
          React.createElement(
            'span',
            { style: { color: activeTheme.subtext, fontSize: 28, marginTop: 10, fontWeight: 400 } },
            'pull requests',
          ),
        ),
        // Repos card
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              background: activeTheme.cardBg,
              border: '1px solid #30363d',
              borderRadius: 20,
              padding: '32px 36px',
            },
          },
          React.createElement(
            'span',
            { style: { fontSize: 80, fontWeight: 700, color: activeTheme.text, lineHeight: 1 } },
            String(reposContributed),
          ),
          React.createElement(
            'span',
            { style: { color: activeTheme.subtext, fontSize: 28, marginTop: 10, fontWeight: 400 } },
            'repos',
          ),
        ),
      ),

      // New stats row: Stars & Followers
      React.createElement(
        'div',
        { style: { display: 'flex', gap: 20, marginBottom: 72 } },
        // Stars card
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              background: activeTheme.cardBg,
              border: '1px solid #30363d',
              borderRadius: 20,
              padding: '32px 36px',
            },
          },
          React.createElement(
            'span',
            { style: { fontSize: 80, fontWeight: 700, color: activeTheme.text, lineHeight: 1 } },
            totalStars > 999 ? `${(totalStars / 1000).toFixed(1)}k` : String(totalStars),
          ),
          React.createElement(
            'span',
            { style: { color: activeTheme.subtext, fontSize: 28, marginTop: 10, fontWeight: 400 } },
            'total stars',
          ),
        ),
        // Followers card
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              background: activeTheme.cardBg,
              border: '1px solid #30363d',
              borderRadius: 20,
              padding: '32px 36px',
            },
          },
          React.createElement(
            'span',
            { style: { fontSize: 80, fontWeight: 700, color: activeTheme.text, lineHeight: 1 } },
            followers > 999 ? `${(followers / 1000).toFixed(1)}k` : String(followers),
          ),
          React.createElement(
            'span',
            { style: { color: activeTheme.subtext, fontSize: 28, marginTop: 10, fontWeight: 400 } },
            'followers',
          ),
        ),
      ),

      // Divider
      React.createElement('div', { style: { height: 1, background: '#21262d', opacity: 0.3, marginBottom: 64 } }),

      // Top Language
      topLanguage
        ? React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              marginBottom: 56,
              background: activeTheme.cardBg,
              border: '1px solid #30363d',
              borderRadius: 20,
              padding: '36px 40px',
            },
          },
          React.createElement(
            'span',
            { style: { color: activeTheme.subtext, fontSize: 22, letterSpacing: '4px', fontWeight: 400, marginBottom: 22 } },
            'TOP LANGUAGE',
          ),
          React.createElement(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: 24 } },
            React.createElement('div', {
              style: {
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: topLanguageColor ?? activeTheme.accent,
                flexShrink: 0,
              },
            }),
            React.createElement(
              'span',
              {
                style: {
                  fontSize: 72,
                  fontWeight: 700,
                  color: activeTheme.text,
                  lineHeight: 1,
                },
              },
              topLanguage,
            ),
          ),
        )
        : null,

      // Top Repo
      topRepo
        ? React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              background: activeTheme.cardBg,
              border: '1px solid #30363d',
              borderRadius: 20,
              padding: '36px 40px',
            },
          },
          React.createElement(
            'span',
            { style: { color: activeTheme.subtext, fontSize: 22, letterSpacing: '4px', fontWeight: 400, marginBottom: 22 } },
            'TOP REPO',
          ),
          React.createElement(
            'span',
            { style: { fontSize: 60, fontWeight: 700, color: activeTheme.text, lineHeight: 1 } },
            topRepo,
          ),
        )
        : null,

      // Push footer to bottom
      React.createElement('div', { style: { flex: 1 } }),

      // Footer
      React.createElement(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        React.createElement(
          'span',
          { style: { color: activeTheme.subtext, opacity: 0.5, fontSize: 24, fontWeight: 400 } },
          `github.com/${stats.username}`,
        ),
        React.createElement(
          'span',
          { style: { color: activeTheme.subtext, opacity: 0.5, fontSize: 24, fontWeight: 400 } },
          'github wrapped',
        ),
      ),
    )

    const svg = await satori(card, {
      width: 1080,
      height: 1920,
      fonts: [
        { name: 'Inter', data: regular, weight: 400, style: 'normal' },
        { name: 'Inter', data: bold, weight: 700, style: 'normal' },
        { name: 'Inter', data: extrabold, weight: 800, style: 'normal' },
      ],
    })

    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1080 } })
    const png = new Uint8Array(resvg.render().asPng())

    return new NextResponse(png, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate card'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
