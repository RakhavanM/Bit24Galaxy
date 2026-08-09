import type { GalaxyFocus } from './types'

export const MIN_ORBIT_DISTANCE = 2.2
export const MAX_ORBIT_DISTANCE = 58
export const OVERVIEW_DISTANCE = 38
export const HERO_FADE_DISTANCE = 21
export const GALAXY_EXIT_DISTANCE = 15.5

export function clampOrbitDistance(distance: number): number {
  return Math.max(MIN_ORBIT_DISTANCE, Math.min(MAX_ORBIT_DISTANCE, distance))
}

export function overviewExplorationProgress(distance: number): number {
  const progress = (OVERVIEW_DISTANCE - distance) / (OVERVIEW_DISTANCE - HERO_FADE_DISTANCE)
  return Math.max(0, Math.min(1, progress))
}

export function shouldExitGalaxy(distance: number): boolean {
  return distance >= GALAXY_EXIT_DISTANCE
}

export function focusPoseFor(target: [number, number, number], distance = 7.6): { target: [number, number, number]; position: [number, number, number] } {
  const safeDistance = clampOrbitDistance(distance)
  return {
    target,
    position: [target[0], target[1] + 0.8, target[2] + safeDistance],
  }
}

export function focusForGalaxy(position: [number, number, number], distance = 7.6): GalaxyFocus {
  return {
    target: position,
    distance: clampOrbitDistance(distance),
  }
}

export function orbitPosition(target: [number, number, number], distance: number, azimuth: number, polar: number): [number, number, number] {
  const safeDistance = clampOrbitDistance(distance)
  const safePolar = Math.max(-1.35, Math.min(1.35, polar))
  const horizontal = Math.cos(safePolar) * safeDistance
  return [
    target[0] + Math.sin(azimuth) * horizontal,
    target[1] + Math.sin(safePolar) * safeDistance,
    target[2] + Math.cos(azimuth) * horizontal,
  ]
}

export function zoomDistance(distance: number, delta: number): number {
  return clampOrbitDistance(distance * Math.exp(delta * 0.0012))
}

