import { type NextRequest, NextResponse } from 'next/server'
import { getMonthlyUsageForPokemon } from '@/lib/smogon'

export const revalidate = 86400

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const namesParam = searchParams.get('names') ?? ''
    const tier = searchParams.get('tier') ?? 'gen9ou'
    const monthsParam = searchParams.get('months') ?? ''

    const names = namesParam.split(',').filter(Boolean).slice(0, 10)
    const months = monthsParam.split(',').filter(Boolean)

    if (names.length === 0 || months.length === 0) {
      return NextResponse.json([])
    }

    const results = await Promise.all(
      names.map(async (name) => {
        const data = await getMonthlyUsageForPokemon(name, tier, months)
        return { name, data }
      })
    )

    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
    })
  } catch (err) {
    console.error('[api/trends]', err)
    return NextResponse.json([], { status: 200 })
  }
}
