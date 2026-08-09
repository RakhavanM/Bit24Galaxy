import { describe, expect, it } from 'vitest'
import { planetProfile } from './planets'
import type { Coin } from './types'

function coin(symbol: string, categories: Coin['categories'] = ['core']): Coin {
  return {
    rank: 1,
    symbol,
    nameFa: symbol,
    nameEn: symbol,
    slug: symbol.toLowerCase(),
    marketCap: 1_000_000,
    marketCapCurrency: 'USDT',
    change24h: 0,
    priceIrt: 1,
    categories,
    iconUrl: '',
    bit24Url: '',
  }
}

describe('planet profiles', () => {
  it('uses a recognizable logo color as the visual anchor', () => {
    expect(planetProfile(coin('BTC')).base).toBe('#f7931a')
    expect(planetProfile(coin('ETH')).base).toBe('#627eea')
    expect(planetProfile(coin('USDT', ['stablecoins'])).base).toBe('#26a17b')
  })

  it('assigns deterministic but varied planet styles and rotation', () => {
    const symbols = ['BTC', 'ETH', 'USDT', 'SOL', 'DOGE', 'TAO', 'AAVE', 'ZEC', 'RNDR', 'GALA', 'MANTA', 'BRETT', 'FLOKI', 'KCS']
    const profiles = symbols.map((symbol) => planetProfile(coin(symbol)))
    const styles = new Set(profiles.map((profile) => profile.style))
    const speeds = new Set(profiles.map((profile) => profile.rotationSpeed))

    expect(styles.size).toBeGreaterThanOrEqual(8)
    expect(speeds.size).toBe(symbols.length)
    expect(styles.size).toBeGreaterThanOrEqual(8)
    expect(profiles.every((profile) => profile.base.startsWith('#'))).toBe(true)
  })

  it('keeps the generated accent and deep colors valid for WebGL uniforms', () => {
    const profile = planetProfile(coin('LINK', ['ai', 'defi']))

    expect(profile.accent).toMatch(/^#[0-9a-f]{6}$/)
    expect(profile.deep).toMatch(/^#[0-9a-f]{6}$/)
    expect(profile.seed).toBeGreaterThanOrEqual(0)
    expect(profile.tilt).toBeGreaterThan(-0.8)
    expect(profile.tilt).toBeLessThan(0.8)
  })

  it('avoids the old regular banding styles for exchange assets', () => {
    expect(planetProfile(coin('BNB', ['exchange'])).style).not.toBe('gas')
    expect(planetProfile(coin('LEO', ['exchange'])).style).not.toBe('desert')
  })
})

