/**
 * World cue for a property lead (#250): the phone rings or someone knocks, once
 * per lead. Pure: decides what to deliver, which hotspot it belongs to and which
 * one-shot UI sounds make it, so it is testable without audio. Playback goes
 * through `gameAudio.playUISound`, which already applies the one-shot gate
 * (`oneShotPolicy.ts`): repeats of the same sound are spaced past its cooldown
 * here, and a lead is marked seen so re-renders or reloads never re-ring it.
 */
import type { GameState, GameNotification } from '@/types/game';
import { ONE_SHOT_COOLDOWN_MS, isKnownUISound, type UISoundType } from '@/utils/oneShotPolicy';
import { generatePremisesOpportunities, type PremisesSource, type PressureState } from '@/rpg/premisesPressure';

export type PremisesCueChannel = 'phone' | 'door';

export interface PremisesCueSound { sound: UISoundType; delayMs: number }

export interface PremisesCue {
  leadId: string;
  channel: PremisesCueChannel;
  /** Studio hotspot the cue belongs to (matches StudioHotspotId). */
  hotspot: 'phone' | 'door';
  line: string;
  sounds: PremisesCueSound[];
}

/** A lead with fewer days than this left is not announced; the next window brings a fresh one. */
export const MIN_DAYS_LEFT_TO_ANNOUNCE = 3;

const CHANNEL_BY_SOURCE: Record<PremisesSource, PremisesCueChannel> = {
  landlord: 'door',
  referral: 'phone',
  agent: 'phone',
  'distressed-sale': 'phone',
};

const SOUNDS_BY_CHANNEL: Record<PremisesCueChannel, PremisesCueSound[]> = {
  // Two rings.
  phone: [{ sound: 'notification', delayMs: 0 }, { sound: 'notification', delayMs: 500 }],
  // Three knocks, each past the identical-sound cooldown.
  door: [{ sound: 'tactileClick', delayMs: 0 }, { sound: 'tactileClick', delayMs: 220 }, { sound: 'tactileClick', delayMs: 440 }],
};

/** The undelivered cue for the current lead, or null (no lead, already delivered, or about to expire). */
export const getPremisesCue = (s: PressureState & Pick<Partial<GameState>, 'premisesCueSeen'>): PremisesCue | null => {
  const lead = generatePremisesOpportunities(s)[0];
  if (!lead || lead.daysLeft < MIN_DAYS_LEFT_TO_ANNOUNCE || s.premisesCueSeen === lead.id) return null;
  const channel = CHANNEL_BY_SOURCE[lead.source];
  return { leadId: lead.id, channel, hotspot: channel, line: lead.cue, sounds: SOUNDS_BY_CHANNEL[channel] };
};

/** Every sound a cue uses is a known UI sound and repeats clear the one-shot cooldown. */
export const cueSoundsRespectOneShotPolicy = (sounds: PremisesCueSound[]): boolean =>
  sounds.every((x, i) => isKnownUISound(x.sound)
    && sounds.slice(0, i).filter(y => y.sound === x.sound).every(y => x.delayMs - y.delayMs > ONE_SHOT_COOLDOWN_MS));

/** Marks the lead delivered and adds one notification carrying the line. Idempotent per lead. */
export const markPremisesCueDelivered = <S extends Pick<GameState, 'notifications'> & { premisesCueSeen?: string }>(s: S, cue: PremisesCue, now = Date.now()): S => {
  if (s.premisesCueSeen === cue.leadId) return s;
  const note: GameNotification = { id: `premises-cue-${cue.leadId}`, message: cue.line, type: 'info', timestamp: now, priority: 'medium' };
  return { ...s, premisesCueSeen: cue.leadId, notifications: [...(s.notifications ?? []), note] };
};
