import { NextResponse } from 'next/server'
import { getLatestMonth, getBestRatingFile } from '@/lib/smogon'
import { parseMovesetData } from '@/lib/smogon'

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://www.smogon.com/stats'
const USER_AGENT = 'PokeMetaTracker/1.0'

export async function GET() {
  try {
    const month = await getLatestMonth()

    // Step 1: fetch directory listing
    const dirUrl = `${BASE_URL}/${month}/moveset/`
    const dirRes = await fetch(dirUrl, { headers: { 'User-Agent': USER_AGENT }, cache: 'no-store' })
    const dirHtml = dirRes.ok ? await dirRes.text() : ''
    const files: string[] = []
    const regex = /href="([^"]+\.txt)"/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(dirHtml)) !== null) {
      if (!match[1].includes('/')) files.push(match[1])
    }
    const uniqueFiles = [...new Set(files)]
    const bestFile = uniqueFiles.length > 0 ? getBestRatingFile(uniqueFiles, 'gen9ou') : 'gen9ou-1695.txt'
    const fileUrl = `${BASE_URL}/${month}/moveset/${bestFile}`

    // Step 2: fetch the file
    const fileRes = await fetch(fileUrl, { headers: { 'User-Agent': USER_AGENT }, cache: 'no-store' })
    const rawText = fileRes.ok ? await fileRes.text() : ''
    const textLen = rawText.length
    const result = parseMovesetData(rawText, 'Great Tusk')

    return NextResponse.json({
      month,
      dirUrl,
      availableFiles: uniqueFiles,
      bestFile,
      fileUrl,
      fileStatus: fileRes.status,
      textLen,
      textStart: rawText.slice(0, 200),
      counters: result?.counters ?? null,
      moves: result?.moves?.slice(0, 3) ?? null,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
