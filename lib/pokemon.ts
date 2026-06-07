import pokemonDataRaw from './pokemon-data.json'
import type { PokemonDataMap } from '@/types/smogon'

export const pokemonData: PokemonDataMap = pokemonDataRaw as PokemonDataMap

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
  if (!entry) return null
  return entry.id
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
  return [showdownDex, showdownPixel]
}

// For table-row small sprites
export function getPokemonSpriteUrls(name: string): string[] {
  const id = getPokemonId(name)
  const showdownPixel = getShowdownPixelUrl(name)
  if (id) {
    return [getPixelSpriteUrl(id), showdownPixel]
  }
  return [showdownPixel]
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
