/**
 * Vocal signal-chain composer (issue #86, V1: vocal recording only).
 *
 * Four slots (microphone, preamp, dynamics, recorder/interface) are filled from
 * owned gear. Evaluation is pure and deterministic and returns explainable
 * strengths/trade-offs. Output coupling is a small bounded modifier; it never
 * replaces player skill, staff skill, room quality or timing.
 */
import type { Equipment, GameState, Project, StaffMember } from '@/types/game';
import type { ProjectBrief } from '@/rpg/projectBrief';

export type SignalSlot = 'microphone' | 'preamp' | 'dynamics' | 'recorderInterface';
export const SIGNAL_SLOTS: SignalSlot[] = ['microphone', 'preamp', 'dynamics', 'recorderInterface'];

export const SLOT_LABELS: Record<SignalSlot, string> = {
  microphone: 'Mic',
  preamp: 'Preamp',
  dynamics: 'Dynamics',
  recorderInterface: 'Recorder',
};

export interface SignalChain {
  id: string;
  name: string;
  service: 'vocal-recording';
  roomId: string;
  slots: Partial<Record<SignalSlot, string>>;
}

export type ReliabilityRisk = 'low' | 'medium' | 'high';

export interface ChainEvaluation {
  compatibility: number;
  /** Minutes. */
  setupTime: number;
  reliabilityRisk: ReliabilityRisk;
  /** 0-100: how well the assigned crew knows this gear. */
  familiarity: number;
  traits: string[];
  reasons: string[];
}

type Trait = 'warm' | 'clear' | 'vintage' | 'digital';

// Dynamics / preamp membership is by catalog id; microphone and interface by category.
const DYNAMICS_IDS = new Set(['fairychild_comp', 'compressor', 'urei_1176_compressor']);
const PREAMP_IDS = new Set(['ssl_console_strip', 'api_the_wiser']);
const GEAR_TRAITS: Record<string, Trait[]> = {
  ribbon_vintage_mic: ['warm', 'vintage'],
  neumann_u_wish: ['clear', 'vintage'],
  condenser_mic: ['clear'],
  dynamic_mic: ['warm'],
  sphere_mic_system: ['clear', 'digital'],
  fairychild_comp: ['warm', 'vintage'],
  urei_1176_compressor: ['warm', 'vintage'],
  compressor: ['clear'],
  ssl_console_strip: ['clear'],
  api_the_wiser: ['warm'],
  audio_interface: ['digital'],
  apogee_symphony_phony: ['clear', 'digital'],
};

export function slotAccepts(slot: SignalSlot, item: Equipment): boolean {
  switch (slot) {
    case 'microphone': return item.category === 'microphone';
    case 'preamp': return item.category === 'mixer' || PREAMP_IDS.has(item.id);
    case 'dynamics': return DYNAMICS_IDS.has(item.id);
    case 'recorderInterface': return item.category === 'interface' || item.category === 'recorder';
  }
}

/** Gear a slot can actually be filled with right now. Busy gear (in another project's chain) is excluded. */
export function availableForSlot(state: Pick<GameState, 'ownedEquipment' | 'activeProject' | 'activeProjects'>, slot: SignalSlot, exceptProjectId?: string): Equipment[] {
  const busy = busyGearIds(state, exceptProjectId);
  return (state.ownedEquipment ?? []).filter((e) => slotAccepts(slot, e) && !busy.has(e.id));
}

/** One piece of gear cannot sit in two live chains at once. */
export function busyGearIds(state: Pick<GameState, 'activeProject' | 'activeProjects'>, exceptProjectId?: string): Set<string> {
  const live: Project[] = [...(state.activeProjects ?? []), ...(state.activeProject ? [state.activeProject] : [])];
  const ids = new Set<string>();
  for (const p of live) {
    if (p.id === exceptProjectId || !p.signalChain) continue;
    Object.values(p.signalChain.slots).forEach((id) => id && ids.add(id));
  }
  return ids;
}

export interface ChainValidation {
  valid: boolean;
  /** Slots whose gear is missing, sold, wrong for the slot, or in use elsewhere. */
  broken: SignalSlot[];
  filled: SignalSlot[];
}

