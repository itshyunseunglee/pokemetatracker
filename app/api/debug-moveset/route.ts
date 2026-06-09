import { NextResponse } from 'next/server'
import { getLatestMonth, getMovesetText, parseMovesetData } from '@/lib/smogon'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const month = await getLatestMonth()
    const rawText = await getMovesetText(month, 'gen9ou')
    const textLen = rawText.length
    const result = parseMovesetData(rawText, 'Great Tusk')
    return NextResponse.json({
      month,
      textLen,
      textStart: rawText.slice(0, 200),
      counters: result?.counters ?? null,
      moves: result?.moves?.slice(0, 3) ?? null,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
