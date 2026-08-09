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

const SUN_DEEP = '#5a1706'
const SUN_GLOW = '#fff2a6'

// The category accent controls the identity of the galaxy label and orbit.
// Suns deliberately live in a separate yellow→orange solar palette so they
// remain unmistakable against the cool/multicolor planets.
const SUN_PALETTE = ['#ffd166', '#ffca5c', '#ffbd45', '#ffad32', '#ff9b2e', '#ff8730', '#ff7428', '#ff6324', '#ff9f1c']

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
  const paletteIndex = positionSeed % SUN_PALETTE.length
  const base = SUN_PALETTE[paletteIndex]
  return {
    base,
    deep: mixColors(SUN_DEEP, base, 0.36),
    glow: mixColors(base, SUN_GLOW, 0.66),
    textureSeed: 7.25,
    textureScale: 3.4,
    radius: 0.58,
    rotationSpeed: 0.025 + (positionSeed % 7) * 0.003,
    coronaStrength: 0.72,
  }
}

export function sunColor(galaxy: GalaxyDefinition): string {
  return sunProfile(galaxy).base
}
