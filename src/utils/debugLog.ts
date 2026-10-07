/** Verbose diagnostics are opt-in so the console stays quiet for players and playtesters (#348). */
export const isDebugLogging = (): boolean => {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('rst-debug') === '1') return true;
    if (typeof location !== 'undefined' && /[?&]debug=1\b/.test(location.search)) return true;
  } catch { /* storage blocked */ }
  return false;
};

export const debugLog = (...args: unknown[]): void => {
  if (isDebugLogging()) console.log(...args);
};
