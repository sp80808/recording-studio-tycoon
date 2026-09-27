export type RandomSource = () => number;

export const hashSeed = (value: string | number): number => {
  const input = String(value);
  let hash = 2166136261;

  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

/**
 * Small deterministic PRNG (Mulberry32) suitable for game simulation.
 * It is not cryptographically secure and should never be used for security.
 */
export const createSeededRandom = (seed: string | number): RandomSource => {
  let state = hashSeed(seed);

  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

export const randomInt = (
  rng: RandomSource,
  minInclusive: number,
  maxInclusive: number
): number => {
  if (maxInclusive <= minInclusive) return minInclusive;
  return minInclusive + Math.floor(rng() * (maxInclusive - minInclusive + 1));
};

export const pickWithRandom = <T>(rng: RandomSource, values: readonly T[]): T => {
  if (values.length === 0) {
    throw new Error('pickWithRandom requires at least one value');
  }
  return values[Math.floor(rng() * values.length)];
};
