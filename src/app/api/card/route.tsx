import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
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
  const theme = searchParams.get('theme') ?? 'daylight'
  const token = process.env.GITHUB_TOKEN

  if (!username || !month || !year || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 })
  }

  // Theme definitions
  const themes: Record<string, { bg: string; accent: string; cardBg: string; text: string; subtext: string; heatmap: string[]; divider: string }> = {
    daylight: {
      bg: 'linear-gradient(170deg, #f6f8fa 0%, #f6f8fa 55%, #e6ffec 100%)',
      accent: '#2da44e',
      cardBg: '#ffffff',
      text: '#24292f',
      subtext: '#57606a',
      heatmap: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
      divider: '#d0d7de',
    },
    midnight: {
      bg: 'linear-gradient(170deg, #0d1117 0%, #0d1117 55%, #0b1d10 100%)',
      accent: '#39d353',
      cardBg: '#161b22',
      text: '#e6edf3',
      subtext: '#7d8590',
      heatmap: ['#2d333b', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
      divider: '#21262d',
    },
    gold: {
      bg: 'linear-gradient(170deg, #1a1600 0%, #2c2500 55%, #3d3300 100%)',
      accent: '#ffd700',
      cardBg: '#2d2600',
      text: '#fff9e6',
      subtext: '#b3a77d',
      heatmap: ['#4f4300', '#f3d673', '#d4af37', '#b89122', '#aa8218'],
      divider: '#5a4d00',
    },
    cyberpunk: {
      bg: 'linear-gradient(170deg, #050005 0%, #150015 55%, #250025 100%)',
      accent: '#ff00ff',
      cardBg: '#250025',
      text: '#ffe6ff',
      subtext: '#b37db3',
      heatmap: ['#4d004d', '#ff99ff', '#ff00ff', '#cc00cc', '#990099'],
      divider: '#4d004d',
    },
  }

  const activeTheme = themes[theme] ?? themes.daylight

  try {
    const [stats, { regular, bold, extrabold }] = await Promise.all([
      fetchMonthlyStats(username, month, year, token),
      loadFonts(),
    ])

    const monthName = MONTHS[month - 1].toUpperCase()
    // Scale font size to fit the month name — short months get HUGE text
    const monthFontSize = Math.max(100, Math.min(220, Math.floor(1050 / monthName.length)))

    const { commits, pullRequests, reposContributed, topLanguage, topLanguageColor, topRepo, avatarUrl, name: fullName, totalStars, followers, dailyCommits } = stats

    // Make sure dailyCommits has the right number of days



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
        {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }
        },
        React.createElement('span', {
          style: {
            color: activeTheme.subtext,
            fontSize: 24,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '4px',
            opacity: 0.8,
          }
        }, 'github wrapped'),
        React.createElement('span', {
          style: {
            color: activeTheme.subtext,
            fontSize: 24,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '4px',
            opacity: 0.8,
          }
        }, `${MONTHS[month - 1]} ${year}`),
      ),

      // Spacer
      React.createElement('div', { style: { flex: 1 } }),

      // User Profile Header
      React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', marginBottom: 32 } },
        React.createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: 24 } },
          avatarBuffer && React.createElement('img', {
            src: `data:image/png;base64,${avatarBuffer.toString('base64')}`,
            width: 140,
            height: 140,
            style: {
              borderRadius: 70,
              border: `3px solid ${activeTheme.accent}`,
              opacity: 0.9,
            }
          } as React.ImgHTMLAttributes<HTMLImageElement>),
          React.createElement(
            'div',
            { style: { display: 'flex', flexDirection: 'column' } },
            fullName && React.createElement(
              'span',
              { style: { color: activeTheme.text, fontSize: 64, fontWeight: 700, lineHeight: 1.1 } },
              fullName
            ),
            React.createElement(
              'span',
              { style: { color: activeTheme.subtext, fontSize: 42, fontWeight: 400, marginTop: 4 } },
              `@${stats.username}`
            ),
          )
        )
      ),

      // Divider
      React.createElement('div', { style: { height: 1, background: activeTheme.divider, opacity: 0.5, marginBottom: 40 } }),

      // Commits — the hero stat
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            marginBottom: 40,
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
          { style: { color: activeTheme.accent, fontSize: 42, marginTop: 8, fontWeight: 400, opacity: 0.8 } },
          'commits this month',
        ),
      ),

      // Secondary stats 4-column row
      React.createElement(
        'div',
        { style: { display: 'flex', gap: 16, marginBottom: 48, width: '100%' } },
        // PRs
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, background: activeTheme.cardBg, border: `1px solid ${activeTheme.divider}`, borderRadius: 24, padding: '20px 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' } },
          React.createElement('span', { style: { fontSize: 48, fontWeight: 700, color: activeTheme.text, lineHeight: 1 } }, String(pullRequests)),
          React.createElement('span', { style: { color: activeTheme.subtext, fontSize: 20, marginTop: 8, fontWeight: 400 } }, 'pull requests')
        ),
        // Repos
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, background: activeTheme.cardBg, border: `1px solid ${activeTheme.divider}`, borderRadius: 24, padding: '20px 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' } },
          React.createElement('span', { style: { fontSize: 48, fontWeight: 700, color: activeTheme.text, lineHeight: 1 } }, String(reposContributed)),
          React.createElement('span', { style: { color: activeTheme.subtext, fontSize: 20, marginTop: 8, fontWeight: 400 } }, 'repos')
        ),
        // Stars
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, background: activeTheme.cardBg, border: `1px solid ${activeTheme.divider}`, borderRadius: 24, padding: '20px 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' } },
          React.createElement('span', { style: { fontSize: 48, fontWeight: 700, color: activeTheme.text, lineHeight: 1 } }, totalStars > 999 ? `${(totalStars / 1000).toFixed(1)}k` : String(totalStars)),
          React.createElement('span', { style: { color: activeTheme.subtext, fontSize: 20, marginTop: 8, fontWeight: 400 } }, 'total stars')
        ),
        // Followers
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, background: activeTheme.cardBg, border: `1px solid ${activeTheme.divider}`, borderRadius: 24, padding: '20px 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' } },
          React.createElement('span', { style: { fontSize: 48, fontWeight: 700, color: activeTheme.text, lineHeight: 1 } }, followers > 999 ? `${(followers / 1000).toFixed(1)}k` : String(followers)),
          React.createElement('span', { style: { color: activeTheme.subtext, fontSize: 20, marginTop: 8, fontWeight: 400 } }, 'followers')
        )
      ),

      // HeatMap Section (7x5 Grid layout)
      (() => {
        const firstDay = new Date(year, month - 1, 1).getDay(); // 0-6 (Sun-Sat)
        const daysInMonth = dailyCommits.length;

        // We want rows (weeks), each with 7 columns (days, Sun-Sat).
        const rows = [];
        let currentRow = [];

        // Pad the first week
        for (let i = 0; i < firstDay; i++) {
          currentRow.push(-1);
        }

        // Fill in days
        for (let d = 1; d <= daysInMonth; d++) {
          currentRow.push(d);
          if (currentRow.length === 7) {
            rows.push(currentRow);
            currentRow = [];
          }
        }

        // Pad the last week
        if (currentRow.length > 0) {
          while (currentRow.length < 7) {
            currentRow.push(-1);
          }
          rows.push(currentRow);
        }

        return React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              marginBottom: 48,
              background: activeTheme.cardBg,
              border: `1px solid ${activeTheme.divider}`,
              borderRadius: 24,
              padding: '32px',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
            },
          },
          React.createElement(
            'div', { style: { width: '100%', display: 'flex' } },
            React.createElement(
              'span',
              { style: { color: activeTheme.subtext, fontSize: 24, letterSpacing: '4px', fontWeight: 700, marginBottom: 36 } },
              'CONTRIBUTION INTENSITY'
            )
          ),
          React.createElement(
            'div',
            {
              // Container for the weeks. Flex column to stack weeks vertically.
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              },
            },
            rows.map((row, rowIndex) =>
              React.createElement(
                'div',
                {
                  key: rowIndex,
                  style: {
                    display: 'flex',
                    flexDirection: 'row', // 7 boxes laid out horizontally per week
                    gap: 12,
                  }
                },
                row.map((day, colIndex) => {
                  let bg = 'transparent';
                  if (day !== -1) {
                    const count = dailyCommits[day - 1] || 0;
                    const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 10 ? 3 : 4;
                    bg = activeTheme.heatmap[level];
                  }

                  return React.createElement('div', {
                    key: colIndex,
                    style: {
                      width: 84, // Reduced from 104
                      height: 84,
                      borderRadius: 12,
                      background: bg,
                    }
                  });
                })
              )
            )
          )
        );
      })(),

      // Bottom row (Language & Repo)
      React.createElement(
        'div',
        { style: { display: 'flex', gap: 16, width: '100%' } },
        topLanguage
          ? React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                background: activeTheme.cardBg,
                border: `1px solid ${activeTheme.divider}`,
                borderRadius: 24,
                padding: '32px 36px',
                flex: 1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
              },
            },
            React.createElement('span', { style: { color: activeTheme.subtext, fontSize: 20, letterSpacing: '2px', fontWeight: 600, marginBottom: 16 } }, 'TOP LANGUAGE'),
            React.createElement(
              'div',
              { style: { display: 'flex', alignItems: 'center', gap: 16 } },
              React.createElement('div', {
                style: { width: 24, height: 24, borderRadius: '50%', background: topLanguageColor ?? activeTheme.accent, flexShrink: 0 },
              }),
              React.createElement('span', { style: { fontSize: 44, fontWeight: 700, color: activeTheme.text, lineHeight: 1 } }, topLanguage),
            )
          )
          : React.createElement('div', { style: { flex: 1 } }),

        topRepo
          ? React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                background: activeTheme.cardBg,
                border: `1px solid ${activeTheme.divider}`,
                borderRadius: 24,
                padding: '32px 36px',
                flex: 1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
              },
            },
            React.createElement('span', { style: { color: activeTheme.subtext, fontSize: 20, letterSpacing: '2px', fontWeight: 600, marginBottom: 16 } }, 'TOP REPO'),
            React.createElement('span', { style: { fontSize: 36, fontWeight: 700, color: activeTheme.text, lineHeight: 1.1 } }, topRepo.length > 20 ? topRepo.slice(0, 18) + '...' : topRepo)
          )
          : React.createElement('div', { style: { flex: 1 } }),
      ),

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
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate card'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
