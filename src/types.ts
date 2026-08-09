export type CategoryId =
  | 'core'
  | 'stablecoins'
  | 'defi'
  | 'layer2'
  | 'ai'
  | 'gamefi'
  | 'exchange'
  | 'memes'

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
  sourceSymbol?: string
  selectionRank?: number
  sourceType?: string
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
  'stablecoins',
  'defi',
  'layer2',
  'ai',
  'gamefi',
  'exchange',
  'memes',
]

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  core: 'ارزهای اصلی',
  stablecoins: 'استیبل‌کوین‌ها',
  defi: 'دیفای',
  layer2: 'لایه دوم',
  ai: 'هوش مصنوعی و DePIN',
  gamefi: 'گیم‌فای و متاورس',
  exchange: 'توکن صرافی',
  memes: 'میم‌کوین‌ها',
}

export const CATEGORY_COLORS: Record<CategoryId, string> = {
  core: '#d7f6ff',
  stablecoins: '#a6dc89',
  defi: '#bd8cff',
  layer2: '#ffad62',
  ai: '#79e9d5',
  gamefi: '#ff83c6',
  exchange: '#ff956d',
  memes: '#ff719e',
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
    id: 'stablecoins',
    label: 'استیبل‌کوین‌ها',
    shortLabel: 'Stablecoins',
    eyebrow: 'THE LIQUIDITY',
    description: 'واحدهای باثبات برای حرکت نقدینگی در بازار.',
    accent: CATEGORY_COLORS.stablecoins,
    accentRgb: '166, 220, 137',
    position: [5.8, 2.1, -1.4],
  },
  {
    id: 'defi',
    label: 'دیفای',
    shortLabel: 'DeFi',
    eyebrow: 'THE OPEN FINANCE',
    description: 'پروتکل‌ها و دارایی‌های مالی بدون واسطه.',
    accent: CATEGORY_COLORS.defi,
    accentRgb: '189, 140, 255',
    position: [-5.2, -2.3, -1.8],
  },
  {
    id: 'layer2',
    label: 'لایه دوم',
    shortLabel: 'Layer 2',
    eyebrow: 'THE SCALERS',
    description: 'راهکارهایی برای مقیاس‌پذیری نسل بعدی شبکه‌ها.',
    accent: CATEGORY_COLORS.layer2,
    accentRgb: '255, 173, 98',
    position: [4.8, -2.4, 0.8],
  },
  {
    id: 'ai',
    label: 'هوش مصنوعی و DePIN',
    shortLabel: 'AI / DePIN',
    eyebrow: 'THE INTELLIGENCE',
    description: 'تقاطع محاسبات، داده و زیرساخت غیرمتمرکز.',
    accent: CATEGORY_COLORS.ai,
    accentRgb: '121, 233, 213',
    position: [-0.3, -4.7, 1.2],
  },
  {
    id: 'gamefi',
    label: 'گیم‌فای و متاورس',
    shortLabel: 'GameFi',
    eyebrow: 'THE WORLDS',
    description: 'اقتصادهای بازی، جهان‌های مجازی و مالکیت دیجیتال.',
    accent: CATEGORY_COLORS.gamefi,
    accentRgb: '255, 131, 198',
    position: [0.6, 4.7, -0.6],
  },
  {
    id: 'exchange',
    label: 'توکن صرافی',
    shortLabel: 'Exchange',
    eyebrow: 'THE VENUES',
    description: 'توکن‌های اکوسیستم‌ها و بازارهای مبادله.',
    accent: CATEGORY_COLORS.exchange,
    accentRgb: '255, 149, 109',
    position: [-9.1, 0.1, -1],
  },
  {
    id: 'memes',
    label: 'میم‌کوین‌ها',
    shortLabel: 'Memes',
    eyebrow: 'THE CULTURE',
    description: 'جامعه، شوخی و انرژی جمعی بازار.',
    accent: CATEGORY_COLORS.memes,
    accentRgb: '255, 113, 158',
    position: [9, 0.1, 1.1],
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
