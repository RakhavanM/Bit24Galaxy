import { describe, expect, it } from 'vitest'
import { CATEGORY_ORDER } from './types'
import type { CoinSnapshot } from './types'

const categoryMap: Record<string, string[]> = {
  core: ['BTC', 'ETH', 'SOL', 'ADA', 'TON', 'AVAX', 'DOT'],
  stablecoins: ['USDT', 'USDC', 'DAI', 'FDUSD', 'USDE', 'TUSD'],
  defi: ['UNI', 'AAVE', 'MKR', 'CRV', 'LDO', 'SNX'],
  layer2: ['ARB', 'OP', 'STRK', 'MNT', 'ZK', 'MANTA'],
  ai: ['TAO', 'RNDR', 'FET', 'AKT', 'IO', 'GRT'],
  gamefi: ['AXS', 'SAND', 'MANA', 'GALA', 'BEAM', 'ENJ'],
  exchange: ['BNB', 'OKB', 'KCS', 'BGB', 'CRO', 'LEO'],
  memes: ['DOGE', 'SHIB', 'PEPE', 'WIF', 'FLOKI', 'BONK', 'BRETT'],
}

const snapshot = {
  schemaVersion: 2,
  generatedAt: 'test',
  source: 'test',
  selection: 'test',
  note: 'test',
  aliases: { RNDR: 'RENDER' },
  categories: categoryMap,
  coins: Object.entries(categoryMap).flatMap(([category, symbols]) => symbols.map((symbol, index) => ({
    rank: index + 1,
    symbol,
    nameFa: symbol,
    nameEn: symbol,
    slug: symbol === 'RNDR' ? 'render' : symbol.toLowerCase(),
    marketCap: 1,
    marketCapCurrency: 'USDT',
    change24h: null,
    priceIrt: null,
    categories: [category] as CoinSnapshot['coins'][number]['categories'],
    iconUrl: `https://example.com/${symbol}.png`,
    bit24Url: `https://bit24.cash/coins/${symbol.toLowerCase()}/`,
  }))),
} as CoinSnapshot & { categories: Record<string, string[]>; aliases: Record<string, string> }

describe('v0.2 asset snapshot', () => {
  const data = snapshot

  it('contains exactly the requested 50 unique symbols', () => {
    expect(data.coins).toHaveLength(50)
    expect(new Set(data.coins.map((coin) => coin.symbol)).size).toBe(50)
    expect(Object.keys(data.categories)).toEqual(CATEGORY_ORDER)
  })

  it('keeps category membership aligned with the editorial taxonomy', () => {
    for (const galaxy of CATEGORY_ORDER) {
      const expected = data.categories[galaxy]
      const actual = data.coins.filter((coin) => coin.categories.includes(galaxy)).map((coin) => coin.symbol)
      expect(actual).toEqual(expected)
    }
  })

  it('preserves the RNDR alias and metadata for every requested asset', () => {
    expect(data.aliases.RNDR).toBe('RENDER')
    expect(data.coins.find((coin) => coin.symbol === 'RNDR')).toMatchObject({ slug: 'render' })
    expect(data.coins.every((coin) => coin.iconUrl.length > 0 && coin.slug.length > 0)).toBe(true)
  })
})

export {}

