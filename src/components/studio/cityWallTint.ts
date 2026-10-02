import { getCityById } from '@/rpg/cities';

const parseHex = (hex: string): number => parseInt(hex.replace('#', ''), 16);

/** Blend two 0xRRGGBB colours; `amount` is the share of `b` (0..1). */
export const mixColor = (a: number, b: number, amount: number): number => {
  const mix = (shift: number) => Math.round(((a >> shift) & 255) * (1 - amount) + ((b >> shift) & 255) * amount);
  return (mix(16) << 16) | (mix(8) << 8) | mix(0);
};

/** How strongly the home city's accent colours the walls. Subtle: the era grade stays dominant. */
export const CITY_WALL_TINT = 0.12;

/** Wall colours nudged toward the home city's accent. No city (legacy saves) returns the colours unchanged. */
export const cityWallColors = (wallLeft: number, wallRight: number, cityId?: string): { wallLeft: number; wallRight: number } => {
  const city = getCityById(cityId);
  if (!city) return { wallLeft, wallRight };
  const accent = parseHex(city.accent);
  return { wallLeft: mixColor(wallLeft, accent, CITY_WALL_TINT), wallRight: mixColor(wallRight, accent, CITY_WALL_TINT) };
};
