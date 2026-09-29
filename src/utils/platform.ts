/**
 * Runtime platform helpers for shell-specific UI (e.g. desktop studio strip).
 */

type TauriWindow = Window & {
  __TAURI_INTERNALS__?: unknown;
  __TAURI__?: unknown;
};

/** True when running inside a Tauri desktop shell (not a plain browser tab). */
export function isTauriShell(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as TauriWindow;
  return w.__TAURI_INTERNALS__ != null || w.__TAURI__ != null;
}
