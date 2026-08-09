import { useEffect, useMemo, useState } from 'react'
import { GalaxyScene } from './components/GalaxyScene'
import { Loader } from './components/Loader'
import Overlay from './components/Overlay'
import { loadCoinSnapshot } from './data'
import { GALAXIES, type Coin, type GalaxyDefinition, type PositionedCoin } from './types'

export default function App() {
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(8)
  const [activeGalaxy, setActiveGalaxy] = useState<GalaxyDefinition | null>(null)
  const [selectedCoin, setSelectedCoin] = useState<PositionedCoin | null>(null)
  const [overviewZoomProgress, setOverviewZoomProgress] = useState(0)

  useEffect(() => {
    let mounted = true
    const timer = window.setInterval(() => setProgress((value) => Math.min(88, value + 7)), 90)
    loadCoinSnapshot()
      .then((snapshot) => {
        if (!mounted) return
        setCoins(snapshot.coins)
        setProgress(100)
        window.setTimeout(() => setLoading(false), 430)
      })
      .catch((error) => {
        console.error(error)
        if (mounted) setLoading(false)
      })
      .finally(() => window.clearInterval(timer))
    return () => {
      mounted = false
      window.clearInterval(timer)
    }
  }, [])

  const safeGalaxy = useMemo(() => {
    if (!activeGalaxy) return null
    return GALAXIES.find((galaxy) => galaxy.id === activeGalaxy.id) ?? null
  }, [activeGalaxy])

  return (
    <main className="app-shell">
      <div className="canvas-layer">
        {!loading && <GalaxyScene coins={coins} activeGalaxy={safeGalaxy} activeSymbol={selectedCoin?.symbol ?? null} onSelectCoin={setSelectedCoin} onSelectGalaxy={(galaxy) => { setActiveGalaxy(galaxy); setSelectedCoin(null); setOverviewZoomProgress(1) }} onClearSelection={() => setSelectedCoin(null)} onOverviewZoomChange={setOverviewZoomProgress} onZoomedOut={() => { setActiveGalaxy(null); setSelectedCoin(null); setOverviewZoomProgress(0) }} />}
      </div>
      {!loading && <Overlay coins={coins} activeGalaxy={safeGalaxy} selectedCoin={selectedCoin} overviewZoomProgress={overviewZoomProgress} onSelectGalaxy={(galaxy) => { setActiveGalaxy(galaxy); setSelectedCoin(null); setOverviewZoomProgress(galaxy ? 1 : 0) }} onSelectCoin={setSelectedCoin} />}
      {loading && <Loader progress={progress} />}
    </main>
  )
}
