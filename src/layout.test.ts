import { describe, expect, it } from 'vitest'
import { positionCoins, radiusForMarketCap, overviewCoinsForGalaxy } from './layout'
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
      categories: ['core'],
      iconUrl: '',
      bit24Url: '',
    })) as Coin[]
    const galaxy = GALAXIES.find((item) => item.id === 'core')!
    const positioned = positionCoins(coins, galaxy, coins)
    const distances = positioned.map((coin) => Math.hypot(coin.position[0] - galaxy.position[0], coin.position[1] - galaxy.position[1], coin.position[2] - galaxy.position[2]))

    expect(Math.min(...distances)).toBeGreaterThan(2.7)
    expect(Math.max(...distances)).toBeLessThan(7.6)
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
      categories: ['core', 'stablecoins', 'defi'],
      iconUrl: '',
      bit24Url: '',
    } as Coin
    const overviewEntries = GALAXIES.flatMap((galaxy) => overviewCoinsForGalaxy([btc], galaxy))

    expect(overviewEntries.map((coin) => coin.symbol)).toEqual(['BTC'])
  })
})
