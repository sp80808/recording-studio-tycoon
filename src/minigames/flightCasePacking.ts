/**
 * flightCasePacking.ts
 * Pure, seeded rules for Flight Case Packing: fit the mobile rig into a limited case before a
 * location session. Front view of the case: heavy gear must not sit directly above anything
 * expensive, fragile gear needs a soft neighbour, and anything left on the floor adds session risk.
 */
import { createSeededRandom, randomInt, type RandomSource } from '@/simulation/seededRandom';

export type GearTrait = 'fragile' | 'heavy' | 'soft' | 'expensive';

export interface PackItem {
  id: string;
  label: string;
  glyph: string;
  /** Footprint when un-rotated. */
  w: number;
  h: number;
  traits: GearTrait[];
  /** How badly the session misses it when left behind. */
  need: number;
}

export interface PlacedItem {
  id: string;
  x: number;
  y: number;
  rotated: boolean;
}

const it = (id: string, label: string, glyph: string, w: number, h: number, traits: GearTrait[], need: number): PackItem => ({ id, label, glyph, w, h, traits, need });

const CORE: PackItem[] = [
  it('interface', 'Interface', '🎛️', 2, 2, ['heavy', 'expensive'], 5),
  it('laptop', 'Laptop', '💻', 3, 2, ['fragile', 'expensive'], 5),
  it('condenser', 'Condenser mic', '🎙️', 1, 2, ['fragile', 'expensive'], 4),
  it('phones', 'Headphones', '🎧', 2, 2, ['fragile'], 3),
  it('dynamic1', 'Dynamic mic', '🎤', 1, 2, [], 3),
  it('di1', 'DI box', '📦', 1, 1, ['heavy'], 2),
  it('cables1', 'Cable bag', '🧵', 2, 1, ['soft'], 2),
  it('cables2', 'Cable bag', '🧵', 1, 1, ['soft'], 2),
];
const EXTRA: PackItem[] = [
  it('dynamic2', 'Dynamic mic', '🎤', 1, 2, [], 3),
  it('di2', 'DI box', '📦', 1, 1, ['heavy'], 2),
  it('stand', 'Mic stand', '📏', 1, 3, [], 2),
  it('cables3', 'Cable bag', '🧵', 2, 1, ['soft'], 2),
  it('foam', 'Foam wedge', '🧽', 1, 1, ['soft'], 1),
];

export interface CaseSpec {
  name: string;
  cols: number;
  rows: number;
  extras: number;
}

export const CASES: Record<1 | 2 | 3, CaseSpec> = {
  1: { name: 'Carry-on case', cols: 5, rows: 5, extras: 0 },
  2: { name: 'Road case', cols: 6, rows: 5, extras: 2 },
  3: { name: 'Rack trunk', cols: 6, rows: 6, extras: 5 },
};

export interface FlightCaseState {
  caseName: string;
  cols: number;
  rows: number;
  items: PackItem[];
  placed: PlacedItem[];
  closed: boolean;
}

export function createFlightCase(seed: string | number, difficulty: 1 | 2 | 3 = 1, rng?: RandomSource): FlightCaseState {
  const spec = CASES[difficulty];
  const roll = rng ?? createSeededRandom(`flightcase:${seed}`);
  const pool = [...EXTRA];
  const extras: PackItem[] = [];
  for (let i = 0; i < spec.extras && pool.length; i++) extras.push(pool.splice(randomInt(roll, 0, pool.length - 1), 1)[0]);
  const items = [...CORE, ...extras];
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(roll, 0, i);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return { caseName: spec.name, cols: spec.cols, rows: spec.rows, items, placed: [], closed: false };
}

export const itemById = (s: FlightCaseState, id: string): PackItem => s.items.find((i) => i.id === id)!;

export const footprint = (item: PackItem, rotated: boolean) => (rotated ? { w: item.h, h: item.w } : { w: item.w, h: item.h });

export function cellsOf(s: FlightCaseState, p: PlacedItem): Array<[number, number]> {
  const { w, h } = footprint(itemById(s, p.id), p.rotated);
  const out: Array<[number, number]> = [];
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) out.push([p.x + dx, p.y + dy]);
  return out;
}

function occupancy(s: FlightCaseState, ignoreId?: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const p of s.placed) if (p.id !== ignoreId) for (const [x, y] of cellsOf(s, p)) m.set(`${x},${y}`, p.id);
  return m;
}

