import { redirect } from 'next/navigation'
import { getLatestMonth, getAvailableTiers } from '@/lib/smogon'

// Redirect /tier to the first available tier (gen9ou or whatever is current)
export default async function TierIndexPage() {
  const month = await getLatestMonth()
  const tiers = await getAvailableTiers(month)
  redirect(`/tier/${tiers[0] ?? 'gen9ou'}`)
}