export function validateChain(chain: SignalChain, state: Pick<GameState, 'ownedEquipment' | 'activeProject' | 'activeProjects'>, exceptProjectId?: string): ChainValidation {
  const busy = busyGearIds(state, exceptProjectId);
  const owned = new Map((state.ownedEquipment ?? []).map((e) => [e.id, e]));
  const broken: SignalSlot[] = [];
  const filled: SignalSlot[] = [];
  for (const slot of SIGNAL_SLOTS) {
    const id = chain.slots[slot];
    if (!id) continue;
    const item = owned.get(id);
    if (!item || !slotAccepts(slot, item) || busy.has(id)) broken.push(slot);
    else filled.push(slot);
  }
  return { valid: broken.length === 0 && filled.length > 0, broken, filled };
}

const familiarityOf = (staff: StaffMember[], gearId: string): number =>
  staff.reduce((best, s) => Math.max(best, s.gearFamiliarity?.[gearId] ?? 0), 0);

/** Pure. Same chain, state and brief always evaluate identically. */
export function evaluateChain(
  chain: SignalChain,
  state: Pick<GameState, 'ownedEquipment'>,
  staff: StaffMember[],
  brief: Pick<ProjectBrief, 'direction' | 'priority' | 'genre'>,
): ChainEvaluation {
  const owned = new Map((state.ownedEquipment ?? []).map((e) => [e.id, e]));
  const items = SIGNAL_SLOTS.map((s) => (chain.slots[s] ? owned.get(chain.slots[s]!) : undefined)).filter((e): e is Equipment => Boolean(e));
  const reasons: string[] = [];

  const traitSet = new Set<Trait>();
  items.forEach((e) => (GEAR_TRAITS[e.id] ?? []).forEach((t) => traitSet.add(t)));
  const traits = Array.from(traitSet).sort();

  const minCondition = items.length ? Math.min(...items.map((e) => e.condition ?? 100)) : 100;
  const reliabilityRisk: ReliabilityRisk = minCondition >= 70 ? 'low' : minCondition >= 40 ? 'medium' : 'high';

  const fam = items.length ? Math.round((items.reduce((a, e) => a + Math.min(5, familiarityOf(staff, e.id)), 0) / (items.length * 5)) * 100) : 0;
  const worn = items.filter((e) => (e.condition ?? 100) < 50).length;
  const setupTime = Math.max(10, 20 + items.length * 6 + worn * 8 - Math.round(fam / 10) * 2);

  let score = 50;
  const filledCount = items.length;
  if (filledCount < SIGNAL_SLOTS.length) { score -= (SIGNAL_SLOTS.length - filledCount) * 6; reasons.push(`${SIGNAL_SLOTS.length - filledCount} empty slot${SIGNAL_SLOTS.length - filledCount === 1 ? '' : 's'} in the chain`); }
  else { score += 6; }

  const wantsCharacter = ['intimate', 'raw', 'live'].includes(brief.direction);
  const wantsClarity = ['polished', 'experimental'].includes(brief.direction);
  if (wantsCharacter && (traitSet.has('warm') || traitSet.has('vintage'))) { score += 14; reasons.push(`Warm character suits a ${brief.direction} brief`); }
  if (wantsClarity && traitSet.has('clear')) { score += 14; reasons.push(`Clear signal path suits a ${brief.direction} brief`); }
  if (wantsClarity && traitSet.has('vintage') && !traitSet.has('clear')) { score -= 6; reasons.push('Vintage colour works against a polished brief'); }
  if (brief.priority === 'speed') {
    if (traitSet.has('digital') || fam >= 50) { score += 8; reasons.push('Familiar, fast-to-patch gear suits the turnaround'); }
    if (traitSet.has('vintage') && fam < 50) { score -= 6; reasons.push('Unfamiliar vintage gear slows setup'); }
  }
  if (fam >= 60) { score += 8; reasons.push('The crew knows this chain well'); }
  if (reliabilityRisk === 'high') { score -= 10; reasons.push(`Worn gear (${Math.round(minCondition)}%) makes this chain a risk`); }
  else if (reliabilityRisk === 'medium') { score -= 4; reasons.push(`Some gear is showing wear (${Math.round(minCondition)}%)`); }

  return { compatibility: Math.max(0, Math.min(100, score)), setupTime, reliabilityRisk, familiarity: fam, traits, reasons };
}

