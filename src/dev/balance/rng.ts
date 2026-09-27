/**
 * Deterministic RNG for the GH #19 balance harness.
 *
 * Self-contained mulberry32 + `withSeededRandom` helper that temporarily
 * replaces Math.random (and Date.now) so existing Math.random-based code
 * (generateNewProjects, generateAIBand) becomes deterministic.
 * Originals are always restored in a `finally` block.
 */

/** Hash an arbitrary seed to a uint32 (FNV-1a). */
export const hashSeed = (seed: number | string): number => {
  const input = String(seed);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

/** Mulberry32 PRNG. Returns a function yielding [0, 1). Not for security use. */
export const mulberry32 = (seed: number | string): (() => number) => {
  let state = hashSeed(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Run `fn` with Math.random replaced by a seeded mulberry32 stream and
 * Date.now replaced by a deterministic counter (generateNewProjects and
 * generateAIBand both call Date.now() for IDs — without this, IDs and
 * therefore review seeds would differ run to run).
 */
export const withSeededRandom = <T>(seed: number | string, fn: () => T): T => {
  const prevRandom = Math.random;
  const prevNow = Date.now;
  Math.random = mulberry32(seed);
  const base = hashSeed(`now:${seed}`);
  let ticks = 0;
  Date.now = () => base + ticks++;
  try {
    return fn();
  } finally {
    Math.random = prevRandom;
    Date.now = prevNow;
  }
};