export function canPlace(s: FlightCaseState, id: string, x: number, y: number, rotated: boolean): boolean {
  if (s.closed) return false;
  const item = s.items.find((i) => i.id === id);
  if (!item) return false;
  const { w, h } = footprint(item, rotated);
  if (x < 0 || y < 0 || x + w > s.cols || y + h > s.rows) return false;
  const occ = occupancy(s, id);
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) if (occ.has(`${x + dx},${y + dy}`)) return false;
  return true;
}

/** Place (or move) an item. Invalid placements return the same state object. */
export function placeItem(s: FlightCaseState, id: string, x: number, y: number, rotated = false): FlightCaseState {
  if (!canPlace(s, id, x, y, rotated)) return s;
  return { ...s, placed: [...s.placed.filter((p) => p.id !== id), { id, x, y, rotated }] };
}

export const removeItem = (s: FlightCaseState, id: string): FlightCaseState =>
  s.closed || !s.placed.some((p) => p.id === id) ? s : { ...s, placed: s.placed.filter((p) => p.id !== id) };

export const closeCase = (s: FlightCaseState): FlightCaseState => (s.closed ? s : { ...s, closed: true });

export interface PackAudit {
  unprotected: string[];
  crushed: string[];
  leftBehind: string[];
}

export function auditCase(s: FlightCaseState): PackAudit {
  const occ = occupancy(s);
  const trait = (id: string | undefined, t: GearTrait) => !!id && itemById(s, id).traits.includes(t);
  const unprotected: string[] = [];
  const crushed: string[] = [];
  for (const p of s.placed) {
    const item = itemById(s, p.id);
    const cells = cellsOf(s, p);
    if (item.traits.includes('fragile')) {
      const padded = cells.some(([x, y]) =>
        ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).some(([dx, dy]) => {
          const n = occ.get(`${x + dx},${y + dy}`);
          return n !== undefined && n !== p.id && trait(n, 'soft');
        }));
      if (!padded) unprotected.push(p.id);
    }
    if (item.traits.includes('heavy')) {
      const below = cells.some(([x, y]) => {
        const n = occ.get(`${x},${y + 1}`);
        return n !== undefined && n !== p.id && trait(n, 'expensive');
      });
      if (below) crushed.push(p.id);
    }
  }
  const placedIds = new Set(s.placed.map((p) => p.id));
  return { unprotected, crushed, leftBehind: s.items.filter((i) => !placedIds.has(i.id)).map((i) => i.id) };
}

/** Extra session risk (0-100) carried into the session by leftovers and bad packing. */
export function sessionRisk(s: FlightCaseState): number {
  const a = auditCase(s);
  const left = a.leftBehind.reduce((n, id) => n + itemById(s, id).need * 4, 0);
  return Math.min(100, left + a.unprotected.length * 8 + a.crushed.length * 12);
}

export interface PackScore {
  total: number;
  tips: string[];
}

/** Standard 0-1000: gear packed 550, fragile protection 250, safe stacking 100, tight fit 100. */
export function scoreFlightCase(s: FlightCaseState): PackScore {
  const a = auditCase(s);
  const tips: string[] = [];
  const needAll = s.items.reduce((n, i) => n + i.need, 0);
  const needPacked = s.placed.reduce((n, p) => n + itemById(s, p.id).need, 0);
  const fragile = s.items.filter((i) => i.traits.includes('fragile') && s.placed.some((p) => p.id === i.id));
  const heavy = s.placed.filter((p) => itemById(s, p.id).traits.includes('heavy'));
  const packedPts = (needPacked / needAll) * 550;
  const protectPts = fragile.length ? (1 - a.unprotected.length / fragile.length) * 250 : 0;
  const stackPts = heavy.length ? (1 - a.crushed.length / heavy.length) * 100 : 0;
  const used = s.placed.reduce((n, p) => n + cellsOf(s, p).length, 0);
  const fillPts = (used / (s.cols * s.rows)) * 100;
  const total = Math.round(Math.max(0, Math.min(1000, packedPts + protectPts + stackPts + fillPts)));
  if (a.leftBehind.length) tips.push(`Left on the floor: ${a.leftBehind.map((id) => itemById(s, id).label).join(', ')}. That adds session risk.`);
  if (a.unprotected.length) tips.push('Fragile gear needs a cable bag or foam wedge touching it.');
  if (a.crushed.length) tips.push('Heavy gear sat above expensive gear. Put it beside or below.');
  return { total, tips };
}
