import { describe, expect, it } from 'vitest'
import { focusPoseFor, clampOrbitDistance } from './camera'

describe('free galaxy camera navigation', () => {
  it('creates a camera pose in front of a selected target', () => {
    const pose = focusPoseFor([4, -2, 1], 7.6)

    expect(pose.target).toEqual([4, -2, 1])
    expect(pose.position).toEqual([4, -1.2, 8.6])
  })

  it('keeps wheel and pinch zoom inside usable scene limits', () => {
    expect(clampOrbitDistance(0.2)).toBe(2.2)
    expect(clampOrbitDistance(12)).toBe(12)
    expect(clampOrbitDistance(80)).toBe(38)
  })
})

