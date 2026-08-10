import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { readFile } from 'fs/promises'
import path from 'path'
import { fetchMonthlyStats, fetchYearlyStats, isValidGitHubUsername } from '@/lib/github'
import { renderCard } from '@/lib/card-renderer'

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
  const mode = searchParams.get('mode') ?? 'monthly'
  const token = process.env.GITHUB_TOKEN

  if (!username || !isValidGitHubUsername(username) || !year) {
    return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 })
  }
  if (mode === 'monthly' && (!month || month < 1 || month > 12)) {
    return NextResponse.json({ error: 'Missing or invalid month' }, { status: 400 })
  }

  try {
    const [stats, loadedFonts] = await Promise.all([
      mode === 'yearly'
        ? fetchYearlyStats(username, year, token)
        : fetchMonthlyStats(username, month, year, token),
      loadFonts(),
    ])

    // Fetch avatar image
    let avatarBuffer: Buffer | null = null
    try {
      const avatarRes = await fetch(stats.avatarUrl)
      if (avatarRes.ok) {
        avatarBuffer = Buffer.from(await avatarRes.arrayBuffer())
      }
    } catch (e) {
      console.error('Failed to fetch avatar:', e)
    }

    const png = await renderCard({
      stats,
      theme,
      mode: mode as 'monthly' | 'yearly',
      month,
      year,
      avatarBuffer,
      fonts: loadedFonts,
    })

    const responseBody = new ArrayBuffer(png.byteLength)
    new Uint8Array(responseBody).set(png)

    return new NextResponse(responseBody, {
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
