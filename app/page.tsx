import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getLatestMonth, getAvailableTiers, getUsageStats } from '@/lib/smogon'
import { formatTierName } from '@/constants/tierColors'
import pokemonDataRaw from '@/lib/pokemon-data.json'
import PokemonCard from '@/components/PokemonCard'
import ErrorBoundary from '@/components/ErrorBoundary'
import { SkeletonCardGrid } from '@/components/SkeletonCard'
import HeroFloatingPokemon from '@/components/HeroFloatingPokemon'
import MonthlyHighlights from '@/components/MonthlyHighlights'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'PokeMetaTracker — Smogon Pokemon Showdown Usage Stats & Tier Rankings',
  description:
    'Competitive Pokemon Showdown usage stats updated monthly from Smogon. Browse OU, UU, Ubers, and 60+ tier rankings, movesets, item trends, and meta history for Gens 1–9.',
  alternates: { canonical: 'https://pokemetatracker-psi.vercel.app' },
  openGraph: {
    title: 'PokeMetaTracker — Smogon Pokemon Showdown Usage Stats & Tier Rankings',
    description:
      'Competitive Pokemon Showdown usage stats updated monthly from Smogon. Browse OU, UU, Ubers, and 60+ tier rankings, movesets, item trends, and meta history for Gens 1–9.',
    url: 'https://pokemetatracker-psi.vercel.app',
    images: [{ url: 'https://pokemetatracker-psi.vercel.app/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://pokemetatracker-psi.vercel.app/opengraph-image'],
  },
}

