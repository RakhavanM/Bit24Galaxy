import type { CategoryId, Coin, GalaxyDefinition, GalaxyLayout, PositionedCoin } from './types'
import { CATEGORY_COLORS, CATEGORY_ORDER } from './types'

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
const MIN_RADIUS = 0.15
const MAX_RADIUS = 0.92
const ORBIT_INNER = 3.1
const ORBIT_OUTER = 8.8

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
  const orbitSpan = ORBIT_OUTER - ORBIT_INNER
  const radialStep = sorted.length > 1 ? orbitSpan / Math.max(2, Math.ceil(Math.sqrt(sorted.length)) + 0.25) : 0

  return sorted.map((coin, index) => {
    const angle = index * GOLDEN_ANGLE + galaxy.position[0] * 0.13
    const ring = Math.floor(Math.sqrt(index + 1))
    const radial = Math.min(ORBIT_OUTER, ORBIT_INNER + ring * radialStep + (index % 2) * 0.18)
    const inclination = 0.68 + (index % 3) * 0.07
    const x = cx + Math.cos(angle) * radial
    const y = cy + Math.sin(angle) * radial * inclination
    const depthPhase = (index * 1.618 + Math.abs(galaxy.position[2]) * 0.37) % 1
    const depthBand = (depthPhase - 0.5) * 10.5
    const z = cz + depthBand + Math.sin(angle * 1.7 + galaxy.position[2]) * (0.7 + (index % 3) * 0.16)
    return {
      ...coin,
      galaxyId: galaxy.id,
      position: [x, y, z],
      radius: radiusForMarketCap(coin.marketCap, minMarketCap, maxMarketCap),
    }
  })
}

export function primaryCategoryForCoin(coin: Coin): CategoryId {
  return coin.categories.find((category) => CATEGORY_ORDER.includes(category)) ?? 'core'
}

export function overviewCoinsForGalaxy(coins: Coin[], galaxy: GalaxyDefinition): Coin[] {
  return coins.filter((coin) => primaryCategoryForCoin(coin) === galaxy.id)
}

export function galaxyColor(galaxy: GalaxyDefinition): string {
  return galaxy.accent || CATEGORY_COLORS[galaxy.id]
}

export function categoryCount(coins: Coin[], galaxy: GalaxyDefinition): number {
  return coins.filter((coin) => coin.categories.includes(galaxy.id)).length
}
