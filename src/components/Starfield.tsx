import { useMemo } from 'react'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { FOG_FAR, FOG_NEAR } from '../camera'

const STAR_COUNT = 5200

export function Starfield() {
  const positions = useMemo(() => {
    const values = new Float32Array(STAR_COUNT * 3)
    const random = (seed: number) => {
      const value = Math.sin(seed * 12.9898) * 43758.5453
      return value - Math.floor(value)
    }
    for (let index = 0; index < STAR_COUNT; index += 1) {
      const distance = 12 + random(index + 1) * 19
      const theta = random(index + 101) * Math.PI * 2
      const phi = Math.acos(2 * random(index + 201) - 1)
      values[index * 3] = distance * Math.sin(phi) * Math.cos(theta)
      values[index * 3 + 1] = distance * Math.cos(phi)
      values[index * 3 + 2] = distance * Math.sin(phi) * Math.sin(theta)
    }
    return values
  }, [])

  return (
    <Points positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#d6e8ff"
        size={0.035}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  )
}

export function NebulaDust() {
  const positions = useMemo(() => {
    const values = new Float32Array(260 * 3)
    for (let index = 0; index < 260; index += 1) {
      const angle = index * 2.39996
      const radius = 2.5 + (index % 31) * 0.32
      values[index * 3] = Math.cos(angle) * radius
      values[index * 3 + 1] = Math.sin(angle * 1.7) * 1.5
      values[index * 3 + 2] = Math.sin(angle) * radius * 0.62
    }
    return values
  }, [])

  return (
    <Points positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#6d74d9"
        size={0.065}
        sizeAttenuation
        opacity={0.16}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  )
}

export function SceneFog() {
  return <fog attach="fog" args={[new THREE.Color('#070b18'), FOG_NEAR, FOG_FAR]} />
}

export default Starfield

