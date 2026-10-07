/**
 * Pixi renderer selection: WebGPU where the browser exposes a usable adapter,
 * WebGL otherwise. Pixi itself falls back down the preference list if init fails.
 *
 * Default is WebGL (the path the art has been tuned on). WebGPU is opt-in via
 * `?renderer=webgpu` or localStorage `rst.renderer = 'webgpu'`; `auto` picks WebGPU
 * when an adapter is available.
 */
export type RendererPreference = 'webgl' | 'webgpu' | 'auto';
export type RendererName = 'webgl' | 'webgpu' | 'canvas';

const STORAGE_KEY = 'rst.renderer';

export function readRendererPreference(): RendererPreference {
  try {
    const q = new URLSearchParams(window.location.search).get('renderer');
    if (q === 'webgl' || q === 'webgpu' || q === 'auto') return q;
    const s = window.localStorage.getItem(STORAGE_KEY);
    if (s === 'webgl' || s === 'webgpu' || s === 'auto') return s;
  } catch {
    /* storage or location unavailable */
  }
  return 'webgl';
}

export async function hasWebGPUAdapter(): Promise<boolean> {
  try {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown | null> } }).gpu;
    if (!gpu) return false;
    return (await gpu.requestAdapter()) != null;
  } catch {
    return false;
  }
}

/** Ordered list for Pixi's `preference`/fallback handling. */
export async function resolveRendererOrder(pref: RendererPreference = readRendererPreference()): Promise<Array<'webgpu' | 'webgl'>> {
  if (pref === 'webgl') return ['webgl'];
  const gpu = await hasWebGPUAdapter();
  if (!gpu) return ['webgl'];
  return ['webgpu', 'webgl'];
}

/** GL renderer strings of CPU rasterisers (headless Chrome, VMs, broken GPU drivers). #352/#353 */
const SOFTWARE_GL_PATTERN = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic|mesa offscreen/i;

export function isSoftwareGlRendererName(name: string | null | undefined): boolean {
  return typeof name === 'string' && SOFTWARE_GL_PATTERN.test(name);
}

/** Best-effort probe of the unmasked GL renderer behind a Pixi WebGL context. Never throws. */
export function readGlRendererName(gl: unknown): string | null {
  try {
    const ctx = gl as WebGLRenderingContext | null;
    if (!ctx || typeof ctx.getExtension !== 'function') return null;
    const ext = ctx.getExtension('WEBGL_debug_renderer_info');
    const raw = ext ? ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL) : ctx.getParameter(ctx.RENDERER);
    return typeof raw === 'string' ? raw : null;
  } catch {
    return null;
  }
}

interface PresentationSettings {
  resolutionScale?: number;
  targetFps: number;
  crtScanlines: boolean;
  analogTapeWarmth: boolean;
  bloomAndGlow: boolean;
}

/**
 * On a CPU rasteriser the full-fat studio runs at ~2fps and every frame blocks the main thread
 * for about a second, which starves timers (the review reveal never finishes), delays input and
 * ends in an out-of-memory tab kill. Clamp the presentation settings, never the saved ones.
 */
export function applySoftwareGlProfile<T extends PresentationSettings>(settings: T): T {
  return {
    ...settings,
    resolutionScale: Math.min(settings.resolutionScale ?? 1, 0.5),
    targetFps: settings.targetFps > 0 ? Math.min(settings.targetFps, 20) : 20,
    crtScanlines: false,
    analogTapeWarmth: false,
    bloomAndGlow: false,
  };
}
