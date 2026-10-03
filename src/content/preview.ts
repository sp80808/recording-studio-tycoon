/** Content previews (#64): explain why a definition does or does not match a fixture. Pure, no engine edits. */
import type { GameState } from '@/types/game';
import { buildFacts, getDirector, type DirectorSubject, type StudioEventDefinition } from '@/narrative/eventDirector';
import { deriveBrief } from '@/rpg/projectBrief';
import type { BriefTemplateContent, SynergyContent } from './schemas';

export interface Check { label: string; pass: boolean; detail: string }

// ───────────── Synergies ─────────────
export interface SynergyFixture {
  name: string;
  room: string;
  categories: string[];
  equipmentIds: string[];
  chainSlots?: string[];
  staffRoles: string[];
  maxCreativity: number;
  maxTechnical: number;
  genre: string;
  clientTier?: string;
}

export const SYNERGY_FIXTURES: SynergyFixture[] = [
  { name: 'Bedroom start', room: 'project-studio', categories: ['microphone', 'interface'], equipmentIds: [], staffRoles: [], maxCreativity: 0, maxTechnical: 0, genre: 'Pop', clientTier: 'Unknown' },
  { name: 'Vocal day', room: 'vocal-suite', categories: ['microphone', 'outboard', 'interface'], equipmentIds: [], staffRoles: ['Producer', 'Engineer'], maxCreativity: 55, maxTechnical: 60, genre: 'Soul', clientTier: 'Regular' },
  { name: 'Live tracking', room: 'live-room', categories: ['microphone', 'instrument', 'recorder'], equipmentIds: [], staffRoles: ['Engineer'], maxCreativity: 40, maxTechnical: 70, genre: 'Rock', clientTier: 'Friendly' },
  { name: 'Flagship mix', room: 'mix-suite', categories: ['monitor', 'mixer', 'outboard', 'software'], equipmentIds: [], staffRoles: ['Engineer', 'Producer', 'Songwriter'], maxCreativity: 85, maxTechnical: 90, genre: 'Electronic', clientTier: 'Loyal' },
];

const list = (xs: readonly string[]) => xs.join(', ');

export function explainSynergy(s: SynergyContent, f: SynergyFixture): { matches: boolean; checks: Check[] } {
  const c = s.criteria;
  const checks: Check[] = [];
  const add = (label: string, pass: boolean, detail: string) => checks.push({ label, pass, detail });
  if (c.roomTypes?.length) add('Room', c.roomTypes.includes(f.room as any), `needs ${list(c.roomTypes)}, fixture has ${f.room}`);
  if (c.chainSlots?.length && f.chainSlots) add('Chain slots', c.chainSlots.every((x) => f.chainSlots!.includes(x)), `needs ${list(c.chainSlots)}, chain has ${list(f.chainSlots) || 'none'}`);
  else if (c.requiredEquipmentCategories?.length) add('Gear categories', c.requiredEquipmentCategories.every((x) => f.categories.includes(x)), `needs ${list(c.requiredEquipmentCategories)}, fixture has ${list(f.categories) || 'none'}`);
  if (c.requiredEquipmentIds?.length) add('Specific gear', c.requiredEquipmentIds.every((x) => f.equipmentIds.includes(x)), `needs ${list(c.requiredEquipmentIds)}`);
  if (c.minStaffCount !== undefined) add('Staff count', f.staffRoles.length >= c.minStaffCount, `needs ${c.minStaffCount}, fixture has ${f.staffRoles.length}`);
  if (c.anyStaffRoles?.length) add('Any staff role', f.staffRoles.some((r) => c.anyStaffRoles!.includes(r as any)), `needs one of ${list(c.anyStaffRoles)}, fixture has ${list(f.staffRoles) || 'nobody'}`);
  if (c.requiredStaffRoles?.length) add('All staff roles', c.requiredStaffRoles.every((r) => f.staffRoles.includes(r)), `needs ${list(c.requiredStaffRoles)}, fixture has ${list(f.staffRoles) || 'nobody'}`);
  if (c.genres?.length) add('Genre', c.genres.some((g) => g.trim().toLowerCase() === f.genre.trim().toLowerCase()), `needs one of ${list(c.genres)}, fixture is ${f.genre}`);
  if (c.clientRelationshipTiers?.length) add('Client tier', Boolean(f.clientTier && c.clientRelationshipTiers.includes(f.clientTier as any)), `needs ${list(c.clientRelationshipTiers)}, fixture client is ${f.clientTier ?? 'none'}`);
  if (c.minStaffCreativity !== undefined) add('Creativity', f.maxCreativity >= c.minStaffCreativity, `needs ${c.minStaffCreativity}, best staff has ${f.maxCreativity}`);
  if (c.minStaffTechnical !== undefined) add('Technical', f.maxTechnical >= c.minStaffTechnical, `needs ${c.minStaffTechnical}, best staff has ${f.maxTechnical}`);
  return { matches: checks.every((k) => k.pass), checks };
}

