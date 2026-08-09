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
    varying vec3 vLocalPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vLocalPosition = normalize(position);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */`
    varying vec3 vNormal;
    varying vec3 vLocalPosition;
    uniform float uTime;
    uniform float uSeed;
    uniform vec3 uBase;
    uniform vec3 uAccent;
    uniform vec3 uDeep;
    uniform float uStyle;
    uniform float uCloudiness;
    uniform float uAtmosphere;

    float hash13(vec3 p) {
      p = fract(p * 0.1031);
      p += dot(p, p.yzx + 33.33);
      return fract((p.x + p.y) * p.z);
    }

    float noise3(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
      float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
      float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
      float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
      float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
      float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
      float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
      float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
      float nx00 = mix(n000, n100, f.x);
      float nx10 = mix(n010, n110, f.x);
      float nx01 = mix(n001, n101, f.x);
      float nx11 = mix(n011, n111, f.x);
      return mix(mix(nx00, nx10, f.y), mix(nx01, nx11, f.y), f.z);
    }

    float fbm3(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 5; i++) {
        value += amplitude * noise3(p);
        p = p * 2.02 + vec3(17.3, 3.7, 11.1);
        amplitude *= 0.5;
      }
      return value;
    }

    vec3 surfacePalette(float macro, float detail) {
      float style = floor(uStyle + 0.5);
      vec3 baseTone = mix(uDeep, uBase, 0.68);
      vec3 lightTone = mix(uBase, uAccent, 0.34);

      if (style < 0.5) { // ocean: soft continents, not hard pixels
        float land = smoothstep(0.53, 0.66, macro);
        vec3 ocean = mix(uDeep * 0.7, uBase * 0.88, smoothstep(0.18, 0.82, macro));
        vec3 landTone = mix(uBase * 0.72, lightTone, detail * 0.5 + 0.22);
        return mix(ocean, landTone, land);
      }
      if (style < 1.5) { // marble: quiet flowing veins
        float vein = 1.0 - smoothstep(0.02, 0.12, abs(macro - 0.51 + (detail - 0.5) * 0.16));
        return mix(baseTone, mix(lightTone, vec3(0.96, 0.95, 0.9), 0.28), vein * 0.58);
      }
      if (style < 2.5) { // gas giant: broad atmospheric bands
        float bands = 0.5 + 0.5 * sin(vLocalPosition.y * 17.0 + detail * 3.0 + uSeed);
        float softBands = smoothstep(0.17, 0.83, bands);
        float storm = smoothstep(0.61, 0.83, fbm3(vLocalPosition * 4.0 + vec3(uSeed)));
        return mix(mix(uDeep, uBase, softBands), lightTone, storm * 0.32);
      }
      if (style < 3.5) { // lava: subdued volcanic fissures
        float crust = smoothstep(0.22, 0.78, macro);
        float fissure = smoothstep(0.73, 0.86, detail);
        vec3 rock = mix(uDeep * 0.5, uBase * 0.68, crust);
        return mix(rock, mix(uAccent, vec3(1.0, 0.36, 0.1), 0.3), fissure * 0.58);
      }
      if (style < 4.5) { // ice: pale frost fields
        float frost = smoothstep(0.38, 0.76, macro + detail * 0.16);
        return mix(uDeep, mix(uBase, uAccent, 0.46), frost);
      }
      if (style < 5.5) { // desert: elegant dune gradients
        float dunes = 0.5 + 0.5 * sin(vLocalPosition.y * 13.0 + macro * 4.0 + uSeed);
        return mix(uDeep, mix(uBase, uAccent, 0.25), smoothstep(0.16, 0.9, dunes));
      }
      if (style < 6.5) { // storm: soft blue-violet turbulence
        float swirl = fbm3(vLocalPosition * 5.5 + vec3(uSeed, uTime * 0.012, 0.0));
        return mix(uDeep, mix(uBase, uAccent, swirl * 0.48), smoothstep(0.22, 0.9, swirl));
      }
      if (style < 7.5) { // crystal: facets by tone, no wireframe grid
        float facet = smoothstep(0.34, 0.72, fbm3(vLocalPosition * 7.5 + vec3(uSeed)));
        vec3 facetTone = mix(uBase, uAccent, 0.32 + detail * 0.25);
        return mix(baseTone, facetTone, facet * 0.72);
      }
      if (style < 8.5) { // shadow: polished obsidian
        float glint = smoothstep(0.66, 0.9, fbm3(vLocalPosition * 8.0 + vec3(uSeed)));
        return mix(uDeep * 0.34, mix(uBase, uAccent, 0.42), glint * 0.74);
      }
      if (style < 9.5) { // neon: subtle bioluminescent clouds for AI assets
      float pulse = smoothstep(0.5, 0.84, fbm3(vLocalPosition * 6.0 + vec3(uSeed, uTime * 0.016, 0.0)));
      return mix(uBase * 0.18, mix(uBase, uAccent, 0.75), pulse);
      }
      if (style < 10.5) { // aurora: cool ribbons with a soft polar glow
        float ribbons = 0.5 + 0.5 * sin(vLocalPosition.y * 10.0 + fbm3(vLocalPosition * 4.0 + vec3(uSeed)) * 5.0);
        float polar = smoothstep(0.25, 0.9, abs(vLocalPosition.y));
        return mix(mix(uDeep, uBase, ribbons * 0.58), uAccent, polar * 0.28);
      }
      if (style < 11.5) { // volcanic: dark basalt with restrained molten seams
        float rock = fbm3(vLocalPosition * 6.5 + vec3(uSeed));
        float seam = smoothstep(0.67, 0.82, fbm3(vLocalPosition * 13.0 + vec3(uSeed * 1.9)));
        return mix(mix(uDeep * 0.72, uBase * 0.74, rock), mix(uAccent, vec3(1.0, 0.32, 0.08), 0.24), seam * 0.46);
      }
      if (style < 12.5) { // savanna: warm matte continents and thin cloud cover
        float land = smoothstep(0.44, 0.64, fbm3(vLocalPosition * 3.4 + vec3(uSeed)));
        float cloudBand = smoothstep(0.62, 0.82, fbm3(vLocalPosition * 8.0 + vec3(uSeed * 1.4)));
        vec3 ground = mix(uDeep * 0.55, mix(uBase, uAccent, 0.42), land);
        return mix(ground, vec3(0.92, 0.88, 0.72), cloudBand * 0.16);
      }
      // twilight: deep violet atmosphere with quiet luminous streaks
      float streak = smoothstep(0.55, 0.86, fbm3(vLocalPosition * 5.5 + vec3(uSeed, uTime * 0.008, 0.0)));
      return mix(uDeep * 0.48, mix(uBase, uAccent, 0.55), streak);
    }

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDirection = normalize(vec3(0.0, 0.0, 1.0));
      vec3 lightDirection = normalize(vec3(-0.6, 0.72, 1.0));
      float wrappedLight = clamp((dot(normal, lightDirection) + 0.32) / 1.32, 0.0, 1.0);
      float specular = pow(max(dot(reflect(-lightDirection, normal), viewDirection), 0.0), 38.0) * 0.22;
      float rim = pow(1.0 - max(dot(normal, viewDirection), 0.0), 3.2);
      float macro = fbm3(vLocalPosition * 3.2 + vec3(uSeed));
      float detail = fbm3(vLocalPosition * 9.0 + vec3(uSeed * 1.7, uTime * 0.008, 0.0));
      vec3 surface = surfacePalette(macro, detail);
      float cloud = smoothstep(0.6, 0.82, fbm3(vLocalPosition * 5.0 + vec3(uSeed * 2.0, uTime * 0.01, 0.0))) * uCloudiness;
      surface = mix(surface, mix(surface, vec3(0.96, 0.98, 1.0), 0.25), cloud * 0.14);
      vec3 shaded = surface * (0.2 + wrappedLight * 0.92);
      vec3 finalColor = shaded + vec3(1.0) * specular + uAccent * rim * uAtmosphere * 0.52;
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
    instance.uStyle = ['ocean', 'marble', 'gas', 'lava', 'ice', 'desert', 'storm', 'crystal', 'shadow', 'neon', 'aurora', 'volcanic', 'savanna', 'twilight'].indexOf(profile.style)
    instance.uCloudiness = profile.cloudiness
    instance.uAtmosphere = profile.atmosphere
    return instance
  }, [profile])

  useFrame((_, delta) => {
    material.uTime += delta
    material.uCloudiness = profile.cloudiness
    material.uAtmosphere = profile.atmosphere * (active ? 1.18 : 1)
  })

  return <primitive object={material} attach="material" />
}
