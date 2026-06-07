export const TIER_COLORS: Record<string, string> = {
  ag: '#a855f7',
  ubers: '#a855f7',
  ou: '#3b82f6',
  uu: '#22c55e',
  ru: '#eab308',
  nu: '#f97316',
  pu: '#ef4444',
  lc: '#ec4899',
  doublesou: '#3b82f6',
  doublesuu: '#16a34a',
  nationaldex: '#6366f1',
  nationaldexou: '#6366f1',
  monotype: '#14b8a6',
  vgc: '#0891b2',
  default: '#6b7280',
}

export function getTierColor(slug: string): string {
  const lower = slug.toLowerCase()
  // VGC check first (startsWith suffix after genX)
  const suffix = lower.replace(/^gen\d+/, '')
  if (suffix.startsWith('vgc')) return TIER_COLORS.vgc
  for (const key of Object.keys(TIER_COLORS)) {
    if (lower.endsWith(key)) return TIER_COLORS[key]
  }
  return TIER_COLORS.default
}

export function formatTierName(tier: string): string {
  const genMatch = tier.match(/^gen(\d+)(.+)$/)
  if (!genMatch) {
    return tier.charAt(0).toUpperCase() + tier.slice(1)
  }
  const genNum = genMatch[1]
  const tierSuffix = genMatch[2].toLowerCase()

  const SUFFIX_MAP: Record<string, string> = {
    ou: 'OU',
    uu: 'UU',
    ubers: 'Ubers',
    ru: 'RU',
    nu: 'NU',
    pu: 'PU',
    lc: 'LC',
    doublesou: 'Doubles OU',
    doublesuu: 'Doubles UU',
    nationaldex: 'National Dex',
    monotype: 'Monotype',
    ag: 'AG',
    zu: 'ZU',
    nfe: 'NFE',
    uubl: 'UUBL',
    rubl: 'RUBL',
    nubl: 'NUBL',
    publ: 'PUBL',
    nationaldexou: 'National Dex OU',
    nationaldexubers: 'National Dex Ubers',
    nationaldexmonotype: 'National Dex Monotype',
  }

  // VGC: "vgc2024" → "VGC 2024", "vgc2026regi" → "VGC 2026 Regi"
  if (tierSuffix.startsWith('vgc')) {
    const vgcPart = tierSuffix.slice(3) // e.g. "2024", "2026regi"
    const yearMatch = vgcPart.match(/^(\d{4})(.*)$/)
    if (yearMatch) {
      const extra = yearMatch[2] ? ' ' + yearMatch[2].charAt(0).toUpperCase() + yearMatch[2].slice(1) : ''
      return `Gen ${genNum} VGC ${yearMatch[1]}${extra}`
    }
    return `Gen ${genNum} VGC`
  }

  const displaySuffix = SUFFIX_MAP[tierSuffix] ?? tierSuffix.charAt(0).toUpperCase() + tierSuffix.slice(1)
  return `Gen ${genNum} ${displaySuffix}`
}

export function getTierDescription(tier: string): string {
  const lower = tier.toLowerCase()
  if (lower.includes('ubers')) return 'The most powerful Pokemon are allowed here, including those banned from OU. This is the most permissive standard tier.'
  if (lower.endsWith('ou')) return 'OverUsed is the standard competitive tier where the most popular Pokemon battle it out. Balanced power level with a focus on team diversity.'
  if (lower.endsWith('uu')) return 'UnderUsed is the second standard tier featuring Pokemon that are too weak for OU but too strong for RU. Great for a different competitive experience.'
  if (lower.endsWith('ru')) return 'RarelyUsed features Pokemon that see little use in OU or UU. An underrated tier with creative team-building opportunities.'
  if (lower.endsWith('nu')) return 'NeverUsed features Pokemon rarely seen in higher tiers. Despite the name, it offers a dynamic and strategic metagame.'
  if (lower.endsWith('pu')) return 'PU is the lowest standard tier, featuring Pokemon that see little usage even in NU. A surprisingly deep and creative tier.'
  if (lower.endsWith('lc')) return 'Little Cup restricts battles to unevolved Pokemon at level 5, creating a unique metagame with surprising depth.'
  if (lower.includes('doublesou')) return 'Doubles OU is the standard doubles battle format where teams of 4 Pokemon battle simultaneously in 2v2 combat.'
  if (lower.includes('monotype')) return 'Monotype requires all Pokemon on a team to share at least one type, leading to unique team structures and strategies.'
  if (lower.includes('nationaldex')) return 'National Dex allows Pokemon from previous generations that are not available in the current game, expanding the roster significantly.'
  return 'A competitive Pokemon tier from Smogon where players battle using various strategies and team compositions.'
}
