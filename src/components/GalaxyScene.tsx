import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { GalaxyNodes, type HoverTarget } from './GalaxyNodes'
import { NebulaDust, SceneFog, Starfield } from './Starfield'
import { compactGalaxyCenters, localGalaxyFootprint, localGalaxyRadius, overviewCoinsForGalaxy, positionCoins } from '../layout'
import { GALAXIES, type Coin, type GalaxyDefinition, type PositionedCoin } from '../types'
import { CAMERA_FAR, clampOrbitDistance, coinFocusDistance, coinFocusTarget, focusDistanceForGalaxy, overviewExplorationProgress, shouldExitGalaxy, orbitPosition, zoomDistance, zoomTargetForPointer, OVERVIEW_DISTANCE } from '../camera'
import { getRenderBudget } from '../renderBudget'

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
  const [hoveredTarget, setHoveredTarget] = useState<HoverTarget | null>(null)
  const uniqueSymbolCount = useMemo(() => new Set(coins.map((coin) => coin.symbol)).size, [coins])
  const renderBudget = useMemo(() => getRenderBudget(uniqueSymbolCount, Boolean(activeGalaxy)), [uniqueSymbolCount, activeGalaxy])
  const handleHoverTarget = (target: HoverTarget | null) => {
    setHoveredTarget(target)
  }
  const sceneGalaxies = useMemo(() => {
    const categoryCoins = new Map(GALAXIES.map((galaxy) => [
      galaxy.id,
      activeGalaxy ? coins.filter((coin) => coin.categories.includes(galaxy.id)) : overviewCoinsForGalaxy(coins, galaxy),
    ] as const))
    const footprints = new Map(GALAXIES.map((galaxy) => [galaxy.id, localGalaxyFootprint(coins, galaxy, categoryCoins.get(galaxy.id) ?? [])] as const))
    const radii = new Map(GALAXIES.map((galaxy) => [galaxy.id, localGalaxyRadius(coins, galaxy, categoryCoins.get(galaxy.id) ?? [])] as const))
    const centers = compactGalaxyCenters(GALAXIES, radii, footprints)
    return GALAXIES.map((galaxy) => ({ ...galaxy, position: centers.get(galaxy.id) ?? galaxy.position }))
  }, [coins, activeGalaxy])

  const positioned = useMemo(() => {
    const map = new Map<string, PositionedCoin[]>()
    sceneGalaxies.forEach((galaxy) => {
      const categoryCoins = activeGalaxy
        ? coins.filter((coin) => coin.categories.includes(galaxy.id))
        : overviewCoinsForGalaxy(coins, galaxy)
      map.set(galaxy.id, positionCoins(coins, galaxy, categoryCoins))
    })
    return map
  }, [coins, activeGalaxy, sceneGalaxies])

  const activeSceneGalaxy = activeGalaxy ? sceneGalaxies.find((galaxy) => galaxy.id === activeGalaxy.id) ?? null : null

  return (
    <Canvas
      dpr={renderBudget.dpr}
      camera={{ position: [0, 0.4, OVERVIEW_DISTANCE], fov: 47, near: 0.1, far: CAMERA_FAR }}
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
      {sceneGalaxies.map((galaxy) => (
        <group key={galaxy.id} visible={!activeGalaxy || activeGalaxy.id === galaxy.id}>
          {(!activeGalaxy || activeGalaxy.id === galaxy.id) && (
            <GalaxyNodes
              galaxy={galaxy}
              coins={positioned.get(galaxy.id) ?? []}
              activeSymbol={activeSymbol}
              activeGalaxy={activeGalaxy?.id ?? null}
              hoveredTarget={hoveredTarget}
              assetCount={uniqueSymbolCount}
              renderBudget={renderBudget}
              onSelectCoin={onSelectCoin}
              onSelectGalaxy={onSelectGalaxy}
              onHoverTarget={handleHoverTarget}
            />
          )}
        </group>
      ))}
      <CameraFlight activeGalaxy={activeSceneGalaxy} activeSymbol={activeSymbol} positioned={positioned} coins={coins} onOverviewZoomChange={onOverviewZoomChange} onZoomedOut={onZoomedOut} hoveredTarget={hoveredTarget} />
      <Environment preset="night" environmentIntensity={0.18} />
    </Canvas>
  )
}

type CameraFlightProps = {
  activeGalaxy: GalaxyDefinition | null
  activeSymbol: string | null
  positioned: Map<string, PositionedCoin[]>
  coins: Coin[]
  onOverviewZoomChange: (progress: number) => void
  onZoomedOut: () => void
  hoveredTarget: HoverTarget | null
}

