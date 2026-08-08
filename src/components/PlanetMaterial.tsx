import { shaderMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { PlanetProfile } from '../planets'
import { hexToColor } from '../planets'

const PlanetShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uSeed: 1,
    uBase: new THREE.Color('#6078e8'),
    uAccent: new THREE.Color('#79e9d5'),
    uDeep: new THREE.Color('#081735'),
    uStyle: 0,
    uCloudiness: 0.4,
    uAtmosphere: 0.3,
  },
  /* glsl */`
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    uniform float uTime;
    uniform float uSeed;
    uniform float uStyle;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 world = modelMatrix * vec4(position, 1.0);
      vWorldPosition = world.xyz;
      float drift = sin(uTime * 0.05 + uSeed) * 0.018;
      vec3 transformed = position + normal * drift;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
    }
  `,
  /* glsl */`
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    uniform float uTime;
    uniform float uSeed;
    uniform vec3 uBase;
    uniform vec3 uAccent;
    uniform vec3 uDeep;
    uniform float uStyle;
    uniform float uCloudiness;
    uniform float uAtmosphere;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p);
        p = p * 2.04 + 13.17;
        amplitude *= 0.5;
      }
      return value;
    }

    vec3 palette(float value) {
      float style = floor(uStyle + 0.5);
      if (style < 0.5) { // ocean
        float land = smoothstep(0.47, 0.63, value);
        return mix(uBase * 0.36, mix(uBase, uAccent, 0.72), land);
      }
      if (style < 1.5) { // marble
        float veins = smoothstep(0.4, 0.7, abs(sin(value * 17.0 + fbm(vUv * 11.0) * 4.0)));
        return mix(uDeep * 0.85, mix(uBase, uAccent, 0.6), veins);
      }
      if (style < 2.5) { // gas giant
        float bands = 0.5 + 0.5 * sin(vUv.y * 42.0 + fbm(vUv * 5.0) * 8.0);
        float storm = smoothstep(0.62, 0.84, fbm(vUv * 8.0 + vec2(uSeed)));
        return mix(mix(uDeep, uBase, bands), uAccent, storm * 0.62);
      }
      if (style < 3.5) { // lava
        float cracks = smoothstep(0.59, 0.76, fbm(vUv * 12.0 + uSeed));
        return mix(uDeep * 0.3, mix(uBase, uAccent, 0.8), cracks);
      }
      if (style < 4.5) { // ice
        float frost = smoothstep(0.28, 0.78, fbm(vUv * 7.0));
        return mix(uDeep, mix(uBase, uAccent, 0.78), frost);
      }
      if (style < 5.5) { // desert
        float dunes = 0.5 + 0.5 * sin(vUv.y * 24.0 + fbm(vUv * 4.0) * 5.0);
        return mix(uDeep, mix(uBase, uAccent, dunes), 0.78);
      }
      if (style < 6.5) { // storm
        float swirls = fbm(vUv * 10.0 + vec2(cos(uTime * 0.04), sin(uTime * 0.04)));
        return mix(uDeep, mix(uBase, uAccent, swirls), 0.86);
      }
      if (style < 7.5) { // crystal / luminous lattice
        float grid = max(abs(sin(vUv.x * 34.0)), abs(sin(vUv.y * 28.0)));
        return mix(uDeep, uAccent, smoothstep(0.82, 0.98, grid));
      }
      if (style < 8.5) { // shadow / obsidian
        float glint = smoothstep(0.68, 0.9, fbm(vUv * 18.0));
        return mix(uDeep * 0.5, mix(uBase, uAccent, 0.8), glint);
      }
      // neon / AI circuitry
      float circuit = smoothstep(0.72, 0.92, abs(sin(vUv.x * 62.0) * sin(vUv.y * 38.0)));
      return mix(uBase * 0.22, uAccent, circuit);
    }

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 lightDirection = normalize(vec3(-0.55, 0.7, 1.0));
      float diffuse = max(dot(normal, lightDirection), 0.0);
      float rim = pow(1.0 - max(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0), 2.8);
      float texture = fbm(vUv * (5.0 + uStyle * 0.6) + vec2(uSeed, uTime * 0.008));
      vec3 surface = palette(texture);
      float cloud = smoothstep(0.58, 0.83, fbm(vUv * 9.0 + vec2(uSeed * 2.0, uTime * 0.012))) * uCloudiness;
      surface = mix(surface, surface + vec3(0.34), cloud * 0.22);
      vec3 shaded = surface * (0.22 + diffuse * 0.92);
      vec3 finalColor = shaded + uAccent * rim * uAtmosphere * 0.7;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
)

type PlanetMaterialProps = {
  profile: PlanetProfile
  active: boolean
}

type PlanetShader = THREE.ShaderMaterial & {
  uTime: number
  uSeed: number
  uStyle: number
  uBase: THREE.Color
  uAccent: THREE.Color
  uDeep: THREE.Color
  uCloudiness: number
  uAtmosphere: number
}

export function PlanetMaterial({ profile, active }: PlanetMaterialProps) {
  const material = useMemo(() => {
    const instance = new PlanetShaderMaterial() as PlanetShader
    instance.uSeed = profile.seed
    instance.uBase = new THREE.Color(...hexToColor(profile.base))
    instance.uAccent = new THREE.Color(...hexToColor(profile.accent))
    instance.uDeep = new THREE.Color(...hexToColor(profile.deep))
    instance.uStyle = ['ocean', 'marble', 'gas', 'lava', 'ice', 'desert', 'storm', 'crystal', 'shadow', 'neon'].indexOf(profile.style)
    instance.uCloudiness = profile.cloudiness
    instance.uAtmosphere = profile.atmosphere
    return instance
  }, [profile])

  useFrame((_, delta) => {
    material.uTime += delta
    material.uCloudiness = profile.cloudiness
    material.uAtmosphere = profile.atmosphere * (active ? 1.25 : 1)
  })

  return (
    <primitive
      object={material}
      attach="material"
    />
  )
}