function formatMonthDisplay(yyyyMm: string): string {
  const [year, month] = yyyyMm.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function getPrevMonth(yyyyMm: string): string {
  const [y, m] = yyyyMm.split('-').map(Number)
  const date = new Date(y, m - 2, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

async function HeroStats() {
  const month = await getLatestMonth()
  const tiers = await getAvailableTiers(month)

  const pokemonCount = Object.keys(pokemonDataRaw).length

  const gens = new Set<number>()
  for (const t of tiers) {
    const g = parseInt(t.match(/^gen(\d)/)?.[1] ?? '0', 10)
    if (g > 0) gens.add(g)
  }
  const genArr = Array.from(gens)
  const minGen = Math.min(...genArr)
  const maxGen = Math.max(...genArr)
  const genLabel = gens.size > 1 ? `Gen ${minGen}–${maxGen}` : gens.size === 1 ? `Gen ${maxGen}` : 'Multi-Gen'

  const stats = [
    { value: `${pokemonCount.toLocaleString()}+`, label: 'Pokemon' },
    { value: `${tiers.length}+`, label: 'Formats' },
    { value: genLabel, label: 'Coverage' },
    { value: 'Monthly', label: 'Updates' },
  ]

  return (
    <div className="flex flex-wrap gap-8 mt-10 pt-8 border-t border-white/6 max-w-lg">
      {stats.map(({ value, label }) => (
        <div key={label}>
          <p className="text-2xl font-black text-white">{value}</p>
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  )
}

async function HeroBadge() {
  const month = await getLatestMonth()
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/35 bg-indigo-500/10 px-4 py-1.5 text-xs font-bold text-indigo-300 mb-7 tracking-widest uppercase select-none">
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
      {formatMonthDisplay(month)} Data Live
    </div>
  )
}

async function HomeContent() {
  const month = await getLatestMonth()
  const tier = 'gen9ou'

  const [currentStats, prevMonthStats] = await Promise.all([
    getUsageStats(month, tier).catch(() => []),
    getUsageStats(getPrevMonth(month), tier).catch(() => []),
  ])

  const top10 = currentStats.slice(0, 10)

  function getRankChange(name: string, currentRank: number): number | 'NEW' {
    const prev = prevMonthStats.find((s) => s.name === name)
    if (!prev) return 'NEW'
    return prev.rank - currentRank
  }

  if (top10.length === 0) {
    return (
      <div className="rounded-xl border border-yellow-900/40 bg-yellow-950/20 p-8 text-center">
        <p className="text-yellow-400 font-medium">Meta data is currently unavailable.</p>
        <p className="text-slate-400 mt-2">Smogon may be updating stats. Please check back later.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {top10.map((pokemon) => (
          <PokemonCard
            key={pokemon.name}
            name={pokemon.name}
            rank={pokemon.rank}
            usagePercent={pokemon.usagePercent}
            rankChange={getRankChange(pokemon.name, pokemon.rank)}
          />
        ))}
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/tier/gen9ou"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
        >
          View Full {formatTierName(tier)} Rankings →
        </Link>
      </div>
    </>
  )
}

export default async function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PokeMetaTracker',
    url: 'https://pokemetatracker-psi.vercel.app',
    description: 'Track Pokemon Showdown competitive meta trends and usage statistics.',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative mb-14 min-h-[460px] md:min-h-[500px]">
        {/* Background card layer (overflow-hidden contains the bg effects) */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d16] via-[#0f0f1c] to-[#0a0a12]" />
          {/* Grid texture */}
          <div className="absolute inset-0 hero-grid-bg" />
          {/* Glow orbs */}
          <div className="hero-orb-1 absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-800/25 blur-[90px]" />
          <div className="hero-orb-2 absolute top-1/2 left-1/4 w-72 h-72 rounded-full bg-violet-800/18 blur-[70px]" />
          <div className="hero-orb-3 absolute -bottom-20 right-1/3 w-80 h-80 rounded-full bg-indigo-700/15 blur-[80px]" />
          {/* Top shimmer line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          {/* Left shimmer line */}
          <div className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent" />
        </div>

        {/* Content — flex row on md+ so Pokemon never overlap text */}
        <div className="relative z-10 p-8 md:px-12 md:py-12 lg:px-16 lg:py-14 flex flex-col md:flex-row md:items-center justify-center min-h-[460px] md:min-h-[500px]">
          <div className="flex flex-col justify-center flex-1">
          {/* Live badge */}
          <Suspense fallback={
            <div className="inline-block w-48 h-7 rounded-full bg-white/5 animate-pulse mb-7" />
          }>
            <HeroBadge />
          </Suspense>

          {/* H1 */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-black text-white leading-[1.0] tracking-tight max-w-[600px]">
            Track the<br />
            <span className="gradient-text">Pokemon</span>
            <br />
            <span className="gradient-text">Showdown</span>
            <br />
            Competitive Meta
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-slate-400 max-w-[480px] leading-relaxed text-base sm:text-[1.05rem]">
            Real-time Smogon usage stats for every tier — top Pokemon, move and item trends,
            counters, and monthly meta evolution all in one place.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              href="/trends"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:from-indigo-500 hover:to-violet-500 transition-all duration-200 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              Meta Trends
              <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
            </Link>
            <Link
              href="/tier"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/6 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-white/12 hover:border-white/25 transition-all duration-200 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-indigo-400 backdrop-blur-sm"
            >
              Tier Rankings
            </Link>
            <Link
              href="/moves"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-5 py-3 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-all duration-200 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-indigo-400 backdrop-blur-sm"
            >
              Move Trends
            </Link>
            <Link
              href="/items"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-5 py-3 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-all duration-200 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-indigo-400 backdrop-blur-sm"
            >
              Item Trends
            </Link>
          </div>

          {/* Stats bar — real data, no hardcoding */}
          <Suspense fallback={
            <div className="flex gap-8 mt-10 pt-8 border-t border-white/6 max-w-lg">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="h-7 w-16 bg-white/10 rounded animate-pulse" />
                  <div className="h-3 w-14 bg-white/5 rounded mt-1.5 animate-pulse" />
                </div>
              ))}
            </div>
          }>
            <HeroStats />
          </Suspense>
        </div>

          {/* Pokemon column — md+ only, flex sibling so it never overlaps text */}
          <div className="hidden md:flex items-center justify-center flex-shrink-0">
            <Suspense fallback={null}>
              <HeroFloatingPokemon />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ─── Top 10 section ───────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">Top 10 Usage This Month</h2>
        <Suspense fallback={null}>
          <MonthlyHighlights tier="gen9ou" />
        </Suspense>
        <ErrorBoundary>
          <Suspense fallback={<SkeletonCardGrid count={10} />}>
            <HomeContent />
          </Suspense>
        </ErrorBoundary>
      </section>
    </>
  )
}
