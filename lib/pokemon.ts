import pokemonDataRaw from './pokemon-data.json'
import type { PokemonDataMap } from '@/types/smogon'

export const pokemonData: PokemonDataMap = pokemonDataRaw as PokemonDataMap

// PokeAPI IDs for competitive form Pokemon not in pokemon-data.json
// (megas, primals, alternate forms that appear in National Dex / Champions stats)
const FORM_POKEMON_IDS: Record<string, number> = {
  'venusaur-mega': 10033, 'charizard-mega-x': 10034, 'charizard-mega-y': 10035,
  'blastoise-mega': 10036, 'alakazam-mega': 10037, 'gengar-mega': 10038,
  'kangaskhan-mega': 10039, 'pinsir-mega': 10040, 'gyarados-mega': 10041,
  'aerodactyl-mega': 10042, 'mewtwo-mega-x': 10043, 'mewtwo-mega-y': 10044,
  'ampharos-mega': 10045, 'scizor-mega': 10046, 'heracross-mega': 10047,
  'houndoom-mega': 10048, 'tyranitar-mega': 10049, 'blaziken-mega': 10050,
  'gardevoir-mega': 10051, 'mawile-mega': 10052, 'aggron-mega': 10053,
  'medicham-mega': 10054, 'manectric-mega': 10055, 'banette-mega': 10056,
  'absol-mega': 10057, 'garchomp-mega': 10058, 'lucario-mega': 10059,
  'abomasnow-mega': 10060, 'latias-mega': 10062, 'latios-mega': 10063,
  'swampert-mega': 10064, 'sceptile-mega': 10065, 'sableye-mega': 10066,
  'altaria-mega': 10067, 'gallade-mega': 10068, 'audino-mega': 10069,
  'sharpedo-mega': 10070, 'slowbro-mega': 10071, 'steelix-mega': 10072,
  'pidgeot-mega': 10073, 'glalie-mega': 10074, 'diancie-mega': 10075,
  'metagross-mega': 10076, 'kyogre-primal': 10077, 'groudon-primal': 10078,
  'rayquaza-mega': 10079, 'camerupt-mega': 10087, 'lopunny-mega': 10088,
  'salamence-mega': 10089, 'beedrill-mega': 10090,
  'zacian-crowned': 10188, 'zamazenta-crowned': 10189,
  'toxtricity-low-key': 10184,
  'lycanroc-midnight': 10126, 'lycanroc-dusk': 10152,
  'oricorio-pom-pom': 10123, 'oricorio-pau': 10124, 'oricorio-sensu': 10125,
  'necrozma-ultra': 10157,
  'basculin-white-striped': 10247,
  'ogerpon-wellspring': 10273, 'ogerpon-hearthflame': 10274, 'ogerpon-cornerstone': 10275,
}

export function normalizeSmogonName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
}

export function getPokemonId(name: string): number | null {
  const normalized = normalizeSmogonName(name)
  const entry = pokemonData[normalized]
  if (entry) return entry.id
  return FORM_POKEMON_IDS[normalized] ?? null
}

export function getOfficialArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}

export function getPixelSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}

export function getShowdownSpriteUrl(name: string): string {
  const spriteName = normalizeSmogonName(name)
  return `https://play.pokemonshowdown.com/sprites/dex/${spriteName}.png`
}

export function getShowdownPixelUrl(name: string): string {
  const spriteName = normalizeSmogonName(name)
  return `https://play.pokemonshowdown.com/sprites/gen5/${spriteName}.png`
}

// Returns ordered list of URLs to attempt — PokeAPI first, Showdown as fallback
export function getPokemonImageUrls(name: string): string[] {
  const id = getPokemonId(name)
  const showdownDex = getShowdownSpriteUrl(name)
  const showdownPixel = getShowdownPixelUrl(name)
  if (id) {
    return [getOfficialArtworkUrl(id), showdownDex, showdownPixel]
  }
  // Last resort: use base form artwork for uncovered form variants (e.g. ogerpon-wellspring → ogerpon)
  const baseId = getPokemonId(name.split('-')[0])
  if (baseId) {
    return [getOfficialArtworkUrl(baseId), showdownDex, showdownPixel]
  }
  return [showdownDex, showdownPixel]
}

// For table-row small sprites
export function getPokemonSpriteUrls(name: string): string[] {
  const id = getPokemonId(name)
  const showdownDex = getShowdownSpriteUrl(name)   // /sprites/dex/ — may 404 for some Gen 9 Pokemon
  const showdownPixel = getShowdownPixelUrl(name)   // /sprites/gen5/ — may be missing for Gen 9
  if (id) {
    // PokeAPI pixel sprite first: always returns 200 for known IDs.
    // This prevents a priority-image 404 from firing onError during React hydration,
    // which was causing rank #1 (Great Tusk) to render broken on initial load.
    return [getPixelSpriteUrl(id), showdownDex, showdownPixel]
  }
  const baseId = getPokemonId(name.split('-')[0])
  if (baseId) {
    return [getPixelSpriteUrl(baseId), showdownDex, showdownPixel]
  }
  return [showdownDex, showdownPixel]
}

// Legacy — kept for backward compat; always returns a URL (never null)
export function getPokemonImageUrl(name: string): { artwork: string; sprite: string } {
  const id = getPokemonId(name)
  if (id) {
    return { artwork: getOfficialArtworkUrl(id), sprite: getPixelSpriteUrl(id) }
  }
  const showdownUrl = getShowdownSpriteUrl(name)
  return { artwork: showdownUrl, sprite: showdownUrl }
}
