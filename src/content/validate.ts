/** Content validation (#64): schema parsing, ids, cross references and family-specific invariants. Pure. */
import type { ZodIssue } from 'zod';
import { EFFECT_LIMITS } from '@/narrative/eventDirector';
import type { ContentRegistry } from './registry';
import {
  BRIEF_DIRECTIONS, BRIEF_SERVICES, BriefTemplateSchema, EventSchema, SynergySchema, type ContentFamily,
  type EventContent, type SynergyContent,
} from './schemas';

export type Severity = 'error' | 'warn';
export interface ContentIssue { severity: Severity; family: ContentFamily; id: string; rule: string; message: string }

/** Caps the game applies when it combines synergy bonuses (src/utils/synergyUtils.ts). */
export const SYNERGY_CAPS = { creativityMultiplier: 1.6, technicalMultiplier: 1.6, workUnitSpeedMultiplier: 1.5, reviewQualityBonus: 12, staffXpMultiplier: 1.8 } as const;
/** A single synergy using more than this share of a cap's headroom is flagged. */
export const SYNERGY_SINGLE_SHARE = 0.6;

const fmt = (i: ZodIssue) => `${i.path.join('.') || '(root)'}: ${i.message}`;
const dupes = (xs: string[]) => xs.filter((x, i) => xs.indexOf(x) !== i);

export function validateRegistry(reg: ContentRegistry, strings?: Record<string, string>): ContentIssue[] {
  const out: ContentIssue[] = [];
  const add = (severity: Severity, family: ContentFamily, id: string, rule: string, message: string) => out.push({ severity, family, id, rule, message });

  // ───── Synergies ─────
  const synIds = reg.synergies.map((s) => s.id);
  for (const d of new Set(dupes(synIds))) add('error', 'synergies', d, 'duplicate-id', 'More than one synergy uses this id.');
  const seenCriteria = new Map<string, string>();
  for (const s of reg.synergies) {
    const parsed = SynergySchema.safeParse(s);
    if (!parsed.success) for (const i of parsed.error.issues) add('error', 'synergies', s.id, 'schema', fmt(i));
    synergyRules(s, add);
    const key = JSON.stringify(Object.entries(s.criteria).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, Array.isArray(v) ? [...v].sort() : v]));
    const prior = seenCriteria.get(key);
    if (prior) add('warn', 'synergies', s.id, 'duplicate-conditions', `Same conditions as "${prior}", so both fire together.`);
    else seenCriteria.set(key, s.id);
  }

  // ───── Events ─────
  const evIds = reg.events.map((e) => e.id);
  for (const d of new Set(dupes(evIds))) add('error', 'events', d, 'duplicate-id', 'More than one event uses this id.');
  for (const d of new Set(dupes(reg.events.map((e) => e.narrativeKey)))) {
    add('error', 'events', d, 'duplicate-narrative-key', 'More than one event uses this narrative key.');
  }
  const written = new Set<string>();
  for (const e of reg.events) for (const o of e.options) for (const m of o.memories ?? []) written.add(m.key);
  for (const e of reg.events) {
    const parsed = EventSchema.safeParse(e);
    if (!parsed.success) for (const i of parsed.error.issues) add('error', 'events', e.id, 'schema', fmt(i));
    eventRules(e, written, strings, add);
  }

  // ───── Briefs ─────
  const b = BriefTemplateSchema.safeParse(reg.briefs);
  if (!b.success) for (const i of b.error.issues) add('error', 'briefs', 'brief-templates', 'schema', fmt(i));
  briefRules(reg, add);
  return out;
}

type Add = (severity: Severity, family: ContentFamily, id: string, rule: string, message: string) => void;

function synergyRules(s: SynergyContent, add: Add) {
  const c = s.criteria;
  const A = (sev: Severity, rule: string, msg: string) => add(sev, 'synergies', s.id, rule, msg);
  const bonusEntries = Object.entries(s.bonuses ?? {}).filter(([, v]) => typeof v === 'number');
  if (!bonusEntries.length) A('error', 'no-bonus', 'A synergy with no bonus does nothing.');
  for (const [k, v] of bonusEntries as [keyof typeof SYNERGY_CAPS, number][]) {
    const cap = SYNERGY_CAPS[k];
    if (!cap) { A('error', 'unknown-bonus', `Unknown bonus "${k}".`); continue; }
    const neutral = k === 'reviewQualityBonus' ? 0 : 1;
    if (v > cap) A('error', 'modifier-over-cap', `${k} ${v} is above the game cap ${cap}.`);
    else if (v < neutral) A('warn', 'penalty', `${k} ${v} is a penalty; synergies are meant to be rewards.`);
    else if ((v - neutral) > (cap - neutral) * SYNERGY_SINGLE_SHARE) A('warn', 'modifier-near-cap', `${k} ${v} uses over ${Math.round(SYNERGY_SINGLE_SHARE * 100)}% of the headroom to the cap ${cap}, so it stacks into the cap on its own.`);
  }
  const keys = Object.keys(c).filter((k) => (c as any)[k] !== undefined);
  if (!keys.length) A('warn', 'matches-everything', 'No conditions: this synergy fires on every session.');
  for (const [k, v] of Object.entries(c)) {
    if (Array.isArray(v) && dupes(v.map(String)).length) A('warn', 'duplicate-entries', `${k} lists a value twice.`);
  }
  if (c.requiredStaffRoles && c.minStaffCount !== undefined && c.requiredStaffRoles.length > c.minStaffCount) {
    A('error', 'impossible', `Needs ${c.requiredStaffRoles.length} different roles but minStaffCount is ${c.minStaffCount}.`);
  }
  if (c.requiredStaffRoles && c.anyStaffRoles && !c.anyStaffRoles.some((r) => c.requiredStaffRoles!.includes(r)) && c.requiredStaffRoles.length === 1) {
    A('warn', 'redundant', 'anyStaffRoles never matches the single required role.');
  }
  if (s.category === 'room_gear' && !c.roomTypes && !c.requiredEquipmentCategories && !c.requiredEquipmentIds && !c.chainSlots) A('warn', 'category-mismatch', 'A room_gear synergy should test a room or gear.');
  if (s.category === 'staff_client' && !c.anyStaffRoles && !c.requiredStaffRoles && !c.minStaffCount && !c.clientRelationshipTiers && !c.minStaffCreativity && !c.minStaffTechnical) A('warn', 'category-mismatch', 'A staff_client synergy should test staff or the client.');
  if (s.category === 'genre_setup' && !c.genres) A('warn', 'category-mismatch', 'A genre_setup synergy should name genres.');
}

