'use client'

import { useState } from 'react'
import { formatTierName } from '@/constants/tierColors'

interface Props {
  tiers: string[]
  selectedTier: string
  basePath: string
  paramName?: string
}

// Tier suffixes (after stripping genX prefix) considered main competitive formats
const MAIN_SUFFIXES = new Set([
  'ou', 'ubers', 'uu', 'ru', 'nu', 'pu', 'lc',
  'doublesou', 'doublesuu', 'monotype', 'nationaldex', 'nationaldexou',
])

function isMainTier(t: string): boolean {
  const suffix = t.replace(/^gen\d+/, '')
  // VGC and BSS (Battle Stadium Singles) are official Championship formats
  return MAIN_SUFFIXES.has(suffix) || suffix.startsWith('vgc') || suffix.startsWith('bss')
}

function hrefFor(t: string, basePath: string, paramName: string): string {
  return basePath === '/tier' ? `/tier/${t}` : `${basePath}?${paramName}=${t}`
}

export default function TierSelector({ tiers, selectedTier, basePath, paramName = 'tier' }: Props): React.JSX.Element {
  const [showAllFormats, setShowAllFormats] = useState(false)
  const [showOlderGens, setShowOlderGens] = useState(false)
  // Tracks when the user explicitly collapses while a niche tier is selected
  const [userCollapsed, setUserCollapsed] = useState(false)

  // Group by generation (single-digit regex to avoid gen9v2doubles → gen=9v2)
  const genMap = new Map<number, string[]>()
  for (const t of tiers) {
    const gen = parseInt(t.match(/^gen(\d)/)?.[1] ?? '0', 10)
    if (!genMap.has(gen)) genMap.set(gen, [])
    genMap.get(gen)!.push(t)
  }
  const gens = Array.from(genMap.keys()).sort((a, b) => b - a)
  const latestGen = gens[0] ?? 0
  const olderGens = gens.filter((g) => g < latestGen)

  const selectedGen = parseInt(selectedTier.match(/^gen(\d)/)?.[1] ?? '0', 10)
  const selectedIsOlderGen = selectedGen > 0 && selectedGen < latestGen
  const selectedIsNiche = selectedTier.length > 0 && !isMainTier(selectedTier)

  // Auto-expand sections when the active tier lives there
  const shouldShowOlderGens = showOlderGens || selectedIsOlderGen
  // Auto-expand niche formats when a niche tier is active — unless the user explicitly collapsed
  const shouldShowAllFormats = showAllFormats || (selectedIsNiche && !userCollapsed)

  const hasNicheFormats = tiers.some((t) => !isMainTier(t))
  const hasOlderGens = olderGens.length > 0

  function toggleAllFormats() {
    if (shouldShowAllFormats) {
      setShowAllFormats(false)
      // If collapsing while a niche tier is selected, pin that tier in the strip
      if (selectedIsNiche) setUserCollapsed(true)
    } else {
      setShowAllFormats(true)
      setUserCollapsed(false)
    }
  }

  function TierRow({ gen }: { gen: number }) {
    const allForGen = genMap.get(gen) ?? []
    const mainTiers = allForGen.filter(isMainTier)
    const nicheTiers = allForGen.filter((t) => !isMainTier(t))

    // When collapsed after explicit user action, pin the selected niche tier in the strip
    const pinnedNiche =
      !shouldShowAllFormats && userCollapsed && selectedIsNiche && allForGen.includes(selectedTier)
        ? [selectedTier]
        : []

    const visibleTiers = shouldShowAllFormats ? allForGen : [...mainTiers, ...pinnedNiche]
    const hiddenNicheCount = nicheTiers.length - pinnedNiche.length

    if (visibleTiers.length === 0) return null

    return (
      <div className="flex items-start gap-2 min-w-0">
        <span className="text-xs font-bold text-slate-500 w-7 mt-1.5 shrink-0 select-none">G{gen}</span>
        <div className="flex flex-wrap gap-1.5 min-w-0">
          {visibleTiers.map((t) => (
            <a
              key={t}
              href={hrefFor(t, basePath, paramName)}
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-nowrap ${
                t === selectedTier
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white/8 text-slate-400 hover:bg-white/15 hover:text-slate-200'
              }`}
            >
              {formatTierName(t).replace(/^Gen \d+ /, '')}
            </a>
          ))}
          {!shouldShowAllFormats && hiddenNicheCount > 0 && (
            <span className="text-xs text-slate-600 self-center pl-0.5">
              +{hiddenNicheCount} more
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-xl bg-[#16161f] border border-white/6 p-4 space-y-2.5">
      {/* Latest gen always visible */}
      {latestGen > 0 && <TierRow gen={latestGen} />}

      {/* Older gens — collapsed unless active tier is there */}
      {hasOlderGens && (
        <>
          {shouldShowOlderGens && olderGens.map((gen) => <TierRow key={gen} gen={gen} />)}
          <button
            onClick={() => setShowOlderGens((v) => !v)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1"
          >
            {shouldShowOlderGens
              ? '▲ Hide older generations'
              : `▼ Older generations (Gen 1–${latestGen - 1})`}
          </button>
        </>
      )}

      {/* Niche/unofficial formats — hidden behind toggle */}
      {hasNicheFormats && (
        <button
          onClick={toggleAllFormats}
          className="block text-xs text-slate-500 hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1"
        >
          {shouldShowAllFormats
            ? '▲ Hide niche formats'
            : '▼ Show all formats (Hackmons, Camomons, AAA…)'}
        </button>
      )}
    </div>
  )
}
