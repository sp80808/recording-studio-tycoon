/**
 * albumSequence.ts
 * Pure, seeded logic for the Track Listing mini-game: order an album so it flows.
 * Newcomers: alternate loud and quiet, open strong, end memorably.
 * Insiders: the single lives in slot 2 or 3, the closer earns its place, and the
 * energy curve should have one clear peak rather than a zig-zag.
 */
import { createSeededRandom, pickWithRandom, randomInt } from '@/simulation/seededRandom';
import { tc } from '@/i18n/content';

export const ALBUM_TRACKS = 7;

export interface AlbumTrack {
  id: number;
  title: string;
  /** 1 (hushed) to 10 (all-out). */
  energy: number;
  single: boolean;
}

const TITLES = [
  'Porch Light', 'Scenic Route', 'Take Seven', 'Key Change Incoming', 'Last Bus Home',
  'Loud on Purpose', 'Borrowed Amp', 'Soundcheck Forever', 'Two A.M. Radio', 'Encore Nobody Asked For',
  'Coffee Went Cold', 'Load-In Blues', 'Fader Up', 'Hidden Track (Not Hidden)',
] as const;

export function buildTracklist(seed: string | number, count: number = ALBUM_TRACKS): AlbumTrack[] {
  const rng = createSeededRandom(`album:${seed}`);
  const pool = [...TITLES];
  const tracks: AlbumTrack[] = [];
  for (let i = 0; i < count; i++) {
    const title = pool.splice(randomInt(rng, 0, pool.length - 1), 1)[0] ?? pickWithRandom(rng, TITLES);
    // Guarantee a spread: a couple of quiet songs and a couple of bangers.
    const energy = i === 0 ? randomInt(rng, 8, 10) : i === 1 ? randomInt(rng, 1, 3) : randomInt(rng, 2, 9);
    tracks.push({ id: i, title, energy, single: false });
  }
  // The single is a high-energy track.
  const loud = tracks.reduce((best, t) => (t.energy > best.energy ? t : best), tracks[0]);
  loud.single = true;
  // Shuffle the presentation order.
  for (let i = tracks.length - 1; i > 0; i--) {
    const j = randomInt(rng, 0, i);
    [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
  }
  return tracks;
}

export interface AlbumScore {
  total: number;
  flow: number;
  opener: number;
  single: number;
  closer: number;
  tips: string[];
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Score an order (array of tracks). Max 1000: flow 450, single 250, opener 150, closer 150. */
export function scoreAlbum(order: AlbumTrack[]): AlbumScore {
  const n = order.length;
  const tips: string[] = [];
  if (n < 3) return { total: 0, flow: 0, opener: 0, single: 0, closer: 0, tips };

  // Flow: average jump between neighbours near a comfortable 2-3; big zig-zags and flat lines both cost.
  let jumpCost = 0;
  for (let i = 1; i < n; i++) {
    const jump = Math.abs(order[i].energy - order[i - 1].energy);
    jumpCost += jump > 4 ? (jump - 4) * 1.5 : 0;
  }
  const direction: number[] = [];
  for (let i = 1; i < n; i++) direction.push(Math.sign(order[i].energy - order[i - 1].energy));
  const turns = direction.slice(1).filter((d, i) => d !== 0 && direction[i] !== 0 && d !== direction[i]).length;
  const zigzag = Math.max(0, turns - 3) * 0.8;
  const flow = Math.round(450 * clamp(1 - (jumpCost + zigzag) / 12, 0, 1));
  if (flow < 300) tips.push(tc('mg.albumSequence.tip_flow', 'The energy lurches around. Try building to one peak.'));

  const opener = Math.round(150 * clamp((order[0].energy - 3) / 5, 0, 1));
  if (opener < 100) tips.push(tc('mg.albumSequence.tip_opener', 'Open with something that grabs people.'));

  const singleIdx = order.findIndex((t) => t.single);
  const single = singleIdx === 1 || singleIdx === 2 ? 250 : singleIdx === 0 || singleIdx === 3 ? 140 : 40;
  if (single < 250) tips.push(tc('mg.albumSequence.tip_single', 'The single belongs in slot 2 or 3, after the opener has won them over.'));

  const last = order[n - 1];
  const closer = last.single ? 60 : Math.round(150 * clamp(1 - Math.abs(last.energy - 3) / 6, 0.2, 1));
  if (closer < 100) tips.push(tc('mg.albumSequence.tip_closer', 'End on a slow burn, not a shrug.'));

  const total = clamp(flow + opener + single + closer, 0, 1000);
  return { total, flow, opener, single, closer, tips };
}
