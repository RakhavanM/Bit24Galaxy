import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Coin, GalaxyDefinition, PositionedCoin } from '../types'
import { GALAXIES, categoryColor, categoryLabel, formatCompactMarketCap, formatIrt, formatPercent, normalizeSearch } from '../types'
import { coinIconUrl } from '../data'

export type OverlayProps = {
  coins: Coin[]
  activeGalaxy: GalaxyDefinition | null
  selectedCoin: PositionedCoin | null
  overviewZoomProgress: number
  onSelectGalaxy: (galaxy: GalaxyDefinition | null) => void
  onSelectCoin: (coin: PositionedCoin | null) => void
}

export function Overlay({ coins, activeGalaxy, selectedCoin, overviewZoomProgress, onSelectGalaxy, onSelectCoin }: OverlayProps) {
  const [search, setSearch] = useState('')
  const normalized = normalizeSearch(search)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        document.querySelector<HTMLInputElement>('.search-box input')?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
  const results = useMemo(() => {
    if (!normalized) return []
    return coins.filter((coin) => normalizeSearch(`${coin.symbol} ${coin.nameFa}`).includes(normalized)).slice(0, 6)
  }, [coins, normalized])

  return (
    <div className="overlay-ui">
      <header className="topbar">
        <a className="bit24-topbar-logo" href="https://bit24.cash/" target="_blank" rel="noreferrer" aria-label="بیت۲۴">
          <img src={`${import.meta.env.BASE_URL}bit24-logo-no-slogan.svg`} alt="بیت۲۴" />
        </a>
        <button className="brand" onClick={() => { onSelectGalaxy(null); onSelectCoin(null) }} aria-label="بازگشت به نمای کلی">
          <span className="brand-spark">✦</span>
          <span><b>GALAXY</b><em>DIGITAL ASSET ATLAS</em></span>
        </button>
        <div className="topbar-actions">
          <span className="topbar-section">50 ASSETS <i /> 8 GALAXIES</span>
          <button className="menu-trigger" onClick={() => undefined} aria-label="منو">
            <span /> <span />
          </button>
        </div>
      </header>

      <section className="hero-copy" style={{ opacity: 1 - overviewZoomProgress, transform: `translateY(${-overviewZoomProgress * 18}px)`, pointerEvents: overviewZoomProgress > 0.92 ? 'none' : 'auto' }}>
        <p className="kicker">AN IMMERSIVE ASSET MAP</p>
        <h1>بازار را<br /><i>از بالا ببین.</i></h1>
        <p className="hero-description">یک اطلس زنده‌نما از ۵۰ دارایی برتر لیست‌شده در بیت۲۴؛ هر کهکشان یک روایت و هر سیاره یک پروژه است.</p>
        <div className="hero-rule"><span /> <b>{activeGalaxy ? activeGalaxy.shortLabel : 'OVERVIEW'}</b></div>
      </section>

      <SearchBox value={search} results={results} onChange={setSearch} onSelect={(coin) => {
        const galaxy = GALAXIES.find((item) => coin.categories.includes(item.id)) ?? null
        onSelectGalaxy(galaxy)
        onSelectCoin({ ...coin, galaxyId: galaxy?.id ?? 'core', position: galaxy?.position ?? [0, 0, 0], radius: 0.5 })
        setSearch('')
      }} />

      <aside className="galaxy-nav" aria-label="انتخاب کهکشان">
        <div className="nav-heading"><span>GALAXIES</span><b>{GALAXIES.length}</b></div>
        <div className="galaxy-list">
          <button className={!activeGalaxy ? 'is-active' : ''} onClick={() => { onSelectGalaxy(null); onSelectCoin(null) }}>
            <span className="nav-index">00</span><span>نمای کلی بازار</span><i />
          </button>
          {GALAXIES.map((galaxy, index) => {
            const count = coins.filter((coin) => coin.categories.includes(galaxy.id)).length
            return (
              <button key={galaxy.id} className={activeGalaxy?.id === galaxy.id ? 'is-active' : ''} onClick={() => { onSelectGalaxy(galaxy); onSelectCoin(null) }}>
                <span className="nav-index">{String(index + 1).padStart(2, '0')}</span><span>{galaxy.label}</span><small>{count}</small><i style={{ background: galaxy.accent }} />
              </button>
            )
          })}
        </div>
      </aside>

      <div className="scroll-hint"><span className="scroll-line" /><span>DRAG TO ROTATE&nbsp; · &nbsp;SCROLL TO ZOOM</span></div>
      <div className="coordinates">35° 43' 45" N<br />51° 23' 20" E</div>
      <div className="footer-note">BIT24 DIGITAL ASSET ATLAS <span>—</span> DATA SNAPSHOT</div>

      {activeGalaxy && <GalaxyInfo galaxy={activeGalaxy} coins={coins} onClose={() => { onSelectGalaxy(null); onSelectCoin(null) }} />}
      {selectedCoin && <CoinDetails coin={selectedCoin} onClose={() => onSelectCoin(null)} />}
    </div>
  )
}

