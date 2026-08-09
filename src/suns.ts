import type { GalaxyDefinition } from './types'

export type SunProfile = {
  base: string
  deep: string
  glow: string
  textureSeed: number
  textureScale: number
  radius: number
  rotationSpeed: number
  coronaStrength: number
}

const SUN_DEEP = '#160d22'
const SUN_GLOW = '#fff4c4'

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [Number.parseInt(value.slice(0, 2), 16), Number.parseInt(value.slice(2, 4), 16), Number.parseInt(value.slice(4, 6), 16)]
}

function rgbToHex(rgb: [number, number, number]): string {
  return `#${rgb.map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')).join('')}`
}

function mixColors(first: string, second: string, amount: number): string {
  const a = hexToRgb(first)
  const b = hexToRgb(second)
  return rgbToHex([a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount, a[2] + (b[2] - a[2]) * amount])
}

export function sunProfile(galaxy: Pick<GalaxyDefinition, 'accent' | 'position'>): SunProfile {
  const positionSeed = Math.abs(Math.round(galaxy.position[0] * 17 + galaxy.position[1] * 29 + galaxy.position[2] * 41))
  return {
    base: galaxy.accent,
    deep: mixColors(SUN_DEEP, galaxy.accent, 0.28),
    glow: mixColors(galaxy.accent, SUN_GLOW, 0.62),
    textureSeed: 7.25,
    textureScale: 3.4,
    radius: 0.58,
    rotationSpeed: 0.025 + (positionSeed % 7) * 0.003,
    coronaStrength: 0.55,
  }
}

export function sunColor(galaxy: GalaxyDefinition): string {
  return sunProfile(galaxy).base
}
