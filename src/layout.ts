import type { Coin, GalaxyDefinition, GalaxyLayout, PositionedCoin } from './types'
import { CATEGORY_COLORS } from './types'

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
const MIN_RADIUS = 0.16
const MAX_RADIUS = 1.11

export function radiusForMarketCap(marketCap: number, minMarketCap: number, maxMarketCap: number): number {
  const safeMin = Math.max(1, minMarketCap)
  const safeMax = Math.max(safeMin + 1, maxMarketCap)
  const value = Math.log10(Math.max(1, marketCap))
  const lo = Math.log10(safeMin)
  const hi = Math.log10(safeMax)
  const normalized = Math.max(0, Math.min(1, (value - lo) / (hi - lo)))
  return MIN_RADIUS + normalized * (MAX_RADIUS - MIN_RADIUS)
}

export function buildGalaxyLayouts(galaxies: GalaxyDefinition[]): Map<string, GalaxyLayout> {
  return new Map(
    galaxies.map((galaxy) => {
      const [x, y, z] = galaxy.position
      return [galaxy.id, { position: [x, y, z], radius: 1.65, opacity: 0.9 }]
    }),
  )
}

export function positionCoins(coins: Coin[], galaxy: GalaxyDefinition, categoryCoins: Coin[]): PositionedCoin[] {
  if (!categoryCoins.length) return []
  const minMarketCap = Math.min(...coins.map((coin) => coin.marketCap))
  const maxMarketCap = Math.max(...coins.map((coin) => coin.marketCap))
  const sorted = [...categoryCoins].sort((a, b) => b.marketCap - a.marketCap)
  const [cx, cy, cz] = galaxy.position
  const spread = 1.35 + Math.min(1.8, Math.sqrt(sorted.length) * 0.36)

  return sorted.map((coin, index) => {
    const angle = index * GOLDEN_ANGLE + galaxy.position[0] * 0.13
    const ring = Math.floor(Math.sqrt(index + 1))
    const radial = 0.45 + ring * (0.66 + (index % 3) * 0.07)
    const wobble = Math.sin(index * 2.21 + galaxy.position[1]) * 0.16
    const x = cx + Math.cos(angle) * (radial * spread * 0.92 + wobble)
    const y = cy + Math.sin(angle) * (radial * spread * 0.58 - wobble * 0.34)
    const z = cz + Math.sin(angle * 1.7) * 1.15 + (index % 4) * 0.16
    return {
      ...coin,
      galaxyId: galaxy.id,
      position: [x, y, z],
      radius: radiusForMarketCap(coin.marketCap, minMarketCap, maxMarketCap),
    }
  })
}

export function galaxyColor(galaxy: GalaxyDefinition): string {
  return galaxy.accent || CATEGORY_COLORS[galaxy.id]
}

export function categoryCount(coins: Coin[], galaxy: GalaxyDefinition): number {
  return coins.filter((coin) => coin.categories.includes(galaxy.id)).length
}