function SearchBox({ value, results, onChange, onSelect }: { value: string; results: Coin[]; onChange: (value: string) => void; onSelect: (coin: Coin) => void }) {
  return (
    <div className="search-wrap">
      <label className="search-box"><span>⌕</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="جست‌وجوی نماد یا نام ارز" /><kbd>⌘ K</kbd></label>
      {results.length > 0 && <div className="search-results">{results.map((coin) => <button key={coin.symbol} onClick={() => onSelect(coin)}><img src={coinIconUrl(coin)} alt="" /><b>{coin.symbol}</b><span>{coin.nameFa}</span><small>#{coin.rank}</small></button>)}</div>}
    </div>
  )
}

function GalaxyInfo({ galaxy, coins, onClose }: { galaxy: GalaxyDefinition; coins: Coin[]; onClose: () => void }) {
  const categoryCoins = coins.filter((coin) => coin.categories.includes(galaxy.id)).sort((a, b) => b.marketCap - a.marketCap)
  return (
    <div className="galaxy-info" style={{ '--accent': galaxy.accent, '--accent-rgb': galaxy.accentRgb } as CSSProperties}>
      <button className="close-button" onClick={onClose}>×</button>
      <p>{galaxy.eyebrow}</p><h2>{galaxy.label}</h2><span>{galaxy.description}</span>
      <div className="info-divider" />
      <div className="info-stat"><b>{categoryCoins.length}</b><span>ASSETS IN CONSTELLATION</span></div>
      <ol>{categoryCoins.slice(0, 5).map((coin) => <li key={coin.symbol}><span>{coin.symbol}</span><small>{formatCompactMarketCap(coin.marketCap)} USDT</small></li>)}</ol>
    </div>
  )
}

function CoinDetails({ coin, onClose }: { coin: PositionedCoin; onClose: () => void }) {
  return (
    <section className="coin-details" style={{ '--accent': categoryColor(coin.categories[0]) } as CSSProperties}>
      <button className="close-button" onClick={onClose}>×</button>
      <div className="coin-details-heading"><img src={coinIconUrl(coin)} alt="" /><div><p>ASSET {String(coin.rank).padStart(2, '0')}</p><h2>{coin.symbol}</h2><span>{coin.nameFa}</span></div></div>
      <div className="coin-stats"><div><span>MARKET CAP</span><b>{formatCompactMarketCap(coin.marketCap)} <small>USDT</small></b></div><div><span>PRICE SNAPSHOT</span><b>{formatIrt(coin.priceIrt)} <small>IRT</small></b></div><div><span>24H CHANGE</span><b className={coin.change24h !== null && coin.change24h >= 0 ? 'positive' : 'negative'}>{formatPercent(coin.change24h)}</b></div></div>
      <div className="coin-tags">{coin.categories.map((category) => <span key={category}>{categoryLabel(category)}</span>)}</div>
      <a className="coin-cta" href={coin.bit24Url} target="_blank" rel="noreferrer">مشاهده صفحه ارز در بیت۲۴ <span>↗</span></a>
      <p className="snapshot-note">این اعداد مربوط به Snapshot اولیه هستند و قیمت لحظه‌ای نیستند.</p>
    </section>
  )
}

export default Overlay