// ───────────── Events ─────────────
const client = (over: Record<string, unknown> = {}) => ({
  clientId: 'mara', clientName: 'Mara Vale', primaryGenre: 'Rock', relationshipXp: 100, tier: 'Friendly',
  sessionsCompleted: 3, lastSessionDay: 20, bestQualityScore: 80, referralCount: 0, ...over,
});

const baseState = (over: Record<string, unknown>): GameState => ({
  currentDay: 30, currentEra: 'analog60s', selectedEra: 'analog60s', saveSeed: 777,
  money: 5000, reputation: 60, hiredStaff: [], ownedEquipment: [], studioRooms: [],
  playerData: { xp: 0, level: 3 }, clientRelationships: { mara: client() },
  storylineState: { runSeed: 1, activeCampaignNodeId: 'x', campaignCompleted: false, branchHistory: [], activeSubplots: [], resolvedSubplotIds: [], storyFlags: {} },
  ...over,
}) as unknown as GameState;

export interface EventFixture { name: string; state: GameState }
export const EVENT_FIXTURES: EventFixture[] = [
  { name: 'Day 5, nobody yet', state: baseState({ currentDay: 5, money: 800, reputation: 5, clientRelationships: {} }) },
  { name: 'Day 30, one regular client', state: baseState({}) },
  { name: 'Day 90, two staff, strong client', state: baseState({ currentDay: 90, money: 12000, reputation: 70, hiredStaff: [{ id: 's1', name: 'Sam' }, { id: 's2', name: 'Ines' }], clientRelationships: { mara: client({ tier: 'Loyal', sessionsCompleted: 8, bestQualityScore: 92 }) } }) },
];

/** Same gates, in the same order, as `resolveEligibleEvents`, with a plain-English reason for the first one that blocks. */
export function explainEvent(state: GameState, def: StudioEventDefinition): { eligible: boolean; reason: string; subject?: DirectorSubject; weight?: number } {
  const facts = buildFacts(state);
  const director = getDirector(state);
  const subject = def.pickSubject ? def.pickSubject(facts) : undefined;
  if (def.pickSubject && !subject) return { eligible: false, reason: 'No client, staff member or gear in this fixture fits the event.' };
  if (!def.eligible(facts, subject)) return { eligible: false, reason: 'The eligibility rule says no for this fixture.', subject };
  const mine = director.history.filter((h) => h.eventId === def.id && (!subject || h.subjectId === subject.id));
  if (def.maxOccurrences !== undefined && mine.length >= def.maxOccurrences) return { eligible: false, reason: `Already happened ${mine.length} time(s); the limit is ${def.maxOccurrences}.`, subject };
  const last = director.history.filter((h) => h.eventId === def.id).slice(-1)[0];
  if (last && state.currentDay - last.day < def.cooldownDays) return { eligible: false, reason: `Still cooling down (${def.cooldownDays - (state.currentDay - last.day)} day(s) left).`, subject };
  const holds = (k: string) => (k.startsWith('studio/') ? facts.has('studio', k.slice(7)) : subject ? facts.has(subject.scope, k, subject.id) : false);
  const missing = (def.requiredMemories ?? []).filter((k) => !holds(k));
  if (missing.length) return { eligible: false, reason: `Needs the memory ${missing.map((k) => `"${k}"`).join(', ')}, which this fixture does not have.`, subject };
  const blocked = (def.blockedMemories ?? []).filter(holds);
  if (blocked.length) return { eligible: false, reason: `Blocked by the memory ${blocked.map((k) => `"${k}"`).join(', ')}.`, subject };
  let weight = def.baseWeight;
  for (const [k, m] of Object.entries(def.memoryWeights ?? {})) if (holds(k)) weight *= m;
  return { eligible: true, reason: subject ? `Eligible, about ${subject.label}.` : 'Eligible.', subject, weight };
}

// ───────────── Briefs ─────────────
export function explainBriefGenre(t: BriefTemplateContent, genre: string) {
  const directions = t.genreDirections[genre] ?? t.defaultDirections;
  return {
    genre,
    usesDefault: !t.genreDirections[genre],
    directions,
    services: t.services.map((s) => `${s.service} → ${s.room} (${s.role})`),
    samples: Array.from({ length: 5 }, (_, i) => deriveBrief({ id: `preview-${i}`, genre })),
  };
}
