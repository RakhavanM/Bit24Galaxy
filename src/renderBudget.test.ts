import { describe, expect, it } from 'vitest'
import { getRenderBudget, shouldRenderOverviewDecoration } from './renderBudget'

describe('render budget', () => {
  it('keeps the expanded overview visually active while using a lighter geometry tier', () => {
    const budget = getRenderBudget(160, false)

    expect(budget.mode).toBe('overview')
    expect(budget.planetSegments).toBeLessThan(64)
    expect(budget.planetNoiseOctaves).toBeLessThan(5)
    expect(budget.animatePlanets).toBe(true)
    expect(shouldRenderOverviewDecoration(160, 50, false, false)).toBe(false)
  })

  it('scales the overview budget for a future 200-asset snapshot', () => {
    const budget = getRenderBudget(200, false)

    expect(budget.animatePlanets).toBe(false)
    expect(budget.dpr[1]).toBeLessThan(1.6)
    expect(shouldRenderOverviewDecoration(200, 0, false, false)).toBe(true)
    expect(shouldRenderOverviewDecoration(200, 65, false, false)).toBe(true)
    expect(shouldRenderOverviewDecoration(200, 200, false, true)).toBe(true)
  })

  it('restores the high-detail and fully animated tier in a focused galaxy', () => {
    const budget = getRenderBudget(200, true)

    expect(budget.mode).toBe('focus')
    expect(budget.planetSegments).toBeGreaterThanOrEqual(48)
    expect(budget.planetNoiseOctaves).toBe(5)
    expect(budget.animatePlanets).toBe(true)
    expect(shouldRenderOverviewDecoration(200, 200, true, false)).toBe(true)
  })
})

