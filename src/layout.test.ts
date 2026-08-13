import { describe, expect, it } from 'vitest'
import { canonicalMarketCapBounds, compactGalaxyCenters, INTER_SYSTEM_MARGIN, minimumSystemCenterDistance, positionCoins, radiusForMarketCap, overviewCoinsForGalaxy } from './layout'
import { GALAXIES, type Coin } from './types'

describe('market-cap galaxy layout', () => {
  it('maps market caps logarithmically into a bounded visual radius', () => {
    const smallest = radiusForMarketCap(1_000_000, 1_000_000, 1_000_000_000_000)
    const middle = radiusForMarketCap(1_000_000_000, 1_000_000, 1_000_000_000_000)
    const biggest = radiusForMarketCap(1_000_000_000_000, 1_000_000, 1_000_000_000_000)

    expect(smallest).toBeCloseTo(0.15)
    expect(middle).toBeGreaterThan(smallest)
    expect(biggest).toBeCloseTo(0.92)
  })

  it('clips extreme market caps through quantile bounds while keeping log ordering', () => {
    const coins = [1, 10, 100, 1_000, 10_000, 1_000_000_000_000].map((marketCap, index) => ({ marketCap, symbol: `T${index}` })) as Coin[]
    const bounds = canonicalMarketCapBounds(coins)
    expect(bounds.max).toBeLessThan(1_000_000_000_000)
    expect(radiusForMarketCap(1_000_000_000_000, bounds.min, bounds.max)).toBeCloseTo(0.92)
    expect(radiusForMarketCap(100, bounds.min, bounds.max)).toBeGreaterThan(radiusForMarketCap(10, bounds.min, bounds.max))
  })

  it('places each category coin deterministically around its galaxy', () => {
    const coins = Array.from({ length: 4 }, (_, index) => ({
      rank: index + 1,
      symbol: `T${index}`,
      nameFa: `توکن ${index}`,
      nameEn: `Token ${index}`,
      slug: `t${index}`,
      marketCap: 10_000_000 * (index + 1),
      marketCapCurrency: 'USDT',
      change24h: 0,
      priceIrt: 1,
      categories: ['ai'],
      iconUrl: '',
      bit24Url: '',
    })) as Coin[]
    const galaxy = GALAXIES.find((item) => item.id === 'ai')!
    const first = positionCoins(coins, galaxy, coins)
    const second = positionCoins(coins, galaxy, coins)

    expect(first).toHaveLength(4)
    expect(first.map((coin) => coin.position)).toEqual(second.map((coin) => coin.position))
    expect(first.every((coin) => coin.radius >= 0.15 && coin.radius <= 0.92)).toBe(true)
  })

  it('uses a materially deep galaxy volume rather than a thin XY sheet', () => {
    const depths = GALAXIES.map((galaxy) => galaxy.position[2])

    expect(Math.max(...depths) - Math.min(...depths)).toBeGreaterThan(4)
  })

  it('keeps planets in a safe orbital band away from their sun', () => {
    const coins = Array.from({ length: 7 }, (_, index) => ({
      rank: index + 1,
      symbol: `T${index}`,
      nameFa: `توکن ${index}`,
      nameEn: `Token ${index}`,
      slug: `t${index}`,
      marketCap: 10_000_000 * (index + 1),
      marketCapCurrency: 'USDT',
      change24h: 0,
      priceIrt: 1,
      categories: ['mainnets'],
      iconUrl: '',
      bit24Url: '',
    })) as Coin[]
    const galaxy = GALAXIES.find((item) => item.id === 'mainnets')!
    const positioned = positionCoins(coins, galaxy, coins)
    const distances = positioned.map((coin) => Math.hypot(coin.position[0] - galaxy.position[0], coin.position[1] - galaxy.position[1], coin.position[2] - galaxy.position[2]))

    expect(Math.min(...distances)).toBeGreaterThan(2.7)
    expect(Math.max(...distances)).toBeLessThan(12.8)
  })

  it('uses the requested safe center-distance rule for two system footprints', () => {
    expect(minimumSystemCenterDistance(10, 12)).toBe(14)
    expect(INTER_SYSTEM_MARGIN).toBe(2)
  })

  it('compacts hubs into a balanced 3D arrangement without violating pairwise safety', () => {
    const radii = new Map(GALAXIES.map((galaxy, index) => [galaxy.id, 8 + (index % 3) * 0.7] as const))
    const centers = compactGalaxyCenters(GALAXIES, radii)
    const values = Array.from(centers.values())
    const centroid = values.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1], sum[2] + point[2]], [0, 0, 0]).map((value) => value / values.length)

    expect(Math.hypot(...centroid)).toBeLessThan(12)
    for (let first = 0; first < GALAXIES.length; first += 1) {
      for (let second = first + 1; second < GALAXIES.length; second += 1) {
        const a = centers.get(GALAXIES[first].id)!
        const b = centers.get(GALAXIES[second].id)!
        expect(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])).toBeGreaterThanOrEqual(minimumSystemCenterDistance(radii.get(GALAXIES[first].id)!, radii.get(GALAXIES[second].id)!))
      }
    }
  })

  it('assigns a multi-category coin to only one galaxy in the overview', () => {
    const btc = {
      rank: 1,
      symbol: 'BTC',
      nameFa: 'بیت کوین',
      nameEn: 'Bitcoin',
      slug: 'btc',
      marketCap: 1_000_000,
      marketCapCurrency: 'USDT',
      change24h: 0,
      priceIrt: 1,
      categories: ['mainnets', 'stablecoins', 'defi'],
      iconUrl: '',
      bit24Url: '',
    } as Coin
    const overviewEntries = GALAXIES.flatMap((galaxy) => overviewCoinsForGalaxy([btc], galaxy))

    expect(overviewEntries.map((coin) => coin.symbol)).toEqual(['BTC'])
  })
})
