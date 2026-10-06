/**
 * What physical kind of gear a flight case holds, and how you'd test it on a bench.
 * Drives the foam-cutout silhouette and which plug the test cable ends in, so the
 * unboxing reads like real hardware: a mic comes out on an XLR, a synth on a 1/4" jack,
 * a mic stand or a licence key has nothing to plug in.
 */
import type { EquipmentItem } from './lootGenerator';
import type { PatchSocket } from './connectors/HardwarePatchPanel';

export type GearKind =
  | 'mic'
  | 'rack'
  | 'console'
  | 'recorder'
  | 'amp'
  | 'keys'
  | 'headphones'
  | 'speaker'
  | 'stand'
  | 'software';

export interface BenchTest {
  /** Plug on the end of the gear's own cable; null when there is nothing to plug in. */
  plug: PatchSocket | null;
  /** Short label for the gear's output, e.g. "XLR out". */
  outputLabel: string;
  /** One-line explanation shown when there is nothing to test. */
  noTestReason?: string;
}

const byName = (name: string): GearKind => {
  const n = name.toLowerCase();
  if (/\bstand\b/.test(n)) return 'stand';
  if (/licen[cs]e|plugin|software|\bkey\b/.test(n)) return 'software';
  if (/headphone|cans/.test(n)) return 'headphones';
  if (/\bmic(rophone)?\b|condenser|ribbon/.test(n)) return 'mic';
  if (/console|mixer|desk/.test(n)) return 'console';
  if (/tape|reel|recorder/.test(n)) return 'recorder';
  if (/amp\b|amplifier|guitar/.test(n)) return 'amp';
  if (/synth|keys|piano|organ|midi|controller/.test(n)) return 'keys';
  if (/monitor|speaker/.test(n)) return 'speaker';
  return 'rack';
};

export function gearKindOf(item: Pick<EquipmentItem, 'name' | 'equipment'>): GearKind {
  const fromName = byName(item.name);
  const category = item.equipment?.category;
  if (!category) return fromName;
  switch (category) {
    case 'microphone': return fromName === 'stand' ? 'stand' : 'mic';
    case 'mixer': return 'console';
    case 'recorder': return 'recorder';
    case 'software': return 'software';
    case 'monitor': return fromName === 'headphones' ? 'headphones' : 'speaker';
    case 'instrument': return fromName === 'amp' ? 'amp' : 'keys';
    case 'interface':
    case 'outboard':
    default: return fromName === 'rack' ? 'rack' : fromName;
  }
}

export const BENCH_TESTS: Record<GearKind, BenchTest> = {
  mic: { plug: 'xlr', outputLabel: 'XLR out' },
  console: { plug: 'xlr', outputLabel: 'Main XLR out' },
  speaker: { plug: 'xlr', outputLabel: 'XLR in' },
  rack: { plug: 'trs', outputLabel: '1/4" line out' },
  recorder: { plug: 'trs', outputLabel: '1/4" line out' },
  amp: { plug: 'trs', outputLabel: '1/4" line out' },
  keys: { plug: 'trs', outputLabel: '1/4" line out' },
  headphones: { plug: 'trs', outputLabel: '1/4" plug' },
  stand: { plug: null, outputLabel: '', noTestReason: 'Nothing to plug in. Check the clutch and the thread, and it is good to go.' },
  software: { plug: null, outputLabel: '', noTestReason: 'A licence key, nothing to plug in. It activates when you rack it.' },
};

export const SOCKET_LABEL: Record<PatchSocket, string> = { xlr: 'XLR', trs: '1/4"' };

/** Plain-language bench verdict from the condition the card already shows. No hidden values. */
export function benchVerdict(condition: number): { level: number; text: string; tone: 'good' | 'ok' | 'bad' } {
  if (condition >= 80) return { level: 8, text: 'Clean signal. Works like it should.', tone: 'good' };
  if (condition >= 50) return { level: 6, text: 'Works, with a little hiss. A service would tidy it up.', tone: 'ok' };
  return { level: 3, text: 'Crackly and weak. It needs a service before a session.', tone: 'bad' };
}

/** Why a plug won't go into a socket. */
export const withArticle = (s: PatchSocket): string => `${s === 'xlr' ? 'an' : 'a'} ${SOCKET_LABEL[s]}`;
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
export const wrongSocketMessage = (plug: PatchSocket, socket: PatchSocket): string =>
  `${cap(withArticle(plug))} plug won't go in ${withArticle(socket)} socket.`;
