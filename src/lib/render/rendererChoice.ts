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
