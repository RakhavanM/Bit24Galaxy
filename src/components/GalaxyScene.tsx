import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { GalaxyNodes } from './GalaxyNodes'
import { NebulaDust, SceneFog, Starfield } from './Starfield'
import { overviewCoinsForGalaxy, positionCoins } from '../layout'
import { GALAXIES, type Coin, type GalaxyDefinition, type PositionedCoin } from '../types'
import { clampOrbitDistance, overviewExplorationProgress, shouldExitGalaxy, orbitPosition, zoomDistance, OVERVIEW_DISTANCE } from '../camera'

type GalaxySceneProps = {
  coins: Coin[]
  activeGalaxy: GalaxyDefinition | null
  activeSymbol: string | null
  onSelectCoin: (coin: PositionedCoin) => void
  onSelectGalaxy: (galaxy: GalaxyDefinition) => void
  onClearSelection: () => void
  onOverviewZoomChange: (progress: number) => void
  onZoomedOut: () => void
}

export function GalaxyScene({ coins, activeGalaxy, activeSymbol, onSelectCoin, onSelectGalaxy, onClearSelection, onOverviewZoomChange, onZoomedOut }: GalaxySceneProps) {
  const positioned = useMemo(() => {
    const map = new Map<string, PositionedCoin[]>()
    GALAXIES.forEach((galaxy) => {
      const categoryCoins = activeGalaxy
        ? coins.filter((coin) => coin.categories.includes(galaxy.id))
        : overviewCoinsForGalaxy(coins, galaxy)
      map.set(galaxy.id, positionCoins(coins, galaxy, categoryCoins))
    })
    return map
  }, [coins, activeGalaxy])

  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 0.4, OVERVIEW_DISTANCE], fov: 47, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onPointerMissed={onClearSelection}
      onCreated={({ gl }) => {
        gl.domElement.style.touchAction = 'none'
      }}
    >
      <color attach="background" args={['#070b18']} />
      <SceneFog />
      <ambientLight intensity={0.22} />
      <pointLight position={[0, 0, 4]} color="#97bfff" intensity={20} distance={22} />
      <Starfield />
      <NebulaDust />
      {GALAXIES.map((galaxy) => (
        <group key={galaxy.id} visible={!activeGalaxy || activeGalaxy.id === galaxy.id}>
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
      <CameraFlight activeGalaxy={activeGalaxy} activeSymbol={activeSymbol} positioned={positioned} onOverviewZoomChange={onOverviewZoomChange} onZoomedOut={onZoomedOut} />
      <Environment preset="night" environmentIntensity={0.18} />
    </Canvas>
  )
}

type CameraFlightProps = {
  activeGalaxy: GalaxyDefinition | null
  activeSymbol: string | null
  positioned: Map<string, PositionedCoin[]>
  onOverviewZoomChange: (progress: number) => void
  onZoomedOut: () => void
}

function CameraFlight({ activeGalaxy, activeSymbol, positioned, onOverviewZoomChange, onZoomedOut }: CameraFlightProps) {
  const { camera, gl } = useThree()
  const target = useRef(new THREE.Vector3(0, 0, 0))
  const desiredTarget = useRef(new THREE.Vector3(0, 0, 0))
  const desiredPosition = useRef(new THREE.Vector3(0, 0.4, OVERVIEW_DISTANCE))
  const distance = useRef(OVERVIEW_DISTANCE)
  const azimuth = useRef(0)
  const polar = useRef(0.05)
  const drag = useRef({ active: false, x: 0, y: 0, moved: false })
  const pinchDistance = useRef<number | null>(null)
  const pointerCount = useRef(0)
  const lastAutoTarget = useRef('overview')
  const lastZoomDistance = useRef(OVERVIEW_DISTANCE)

  useEffect(() => {
    let nextTarget: [number, number, number] = [0, 0, 0]
    let nextDistance = activeGalaxy ? 7.6 : OVERVIEW_DISTANCE
    const targetKey = activeGalaxy ? `${activeGalaxy.id}:${activeSymbol ?? ''}` : 'overview'

    if (activeGalaxy) {
      nextTarget = activeGalaxy.position
      if (activeSymbol) {
        const coin = positioned.get(activeGalaxy.id)?.find((item) => item.symbol === activeSymbol)
        if (coin) {
          nextTarget = coin.position
          nextDistance = 5.4
        }
      }
    }

    if (lastAutoTarget.current !== targetKey) {
      desiredTarget.current.set(...nextTarget)
      distance.current = clampOrbitDistance(nextDistance)
      lastZoomDistance.current = distance.current
      lastAutoTarget.current = targetKey
    }
  }, [activeGalaxy, activeSymbol, positioned])

  useEffect(() => {
    const element = gl.domElement
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      distance.current = zoomDistance(distance.current, event.deltaY)
      if (activeGalaxy && shouldExitGalaxy(distance.current)) onZoomedOut()
    }
    const onPointerDown = (event: PointerEvent) => {
      pointerCount.current += 1
      if (pointerCount.current === 1) {
        drag.current = { active: true, x: event.clientX, y: event.clientY, moved: false }
      }
      element.setPointerCapture?.(event.pointerId)
    }
    const onPointerMove = (event: PointerEvent) => {
      if (pointerCount.current === 2) return
      if (!drag.current.active) return
      const dx = event.clientX - drag.current.x
      const dy = event.clientY - drag.current.y
      if (Math.abs(dx) + Math.abs(dy) > 2) drag.current.moved = true
      azimuth.current -= dx * 0.006
      polar.current = Math.max(-1.1, Math.min(1.1, polar.current + dy * 0.004))
      drag.current.x = event.clientX
      drag.current.y = event.clientY
    }
    const onPointerUp = (event: PointerEvent) => {
      pointerCount.current = Math.max(0, pointerCount.current - 1)
      if (pointerCount.current === 0) drag.current.active = false
      element.releasePointerCapture?.(event.pointerId)
    }
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 2) return
      event.preventDefault()
      const [first, second] = Array.from(event.touches)
      const current = Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY)
      if (pinchDistance.current !== null) {
        distance.current = zoomDistance(distance.current, pinchDistance.current - current)
        if (activeGalaxy && shouldExitGalaxy(distance.current)) onZoomedOut()
      }
      pinchDistance.current = current
    }
    const onTouchEnd = () => { pinchDistance.current = null }
    element.addEventListener('wheel', onWheel, { passive: false })
    element.addEventListener('pointerdown', onPointerDown)
    element.addEventListener('pointermove', onPointerMove)
    element.addEventListener('pointerup', onPointerUp)
    element.addEventListener('pointercancel', onPointerUp)
    element.addEventListener('touchmove', onTouchMove, { passive: false })
    element.addEventListener('touchend', onTouchEnd)
    return () => {
      element.removeEventListener('wheel', onWheel)
      element.removeEventListener('pointerdown', onPointerDown)
      element.removeEventListener('pointermove', onPointerMove)
      element.removeEventListener('pointerup', onPointerUp)
      element.removeEventListener('pointercancel', onPointerUp)
      element.removeEventListener('touchmove', onTouchMove)
      element.removeEventListener('touchend', onTouchEnd)
    }
  }, [gl])

  useFrame((_, delta) => {
    const ease = 1 - Math.pow(0.001, delta)
    target.current.lerp(desiredTarget.current, ease)
    const [x, y, z] = orbitPosition([target.current.x, target.current.y, target.current.z], distance.current, azimuth.current, polar.current)
    desiredPosition.current.set(x, y + 0.8, z)
    camera.position.lerp(desiredPosition.current, ease)
    camera.lookAt(target.current)
    if (!activeGalaxy && Math.abs(lastZoomDistance.current - distance.current) > 0.01) {
      onOverviewZoomChange(overviewExplorationProgress(distance.current))
      lastZoomDistance.current = distance.current
    }
  })

  return null
}

