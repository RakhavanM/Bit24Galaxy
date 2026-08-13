export type CategoryId =
  | 'global-markets'
  | 'mainnets'
  | 'gaming-metaverse'
  | 'ai'
  | 'stablecoins'
  | 'memes'
  | 'layer2'
  | 'oracles'
  | 'defi'
  | 'iot'
  | 'depin'
  | 'wallet-exchange'
  | 'privacy'
  | 'socialfi'
  | 'nft'
  | 'fan-tokens'

export type Coin = {
  rank: number
  symbol: string
  nameFa: string
  nameEn: string
  slug: string
  bit24Slug?: string
  marketCap: number
  marketCapCurrency: string
  marketCapSource?: string
  change24h: number | null
  priceIrt: number | null
  priceUsd?: number | null
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
  source: string | string[]
  selection: string
  note: string
  categoryCount?: number
  placementCount?: number
  uniqueSymbolCount?: number
  categories: Record<CategoryId, string[]>
  marketCapProvenance?: Record<string, string>
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
  'global-markets',
  'mainnets',
  'gaming-metaverse',
  'ai',
  'stablecoins',
  'memes',
  'layer2',
  'oracles',
  'defi',
  'iot',
  'depin',
  'wallet-exchange',
  'privacy',
  'socialfi',
  'nft',
  'fan-tokens',
]

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  'global-markets': 'توکن بازارهای جهانی',
  mainnets: 'شبکه‌های اصلی',
  'gaming-metaverse': 'گیمینگ و متاورس',
  ai: 'هوش مصنوعی',
  stablecoins: 'استیبل‌کوین',
  memes: 'میم‌کوین',
  layer2: 'لایه دوم',
  oracles: 'اوراکل',
  defi: 'دیفای',
  iot: 'اینترنت اشیاء',
  depin: 'دپین',
  'wallet-exchange': 'ارز والت یا صرافی',
  privacy: 'پرایوسی کوین',
  socialfi: 'سوشال‌فای',
  nft: 'ان‌اف‌تی',
  'fan-tokens': 'توکن هواداری',
}

export const CATEGORY_COLORS: Record<CategoryId, string> = {
  'global-markets': '#8fb8ff',
  mainnets: '#d7f6ff',
  'gaming-metaverse': '#ff83c6',
  ai: '#79e9d5',
  stablecoins: '#a6dc89',
  memes: '#ff719e',
  layer2: '#ffad62',
  oracles: '#7fc8ff',
  defi: '#bd8cff',
  iot: '#67d5d0',
  depin: '#70e0ff',
  'wallet-exchange': '#ff956d',
  privacy: '#f0c56c',
  socialfi: '#d89dff',
  nft: '#f4a6e8',
  'fan-tokens': '#ffbf72',
}

const GALAXY_POSITIONS: [number, number, number][] = [
  [-48, 36, -38], [0, 42, -6], [48, 36, 28],
  [-52, 8, 30], [0, 10, 4], [52, 8, -28],
  [-48, -24, -30], [0, -22, 8], [48, -24, 34],
  [-30, -52, 26], [30, -52, -26], [-72, -4, 0],
  [72, -4, -2], [-30, 54, 28], [30, 54, -30], [0, 70, 0],
]

const GALAXY_COPY: Record<CategoryId, { shortLabel: string; eyebrow: string; description: string }> = {
  'global-markets': { shortLabel: 'Global Markets', eyebrow: 'THE MACRO LAYER', description: 'دارایی‌هایی که بازارهای جهانی را به زنجیره متصل می‌کنند.' },
  mainnets: { shortLabel: 'Mainnets', eyebrow: 'THE FOUNDATIONS', description: 'شبکه‌های اصلی و زیرساخت‌های پایه اکوسیستم رمزارز.' },
  'gaming-metaverse': { shortLabel: 'Gaming / Metaverse', eyebrow: 'THE WORLDS', description: 'اقتصادهای بازی، جهان‌های مجازی و مالکیت دیجیتال.' },
  ai: { shortLabel: 'AI', eyebrow: 'THE INTELLIGENCE', description: 'تقاطع محاسبات، داده و هوش مصنوعی غیرمتمرکز.' },
  stablecoins: { shortLabel: 'Stablecoins', eyebrow: 'THE LIQUIDITY', description: 'واحدهای باثبات برای حرکت نقدینگی در بازار.' },
  memes: { shortLabel: 'Memes', eyebrow: 'THE CULTURE', description: 'جامعه، شوخی و انرژی جمعی بازار.' },
  layer2: { shortLabel: 'Layer 2', eyebrow: 'THE SCALERS', description: 'راهکارهایی برای مقیاس‌پذیری نسل بعدی شبکه‌ها.' },
  oracles: { shortLabel: 'Oracles', eyebrow: 'THE SIGNALS', description: 'داده‌های بیرونی که قراردادهای هوشمند را تغذیه می‌کنند.' },
  defi: { shortLabel: 'DeFi', eyebrow: 'THE OPEN FINANCE', description: 'پروتکل‌ها و دارایی‌های مالی بدون واسطه.' },
  iot: { shortLabel: 'IoT', eyebrow: 'THE SENSORS', description: 'شبکه‌هایی برای داده و ارتباطات ماشین‌به‌ماشین.' },
  depin: { shortLabel: 'DePIN', eyebrow: 'THE INFRASTRUCTURE', description: 'زیرساخت‌های فیزیکی و خدمات توزیع‌شده.' },
  'wallet-exchange': { shortLabel: 'Wallet / Exchange', eyebrow: 'THE VENUES', description: 'توکن‌های اکوسیستم‌ها و بازارهای مبادله.' },
  privacy: { shortLabel: 'Privacy', eyebrow: 'THE VEIL', description: 'پروتکل‌هایی برای حفظ حریم خصوصی و تراکنش‌های محرمانه.' },
  socialfi: { shortLabel: 'SocialFi', eyebrow: 'THE NETWORKS', description: 'اقتصادهای اجتماعی و مالکیت ارتباطات دیجیتال.' },
  nft: { shortLabel: 'NFT', eyebrow: 'THE ARTIFACTS', description: 'دارایی‌های کلکسیونی، هنری و کاربردی روی زنجیره.' },
  'fan-tokens': { shortLabel: 'Fan Tokens', eyebrow: 'THE TRIBES', description: 'دارایی‌های هواداری و اقتصاد مشارکت اجتماعی.' },
}

export const GALAXIES: GalaxyDefinition[] = CATEGORY_ORDER.map((id, index) => ({
  id,
  label: CATEGORY_LABELS[id],
  shortLabel: GALAXY_COPY[id].shortLabel,
  eyebrow: GALAXY_COPY[id].eyebrow,
  description: GALAXY_COPY[id].description,
  accent: CATEGORY_COLORS[id],
  accentRgb: CATEGORY_COLORS[id].match(/[0-9a-f]{2}/gi)!.map((part) => Number.parseInt(part, 16)).join(', '),
  position: GALAXY_POSITIONS[index],
}))

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
