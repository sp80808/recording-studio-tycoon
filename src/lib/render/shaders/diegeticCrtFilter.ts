import { Filter, defaultFilterVert } from 'pixi.js';

export interface DiegeticCrtOptions {
  pitch?: number;
  scanlineAlpha?: number;
  curvature?: number;
  chromaticAberration?: number;
}

export interface DiegeticCrtFilterHandle {
  filter: Filter;
  updateTime: (tSeconds: number) => void;
  setTuning: (options: Partial<DiegeticCrtOptions>) => void;
}

export const DEFAULT_DIEGETIC_CRT_OPTIONS: Required<DiegeticCrtOptions> = {
  pitch: 3.0,
  scanlineAlpha: 0.25,
  curvature: 0.05,
  chromaticAberration: 0.0015,
};

const CRT_FRAGMENT_SHADER = `
  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uTexture;
  uniform vec4 uInputSize;
  uniform float uPitch;
  uniform float uScanlineAlpha;
  uniform float uCurvature;
  uniform float uChromatic;
  uniform float uTime;

  vec2 curveUV(vec2 uv) {
    if (uCurvature <= 0.001) return uv;
    vec2 p = uv - 0.5;
    float r2 = p.x * p.x + p.y * p.y;
    return 0.5 + p * (1.0 + r2 * uCurvature * 2.0);
  }

  void main(void) {
    vec2 uv = curveUV(vTextureCoord);

    // Bezel clipping
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      finalColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }

    // Sub-pixel chromatic aberration
    vec2 dir = uv - 0.5;
    float r = texture(uTexture, uv - dir * uChromatic).r;
    float g = texture(uTexture, uv).g;
    float b = texture(uTexture, uv + dir * uChromatic).b;
    float a = texture(uTexture, uv).a;

    // Scanlines
    float screenY = uv.y * uInputSize.y;
    float scanline = sin((screenY / max(1.0, uPitch)) * 3.14159265 + uTime * 2.0) * 0.5 + 0.5;
    vec3 color = vec3(r, g, b) * (1.0 - scanline * uScanlineAlpha);

    finalColor = vec4(color, a);
  }
`;

/**
 * Creates an in-world diegetic CRT screen filter (PixiJS v8).
 * Safely returns null when executing outside a browser / WebGL context.
 */
export function createDiegeticCrtFilter(options: DiegeticCrtOptions = {}): DiegeticCrtFilterHandle | null {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return null;
  }

  const opts = { ...DEFAULT_DIEGETIC_CRT_OPTIONS, ...options };

  const crtUniforms = {
    uPitch: { value: opts.pitch, type: 'f32' },
    uScanlineAlpha: { value: opts.scanlineAlpha, type: 'f32' },
    uCurvature: { value: opts.curvature, type: 'f32' },
    uChromatic: { value: opts.chromaticAberration, type: 'f32' },
    uTime: { value: 0.0, type: 'f32' },
  };

  try {
    const filter = Filter.from({
      gl: {
        vertex: defaultFilterVert,
        fragment: CRT_FRAGMENT_SHADER,
      },
      resources: {
        crtUniforms,
      },
    });

    return {
      filter,
      updateTime: (t: number) => {
        crtUniforms.uTime.value = t;
      },
      setTuning: (newOpts: Partial<DiegeticCrtOptions>) => {
        if (newOpts.pitch !== undefined) crtUniforms.uPitch.value = newOpts.pitch;
        if (newOpts.scanlineAlpha !== undefined) crtUniforms.uScanlineAlpha.value = newOpts.scanlineAlpha;
        if (newOpts.curvature !== undefined) crtUniforms.uCurvature.value = newOpts.curvature;
        if (newOpts.chromaticAberration !== undefined) crtUniforms.uChromatic.value = newOpts.chromaticAberration;
      },
    };
  } catch {
    return null;
  }
}
