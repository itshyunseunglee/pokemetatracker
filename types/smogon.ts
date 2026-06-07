export interface UsageStat {
  rank: number
  name: string
  usagePercent: number
  rawCount: number
  realCount: number
}

export interface MovesetData {
  name: string
  moves: { name: string; percent: number }[]
  items: { name: string; percent: number }[]
  spreads: { nature: string; evs: string; percent: number }[]
  teammates: { name: string; percent: number }[]
  counters: { name: string; koPercent: number; switchPercent: number }[]
}

export interface MonthlyUsage {
  month: string
  usagePercent: number
}

export interface TierInfo {
  slug: string
  displayName: string
  color: string
}

export interface PokemonData {
  id: number
  types: string[]
  stats: {
    hp: number
    atk: number
    def: number
    spa: number
    spd: number
    spe: number
  }
}

export type PokemonDataMap = Record<string, PokemonData>
