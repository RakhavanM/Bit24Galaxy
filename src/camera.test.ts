import { describe, expect, it } from 'vitest'
import { CAMERA_FAR, FOG_FAR, FOG_NEAR, MAX_ORBIT_DISTANCE, focusDistanceForGalaxy, focusPoseFor, clampOrbitDistance, overviewExplorationProgress, pointerWorldOnTargetPlane, shouldExitGalaxy, zoomTargetForPointer } from './camera'

describe('free galaxy camera navigation', () => {
  it('creates a camera pose in front of a selected target', () => {
    const pose = focusPoseFor([4, -2, 1], 7.6)

    expect(pose.target).toEqual([4, -2, 1])
    expect(pose.position).toEqual([4, -1.2, 8.6])
  })

  it('keeps wheel and pinch zoom inside usable scene limits', () => {
    expect(clampOrbitDistance(0.2)).toBe(2.2)
    expect(clampOrbitDistance(12)).toBe(12)
    expect(clampOrbitDistance(220)).toBe(180)
  })

  it('keeps the render frustum and fog beyond the complete zoomed-out world', () => {
    expect(CAMERA_FAR).toBeGreaterThan(MAX_ORBIT_DISTANCE + 200)
    expect(FOG_NEAR).toBeGreaterThan(MAX_ORBIT_DISTANCE)
    expect(FOG_FAR).toBeGreaterThan(CAMERA_FAR)
  })

  it('fades the opening copy as the user enters the atlas', () => {
    expect(overviewExplorationProgress(108)).toBe(0)
    expect(overviewExplorationProgress(86)).toBeCloseTo(0.5)
    expect(overviewExplorationProgress(50)).toBe(1)
  })

  it('uses a wider focus distance for a large twelve-planet footprint', () => {
    expect(focusDistanceForGalaxy(4)).toBeGreaterThanOrEqual(18)
    expect(focusDistanceForGalaxy(10.5)).toBeGreaterThan(20)
    expect(focusDistanceForGalaxy(10.5)).toBeLessThan(32)
  })

  it('leaves a focused galaxy when the user zooms back out', () => {
    expect(shouldExitGalaxy(33)).toBe(false)
    expect(shouldExitGalaxy(34)).toBe(true)
  })

  it('moves the zoom target toward the pointer instead of the viewport center', () => {
    const target = zoomTargetForPointer([0, 0, 0], [1, 1, 0], 10, 9)

    expect(target[0]).toBeCloseTo(0.1)
    expect(target[1]).toBeCloseTo(0.1)
    expect(target[2]).toBeCloseTo(0)
  })

  it('projects a pointer ray onto the current target plane', () => {
    const point = pointerWorldOnTargetPlane([0, 0, 10], [0, 0, -1], [0, 0, 0])

    expect(point).toEqual([0, 0, 0])
  })
})

export {}
