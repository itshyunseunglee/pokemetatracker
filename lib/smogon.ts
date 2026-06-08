import { getCached, setCached } from './cache'
import type { UsageStat, MovesetData, MonthlyUsage } from '@/types/smogon'

const BASE_URL = 'https://www.smogon.com/stats'
const USER_AGENT = 'PokeMetaTracker/1.0'
const TTL_24H = 24 * 60 * 60 * 1000
const DEFAULT_TIERS = ['gen9ou', 'gen9uu', 'gen9ubers', 'gen9ru', 'gen9nu', 'gen9pu']

async function smogonFetch(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    next: { revalidate: 86400 },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  return res.text()
}

function getPreviousMonth(yyyyMm: string): string {
  const [y, m] = yyyyMm.split('-').map(Number)
  const date = new Date(y, m - 1 - 1, 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export async function getLatestMonth(): Promise<string> {
  const now = new Date()
  // Start from previous month (Smogon publishes last month's data)
  let candidate = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`
  if (now.getMonth() === 0) {
    candidate = `${now.getFullYear() - 1}-12`
  }

  for (let i = 0; i < 3; i++) {
    try {
      const url = `${BASE_URL}/${candidate}/`
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        next: { revalidate: 86400 },
      })
      if (res.ok) return candidate
    } catch {
      // fall through
    }
    candidate = getPreviousMonth(candidate)
  }
  return candidate
}

function recentMonthsFallback(count: number): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 1; i <= count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

export async function getAvailableMonths(): Promise<string[]> {
  const cacheKey = 'smogon:available-months'
  const cached = getCached<string[]>(cacheKey)
  if (cached) return cached

  try {
    const html = await smogonFetch(`${BASE_URL}/`)
    const months: string[] = []
    // Try both quoted and unquoted href patterns
    const regex = /href=["']?(\d{4}-\d{2})\/["']?/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(html)) !== null) {
      months.push(match[1])
    }
    months.sort((a, b) => b.localeCompare(a))
    const result = months.length > 0 ? months : recentMonthsFallback(12)
    if (result.length > 0) setCached(cacheKey, result, TTL_24H)
    return result
  } catch (err) {
    console.error('[smogon] getAvailableMonths failed:', err)
    return recentMonthsFallback(12)
  }
}

export function getBestRatingFile(files: string[], tierBaseName: string): string {
  const matching = files.filter((f) => f.startsWith(tierBaseName + '-') && f.endsWith('.txt'))
  if (matching.length === 0) return `${tierBaseName}-0.txt`
  matching.sort((a, b) => {
    const ratingA = parseInt(a.replace(tierBaseName + '-', '').replace('.txt', ''), 10)
    const ratingB = parseInt(b.replace(tierBaseName + '-', '').replace('.txt', ''), 10)
    return ratingB - ratingA
  })
  return matching[0]
}

export async function getAvailableTiers(month: string): Promise<string[]> {
  const cacheKey = `smogon:tiers:${month}`
  const cached = getCached<string[]>(cacheKey)
  if (cached) return cached

  try {
    const html = await smogonFetch(`${BASE_URL}/${month}/`)
    const files: string[] = []
    const regex = /href="([^"]+\.txt)"/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(html)) !== null) {
      const file = match[1]
      // Only root-level txt files, no subdirectory paths
      if (!file.includes('/')) {
        files.push(file)
      }
    }

    // Group by tier base name and pick highest rating
    const tierBases = new Set<string>()
    for (const file of files) {
      const base = file.replace(/-\d+\.txt$/, '')
      tierBases.add(base)
    }

    // Sort: higher gen first, then main tiers by priority, VGC, then niche alphabetically
    const tierPriority: Record<string, string> = {
      'ou': '00', 'ubers': '01', 'uu': '02', 'ru': '03', 'nu': '04', 'pu': '05',
      'lc': '06', 'doublesou': '07', 'doublesuu': '08', 'monotype': '09',
      'nationaldex': '10', 'nationaldexou': '11',
    }
    const getTierSortKey = (suffix: string): string => {
      if (suffix in tierPriority) return tierPriority[suffix]
      if (suffix.startsWith('vgc')) return '12' + suffix
      return 'zz' + suffix
    }
    const tiers = Array.from(tierBases).sort((a, b) => {
      const genA = parseInt(a.match(/^gen(\d)/)?.[1] ?? '0', 10)
      const genB = parseInt(b.match(/^gen(\d)/)?.[1] ?? '0', 10)
      if (genA !== genB) return genB - genA
      const nameA = a.replace(/^gen\d+/, '')
      const nameB = b.replace(/^gen\d+/, '')
      return getTierSortKey(nameA).localeCompare(getTierSortKey(nameB))
    })
    setCached(cacheKey, tiers, TTL_24H)
    return tiers
  } catch (err) {
    console.error('[smogon] getAvailableTiers failed:', err)
    return DEFAULT_TIERS
  }
}

export async function getMovesetText(month: string, tier: string): Promise<string> {
  const cacheKey = `smogon:moveset:${month}:${tier}`
  const cached = getCached<string>(cacheKey)
  if (cached) return cached

  let files: string[] = []
  try {
    const html = await smogonFetch(`${BASE_URL}/${month}/moveset/`)
    const regex = /href="([^"]+\.txt)"/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(html)) !== null) {
      if (!match[1].includes('/')) files.push(match[1])
    }
  } catch { /* fallback to default rating */ }

  const bestFile = files.length > 0 ? getBestRatingFile(files, tier) : `${tier}-1695.txt`
  const url = `${BASE_URL}/${month}/moveset/${bestFile}`
  const text = await smogonFetch(url)
  setCached(cacheKey, text, TTL_24H)
  return text
}

export async function getRawUsageText(month: string, tier: string): Promise<string> {
  const cacheKey = `smogon:raw:${month}:${tier}`
  const cached = getCached<string>(cacheKey)
  if (cached) return cached

  // Get directory listing to find the best rating file
  let files: string[] = []
  try {
    const html = await smogonFetch(`${BASE_URL}/${month}/`)
    const regex = /href="([^"]+\.txt)"/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(html)) !== null) {
      if (!match[1].includes('/')) files.push(match[1])
    }
  } catch {
    // fallback: try -1695 common rating
  }

  const bestFile = files.length > 0 ? getBestRatingFile(files, tier) : `${tier}-1695.txt`
  const url = `${BASE_URL}/${month}/${bestFile}`
  const text = await smogonFetch(url)
  setCached(cacheKey, text, TTL_24H)
  return text
}

export function parseUsageStats(text: string): UsageStat[] {
  try {
    const lines = text.split('\n')
    const stats: UsageStat[] = []
    for (const line of lines) {
      // Lines look like: | 1 | Garchomp    | 35.000% | 12345 | 12000 | ...
      if (!line.startsWith('|') || !line.includes('%')) continue
      const parts = line.split('|').map((p) => p.trim()).filter((p) => p.length > 0)
      if (parts.length < 5) continue
      const rank = parseInt(parts[0], 10)
      if (isNaN(rank)) continue
      const name = parts[1]
      const usageStr = parts[2].replace('%', '')
      const usagePercent = parseFloat(usageStr)
      const rawCount = parseInt(parts[3], 10)
      const realCount = parseInt(parts[4], 10)
      if (!name || isNaN(usagePercent)) continue
      stats.push({
        rank,
        name,
        usagePercent: isNaN(usagePercent) ? 0 : usagePercent,
        rawCount: isNaN(rawCount) ? 0 : rawCount,
        realCount: isNaN(realCount) ? 0 : realCount,
      })
    }
    return stats
  } catch (err) {
    console.error('[smogon] parseUsageStats failed:', err)
    return []
  }
}

export function parseMovesetData(text: string, pokemonName: string): MovesetData | null {
  try {
    const normalized = pokemonName.toLowerCase().trim()
    // Split by "+---+" separator tokens (original robust approach)
    const sections = text.split(/\+[-]+\+/m)

    // Find the section that contains exactly the Pokemon name (no % or :)
    let nameIdx = -1
    for (let i = 0; i < sections.length; i++) {
      const contentLines = sections[i].split('\n')
        .map((l) => l.replace(/^\s*\|\s*/, '').replace(/\s*\|\s*$/, '').trim())
        .filter((l) => l.length > 0)
      if (contentLines.length === 1 && contentLines[0].toLowerCase() === normalized) {
        nameIdx = i
        break
      }
    }

    if (nameIdx === -1) return null

    // Collect all data lines from subsequent sections until the next Pokemon name section.
    // A Pokemon name section is: single content line, no %, no :, not a known header.
    const knownHeaders = new Set([
      'abilities', 'items', 'spreads', 'moves', 'tera types', 'teammates', 'checks and counters',
    ])
    const dataLines: string[] = []
    for (let i = nameIdx + 1; i < sections.length; i++) {
      const contentLines = sections[i].split('\n')
        .map((l) => l.replace(/^\s*\|\s*/, '').replace(/\s*\|\s*$/, '').trim())
        .filter((l) => l.length > 0)
      // Detect start of next Pokemon's block: single line that starts with a letter,
      // has no % or : and no "(" (counter name lines have "(score ± err)").
      if (
        contentLines.length === 1 &&
        /^[A-Za-z]/.test(contentLines[0]) &&
        !contentLines[0].includes('(') &&
        !knownHeaders.has(contentLines[0].toLowerCase()) &&
        !contentLines[0].includes('%') &&
        !contentLines[0].includes(':') &&
        !/^\d/.test(contentLines[0])
      ) {
        break
      }
      dataLines.push(...contentLines)
    }

    const result: MovesetData = {
      name: pokemonName,
      moves: [],
      items: [],
      spreads: [],
      teammates: [],
      counters: [],
    }

    let currentSection = ''
    let pendingCounterName = ''

    for (const content of dataLines) {
      const lower = content.toLowerCase()

      // Detect section headers
      if (lower === 'abilities') { currentSection = 'abilities'; continue }
      if (lower === 'items') { currentSection = 'items'; continue }
      if (lower === 'spreads') { currentSection = 'spreads'; continue }
      if (lower === 'moves') { currentSection = 'moves'; continue }
      if (lower === 'tera types') { currentSection = 'tera'; continue }
      if (lower === 'teammates') { currentSection = 'teammates'; continue }
      if (lower === 'checks and counters') { currentSection = 'counters'; continue }
      // Skip metadata lines
      if (lower.startsWith('raw count') || lower.startsWith('avg. weight') || lower.startsWith('viability')) continue

      // "Name XX.XX%" pattern (moves, items, spreads, teammates, abilities)
      const percentMatch = content.match(/^(.+?)\s+([\d.]+)%\s*$/)

      if (currentSection === 'moves' && percentMatch) {
        const name = percentMatch[1].trim()
        const pct = parseFloat(percentMatch[2])
        if (name && name !== 'Other' && !isNaN(pct)) result.moves.push({ name, percent: pct })
      } else if (currentSection === 'items' && percentMatch) {
        const name = percentMatch[1].trim()
        const pct = parseFloat(percentMatch[2])
        if (name && name !== 'Other' && name !== 'Nothing' && !isNaN(pct)) result.items.push({ name, percent: pct })
      } else if (currentSection === 'spreads' && percentMatch) {
        const name = percentMatch[1].trim()
        const pct = parseFloat(percentMatch[2])
        if (name && !isNaN(pct)) {
          const spreadParts = name.split(':')
          result.spreads.push({ nature: spreadParts[0]?.trim() ?? '', evs: spreadParts[1]?.trim() ?? '', percent: pct })
        }
      } else if (currentSection === 'teammates' && percentMatch) {
        const name = percentMatch[1].trim()
        const pct = parseFloat(percentMatch[2])
        if (name && !isNaN(pct)) result.teammates.push({ name, percent: pct })
      } else if (currentSection === 'counters') {
        // Counters: name line "Name    score (KO±err)", then KO% line "(XX% KOed / YY% switched)"
        const koMatch = content.match(/([\d.]+)%\s*KOed\s*\/\s*([\d.]+)%\s*switched/)
        if (koMatch) {
          if (pendingCounterName) {
            result.counters.push({
              name: pendingCounterName,
              koPercent: parseFloat(koMatch[1]),
              switchPercent: parseFloat(koMatch[2]),
            })
          }
          pendingCounterName = ''
        } else if (/^[A-Za-z]/.test(content)) {
          // Counter line format: "Name   1.234 (kp ± err)" OR "Name   | 1.234 | (kp ± err)"
          // The pipe variant occurs when Smogon uses multi-column table formatting.
          const nameMatch = content.match(/^([A-Za-z][A-Za-z0-9\s\-'.]+?)(\s+|\s*\|)\s*[\d|]/)
          if (nameMatch) pendingCounterName = nameMatch[1].trim()
        }
      }
    }

    return result
  } catch (err) {
    console.error('[smogon] parseMovesetData failed:', err)
    return null
  }
}

export async function getMonthlyUsageForPokemon(
  pokemon: string,
  tier: string,
  months: string[]
): Promise<MonthlyUsage[]> {
  const settled = await Promise.all(
    months.map(async (month): Promise<MonthlyUsage | null> => {
      try {
        const text = await getRawUsageText(month, tier)
        const stats = parseUsageStats(text)
        const entry = stats.find((s) => s.name.toLowerCase() === pokemon.toLowerCase())
        return entry != null ? { month, usagePercent: entry.usagePercent } : null
      } catch {
        return null
      }
    })
  )
  return settled.filter((r): r is MonthlyUsage => r !== null)
}

export async function getUsageMinElo(month: string, tier: string): Promise<number> {
  let files: string[] = []
  try {
    const html = await smogonFetch(`${BASE_URL}/${month}/`)
    const regex = /href="([^"]+\.txt)"/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(html)) !== null) {
      if (!match[1].includes('/')) files.push(match[1])
    }
  } catch {}
  const bestFile = files.length > 0 ? getBestRatingFile(files, tier) : `${tier}-1695.txt`
  const rating = parseInt(bestFile.replace(`${tier}-`, '').replace('.txt', ''), 10)
  return isNaN(rating) ? 0 : rating
}

export async function getUsageStats(month: string, tier: string): Promise<UsageStat[]> {
  const cacheKey = `smogon:stats:${month}:${tier}`
  const cached = getCached<UsageStat[]>(cacheKey)
  if (cached) return cached

  try {
    const text = await getRawUsageText(month, tier)
    const stats = parseUsageStats(text)
    setCached(cacheKey, stats, TTL_24H)
    return stats
  } catch (err) {
    console.error(`[smogon] getUsageStats failed for ${month}/${tier}:`, err)
    return []
  }
}
