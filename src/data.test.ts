import { describe, expect, it } from 'vitest'
import snapshot from '../public/data/coins.json'
import { CATEGORY_ORDER } from './types'

describe('v4 static asset snapshot', () => {
  it('contains the 16 ordered categories and the source placement total', () => {
    expect(Object.keys(snapshot.categories)).toEqual(CATEGORY_ORDER)
    expect(snapshot.coins).toHaveLength(162)
    expect(new Set(snapshot.coins.map((coin) => coin.symbol)).size).toBe(160)
  })

  it('keeps each placement aligned with its source category', () => {
    for (const category of CATEGORY_ORDER) {
      const expected = snapshot.categories[category]
      const actual = snapshot.coins.filter((coin) => coin.categories.includes(category)).map((coin) => coin.symbol)
      expect(actual).toEqual(expected)
    }
  })

  it('has positive canonical market caps and local icons for all placements', () => {
    expect(snapshot.coins.every((coin) => coin.marketCap > 0 && coin.iconUrl.length > 0 && coin.slug.length > 0)).toBe(true)
    expect(new Set(snapshot.coins.map((coin) => coin.symbol)).size).toBe(160)
  })
})

export {}
