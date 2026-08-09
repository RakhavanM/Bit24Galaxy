import { shaderMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { SunProfile } from '../suns'

const SunShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uBase: new THREE.Color('#bd8cff'),
    uDeep: new THREE.Color('#160d22'),
    uGlow: new THREE.Color('#fff4c4'),
    uSeed: 7.25,
    uTextureScale: 3.4,
  },
  /* glsl */`
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = normalize(position);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */`
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float uTime;
    uniform vec3 uBase;
    uniform vec3 uDeep;
    uniform vec3 uGlow;
    uniform float uSeed;
    uniform float uTextureScale;

    float hash13(vec3 p) {
      p = fract(p * 0.1031);
      p += dot(p, p.yzx + 33.33);
      return fract((p.x + p.y) * p.z);
    }

    float noise3(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash13(i);
      float b = hash13(i + vec3(1.0, 0.0, 0.0));
      float c = hash13(i + vec3(0.0, 1.0, 0.0));
      float d = hash13(i + vec3(1.0, 1.0, 0.0));
      float e = hash13(i + vec3(0.0, 0.0, 1.0));
      float f1 = hash13(i + vec3(1.0, 0.0, 1.0));
      float g = hash13(i + vec3(0.0, 1.0, 1.0));
      float h = hash13(i + vec3(1.0, 1.0, 1.0));
      return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y), mix(mix(e, f1, f.x), mix(g, h, f.x), f.y), f.z);
    }

    float fbm(vec3 point) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int index = 0; index < 5; index++) {
        value += amplitude * noise3(point);
        point = point * 2.05 + vec3(4.7, 11.3, 7.1);
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDirection = normalize(vec3(0.0, 0.0, 1.0));
      vec3 lightDirection = normalize(vec3(-0.52, 0.68, 1.0));
      float light = clamp((dot(normal, lightDirection) + 0.22) / 1.22, 0.0, 1.0);
      float rim = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.3);
      float slowTime = uTime * 0.012;
      float largeCells = fbm(normal * uTextureScale + vec3(slowTime, 0.0, uSeed));
      float fineCells = fbm(normal * 9.0 + vec3(-slowTime * 1.7, uSeed, 0.0));
      float filament = smoothstep(0.58, 0.76, fineCells + largeCells * 0.38);
      vec3 surface = mix(uDeep, uBase, smoothstep(0.12, 0.88, largeCells));
      surface = mix(surface, mix(uBase, uGlow, 0.42), filament * 0.38);
      float granulation = smoothstep(0.43, 0.67, noise3(normal * 25.0 + vec3(uSeed, slowTime, 0.0)));
      surface += uGlow * granulation * 0.09;
      float flare = smoothstep(0.7, 0.98, fbm(normal * 8.0 + vec3(slowTime * 2.0, uSeed, 0.0)));
      vec3 color = surface * (0.3 + light * 1.05) + uGlow * (rim * 0.28 + flare * 0.08);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
)

type SunShader = THREE.ShaderMaterial & {
  uTime: number
  uBase: THREE.Color
  uDeep: THREE.Color
  uGlow: THREE.Color
  uSeed: number
  uTextureScale: number
}

export function SunMaterial({ profile }: { profile: SunProfile }) {
  const material = useMemo(() => {
    const instance = new SunShaderMaterial() as SunShader
    instance.uBase = new THREE.Color(profile.base)
    instance.uDeep = new THREE.Color(profile.deep)
    instance.uGlow = new THREE.Color(profile.glow)
    instance.uSeed = profile.textureSeed
    instance.uTextureScale = profile.textureScale
    return instance
  }, [profile])

  useFrame((_, delta) => {
    material.uTime += delta
  })

  return <primitive object={material} attach="material" />
}

