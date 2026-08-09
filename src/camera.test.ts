import { describe, expect, it } from 'vitest'
import { focusPoseFor, clampOrbitDistance, overviewExplorationProgress, shouldExitGalaxy } from './camera'

describe('free galaxy camera navigation', () => {
  it('creates a camera pose in front of a selected target', () => {
    const pose = focusPoseFor([4, -2, 1], 7.6)

    expect(pose.target).toEqual([4, -2, 1])
    expect(pose.position).toEqual([4, -1.2, 8.6])
  })

  it('keeps wheel and pinch zoom inside usable scene limits', () => {
    expect(clampOrbitDistance(0.2)).toBe(2.2)
    expect(clampOrbitDistance(12)).toBe(12)
    expect(clampOrbitDistance(80)).toBe(58)
  })

  it('fades the opening copy as the user enters the atlas', () => {
    expect(overviewExplorationProgress(38)).toBe(0)
    expect(overviewExplorationProgress(29.5)).toBeCloseTo(0.5)
    expect(overviewExplorationProgress(18)).toBe(1)
  })

  it('leaves a focused galaxy when the user zooms back out', () => {
    expect(shouldExitGalaxy(14)).toBe(false)
    expect(shouldExitGalaxy(15.5)).toBe(true)
  })
})

