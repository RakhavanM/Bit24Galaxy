export type RenderMode = 'overview' | 'focus'

export type RenderBudget = {
  mode: RenderMode
  planetSegments: number
  atmosphereSegments: number
  sunSegments: number
  coronaSegments: number
  planetNoiseOctaves: number
  animatePlanets: boolean
  animateSuns: boolean
  showLabels: boolean
  dpr: [number, number]
}

export function getRenderBudget(assetCount: number, focused: boolean): RenderBudget {
  if (focused) {
    return {
      mode: 'focus',
      planetSegments: 64,
      atmosphereSegments: 32,
      sunSegments: 64,
      coronaSegments: 40,
      planetNoiseOctaves: 5,
      animatePlanets: true,
      animateSuns: true,
      showLabels: true,
      dpr: [1, 1.6],
    }
  }

  const manyAssets = assetCount > 100
  return {
    mode: 'overview',
    planetSegments: manyAssets ? 32 : 48,
    atmosphereSegments: manyAssets ? 16 : 20,
    sunSegments: manyAssets ? 40 : 48,
    coronaSegments: manyAssets ? 24 : 32,
    planetNoiseOctaves: manyAssets ? 3 : 4,
    animatePlanets: !manyAssets,
    animateSuns: true,
    showLabels: !manyAssets,
    dpr: manyAssets ? [1, 1.25] : [1, 1.6],
  }
}

export function shouldRenderOverviewDecoration(
  assetCount: number,
  assetIndex: number,
  focused: boolean,
  highlighted: boolean,
): boolean {
  if (focused || highlighted || assetCount <= 100) return true
  return assetIndex % 4 === 0
}

export function shouldRenderOverviewLabel(
  assetCount: number,
  assetIndex: number,
  focused: boolean,
  highlighted: boolean,
): boolean {
  return shouldRenderOverviewDecoration(assetCount, assetIndex, focused, highlighted)
}
