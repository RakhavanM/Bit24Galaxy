import * as THREE from 'three'

export function coinSymbolFromIntersection(object: THREE.Object3D | null): string | null {
  let current: THREE.Object3D | null = object
  while (current) {
    const symbol = current.userData?.coinSymbol
    if (typeof symbol === 'string' && symbol.length > 0) return symbol
    current = current.parent
  }
  return null
}
