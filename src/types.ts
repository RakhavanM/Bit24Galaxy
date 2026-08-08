export type CategoryId =
  | 'core'
  | 'networks'
  | 'ai'
  | 'defi'
  | 'memes'
  | 'stablecoins'
  | 'rwa'
  | 'exchange'
  | 'privacy'

export type Coin = {
  rank: number
  symbol: string
  nameFa: string
  nameEn: string
  slug: string
  marketCap: number
  marketCapCurrency: string
  change24h: number | null
  priceIrt: number | null
  categories: CategoryId[]
  iconUrl: string
  bit24Url: string
}

export type CoinSnapshot = {
  schemaVersion: number
  generatedAt: string
  source: string
  selection: string
  note: string
  coins: Coin[]
}

export type GalaxyDefinition = {
  id: CategoryId
  label: string
  shortLabel: string
  eyebrow: string
  description: string
  accent: string
  accentRgb: string
  position: [number, number, number]
}

export type PositionedCoin = Coin & {
  galaxyId: CategoryId
  position: [number, number, number]
  radius: number
}

export type GalaxyView = {
  id: CategoryId | 'all'
  label: string
  description: string
  coins: PositionedCoin[]
}

export type CoinEvent = {
  type: 'select' | 'open'
  coin: Coin
}

export type GalaxyEvent = {
  type: 'select'
  galaxy: GalaxyDefinition | null
}

export type GalaxyFocus = {
  target: [number, number, number]
  distance: number
}

export type GalaxyLayout = {
  position: [number, number, number]
  radius: number
  opacity: number
}

export type SceneMode = 'overview' | 'galaxy'

export type SearchResult = Coin & {
  relevance: number
}

export const CATEGORY_ORDER: CategoryId[] = [
  'core',
  'networks',
  'ai',
  'defi',
  'memes',
  'stablecoins',
  'rwa',
  'exchange',
  'privacy',
]

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  core: 'ارزهای اصلی',
  networks: 'شبکه‌های اصلی',
  ai: 'هوش مصنوعی',
  defi: 'دیفای',
  memes: 'میم‌کوین‌ها',
  stablecoins: 'استیبل‌کوین‌ها',
  rwa: 'RWA / Stocks',
  exchange: 'توکن صرافی',
  privacy: 'پرایوسی',
}

export const CATEGORY_COLORS: Record<CategoryId, string> = {
  core: '#d7f6ff',
  networks: '#6e9eff',
  ai: '#79e9d5',
  defi: '#bd8cff',
  memes: '#ff719e',
  stablecoins: '#a6dc89',
  rwa: '#ffca78',
  exchange: '#ff956d',
  privacy: '#b5a7ff',
}

export const GALAXIES: GalaxyDefinition[] = [
  {
    id: 'core',
    label: 'ارزهای اصلی',
    shortLabel: 'Core',
    eyebrow: 'THE ANCHORS',
    description: 'دارایی‌هایی که نقشه بازار را تعریف می‌کنند.',
    accent: CATEGORY_COLORS.core,
    accentRgb: '215, 246, 255',
    position: [-6, 2.3, 1],
  },
  {
    id: 'networks',
    label: 'شبکه‌های اصلی',
    shortLabel: 'Networks',
    eyebrow: 'THE LAYERS',
    description: 'زیرساخت‌هایی که اقتصاد باز رمزارز روی آن‌ها حرکت می‌کند.',
    accent: CATEGORY_COLORS.networks,
    accentRgb: '110, 158, 255',
    position: [5.8, 2.1, -1.4],
  },
  {
    id: 'ai',
    label: 'هوش مصنوعی',
    shortLabel: 'AI',
    eyebrow: 'THE INTELLIGENCE',
    description: 'تقاطع محاسبات، داده و اقتصاد غیرمتمرکز.',
    accent: CATEGORY_COLORS.ai,
    accentRgb: '121, 233, 213',
    position: [-5.2, -2.3, -1.8],
  },
  {
    id: 'defi',
    label: 'دیفای',
    shortLabel: 'DeFi',
    eyebrow: 'THE OPEN FINANCE',
    description: 'پروتکل‌ها و دارایی‌های مالی بدون واسطه.',
    accent: CATEGORY_COLORS.defi,
    accentRgb: '189, 140, 255',
    position: [4.8, -2.4, 0.8],
  },
  {
    id: 'memes',
    label: 'میم‌کوین‌ها',
    shortLabel: 'Memes',
    eyebrow: 'THE CULTURE',
    description: 'جامعه، شوخی و انرژی جمعی بازار.',
    accent: CATEGORY_COLORS.memes,
    accentRgb: '255, 113, 158',
    position: [-0.3, -4.7, 1.2],
  },
  {
    id: 'stablecoins',
    label: 'استیبل‌کوین‌ها',
    shortLabel: 'Stablecoins',
    eyebrow: 'THE LIQUIDITY',
    description: 'واحدهای باثبات برای حرکت نقدینگی در بازار.',
    accent: CATEGORY_COLORS.stablecoins,
    accentRgb: '166, 220, 137',
    position: [0.6, 4.7, -0.6],
  },
  {
    id: 'rwa',
    label: 'RWA / Stocks',
    shortLabel: 'RWA',
    eyebrow: 'THE BRIDGE',
    description: 'دارایی‌هایی که دنیای واقعی را به زنجیره می‌آورند.',
    accent: CATEGORY_COLORS.rwa,
    accentRgb: '255, 202, 120',
    position: [-9.1, 0.1, -1],
  },
  {
    id: 'exchange',
    label: 'توکن صرافی',
    shortLabel: 'Exchange',
    eyebrow: 'THE VENUES',
    description: 'توکن‌های اکوسیستم‌ها و بازارهای مبادله.',
    accent: CATEGORY_COLORS.exchange,
    accentRgb: '255, 149, 109',
    position: [9, 0.1, 1.1],
  },
  {
    id: 'privacy',
    label: 'پرایوسی',
    shortLabel: 'Privacy',
    eyebrow: 'THE SHADOWS',
    description: 'پروژه‌هایی با تمرکز بر حریم خصوصی و اختیار کاربر.',
    accent: CATEGORY_COLORS.privacy,
    accentRgb: '181, 167, 255',
    position: [0, 0, -3.2],
  },
]

export function galaxyById(id: CategoryId): GalaxyDefinition {
  return GALAXIES.find((galaxy) => galaxy.id === id) ?? GALAXIES[0]
}

export function categoryLabel(id: CategoryId): string {
  return CATEGORY_LABELS[id]
}

export function categoryColor(id: CategoryId): string {
  return CATEGORY_COLORS[id]
}

export function formatCompactMarketCap(value: number): string {
  if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(2)}T`
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

export function formatIrt(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 }).format(value)
}

export function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}٪`
}

export function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase('fa-IR').replace(/ي/g, 'ی').replace(/ك/g, 'ک')
}
