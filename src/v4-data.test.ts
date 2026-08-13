import { describe, expect, it } from 'vitest'
import snapshot from '../public/data/coins.json'

const expectedCategoryIds = [
  'global-markets',
  'mainnets',
  'gaming-metaverse',
  'ai',
  'stablecoins',
  'memes',
  'layer2',
  'oracles',
  'defi',
  'iot',
  'depin',
  'wallet-exchange',
  'privacy',
  'socialfi',
  'nft',
  'fan-tokens',
]

describe('Bit24Galaxy v4 dataset', () => {
  it('contains 16 ordered galaxies and preserves the source placement counts', () => {
    expect(Object.keys(snapshot.categories)).toEqual(expectedCategoryIds)
    expect(Object.values(snapshot.categories).every((symbols) => symbols.length > 0 && symbols.length <= 12)).toBe(true)
    expect(snapshot.coins).toHaveLength(162)
  })

  it('does not include the uncategorized source group', () => {
    expect(Object.keys(snapshot.categories)).not.toContain('uncategorized')
    expect(Object.keys(snapshot.categories)).not.toContain('بدون دسته‌بندی')
  })

  it('preserves canonical market-cap metadata for repeated placements', () => {
    const grouped = new Map<string, typeof snapshot.coins>()
    for (const coin of snapshot.coins) grouped.set(coin.symbol, [...(grouped.get(coin.symbol) ?? []), coin])
    for (const placements of grouped.values()) {
      expect(new Set(placements.map((coin) => coin.marketCap)).size).toBe(1)
      expect(new Set(placements.map((coin) => coin.marketCapSource)).size).toBe(1)
    }
    expect(new Set(snapshot.coins.map((coin) => coin.symbol)).size).toBe(160)
    expect(snapshot.coins.every((coin) => coin.marketCap > 0 && coin.marketCapSource)).toBe(true)
  })
})

export {}
