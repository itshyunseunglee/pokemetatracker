import fs from 'fs'
import path from 'path'
import https from 'https'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface PokeApiListItem {
  name: string
  url: string
}

interface PokeApiListResponse {
  results: PokeApiListItem[]
}

interface PokeApiPokemon {
  id: number
  name: string
  types: { slot: number; type: { name: string } }[]
  stats: { base_stat: number; stat: { name: string } }[]
}

interface PokemonEntry {
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

function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'PokeMetaTracker/1.0' } }, (res) => {
      let data = ''
      res.on('data', (chunk: string) => (data += chunk))
      res.on('end', () => {
        try {
          resolve(JSON.parse(data) as T)
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('error', reject)
    req.setTimeout(15000, () => {
      req.destroy()
      reject(new Error(`Timeout fetching ${url}`))
    })
  })
}

async function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms))
}

async function main(): Promise<void> {
  console.log('Fetching Pokemon list from PokeAPI...')
  const list = await fetchJson<PokeApiListResponse>('https://pokeapi.co/api/v2/pokemon?limit=10000')
  console.log(`Found ${list.results.length} Pokemon`)

  const result: Record<string, PokemonEntry> = {}
  const TOP_LIMIT = 1030 // gen 9 + DLC up to ~1025

  // Common competitive alternate forms not covered by base ID range
  const EXTRA_FORMS = [
    'landorus-therian', 'tornadus-therian', 'thundurus-therian',
    'rotom-wash', 'rotom-heat', 'rotom-mow', 'rotom-frost', 'rotom-fan',
    'giratina-origin', 'shaymin-sky', 'deoxys-speed', 'deoxys-attack', 'deoxys-defense',
    'slowking-galar', 'weezing-galar', 'articuno-galar', 'zapdos-galar', 'moltres-galar',
    'urshifu-rapid-strike', 'calyrex-shadow', 'calyrex-ice',
    'enamorus-therian',
    'ogerpon-wellspring', 'ogerpon-hearthflame', 'ogerpon-cornerstone',
    'terapagos-stellar', 'terapagos-terastal',
    'samurott-hisui', 'typhlosion-hisui', 'decidueye-hisui',
    'lilligant-hisui', 'arcanine-hisui', 'electrode-hisui',
    'avalugg-hisui', 'goodra-hisui', 'braviary-hisui',
    'ursaluna-bloodmoon',
  ]

  const baseSubset = list.results.slice(0, TOP_LIMIT)
  // Merge base with extra forms (deduplicate)
  const baseNames = new Set(baseSubset.map((r) => r.name))
  const extraItems = EXTRA_FORMS
    .filter((name) => !baseNames.has(name))
    .map((name) => ({ name, url: `https://pokeapi.co/api/v2/pokemon/${name}/` }))

  const subset = [...baseSubset, ...extraItems]
  let processed = 0

  for (const item of subset) {
    try {
      const pokemon = await fetchJson<PokeApiPokemon>(item.url)

      const statMap: Record<string, number> = {}
      for (const s of pokemon.stats) {
        statMap[s.stat.name] = s.base_stat
      }

      const entry: PokemonEntry = {
        id: pokemon.id,
        types: pokemon.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
        stats: {
          hp: statMap['hp'] ?? 0,
          atk: statMap['attack'] ?? 0,
          def: statMap['defense'] ?? 0,
          spa: statMap['special-attack'] ?? 0,
          spd: statMap['special-defense'] ?? 0,
          spe: statMap['speed'] ?? 0,
        },
      }

      result[pokemon.name.toLowerCase()] = entry
      processed++

      if (processed % 100 === 0) {
        console.log(`Processed ${processed}/${subset.length}...`)
        await sleep(100)
      }
    } catch (err) {
      console.error(`Failed to fetch ${item.name}:`, err)
    }
  }

  const outputPath = path.join(__dirname, '..', 'lib', 'pokemon-data.json')
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2))
  console.log(`Done! Wrote ${Object.keys(result).length} Pokemon to ${outputPath}`)
}

main().catch((err) => {
  console.error('generate-pokemon-data failed:', err)
  process.exit(1)
})
