import { Html, Line, Sphere } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { GalaxyDefinition, PositionedCoin } from '../types'
import { categoryColor, formatCompactMarketCap } from '../types'
import { coinIconUrl } from '../data'
import * as THREE from 'three'

type GalaxyNodesProps = {
  galaxy: GalaxyDefinition
  coins: PositionedCoin[]
  activeSymbol: string | null
  activeGalaxy: string | null
  onSelectCoin: (coin: PositionedCoin) => void
  onSelectGalaxy: (galaxy: GalaxyDefinition) => void
}

export function GalaxyNodes({
  galaxy,
  coins,
  activeSymbol,
  activeGalaxy,
  onSelectCoin,
  onSelectGalaxy,
}: GalaxyNodesProps) {
  const [x, y, z] = galaxy.position
  const color = categoryColor(galaxy.id)
  const isActive = activeGalaxy === galaxy.id
  const ringPoints = useMemo(() => {
    const points: [number, number, number][] = []
    for (let index = 0; index <= 80; index += 1) {
      const angle = (index / 80) * Math.PI * 2
      points.push([x + Math.cos(angle) * 2.6, y + Math.sin(angle) * 1.28, z])
    }
    return points
  }, [x, y, z])

  return (
    <group>
      <Line points={ringPoints} color={color} transparent opacity={isActive ? 0.42 : 0.15} lineWidth={isActive ? 1.2 : 0.55} />
      <group position={[x, y, z]} onClick={(event) => { event.stopPropagation(); onSelectGalaxy(galaxy) }}>
        <Sphere args={[1.25, 32, 32]}>
          <meshBasicMaterial color={color} transparent opacity={isActive ? 0.16 : 0.055} depthWrite={false} blending={THREE.AdditiveBlending} />
        </Sphere>
        <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className={`galaxy-label ${isActive ? 'galaxy-label--active' : ''}`} style={{ '--accent': color } as CSSProperties}>
            <span>{galaxy.shortLabel}</span>
            <strong>{galaxy.label}</strong>
          </div>
        </Html>
      </group>
      {coins.map((coin) => (
        <CoinNode key={`${galaxy.id}-${coin.symbol}`} coin={coin} color={color} active={coin.symbol === activeSymbol} onSelect={onSelectCoin} />
      ))}
    </group>
  )
}

type CoinNodeProps = {
  coin: PositionedCoin
  color: string
  active: boolean
  onSelect: (coin: PositionedCoin) => void
}

function CoinNode({ coin, color, active, onSelect }: CoinNodeProps) {
  const group = useRef<THREE.Group>(null)
  const [x, y, z] = coin.position
  return (
    <group
      ref={group}
      position={coin.position}
      onClick={(event) => { event.stopPropagation(); onSelect(coin) }}
      onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'default' }}
      scale={active ? 1.22 : 1}
    >
      <Sphere args={[coin.radius, 20, 20]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 1.5 : 0.58} roughness={0.28} metalness={0.2} />
      </Sphere>
      <Html center distanceFactor={9} style={{ pointerEvents: 'none' }}>
        <div className={`coin-label ${active ? 'coin-label--active' : ''}`}>
          <img src={coinIconUrl(coin)} alt="" />
          <span>{coin.symbol}</span>
        </div>
      </Html>
      {active && (
        <Html position={[0, coin.radius + 0.42, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className="coin-tooltip">
            <b>{coin.nameFa}</b>
            <span>رتبه {coin.rank} · {formatCompactMarketCap(coin.marketCap)} USDT</span>
          </div>
        </Html>
      )}
    </group>
  )
}

export function GalaxyCore({ galaxy, active, onSelect }: { galaxy: GalaxyDefinition; active: boolean; onSelect: (galaxy: GalaxyDefinition) => void }) {
  const color = categoryColor(galaxy.id)
  return (
    <group position={galaxy.position} onClick={(event) => { event.stopPropagation(); onSelect(galaxy) }}>
      <Sphere args={[0.44, 24, 24]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 4 : 1.7} toneMapped={false} />
      </Sphere>
    </group>
  )
}

