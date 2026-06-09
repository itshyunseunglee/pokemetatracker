import type { MetadataRoute } from 'next'
import { getLatestMonth, getAvailableTiers, getUsageStats } from '@/lib/smogon'
import { normalizeSmogonName } from '@/lib/pokemon'

const BASE_URL = 'https://pokemetatracker-psi.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const routes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${BASE_URL}/trends`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/tier`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/moves`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/items`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ]

  try {
    const month = await getLatestMonth()
    const tiers = await getAvailableTiers(month)

    for (const tier of tiers) {
      routes.push({
        url: `${BASE_URL}/tier/${tier}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: tier === 'gen9ou' ? 0.9 : 0.8,
      })
    }

    // Fetch top Pokemon from multiple tiers for broader coverage
    const tiersToCover = tiers.slice(0, 8)
    const pokemonSet = new Set<string>()

    await Promise.all(
      tiersToCover.map(async (tier) => {
        try {
          const stats = await getUsageStats(month, tier)
          stats.slice(0, 80).forEach((s) => pokemonSet.add(normalizeSmogonName(s.name)))
        } catch { /* skip */ }
      })
    )

    for (const pokemonName of Array.from(pokemonSet)) {
      routes.push({
        url: `${BASE_URL}/pokemon/${pokemonName}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  } catch (err) {
    console.error('[sitemap] Failed to generate dynamic routes:', err)
  }

  return routes
}
