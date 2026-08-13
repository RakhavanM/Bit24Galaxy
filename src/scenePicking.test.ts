import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { coinSymbolFromIntersection } from './scenePicking'

describe('scene picking', () => {
  it('finds the coin symbol on a nested mesh intersection', () => {
    const group = new THREE.Group()
    group.userData.coinSymbol = 'CRCLON'
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshBasicMaterial())
    group.add(mesh)

    expect(coinSymbolFromIntersection(mesh)).toBe('CRCLON')
  })

  it('returns null when the intersection is not a coin', () => {
    expect(coinSymbolFromIntersection(new THREE.Mesh())).toBeNull()
    expect(coinSymbolFromIntersection(null)).toBeNull()
  })
})

export {}
