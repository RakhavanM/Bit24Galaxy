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
      float facing = max(dot(normal, viewDirection), 0.0);
      float light = clamp((dot(normal, lightDirection) + 0.32) / 1.32, 0.0, 1.0);
      float limb = pow(1.0 - facing, 2.15);
      float slowTime = uTime * 0.018;

      // One shared solar texture language: broad convection cells, fine
      // granulation, and a few soft filament ribbons. Only the palette changes
      // between constellation suns.
      float cells = fbm(vPosition * uTextureScale + vec3(slowTime, uSeed, 0.0));
      float granules = fbm(vPosition * 22.0 + vec3(-slowTime * 1.4, uSeed * 1.7, 0.0));
      float filaments = abs(sin(vPosition.y * 24.0 + fbm(vPosition * 8.0 + vec3(uSeed)) * 8.0 + slowTime));
      filaments = smoothstep(0.82, 0.985, filaments) * smoothstep(0.35, 0.8, granules);
      float brightGranules = smoothstep(0.49, 0.77, granules);
      float darkGranules = smoothstep(0.76, 0.94, 1.0 - granules);

      vec3 surface = mix(uDeep, uBase, smoothstep(0.16, 0.86, cells));
      surface += uGlow * brightGranules * 0.17;
      surface *= 1.0 - darkGranules * 0.12;
      surface = mix(surface, mix(uBase, uGlow, 0.7), filaments * 0.22);

      float hotCore = pow(facing, 0.62);
      vec3 finalColor = surface * (0.58 + light * 0.92 + hotCore * 0.24);
      finalColor += uGlow * (limb * 0.52 + hotCore * 0.14);
      gl_FragColor = vec4(finalColor, 1.0);
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
    instance.toneMapped = false
    return instance
  }, [profile])

  useFrame((_, delta) => {
    material.uTime += delta
  })

  return <primitive object={material} attach="material" />
}

export function SunCorona({ profile, active, segments = 40 }: { profile: SunProfile; active: boolean; segments?: number }) {
  return (
    <group>
      <SphereShell radius={profile.radius * 1.08} color={profile.glow} opacity={active ? 0.16 : 0.105} segments={segments} />
      <SphereShell radius={profile.radius * 1.17} color={profile.base} opacity={active ? 0.095 : 0.055} segments={segments} />
      <SphereShell radius={profile.radius * 1.29} color={profile.glow} opacity={active ? 0.06 : 0.032} segments={segments} />
    </group>
  )
}

function SphereShell({ radius, color, opacity, segments }: { radius: number; color: string; opacity: number; segments: number }) {
  return (
    <mesh scale={radius}>
      <sphereGeometry args={[1, segments, Math.max(16, Math.floor(segments * 0.7))]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  )
}

