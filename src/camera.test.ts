import { describe, expect, it } from 'vitest'
import { focusPoseFor, clampOrbitDistance, overviewExplorationProgress, shouldExitGalaxy, zoomTargetForPointer } from './camera'

describe('free galaxy camera navigation', () => {
  it('creates a camera pose in front of a selected target', () => {
    const pose = focusPoseFor([4, -2, 1], 7.6)

    expect(pose.target).toEqual([4, -2, 1])
    expect(pose.position).toEqual([4, -1.2, 8.6])
  })

  it('keeps wheel and pinch zoom inside usable scene limits', () => {
    expect(clampOrbitDistance(0.2)).toBe(2.2)
    expect(clampOrbitDistance(12)).toBe(12)
    expect(clampOrbitDistance(140)).toBe(110)
  })

  it('fades the opening copy as the user enters the atlas', () => {
    expect(overviewExplorationProgress(78)).toBe(0)
    expect(overviewExplorationProgress(60)).toBeCloseTo(0.5)
    expect(overviewExplorationProgress(36)).toBe(1)
  })

  it('leaves a focused galaxy when the user zooms back out', () => {
    expect(shouldExitGalaxy(24)).toBe(false)
    expect(shouldExitGalaxy(25)).toBe(true)
  })

  it('moves the zoom target toward the pointer instead of the viewport center', () => {
    const target = zoomTargetForPointer([0, 0, 0], [1, 1, 0], 10, 9)

    expect(target[0]).toBeCloseTo(0.1)
    expect(target[1]).toBeCloseTo(0.1)
    expect(target[2]).toBeCloseTo(0)
  })
})

