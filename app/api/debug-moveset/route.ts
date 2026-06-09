import { NextResponse } from 'next/server'
import { getLatestMonth, getBestRatingFile, parseMovesetData, getMovesetText, getUsageStats, getAvailableTiers } from '@/lib/smogon'
import { normalizeSmogonName } from '@/lib/pokemon'

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://www.smogon.com/stats'
const USER_AGENT = 'PokeMetaTracker/1.0'

export async function GET() {
  try {
    const month = await getLatestMonth()

    // Simulate exactly what PokemonDetail does
    const tiers = await getAvailableTiers(month)
    const tierSearchResults = await Promise.all(
      tiers.map(async (tier) => {
        try {
          const stats = await getUsageStats(month, tier)
          const entry = stats.find((s) => normalizeSmogonName(s.name) === 'great-tusk')
          return entry ? { tier, smogonName: entry.name, usagePercent: entry.usagePercent } : null
        } catch { return null }
      })
    )
    const allTierUsages = tierSearchResults.filter((r): r is NonNullable<typeof r> => r !== null)
    const mainTier = allTierUsages[0]?.tier ?? 'gen9ou'
    const smogonName = allTierUsages[0]?.smogonName ?? 'great-tusk'

    // Get moveset via getMovesetText (same as Pokemon page)
    const rawText = await getMovesetText(month, mainTier)
    const result = parseMovesetData(rawText, smogonName)

    // Also test direct fresh fetch
    const dirRes = await fetch(`${BASE_URL}/${month}/moveset/`, { headers: { 'User-Agent': USER_AGENT }, cache: 'no-store' })
    const dirHtml = dirRes.ok ? await dirRes.text() : ''
    const files: string[] = []
    const regex = /href="([^"]+\.txt)"/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(dirHtml)) !== null) {
      if (!match[1].includes('/')) files.push(match[1])
    }
    const uniqueFiles = Array.from(new Set(files))
    const bestFile = uniqueFiles.length > 0 ? getBestRatingFile(uniqueFiles, mainTier) : `${mainTier}-1695.txt`

    return NextResponse.json({
      month,
      mainTier,
      smogonName,
      tiersFound: allTierUsages.length,
      movesetTextLen: rawText.length,
      movesetTextStart: rawText.slice(0, 100),
      bestFileFromDirectory: bestFile,
      counters: result?.counters ?? null,
      counterId: result?.counters?.length ?? -1,
      moves: result?.moves?.slice(0, 2) ?? null,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