const memoryBase = (k: string) => (k.startsWith('studio/') ? k.slice(7) : k);

function eventRules(e: EventContent, written: Set<string>, strings: Record<string, string> | undefined, add: Add) {
  const A = (sev: Severity, rule: string, msg: string) => add(sev, 'events', e.id, rule, msg);
  const optIds = e.options.map((o) => o.id);
  for (const d of new Set(dupes(optIds))) A('error', 'duplicate-option', `Option id "${d}" appears twice.`);
  if (e.delegable && !e.defaultOptionId) A('error', 'delegable-without-default', 'A delegable event needs a defaultOptionId.');
  if (e.defaultOptionId && !optIds.includes(e.defaultOptionId)) A('error', 'bad-default', `defaultOptionId "${e.defaultOptionId}" is not one of the options.`);
  if (e.cooldownDays === 0 && e.maxOccurrences === undefined) A('warn', 'modal-no-cooldown', 'A modal event with no cooldown and no occurrence limit can repeat every opportunity.');
  if (e.requiredMemories && e.blockedMemories && e.requiredMemories.some((k) => e.blockedMemories!.includes(k))) A('error', 'impossible', 'A memory is both required and blocked, so the event can never fire.');
  for (const k of [...(e.requiredMemories ?? []), ...(e.blockedMemories ?? []), ...Object.keys(e.memoryWeights ?? {})]) {
    if (!written.has(memoryBase(k))) A('warn', 'unwritten-memory', `Memory "${k}" is never written by any authored option, so only code can set it.`);
  }
  for (const o of e.options) {
    for (const fx of o.effects) {
      if (fx.kind === 'referral') continue;
      const limit = EFFECT_LIMITS[fx.kind];
      if (Math.abs(fx.amount) > limit) A('error', 'effect-over-limit', `${o.id}: ${fx.kind} ${fx.amount} exceeds the safe range ±${limit} and would be clamped.`);
      else if (fx.amount > limit * 0.5 && fx.kind !== 'gearCondition') A('warn', 'effect-near-limit', `${o.id}: ${fx.kind} +${fx.amount} is above half the safe range (${limit}).`);
    }
  }
  if (e.baseWeight > 100) A('warn', 'weight', `baseWeight ${e.baseWeight} will drown out other events.`);
  if (strings) {
    const need = [`event.${e.id}.kicker`, `event.${e.id}.title`, `event.${e.id}.context`, ...e.options.flatMap((o) => ['label', 'flavor', 'outcome'].map((p) => `event.${e.id}.opt.${o.id}.${p}`))];
    const missing = need.filter((k) => !strings[k]);
    if (missing.length) A('error', 'missing-text', `Missing ${missing.length} English string${missing.length > 1 ? 's' : ''}, first: ${missing[0]}`);
  }
}

function briefRules(reg: ContentRegistry, add: Add) {
  const A = (sev: Severity, id: string, rule: string, msg: string) => add(sev, 'briefs', id, rule, msg);
  const t = reg.briefs;
  const covered = new Set(t.services.map((s) => s.service));
  for (const svc of BRIEF_SERVICES) if (!covered.has(svc)) A('error', svc, 'no-room-path', `Service "${svc}" has no room/role mapping, so a brief asking for it cannot be booked.`);
  for (const d of new Set(dupes(t.services.map((s) => s.service)))) A('error', d, 'duplicate-service', 'Service is mapped twice.');
  for (const d of new Set(dupes(t.approaches.map((a) => a.id)))) A('error', d, 'duplicate-id', 'Approach id is used twice.');
  for (const a of t.approaches) {
    const sum = a.focus.performance + a.focus.soundCapture + a.focus.layering;
    if (sum !== 100) A('warn', a.id, 'focus-sum', `Focus adds up to ${sum}, not 100.`);
  }
  const reachable = new Set<string>([...t.defaultDirections, ...Object.values(t.genreDirections).flat()]);
  for (const d of BRIEF_DIRECTIONS) if (!reachable.has(d)) A('warn', d, 'unreachable-direction', `No genre can ask for the "${d}" direction.`);
  for (const [g, ds] of Object.entries(t.genreDirections)) if (dupes(ds).length) A('warn', g, 'duplicate-entries', 'A direction is listed twice.');
  const approachDirs = new Set(t.approaches.map((a) => a.direction));
  for (const d of reachable) if (!approachDirs.has(d as any)) A('warn', d, 'no-approach', `No production approach leans toward "${d}".`);
}

export const summarise = (issues: ContentIssue[]) => ({
  errors: issues.filter((i) => i.severity === 'error').length,
  warnings: issues.filter((i) => i.severity === 'warn').length,
});