function CameraFlight({ activeGalaxy, activeSymbol, positioned, coins, onOverviewZoomChange, onZoomedOut, hoveredTarget }: CameraFlightProps) {
  const { camera, gl } = useThree()
  const target = useRef(new THREE.Vector3(0, 0, 0))
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const pointer = useMemo(() => new THREE.Vector2(), [])
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
  const activeGalaxyRef = useRef(activeGalaxy)
  const onZoomedOutRef = useRef(onZoomedOut)

  useEffect(() => {
    activeGalaxyRef.current = activeGalaxy
    onZoomedOutRef.current = onZoomedOut
  }, [activeGalaxy, onZoomedOut])

  useEffect(() => {
    let nextTarget: [number, number, number] = [0, 0, 0]
    const activeFootprint = activeGalaxy ? localGalaxyRadius(coins, activeGalaxy, coins.filter((coin) => coin.categories.includes(activeGalaxy.id))) : 0
    let nextDistance = activeGalaxy ? focusDistanceForGalaxy(activeFootprint) : OVERVIEW_DISTANCE
    const targetKey = activeGalaxy ? `${activeGalaxy.id}:${activeSymbol ?? ''}` : 'overview'

    if (activeGalaxy) {
      nextTarget = activeGalaxy.position
      if (activeSymbol) {
        const coin = positioned.get(activeGalaxy.id)?.find((item) => item.symbol === activeSymbol)
        if (coin) {
          nextTarget = coinFocusTarget(coin.position)
          nextDistance = coinFocusDistance(coin.radius)
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
    element.style.cursor = activeGalaxy ? 'grab' : 'default'
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const zoomBefore = distance.current
      distance.current = zoomDistance(distance.current, event.deltaY)
      const zoomAmount = Math.max(-1, Math.min(1, (distance.current - zoomBefore) / Math.max(zoomBefore, 1)))
      if (hoveredTarget) {
        const hoveredPoint = zoomTargetForPointer(
          [target.current.x, target.current.y, target.current.z],
          hoveredTarget.position,
          zoomBefore,
          distance.current,
        )
        desiredTarget.current.lerp(new THREE.Vector3(...hoveredPoint), Math.min(0.92, 0.3 + Math.abs(zoomAmount) * 1.2))
      }
      if (activeGalaxyRef.current && shouldExitGalaxy(distance.current)) onZoomedOutRef.current()
    }
    const onPointerDown = (event: PointerEvent) => {
      pointerCount.current += 1
      if (activeGalaxyRef.current && !drag.current.moved) {
        const rect = element.getBoundingClientRect()
        pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
        raycaster.setFromCamera(pointer, camera)
        const scene = (element as HTMLCanvasElement & { __r3f?: { root?: { children?: THREE.Object3D[] } } }).__r3f?.root
        const hits = raycaster.intersectObjects(scene?.children ?? [], true)
        const hit = hits.find((entry) => entry.object.userData?.coinSymbol)
        const symbol = hit?.object.userData?.coinSymbol as string | undefined
        const coin = symbol ? positioned.get(activeGalaxyRef.current.id)?.find((item) => item.symbol === symbol) : undefined
        if (coin) {
          desiredTarget.current.set(...coinFocusTarget(coin.position))
          distance.current = coinFocusDistance(coin.radius)
          lastZoomDistance.current = distance.current
        }
      }
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
        const zoomBefore = distance.current
        distance.current = zoomDistance(distance.current, pinchDistance.current - current)
        const zoomAmount = Math.max(-1, Math.min(1, (distance.current - zoomBefore) / Math.max(zoomBefore, 1)))
        if (hoveredTarget) {
          const hoveredPoint = zoomTargetForPointer(
            [target.current.x, target.current.y, target.current.z],
            hoveredTarget.position,
            zoomBefore,
            distance.current,
          )
          desiredTarget.current.lerp(new THREE.Vector3(...hoveredPoint), Math.min(0.8, 0.25 + Math.abs(zoomAmount) * 0.9))
        }
        if (activeGalaxyRef.current && shouldExitGalaxy(distance.current)) onZoomedOutRef.current()
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
  }, [gl, hoveredTarget, activeGalaxy, camera, pointer, positioned, raycaster])

  useFrame((_, delta) => {
    const ease = 1 - Math.pow(0.001, delta)
    target.current.lerp(desiredTarget.current, ease)
    const [x, y, z] = orbitPosition([target.current.x, target.current.y, target.current.z], distance.current, azimuth.current, polar.current)
    desiredPosition.current.set(x, y + 0.8, z)

    camera.position.lerp(desiredPosition.current, ease)
    camera.lookAt(target.current)
    if (!activeGalaxyRef.current && Math.abs(lastZoomDistance.current - distance.current) > 0.01) {
      onOverviewZoomChange(overviewExplorationProgress(distance.current))
      lastZoomDistance.current = distance.current
    }
  })

  return null
}

