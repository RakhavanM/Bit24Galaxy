import { describe, expect, it } from 'vitest'
import { GALAXIES } from './types'
import { sunProfile } from './suns'

describe('galaxy sun profiles', () => {
  it('uses each galaxy accent as the sun color', () => {
    const profiles = GALAXIES.map((galaxy) => sunProfile(galaxy))

    expect(profiles[0].base).toBe(GALAXIES[0].accent)
    expect(new Set(profiles.map((profile) => profile.base)).size).toBeGreaterThan(4)
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
