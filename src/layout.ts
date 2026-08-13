import type { CategoryId, Coin, GalaxyDefinition, GalaxyLayout, PositionedCoin } from './types'
import { CATEGORY_COLORS, CATEGORY_ORDER } from './types'

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
const MIN_RADIUS = 0.15
const MAX_RADIUS = 0.92
const ORBIT_INNER = 3.8
const ORBIT_OUTER = 11.8
const INTER_SYSTEM_MARGIN = 2
const OBJECT_MARGIN = 0.35

type LocalPlanet = {
  offset: [number, number, number]
  radius: number
}

export function radiusForMarketCap(marketCap: number, minMarketCap: number, maxMarketCap: number): number {
  const safeMin = Math.max(1, minMarketCap)
  const safeMax = Math.max(safeMin + 1, maxMarketCap)
  const value = Math.log10(Math.max(1, marketCap))
  const lo = Math.log10(safeMin)
  const hi = Math.log10(safeMax)
  const normalized = Math.max(0, Math.min(1, (value - lo) / (hi - lo)))
  return MIN_RADIUS + normalized * (MAX_RADIUS - MIN_RADIUS)
}

export function canonicalMarketCapBounds(coins: Coin[]): { min: number; max: number } {
  const values = coins.map((coin) => Math.max(1, coin.marketCap)).sort((a, b) => a - b)
  if (!values.length) return { min: 1, max: 1 }
  const quantile = (fraction: number) => values[Math.min(values.length - 1, Math.floor((values.length - 1) * fraction))]
  return { min: quantile(0.02), max: quantile(0.98) }
}

export function buildGalaxyLayouts(galaxies: GalaxyDefinition[]): Map<string, GalaxyLayout> {
  return new Map(
    galaxies.map((galaxy) => {
      const [x, y, z] = galaxy.position
      return [galaxy.id, { position: [x, y, z], radius: 1.65, opacity: 0.9 }]
    }),
  )
}

export function localGalaxyFootprint(coins: Coin[], galaxy: GalaxyDefinition, categoryCoins: Coin[]): LocalPlanet[] {
  if (!categoryCoins.length) return []
  const bounds = canonicalMarketCapBounds(coins)
  const minMarketCap = bounds.min
  const maxMarketCap = bounds.max
  const sorted = [...categoryCoins].sort((a, b) => b.marketCap - a.marketCap)
  const orbitSpan = ORBIT_OUTER - ORBIT_INNER
  const radialStep = sorted.length > 1 ? orbitSpan / Math.max(2, Math.ceil(Math.sqrt(sorted.length)) + 0.25) : 0

  return sorted.map((coin, index) => {
    const angle = index * GOLDEN_ANGLE + galaxy.position[0] * 0.13
    const ring = Math.floor(Math.sqrt(index + 1))
    const radial = Math.min(ORBIT_OUTER, ORBIT_INNER + ring * radialStep + (index % 2) * 0.18)
    const inclination = 0.68 + (index % 3) * 0.07
    const depthPhase = (index * 1.618 + Math.abs(galaxy.position[2]) * 0.37) % 1
    const depthBand = (depthPhase - 0.5) * 9.5
    return {
      offset: [
        Math.cos(angle) * radial,
        Math.sin(angle) * radial * inclination,
        depthBand + Math.sin(angle * 1.7 + galaxy.position[2]) * (0.7 + (index % 3) * 0.16),
      ],
      radius: radiusForMarketCap(coin.marketCap, minMarketCap, maxMarketCap),
    }
  })
}

export function localGalaxyRadius(coins: Coin[], galaxy: GalaxyDefinition, categoryCoins: Coin[]): number {
  const footprint = localGalaxyFootprint(coins, galaxy, categoryCoins)
  return Math.max(0.58, ...footprint.map((planet) => Math.hypot(...planet.offset) + planet.radius))
}

export function positionCoins(coins: Coin[], galaxy: GalaxyDefinition, categoryCoins: Coin[]): PositionedCoin[] {
  const [cx, cy, cz] = galaxy.position
  const footprint = localGalaxyFootprint(coins, galaxy, categoryCoins)
  const sorted = [...categoryCoins].sort((a, b) => b.marketCap - a.marketCap)
  return sorted.map((coin, index) => {
    const planet = footprint[index]
    return {
      ...coin,
      galaxyId: galaxy.id,
      position: [cx + planet.offset[0], cy + planet.offset[1], cz + planet.offset[2]],
      radius: planet.radius,
    }
  })
}