/** Bounded output modifier: 0.97 .. 1.06. Never dominates skill or timing. */
export function chainMultiplier(ev: ChainEvaluation): number {
  const raw = 1 + (ev.compatibility - 50) / 50 * 0.06;
  const riskPenalty = ev.reliabilityRisk === 'high' ? 0.02 : 0;
  return Math.max(0.97, Math.min(1.06, Number((raw - riskPenalty).toFixed(3))));
}

/** Quiet one-line rack readout — not a form dump of reasons. */
export function formatChainStatusLine(ev: ChainEvaluation, broken: SignalSlot[] = []): string {
  if (broken.length > 0) {
    return `Unavailable: ${broken.map((s) => SLOT_LABELS[s]).join(', ')}`;
  }
  const character = ev.traits.length > 0 ? ev.traits.join(' · ') : 'neutral';
  return `${character} · Setup ${ev.setupTime} min · Reliability ${ev.reliabilityRisk}`;
}

/** Slots filled on a project's chain, if the chain is currently valid. Used by synergies. */
export function activeChainSlots(project: Project, state: Pick<GameState, 'ownedEquipment' | 'activeProject' | 'activeProjects'>): SignalSlot[] | null {
  if (!project.signalChain) return null;
  const v = validateChain(project.signalChain, state, project.id);
  return v.broken.length === 0 ? v.filled : [];
}

export interface ResolvedTemplate {
  chain: SignalChain;
  validation: ChainValidation;
}

/** Saved templates surface broken slots (sold/missing gear) instead of silently failing. */
export function resolveTemplates(state: Pick<GameState, 'chainTemplates' | 'ownedEquipment' | 'activeProject' | 'activeProjects'>): ResolvedTemplate[] {
  return (state.chainTemplates ?? []).map((chain) => ({ chain, validation: validateChain(chain, state) }));
}

export function saveTemplate(templates: SignalChain[] | undefined, chain: SignalChain, name: string): SignalChain[] {
  const id = `chain-tpl-${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const tpl: SignalChain = { ...chain, id, name: name.trim() || chain.name };
  return [...(templates ?? []).filter((t) => t.id !== id), tpl].slice(-12);
}

/** Staff who worked the session gain familiarity with each piece of gear used (capped). */
export function growFamiliarity(staff: StaffMember[], chain: SignalChain, staffIds: Set<string>): StaffMember[] {
  const gear = SIGNAL_SLOTS.map((s) => chain.slots[s]).filter((id): id is string => Boolean(id));
  return staff.map((s) => {
    if (!staffIds.has(s.id)) return s;
    const next = { ...(s.gearFamiliarity ?? {}) };
    gear.forEach((id) => { next[id] = Math.min(10, (next[id] ?? 0) + 1); });
    return { ...s, gearFamiliarity: next };
  });
}

/**
 * One-tap "quick fill": seats the best-fitting free gear in every EMPTY slot, never
 * touching what the player already patched. Greedy per slot in signal order, scored
 * by the same evaluator the rack uses; ties break by condition then id so it is
 * deterministic. Returns the new slots map and which slots it filled.
 */
export function suggestFill(
  chain: SignalChain,
  state: Pick<GameState, 'ownedEquipment' | 'activeProject' | 'activeProjects'>,
  staff: StaffMember[],
  brief: Pick<ProjectBrief, 'direction' | 'priority' | 'genre'>,
  exceptProjectId?: string,
): { slots: SignalChain['slots']; filled: SignalSlot[] } {
  const slots: SignalChain['slots'] = { ...chain.slots };
  const filled: SignalSlot[] = [];
  const taken = new Set(Object.values(slots).filter((id): id is string => Boolean(id)));
  for (const slot of SIGNAL_SLOTS) {
    if (slots[slot]) continue;
    const candidates = availableForSlot(state, slot, exceptProjectId).filter((e) => !taken.has(e.id));
    if (candidates.length === 0) continue;
    const scored = candidates.map((e) => ({
      e,
      score: evaluateChain({ ...chain, slots: { ...slots, [slot]: e.id } }, state, staff, brief).compatibility,
    }));
    scored.sort((a, b) => b.score - a.score || (b.e.condition ?? 100) - (a.e.condition ?? 100) || a.e.id.localeCompare(b.e.id));
    slots[slot] = scored[0].e.id;
    taken.add(scored[0].e.id);
    filled.push(slot);
  }
  return { slots, filled };
}
