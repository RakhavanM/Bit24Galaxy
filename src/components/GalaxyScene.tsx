import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { GalaxyCore, GalaxyNodes } from './GalaxyNodes'
import { NebulaDust, SceneFog, Starfield } from './Starfield'
import { positionCoins } from '../layout'
import { GALAXIES, type Coin, type GalaxyDefinition, type PositionedCoin } from '../types'

type GalaxySceneProps = {
  coins: Coin[]
  activeGalaxy: GalaxyDefinition | null
  activeSymbol: string | null
  onSelectCoin: (coin: PositionedCoin) => void
  onSelectGalaxy: (galaxy: GalaxyDefinition) => void
  onClearSelection: () => void
}

export function GalaxyScene({ coins, activeGalaxy, activeSymbol, onSelectCoin, onSelectGalaxy, onClearSelection }: GalaxySceneProps) {
  const positioned = useMemo(() => {
    const map = new Map<string, PositionedCoin[]>()
    GALAXIES.forEach((galaxy) => {
      map.set(galaxy.id, positionCoins(coins, galaxy, coins.filter((coin) => coin.categories.includes(galaxy.id))))
    })
    return map
  }, [coins])

  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 0.4, 16], fov: 47, near: 0.1, far: 80 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onPointerMissed={onClearSelection}
    >
      <color attach="background" args={['#070b18']} />
      <SceneFog />
      <ambientLight intensity={0.22} />
      <pointLight position={[0, 0, 4]} color="#97bfff" intensity={20} distance={22} />
      <Starfield />
      <NebulaDust />
      {GALAXIES.map((galaxy) => (
        <group key={galaxy.id} visible={!activeGalaxy || activeGalaxy.id === galaxy.id}>
          <GalaxyCore galaxy={galaxy} active={activeGalaxy?.id === galaxy.id} onSelect={onSelectGalaxy} />
          {(!activeGalaxy || activeGalaxy.id === galaxy.id) && (
            <GalaxyNodes
              galaxy={galaxy}
              coins={positioned.get(galaxy.id) ?? []}
              activeSymbol={activeSymbol}
              activeGalaxy={activeGalaxy?.id ?? null}
              onSelectCoin={onSelectCoin}
              onSelectGalaxy={onSelectGalaxy}
            />
          )}
        </group>
      ))}
      <CameraFlight activeGalaxy={activeGalaxy} activeSymbol={activeSymbol} positioned={positioned} />
      <Environment preset="night" environmentIntensity={0.18} />
    </Canvas>
  )
}

function CameraFlight({ activeGalaxy, activeSymbol, positioned }: { activeGalaxy: GalaxyDefinition | null; activeSymbol: string | null; positioned: Map<string, PositionedCoin[]> }) {
  const { camera } = useThree()
  const destination = useRef(new THREE.Vector3(0, 0.4, 16))
  const lookAt = useRef(new THREE.Vector3(0, 0, 0))

  useEffect(() => {
    if (!activeGalaxy) {
      destination.current.set(0, 0.4, 16)
      lookAt.current.set(0, 0, 0)
      return
    }
    let target = new THREE.Vector3(...activeGalaxy.position)
    if (activeSymbol) {
      const coin = positioned.get(activeGalaxy.id)?.find((item) => item.symbol === activeSymbol)
      if (coin) target = new THREE.Vector3(...coin.position)
    }
    lookAt.current.copy(target)
    destination.current.copy(target).add(new THREE.Vector3(0, 0.8, 7.6))
  }, [activeGalaxy, activeSymbol, positioned])

  useFrame((_, delta) => {
    const ease = 1 - Math.pow(0.001, delta)
    camera.position.lerp(destination.current, ease)
    const currentLook = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).add(camera.position)
    currentLook.lerp(lookAt.current, ease)
    camera.lookAt(currentLook)
  })

  return null
}

