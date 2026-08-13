import { describe, expect, it } from 'vitest'
import { coinFocusDistance, coinFocusTarget } from './camera'

describe('planet click focus', () => {
  it('targets the clicked planet and leaves room for its surface and label', () => {
    const target = coinFocusTarget([12, -4, 7])
    expect(target).toEqual([12, -4, 7])
    expect(coinFocusDistance(0.15)).toBeGreaterThan(1.5)
    expect(coinFocusDistance(0.9)).toBeGreaterThan(coinFocusDistance(0.15))
    expect(coinFocusDistance(0.9)).toBeLessThan(4)
  })
})

export {}
