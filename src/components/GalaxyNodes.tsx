import { Html, Line, Sphere, Torus } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { GalaxyDefinition, PositionedCoin } from '../types'
import { categoryColor, formatCompactMarketCap } from '../types'
import { coinIconUrl } from '../data'
import { planetProfile } from '../planets'
import { PlanetMaterial } from './PlanetMaterial'
import { SunCorona, SunMaterial } from './SunMaterial'
import { sunProfile } from '../suns'
import * as THREE from 'three'

export type HoverTarget =
  | { kind: 'sun'; id: string; position: [number, number, number]; accent: string }
  | { kind: 'planet'; id: string; position: [number, number, number]; accent: string }

type GalaxyNodesProps = {
  galaxy: GalaxyDefinition
  coins: PositionedCoin[]
  activeSymbol: string | null
  activeGalaxy: string | null
  hoveredTarget: HoverTarget | null
  onSelectCoin: (coin: PositionedCoin) => void
  onSelectGalaxy: (galaxy: GalaxyDefinition) => void
  onHoverTarget: (target: HoverTarget | null) => void
}

export function GalaxyNodes({ galaxy, coins, activeSymbol, activeGalaxy, hoveredTarget, onSelectCoin, onSelectGalaxy, onHoverTarget }: GalaxyNodesProps) {
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
      <Line points={ringPoints} color={color} transparent opacity={isActive ? 0.42 : 0.12} lineWidth={isActive ? 1.2 : 0.5} />
      <GalaxySun galaxy={galaxy} active={isActive} highlighted={hoveredTarget?.kind === 'sun' && hoveredTarget.id === galaxy.id} onSelect={onSelectGalaxy} onHoverTarget={onHoverTarget} />
      {coins.map((coin) => (
        <CoinNode key={`${galaxy.id}-${coin.symbol}`} coin={coin} active={coin.symbol === activeSymbol} highlighted={hoveredTarget?.kind === 'planet' && hoveredTarget.id === coin.symbol} onSelect={onSelectCoin} onHoverTarget={onHoverTarget} />
      ))}
    </group>
  )
}

function GalaxySun({ galaxy, active, highlighted, onSelect, onHoverTarget }: { galaxy: GalaxyDefinition; active: boolean; highlighted: boolean; onSelect: (galaxy: GalaxyDefinition) => void; onHoverTarget: (target: HoverTarget | null) => void }) {
  const group = useRef<THREE.Group>(null)
  const profile = useMemo(() => sunProfile(galaxy), [galaxy])
  const [x, y, z] = galaxy.position

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * profile.rotationSpeed
  })

  return (
    <group
      ref={group}
      position={[x, y, z]}
      onClick={(event) => { event.stopPropagation(); onSelect(galaxy) }}
      onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer'; onHoverTarget({ kind: 'sun', id: galaxy.id, position: galaxy.position, accent: galaxy.accent }) }}
      onPointerOut={() => { document.body.style.cursor = 'default'; onHoverTarget(null) }}
      scale={active ? 1.12 : highlighted ? 1.06 : 1}
    >
      <Sphere args={[profile.radius, 64, 48]}>
        <SunMaterial profile={profile} />
      </Sphere>
      <SunCorona profile={profile} active={active || highlighted} />
      {highlighted && <HighlightShell radius={profile.radius} color={profile.glow} />}
      <Html center distanceFactor={13} style={{ pointerEvents: 'none' }}>
        <div className={`galaxy-label ${active ? 'galaxy-label--active' : ''} ${highlighted ? 'galaxy-label--highlight' : ''}`} style={{ '--accent': galaxy.accent, '--highlight': galaxy.accent } as CSSProperties}>
          <span>{galaxy.shortLabel}</span>
          <strong>{galaxy.label}</strong>
        </div>
      </Html>
    </group>
  )
}

type CoinNodeProps = {
  coin: PositionedCoin
  active: boolean
  highlighted: boolean
  onSelect: (coin: PositionedCoin) => void
  onHoverTarget: (target: HoverTarget | null) => void
}

function CoinNode({ coin, active, highlighted, onSelect, onHoverTarget }: CoinNodeProps) {
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
      onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer'; onHoverTarget({ kind: 'planet', id: coin.symbol, position: coin.position, accent: profile.accent }) }}
      onPointerOut={() => { document.body.style.cursor = 'default'; onHoverTarget(null) }}
      scale={active ? 1.22 : highlighted ? 1.08 : 1}
    >
      <Sphere args={[coin.radius, 64, 48]}>
        <PlanetMaterial profile={profile} active={active || highlighted} />
      </Sphere>
      {highlighted && <HighlightShell radius={coin.radius} color={profile.accent} />}
      {profile.ring && (
        <Torus args={[coin.radius * 1.36, Math.max(0.012, coin.radius * 0.026), 64, 12]} rotation={[profile.tilt + 0.65, 0.15, 0]}>
          <meshBasicMaterial color={profile.accent} transparent opacity={active ? 0.68 : 0.32} blending={THREE.AdditiveBlending} />
        </Torus>
      )}
      <Atmosphere radius={coin.radius} color={profile.accent} intensity={profile.atmosphere * ((active || highlighted) ? 1.4 : 1)} />
      <Html center distanceFactor={11} style={{ pointerEvents: 'none' }}>
        <div className={`coin-label ${active ? 'coin-label--active' : ''} ${highlighted ? 'coin-label--highlight' : ''}`} style={{ '--highlight': profile.accent } as CSSProperties}>
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
      <meshBasicMaterial color={color} transparent opacity={Math.min(0.14, intensity * 0.1)} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
    </Sphere>
  )
}

function HighlightShell({ radius, color }: { radius: number; color: string }) {
  return (
    <Sphere args={[radius * 1.1, 32, 24]}>
      <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
    </Sphere>
  )
}

