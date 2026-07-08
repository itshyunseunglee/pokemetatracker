'use client'

import { memo } from 'react'
import Link from 'next/link'
import { normalizeSmogonName, getPokemonImageUrls, getPokemonSpriteUrls } from '@/lib/pokemon'
import SmartPokemonImage from './SmartPokemonImage'

interface RankChangeProp {
  change: number | 'NEW' | undefined
}

function RankChange({ change }: RankChangeProp): React.JSX.Element | null {
  if (change === undefined) return null
  if (change === 'NEW') return <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">NEW</span>
  if (change > 0) return <span className="text-green-400 text-xs font-semibold">↑ {change}</span>
  if (change < 0) return <span className="text-red-400 text-xs font-semibold">↓ {Math.abs(change)}</span>
  return <span className="text-slate-500 text-xs">—</span>
}

interface RowProps {
  rank: number
  name: string
  usagePercent: number
  rawCount: number
  rankChange: number | 'NEW' | undefined
  view: 'table' | 'card'
  hideChange?: boolean
}

export const PokemonRowClient = memo(function PokemonRowClient({
  rank, name, usagePercent, rawCount, rankChange, view, hideChange,
}: RowProps): React.JSX.Element {
  const normalized = normalizeSmogonName(name)
  const artworkUrls = getPokemonImageUrls(name)
  const spriteUrls = getPokemonSpriteUrls(name)
  const pokemonHref = `/pokemon/${normalized}`

  if (view === 'card') {
    return (
      <Link
        href={pokemonHref}
        className="flex flex-col items-center rounded-xl bg-[#1a1a24] border border-white/6 p-4 hover:border-indigo-500/50 transition-all hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span className="text-sm text-slate-500 mb-1">#{rank}</span>
        <div className="h-20 w-20 flex items-center justify-center">
          <SmartPokemonImage
            urls={artworkUrls}
            alt={`${name} artwork`}
            width={80}
            height={80}
            priority={rank <= 3}
            loading={rank <= 5 ? 'eager' : 'lazy'}
          />
        </div>
        <p className="text-sm font-semibold text-slate-100 capitalize text-center mt-1">{name}</p>
        <p className="text-indigo-400 font-bold">{usagePercent.toFixed(1)}%</p>
        <RankChange change={rankChange} />
      </Link>
    )
  }

  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
      <td className="py-3 px-4 text-slate-400 font-mono text-sm">{rank}</td>
      <td className="py-3 px-4">
        <Link href={pokemonHref} className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded min-h-[44px]">
          <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center">
            <SmartPokemonImage
              urls={spriteUrls}
              alt={`${name} sprite`}
              width={40}
              height={40}
              loading={rank <= 10 ? 'eager' : 'lazy'}
            />
          </div>
          <span className="text-slate-100 font-medium hover:text-indigo-400 transition-colors capitalize">{name}</span>
        </Link>
      </td>
      <td className="py-3 px-4 text-indigo-400 font-bold">{usagePercent.toFixed(2)}%</td>
      <td className="py-3 px-4 text-slate-400 text-sm">{rawCount.toLocaleString()}</td>
      {!hideChange && <td className="py-3 px-4"><RankChange change={rankChange} /></td>}
    </tr>
  )
})
