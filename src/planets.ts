import type { CategoryId, Coin } from './types'

export type PlanetStyle = 'ocean' | 'marble' | 'gas' | 'lava' | 'ice' | 'desert' | 'storm' | 'crystal' | 'shadow' | 'neon' | 'aurora' | 'volcanic' | 'savanna' | 'twilight'

export type PlanetProfile = {
  base: string
  accent: string
  deep: string
  style: PlanetStyle
  seed: number
  rotationSpeed: number
  tilt: number
  ring: boolean
  atmosphere: number
  cloudiness: number
}

const LOGO_COLORS: Record<string, string> = {
  AAVE: '#9090f0', ADA: '#0033ad', ASTER: '#111111', AVAX: '#e84142', BCH: '#0ac18e', BFUSD: '#f0b808',
  BNB: '#f3ba2f', BTC: '#f7931a', CC: '#f0f890', CRO: '#002d74', DOGE: '#c2a633', DOT: '#e6007a',
  ETH: '#627eea', GRAM: '#30a0f0', HBAR: '#e8e8e8', HTX: '#0098d8', HYPE: '#00d4ff', ICP: '#29abe2',
  LEO: '#f8e030', LINK: '#2a5ada', LTC: '#345d9d', M: '#9878f8', MNT: '#65c2ef', NEAR: '#00c08b',
  OKB: '#e0e0e0', ONDO: '#111111', PAXG: '#c9a227', PYUSD: '#ffffff', RAIN: '#e0f800', RLUSD: '#0068ff',
  SHIB: '#f8a008', SKY: '#5038e8', SOL: '#9945ff', STETH: '#00a3ff', SUI: '#4da2ff', TAO: '#2f2f2f',
  TRX: '#ef0027', UNI: '#ff007a', USD1: '#c88000', USDC: '#2775ca', USDE: '#202020', USDG: '#304010',
  USDT: '#26a17b', WBTC: '#f09242', WLFI: '#e8a808', XAUT: '#d0b058', XLM: '#7d7d7d', XMR: '#ff6600',
  XRP: '#f0f0f0', ZEC: '#f4b728',
}

const STYLE_ORDER: PlanetStyle[] = ['ocean', 'marble', 'gas', 'lava', 'ice', 'desert', 'storm', 'crystal', 'shadow', 'neon', 'aurora', 'volcanic', 'savanna', 'twilight']

const CATEGORY_STYLE: Partial<Record<CategoryId, PlanetStyle>> = {
  ai: 'neon',
  defi: 'crystal',
  gamefi: 'storm',
  layer2: 'aurora',
  memes: 'volcanic',
  stablecoins: 'ice',
  exchange: 'savanna',
}

const STYLE_ACCENTS: Record<PlanetStyle, string> = {
  ocean: '#55d6ff',
  marble: '#f4f0dc',
  gas: '#d99cff',
  lava: '#ff6d48',
  ice: '#bdeaff',
  desert: '#f3c36c',
  storm: '#79a5ff',
  crystal: '#e1aaff',
  shadow: '#7f72d9',
  neon: '#61ffdf',
  aurora: '#8fe8ff',
  volcanic: '#ff865f',
  savanna: '#d6c66f',
  twilight: '#9d8cff',
}

const STYLE_DEEP: Record<PlanetStyle, string> = {
  ocean: '#082b55',
  marble: '#252136',
  gas: '#301456',
  lava: '#42100c',
  ice: '#102b4e',
  desert: '#4b2513',
  storm: '#101c50',
  crystal: '#291044',
  shadow: '#090719',
  neon: '#063f3a',
  aurora: '#0b274b',
  volcanic: '#3b120e',
  savanna: '#3f3215',
  twilight: '#211640',
}

function hashSymbol(symbol: string): number {
  let hash = 2166136261
  for (let index = 0; index < symbol.length; index += 1) {
    hash ^= symbol.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

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

export function logoColor(symbol: string): string {
  return LOGO_COLORS[symbol.toUpperCase()] ?? '#8ca9df'
}

export function planetProfile(coin: Pick<Coin, 'symbol' | 'categories'>): PlanetProfile {
  const hash = hashSymbol(coin.symbol)
  const categoryStyle = coin.categories.map((category) => CATEGORY_STYLE[category]).find(Boolean)
  // Category style is a palette bias, not a hard template. This keeps DeFi/AI
  // assets related while preventing an entire constellation from looking cloned.
  const style = categoryStyle && hash % 5 === 0 ? categoryStyle : STYLE_ORDER[hash % STYLE_ORDER.length]
  const base = logoColor(coin.symbol)
  const accent = mixColors(base, STYLE_ACCENTS[style], 0.32)
  const deep = mixColors(STYLE_DEEP[style], base, 0.16)
  const rotationSpeed = 0.04 + ((hash % 1009) / 1009) * 0.12
  const tilt = (((hash >>> 8) % 100) / 100 - 0.5) * 0.9

  return {
    base,
    accent,
    deep,
    style,
    seed: (hash % 10000) / 1000,
    rotationSpeed,
    tilt,
    ring: ['BTC', 'ETH', 'SOL', 'XAUT', 'PAXG'].includes(coin.symbol) || hash % 23 === 0,
    atmosphere: 0.14 + ((hash >>> 16) % 18) / 100,
    cloudiness: 0.14 + ((hash >>> 24) % 42) / 100,
  }
}

export function hexToColor(hex: string): [number, number, number] {
  const [red, green, blue] = hexToRgb(hex)
  return [red / 255, green / 255, blue / 255]
}

export { LOGO_COLORS }
