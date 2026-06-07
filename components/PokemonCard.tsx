'use client'

import React, { memo } from 'react'
import Link from 'next/link'
import { normalizeSmogonName, getPokemonImageUrls } from '@/lib/pokemon'
import SmartPokemonImage from './SmartPokemonImage'

interface Props {
  name: string
  rank: number
  usagePercent: number
  rankChange?: number | 'NEW'
}

function RankDelta({ change }: { change: number | 'NEW' | undefined }): React.JSX.Element | null {
  if (change === undefined) return null
  if (change === 'NEW') {
    return <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">NEW</span>
  }
  if (change > 0) {
    return <span className="text-green-400 text-xs font-semibold">↑ {change}</span>
  }
  if (change < 0) {
    return <span className="text-red-400 text-xs font-semibold">↓ {Math.abs(change)}</span>
  }
  return <span className="text-slate-500 text-xs">—</span>
}

const PokemonCard = memo(function PokemonCard({ name, rank, usagePercent, rankChange }: Props): React.JSX.Element {
  const normalized = normalizeSmogonName(name)
  const imageUrls = getPokemonImageUrls(name)
  const displayName = name.replace(/-/g, ' ')

  return (
    <Link
      href={`/pokemon/${normalized}`}
      className="group block rounded-xl bg-[#1a1a24] border border-white/6 p-4 transition-all duration-200 hover:scale-[1.03] hover:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold text-slate-400">#{rank}</span>
        <RankDelta change={rankChange} />
      </div>

      <div className="flex justify-center mb-3 h-24 items-center">
        <SmartPokemonImage
          urls={imageUrls}
          alt={`${displayName} official artwork`}
          width={96}
          height={96}
          className="drop-shadow-lg"
          priority={rank <= 3}
          loading={rank <= 5 ? 'eager' : 'lazy'}
        />
      </div>

      <p className="text-center text-sm font-semibold text-slate-100 capitalize truncate">{displayName}</p>
      <p className="text-center text-indigo-400 font-bold mt-1">{usagePercent.toFixed(1)}%</p>
    </Link>
  )
})

export default PokemonCard
