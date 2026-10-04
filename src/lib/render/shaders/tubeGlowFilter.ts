import { Filter, defaultFilterVert } from 'pixi.js';

export interface TubeGlowOptions {
  intensity?: number;
  glowColor?: [number, number, number]; // [r, g, b] 0..1
  flicker?: number;
  time?: number;
}

export interface TubeGlowFilterHandle {
  filter: Filter;
  update: (intensity: number, tSeconds: number, hasActiveProject: boolean, activity: number, reduceMotion: boolean) => void;
}

/**
 * Calculates thermionic cathode emission intensity based on session activity and recording drive.
 */
export function calculateTubeGlowIntensity(activity = 0, hasActiveProject = false): number {
  const clamped = Math.max(0, Math.min(1, activity));
  const base = hasActiveProject ? 0.35 : 0.18;
  return base + clamped * 0.35; // scales from 0.18 (idle) to 0.70 (max active session)
}

const TUBE_GLOW_FRAGMENT_SHADER = `
  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uTexture;
  uniform vec3 uGlowColor;
  uniform float uIntensity;
  uniform float uFlicker;
  uniform float uTime;

  void main(void) {
    vec4 baseColor = texture(uTexture, vTextureCoord);
    
    // 50Hz/60Hz mains micro-hum flicker
    float hum = sin(uTime * 314.159) * 0.04 * uFlicker;
    float currentIntensity = clamp(uIntensity + hum, 0.0, 1.0);

    // Warm thermionic chromatic dispersion (orange/amber cathode halo)
    float luma = dot(baseColor.rgb, vec3(0.299, 0.587, 0.114));
    vec3 emissive = uGlowColor * luma * currentIntensity;

    vec3 blended = baseColor.rgb + emissive * 0.65;
    finalColor = vec4(blended, baseColor.a);
  }
`;

/**
 * Creates a thermionic vacuum tube cathode glow filter for analog valve amplifiers and meter lamps.
 * Safely returns null in non-browser Node environments.
 */
export function createTubeGlowFilter(options: TubeGlowOptions = {}): TubeGlowFilterHandle | null {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return null;
  }

  const tubeUniforms = {
    uGlowColor: { value: options.glowColor ?? [1.0, 0.65, 0.22], type: 'vec3<f32>' }, // Warm 2400K amber
    uIntensity: { value: options.intensity ?? 0.25, type: 'f32' },
    uFlicker: { value: options.flicker ?? 1.0, type: 'f32' },
    uTime: { value: options.time ?? 0.0, type: 'f32' },
  };

  try {
    const filter = Filter.from({
      gl: {
        vertex: defaultFilterVert,
        fragment: TUBE_GLOW_FRAGMENT_SHADER,
      },
      resources: {
        tubeUniforms,
      },
    });

    return {
      filter,
      update: (intensity: number, tSeconds: number, hasActiveProject: boolean, _activity: number, reduceMotion: boolean) => {
        tubeUniforms.uIntensity.value = intensity;
        tubeUniforms.uTime.value = reduceMotion ? 0.0 : tSeconds;
        tubeUniforms.uFlicker.value = reduceMotion ? 0.0 : (hasActiveProject ? 1.2 : 0.6);
      },
    };
  } catch {
    return null;
  }
}
