import { describe, expect, it } from 'vitest'
import { GALAXIES } from './types'
import { sunProfile } from './suns'

function rgb(hex: string): [number, number, number] {
  const value = hex.slice(1)
  return [Number.parseInt(value.slice(0, 2), 16), Number.parseInt(value.slice(2, 4), 16), Number.parseInt(value.slice(4, 6), 16)]
}

describe('galaxy sun profiles', () => {
  it('uses a distinct high-luminance yellow-to-orange palette', () => {
    const profiles = GALAXIES.map((galaxy) => sunProfile(galaxy))

    expect(new Set(profiles.map((profile) => profile.base)).size).toBeGreaterThan(4)
    profiles.forEach((profile, index) => {
      const [red, green, blue] = rgb(profile.base)
      expect(profile.base).not.toBe(GALAXIES[index].accent)
      expect(red).toBeGreaterThanOrEqual(220)
      expect(green).toBeGreaterThanOrEqual(90)
      expect(green).toBeGreaterThan(blue)
      expect(blue).toBeLessThanOrEqual(180)
    })
  })

  it('keeps the same high-quality texture recipe for every sun', () => {
    const seeds = new Set(GALAXIES.map((galaxy) => sunProfile(galaxy).textureSeed))
    const scales = new Set(GALAXIES.map((galaxy) => sunProfile(galaxy).textureScale))
    const radii = new Set(GALAXIES.map((galaxy) => sunProfile(galaxy).radius))

    expect(seeds.size).toBe(1)
    expect(scales.size).toBe(1)
    expect(radii.size).toBe(1)
  })

  it('returns valid dark and glow colors for the shared sun shader', () => {
    const profile = sunProfile(GALAXIES.find((galaxy) => galaxy.id === 'memes')!)

    expect(profile.deep).toMatch(/^#[0-9a-f]{6}$/)
    expect(profile.glow).toMatch(/^#[0-9a-f]{6}$/)
    expect(profile.textureSeed).toBeGreaterThan(0)
    expect(profile.radius).toBeGreaterThan(0.4)
  })
})
