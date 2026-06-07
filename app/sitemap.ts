import type { MetadataRoute } from 'next'
import { getLatestMonth, getAvailableTiers, getUsageStats } from '@/lib/smogon'
import { normalizeSmogonName } from '@/lib/pokemon'

const BASE_URL = 'https://pokemetatracker-psi.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: `${BASE_URL}/trends`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/tier`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/moves`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/items`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ]

  try {
    const month = await getLatestMonth()
    const tiers = await getAvailableTiers(month)

    for (const tier of tiers) {
      routes.push({
        url: `${BASE_URL}/tier/${tier}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      })
    }

    const mainTier = tiers[0] ?? 'gen9ou'
    const stats = await getUsageStats(month, mainTier)
    const top100 = stats.slice(0, 100)
    for (const pokemon of top100) {
      routes.push({
        url: `${BASE_URL}/pokemon/${normalizeSmogonName(pokemon.name)}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  } catch (err) {
    console.error('[sitemap] Failed to generate dynamic routes:', err)
  }

  return routes
}
