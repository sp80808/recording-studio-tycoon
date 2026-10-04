/**
 * Content schemas (#64). Each authored family is described as plain serialisable data so it can be
 * inspected, validated and exported without touching engine code. Function-valued parts of an event
 * (eligibility, subject picker, text builder) are not data; the registry records only their presence.
 */
import { z } from 'zod';

export const ROOM_TYPES = ['project-studio', 'vocal-suite', 'live-room', 'mix-suite'] as const;
export const EQUIPMENT_CATEGORIES = ['microphone', 'monitor', 'interface', 'outboard', 'instrument', 'software', 'recorder', 'mixer'] as const;
export const CHAIN_SLOTS = ['microphone', 'preamp', 'dynamics', 'recorderInterface'] as const;
export const STAFF_ROLES = ['Engineer', 'Producer', 'Songwriter'] as const;
export const CLIENT_TIERS = ['Unknown', 'Acquaintance', 'Friendly', 'Regular', 'Loyal', 'Advocate'] as const;
export const SYNERGY_CATEGORIES = ['room_gear', 'staff_client', 'genre_setup'] as const;
export const MEMORY_SCOPES = ['studio', 'client', 'staff', 'project', 'gear', 'band'] as const;
export const BRIEF_SERVICES = ['tracking', 'vocal-production', 'mix', 'master', 'full-production'] as const;
export const BRIEF_DIRECTIONS = ['raw', 'polished', 'intimate', 'live', 'heavy', 'experimental'] as const;
export const BRIEF_PRIORITIES = ['quality', 'speed', 'budget'] as const;

const id = z.string().min(2).regex(/^[a-z0-9][a-z0-9_.-]*$/, 'ids are lower-case letters, digits, _ . -');

// ───────────── Synergies ─────────────
export const SynergySchema = z.object({
  id,
  name: z.string().min(2),
  category: z.enum(SYNERGY_CATEGORIES),
  tagline: z.string().min(2),
  description: z.string().min(10),
  hint: z.string().min(5),
  icon: z.string().min(1),
  criteria: z.object({
    roomTypes: z.array(z.enum(ROOM_TYPES)).optional(),
    requiredEquipmentCategories: z.array(z.enum(EQUIPMENT_CATEGORIES)).optional(),
    chainSlots: z.array(z.enum(CHAIN_SLOTS)).optional(),
    requiredEquipmentIds: z.array(z.string()).optional(),
    anyStaffRoles: z.array(z.enum(STAFF_ROLES)).optional(),
    requiredStaffRoles: z.array(z.enum(STAFF_ROLES)).optional(),
    minStaffCount: z.number().int().min(1).max(10).optional(),
    genres: z.array(z.string().min(2)).optional(),
    clientRelationshipTiers: z.array(z.enum(CLIENT_TIERS)).optional(),
    minStaffCreativity: z.number().min(1).max(100).optional(),
    minStaffTechnical: z.number().min(1).max(100).optional(),
  }).strict(),
  bonuses: z.object({
    creativityMultiplier: z.number().optional(),
    technicalMultiplier: z.number().optional(),
    workUnitSpeedMultiplier: z.number().optional(),
    reviewQualityBonus: z.number().optional(),
    staffXpMultiplier: z.number().optional(),
  }).strict(),
}).strict();
export type SynergyContent = z.infer<typeof SynergySchema>;

// ───────────── Events ─────────────
const EffectSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('money'), amount: z.number() }),
  z.object({ kind: z.literal('reputation'), amount: z.number() }),
  z.object({ kind: z.literal('xp'), amount: z.number() }),
  z.object({ kind: z.literal('clientXp'), amount: z.number() }),
  z.object({ kind: z.literal('staffXp'), amount: z.number() }),
  z.object({ kind: z.literal('gearCondition'), amount: z.number() }),
  z.object({ kind: z.literal('referral') }),
]);

export const EventOptionSchema = z.object({
  id,
  label: z.string().min(1),
  flavorText: z.string().min(1),
  effects: z.array(EffectSchema),
  memories: z.array(z.object({
    scope: z.enum(MEMORY_SCOPES).optional(),
    key: z.string().min(1),
    ttlDays: z.number().int().positive().optional(),
    intensity: z.number().optional(),
  })).optional(),
  outcome: z.string().min(1),
});

export const EventSchema = z.object({
  id,
  family: z.string().min(2),
  baseWeight: z.number().positive(),
  cooldownDays: z.number().int().min(0),
  maxOccurrences: z.number().int().positive().optional(),
  requiredMemories: z.array(z.string()).optional(),
  blockedMemories: z.array(z.string()).optional(),
  memoryWeights: z.record(z.number().positive()).optional(),
  narrativeKey: z.string().regex(/^[a-z0-9_]+(\.[a-z0-9_-]+)+$/, 'narrative keys are dotted lower-case paths'),
  kicker: z.string().min(1),
  title: z.string().min(1),
  options: z.array(EventOptionSchema).min(1).max(4),
  delegable: z.boolean().optional(),
  defaultOptionId: z.string().optional(),
  /** Recorded, not editable: these parts are code. */
  hasSubjectPicker: z.boolean(),
  hasEligibility: z.boolean(),
});
export type EventContent = z.infer<typeof EventSchema>;

// ───────────── Brief templates ─────────────
export const BriefApproachSchema = z.object({
  id,
  label: z.string().min(2),
  blurb: z.string().min(5),
  direction: z.enum(BRIEF_DIRECTIONS),
  focus: z.object({ performance: z.number().min(0), soundCapture: z.number().min(0), layering: z.number().min(0) }),
});

export const BriefTemplateSchema = z.object({
  /** One row per service the brief generator can ask for. */
  services: z.array(z.object({
    service: z.enum(BRIEF_SERVICES),
    room: z.enum(ROOM_TYPES),
    role: z.enum(STAFF_ROLES),
  })),
  priorities: z.array(z.enum(BRIEF_PRIORITIES)),
  /** Directions a genre can ask for. */
  genreDirections: z.record(z.array(z.enum(BRIEF_DIRECTIONS)).min(1)),
  defaultDirections: z.array(z.enum(BRIEF_DIRECTIONS)).min(1),
  approaches: z.array(BriefApproachSchema),
});
export type BriefTemplateContent = z.infer<typeof BriefTemplateSchema>;

export type ContentFamily = 'briefs' | 'events' | 'synergies';
export const CONTENT_FAMILIES: ContentFamily[] = ['briefs', 'events', 'synergies'];