export function minimumSystemCenterDistance(firstRadius: number, secondRadius: number): number {
  // User-facing rule: a 10-unit and a 12-unit system require at least 14
  // units between sun centers. Exact planet-pair clearance is resolved below
  // when local footprints are supplied.
  return Math.max(firstRadius, secondRadius) + INTER_SYSTEM_MARGIN
}

function pushCentersApart(first: [number, number, number], second: [number, number, number], amount: number, direction?: [number, number, number]): void {
  const dx = second[0] - first[0]
  const dy = second[1] - first[1]
  const dz = second[2] - first[2]
  const distance = Math.hypot(dx, dy, dz)
  const safeDistance = Math.max(distance, 0.001)
  const unit = direction ?? [dx / safeDistance, dy / safeDistance, dz / safeDistance]
  const half = amount * 0.5
  first[0] -= unit[0] * half
  first[1] -= unit[1] * half
  first[2] -= unit[2] * half
  second[0] += unit[0] * half
  second[1] += unit[1] * half
  second[2] += unit[2] * half
}

export function compactGalaxyCenters(
  galaxies: GalaxyDefinition[],
  radii: Map<CategoryId, number>,
  footprints: Map<CategoryId, LocalPlanet[]> = new Map(),
): Map<CategoryId, [number, number, number]> {
  const result = new Map<CategoryId, [number, number, number]>()
  const center = galaxies.reduce<[number, number, number]>(
    (sum, galaxy) => [sum[0] + galaxy.position[0], sum[1] + galaxy.position[1], sum[2] + galaxy.position[2]],
    [0, 0, 0],
  ).map((value) => value / galaxies.length) as [number, number, number]
  const scale = 0.48

  galaxies.forEach((galaxy) => {
    result.set(galaxy.id, [
      (galaxy.position[0] - center[0]) * scale,
      (galaxy.position[1] - center[1]) * scale,
      (galaxy.position[2] - center[2]) * scale,
    ])
  })

  // Relax the compact arrangement in full 3D. Equal and opposite pushes keep
  // the centroid near the origin, so no side of the volume becomes overloaded.
  for (let pass = 0; pass < 48; pass += 1) {
    for (let firstIndex = 0; firstIndex < galaxies.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < galaxies.length; secondIndex += 1) {
        const firstGalaxy = galaxies[firstIndex]
        const secondGalaxy = galaxies[secondIndex]
        const firstCenter = result.get(firstGalaxy.id)!
        const secondCenter = result.get(secondGalaxy.id)!
        const centerDistance = Math.hypot(
          secondCenter[0] - firstCenter[0],
          secondCenter[1] - firstCenter[1],
          secondCenter[2] - firstCenter[2],
        )
        const centerRequired = minimumSystemCenterDistance(radii.get(firstGalaxy.id) ?? 0, radii.get(secondGalaxy.id) ?? 0)
        if (centerDistance < centerRequired) pushCentersApart(firstCenter, secondCenter, centerRequired - centerDistance)

        const firstFootprint = footprints.get(firstGalaxy.id) ?? []
        const secondFootprint = footprints.get(secondGalaxy.id) ?? []
        let worstClearance = 0
        let collisionDirection: [number, number, number] | undefined
        for (const firstPlanet of firstFootprint) {
          for (const secondPlanet of secondFootprint) {
            const dx = secondCenter[0] + secondPlanet.offset[0] - firstCenter[0] - firstPlanet.offset[0]
            const dy = secondCenter[1] + secondPlanet.offset[1] - firstCenter[1] - firstPlanet.offset[1]
            const dz = secondCenter[2] + secondPlanet.offset[2] - firstCenter[2] - firstPlanet.offset[2]
            const distance = Math.max(Math.hypot(dx, dy, dz), 0.001)
            const clearance = distance - firstPlanet.radius - secondPlanet.radius - OBJECT_MARGIN
            if (clearance < worstClearance) {
              worstClearance = clearance
              collisionDirection = [dx / distance, dy / distance, dz / distance]
            }
          }
        }
        if (worstClearance < 0 && collisionDirection) pushCentersApart(firstCenter, secondCenter, -worstClearance, collisionDirection)
      }
    }
  }

  return result
}

export function primaryCategoryForCoin(coin: Coin): CategoryId {
  return coin.categories.find((category) => CATEGORY_ORDER.includes(category)) ?? CATEGORY_ORDER[0]
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

export { INTER_SYSTEM_MARGIN }
