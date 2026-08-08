import { Html, Line, Sphere, Torus } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { GalaxyDefinition, PositionedCoin } from '../types'
import { categoryColor, formatCompactMarketCap } from '../types'
import { coinIconUrl } from '../data'
import { planetProfile } from '../planets'
import { PlanetMaterial } from './PlanetMaterial'
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
        <CoinNode key={`${galaxy.id}-${coin.symbol}`} coin={coin} active={coin.symbol === activeSymbol} onSelect={onSelectCoin} />
      ))}
    </group>
  )
}

type CoinNodeProps = {
  coin: PositionedCoin
  active: boolean
  onSelect: (coin: PositionedCoin) => void
}

function CoinNode({ coin, active, onSelect }: CoinNodeProps) {
  const group = useRef<THREE.Group>(null)
  const profile = useMemo(() => planetProfile(coin), [coin.symbol, coin.categories])

  useFrame((_, delta) => {
    if (!group.current) return
    group.current.rotation.y += delta * profile.rotationSpeed
    group.current.rotation.x = profile.tilt
  })

  return (
    <group
      ref={group}
      position={coin.position}
      onClick={(event) => { event.stopPropagation(); onSelect(coin) }}
      onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'default' }}
      scale={active ? 1.22 : 1}
    >
      <Sphere args={[coin.radius, 48, 32]}>
        <PlanetMaterial profile={profile} active={active} />
      </Sphere>
      {profile.ring && (
        <Torus args={[coin.radius * 1.36, Math.max(0.018, coin.radius * 0.045), 48, 8]} rotation={[profile.tilt + 0.65, 0.15, 0]}>
          <meshBasicMaterial color={profile.accent} transparent opacity={active ? 0.9 : 0.54} blending={THREE.AdditiveBlending} />
        </Torus>
      )}
      <Atmosphere radius={coin.radius} color={profile.accent} intensity={profile.atmosphere * (active ? 1.4 : 1)} />
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

function Atmosphere({ radius, color, intensity }: { radius: number; color: string; intensity: number }) {
  return (
    <Sphere args={[radius * 1.055, 32, 24]}>
      <meshBasicMaterial color={color} transparent opacity={Math.min(0.28, intensity * 0.2)} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
    </Sphere>
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

