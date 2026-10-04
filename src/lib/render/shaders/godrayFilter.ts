import { Filter, defaultFilterVert } from 'pixi.js';

export interface GodrayFilterOptions {
  lightPosition?: [number, number]; // [x, y] in screen pixels
  strength?: number;                 // 0..1
  color?: [number, number, number];  // [r, g, b] 0..1
  decay?: number;                    // 0..1
  density?: number;
  time?: number;
}

export interface StudioGodrayFilterHandle {
  filter: Filter;
  update: (lightPos: [number, number], strength: number, color: [number, number, number], tSeconds: number) => void;
}

/**
 * Calculates authentic atmospheric sunlight/moonlight color according to studio time of day.
 */
export function calculateGodrayColor(minutesOfDay: number): { r: number; g: number; b: number; hex: number } {
  const m = ((minutesOfDay % 1440) + 1440) % 1440;

  // Dawn / early morning (05:00 - 08:30): warm peach-gold
  if (m >= 300 && m < 510) {
    return { r: 1.0, g: 0.76, b: 0.48, hex: 0xffc27a };
  }
  // Midday / bright sun (08:30 - 16:30): brilliant warm white
  if (m >= 510 && m < 990) {
    return { r: 1.0, g: 0.94, b: 0.75, hex: 0xfff0c0 };
  }
  // Golden hour / sunset (16:30 - 20:30): amber ruby
  if (m >= 990 && m < 1230) {
    return { r: 1.0, g: 0.48, b: 0.27, hex: 0xff7a45 };
  }
  // Night / moonlight (20:30 - 05:00): soft moonlit slate
  return { r: 0.29, g: 0.43, b: 0.55, hex: 0x4a6d8c };
}

const GODRAY_FRAGMENT_SHADER = `
  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uTexture;
  uniform vec4 uInputSize;
  uniform vec2 uLightPos;
  uniform float uStrength;
  uniform vec3 uColor;
  uniform float uDecay;
  uniform float uDensity;
  uniform float uTime;

  const int SAMPLES = 16;

  void main(void) {
    vec2 screenPos = vTextureCoord * uInputSize.xy;
    vec2 deltaTextCoord = (screenPos - uLightPos);
    deltaTextCoord *= (1.0 / float(SAMPLES)) * uDensity;

    vec2 coord = screenPos;
    vec4 baseColor = texture(uTexture, vTextureCoord);
    vec3 rayColor = vec3(0.0);
    float illuminationDecay = 1.0;

    for (int i = 0; i < SAMPLES; i++) {
      coord -= deltaTextCoord;
      vec2 uv = coord / uInputSize.xy;
      if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
        vec4 smp = texture(uTexture, uv);
        rayColor += smp.rgb * smp.a * illuminationDecay * (0.05 * uStrength);
      }
      illuminationDecay *= uDecay;
    }

    vec3 finalRgb = baseColor.rgb + rayColor * uColor;
    float finalAlpha = max(baseColor.a, length(rayColor) * uStrength);

    finalColor = vec4(finalRgb, clamp(finalAlpha, 0.0, 1.0));
  }
`;

/**
 * Creates an optical volumetric Godray filter for the studio window sunlight beam.
 * Safely returns null in non-browser Node environments.
 */
export function createStudioGodrayFilter(options: GodrayFilterOptions = {}): StudioGodrayFilterHandle | null {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return null;
  }

  const godrayUniforms = {
    uLightPos: { value: options.lightPosition ?? [0, 0], type: 'vec2<f32>' },
    uStrength: { value: options.strength ?? 0.8, type: 'f32' },
    uColor: { value: options.color ?? [1.0, 0.94, 0.75], type: 'vec3<f32>' },
    uDecay: { value: options.decay ?? 0.92, type: 'f32' },
    uDensity: { value: options.density ?? 0.85, type: 'f32' },
    uTime: { value: options.time ?? 0.0, type: 'f32' },
  };

  try {
    const filter = Filter.from({
      gl: {
        vertex: defaultFilterVert,
        fragment: GODRAY_FRAGMENT_SHADER,
      },
      resources: {
        godrayUniforms,
      },
    });

    return {
      filter,
      update: (lightPos: [number, number], strength: number, color: [number, number, number], tSeconds: number) => {
        godrayUniforms.uLightPos.value = lightPos;
        godrayUniforms.uStrength.value = strength;
        godrayUniforms.uColor.value = color;
        godrayUniforms.uTime.value = tSeconds;
      },
    };
  } catch {
    return null;
  }
}
