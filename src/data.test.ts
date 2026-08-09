import { describe, expect, it } from 'vitest'
import { CATEGORY_ORDER } from './types'
import type { CoinSnapshot } from './types'
import * as fs from 'node:fs'
import * as path from 'node:path'

const snapshot = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'public/data/coins.json'), 'utf8')) as CoinSnapshot & { categories: Record<string, string[]> }

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
    expect(data.coins.find((coin) => coin.symbol === 'RNDR')).toMatchObject({ sourceSymbol: 'RENDER', slug: 'render' })
    expect(data.coins.every((coin) => coin.iconUrl.length > 0 && coin.slug.length > 0)).toBe(true)
  })
})

