import type { GameState, Project, ProjectReport } from '@/types/game';
import { quoteFor } from '@/rpg/serviceQuote';
import { getProjectBrief } from '@/rpg/projectBrief';
import { telemetry } from './sink';
import { FEATURE_ORDER, resolveProducerFeatureUnlocks, type ProducerFeature } from '@/rpg/featureUnlocks';
import { durationBand, feeBand, qualityBand } from './gameplayEvents';

/** Call-site helpers: build allowlisted properties from game objects. Gameplay code imports only this and the sink. */
const enquiryProps = (state: GameState, project: Project) => {
  const q = quoteFor(state, project);
  return {
    service: q.service,
    feeBand: feeBand(q.fee),
    durationBand: durationBand(project.durationDaysTotal),
    marginBand: q.marginBand,
    deposit: q.deposit.required,
    roomsFree: (state.studioRooms ?? []).filter((r) => r.unlocked).length - [state.activeProject, ...(state.activeProjects ?? [])].filter((p) => p?.bookingRoomId).length,
  };
};

export const trackEnquiry = (kind: 'accepted' | 'declined', state: GameState, project: Project | undefined): void => {
  if (!project) return;
  telemetry.capture(kind === 'accepted' ? 'enquiry_accepted' : 'enquiry_declined', state.currentDay, enquiryProps(state, project));
};

export const trackSessionBooked = (state: GameState, project: Project, roomType?: string): void =>
  telemetry.capture('session_booked', state.currentDay, {
    service: getProjectBrief(project).serviceType,
    feeBand: feeBand(project.payoutBase ?? 0),
    roomType,
  }, project.id);

export const trackSessionSettled = (state: GameState, project: Project | undefined, report: ProjectReport): void =>
  telemetry.capture('session_settled', state.currentDay, {
    service: project ? getProjectBrief(project).serviceType : null,
    qualityBand: qualityBand(report.overallQualityScore),
    quality: report.overallQualityScore,
    feeBand: feeBand(report.moneyGained),
    deposit: Boolean(project?.depositPaid),
  }, report.projectId);

export const trackIntervention = (outcome: 'intervened' | 'delegated' | 'skipped', day: number, kind: string): void =>
  telemetry.capture(`intervention_${outcome}`, day, { kind });

export const trackEnquiriesGenerated = (day: number, projects: Project[], source: 'settlement' | 'chase'): void => {
  for (const p of projects) {
    telemetry.capture('enquiry_generated', day, {
      service: getProjectBrief(p).serviceType,
      feeBand: feeBand(p.payoutBase ?? 0),
      durationBand: durationBand(p.durationDaysTotal),
      source,
    }, p.id);
  }
};

export const trackSessionStarted = (state: GameState, project: Project, roomType?: string): void =>
  telemetry.capture('session_started', state.currentDay, {
    service: getProjectBrief(project).serviceType,
    feeBand: feeBand(project.payoutBase ?? 0),
    roomType,
  }, `started-${project.id}`);

export const trackInterventionOffered = (day: number, kind: string, offerId: string): void =>
  telemetry.capture('intervention_offered', day, { kind }, `offered-${offerId}`);

export const trackGear = (kind: 'bought' | 'sold', day: number, price: number, source?: string): void =>
  telemetry.capture(kind === 'bought' ? 'gear_bought' : 'gear_sold', day, { source, priceBand: feeBand(price) });

export const trackRoomPurchased = (state: GameState, roomId: string): void => {
  const room = (state.studioRooms ?? []).find(r => r.id === roomId);
  if (room) telemetry.capture('room_purchased', state.currentDay, { roomType: room.type }, `room-${roomId}`);
};

export const trackRelationshipTier = (day: number, from: string | undefined, to: string | undefined, clientKey: string): void => {
  if (from && to && from !== to) telemetry.capture('relationship_tier_changed', day, { from, to }, `tier-${clientKey}-${to}`);
};

export const trackEnquiryViewed = (state: GameState, project: Project): void =>
  telemetry.capture('enquiry_viewed', state.currentDay, {
    service: getProjectBrief(project).serviceType,
    feeBand: feeBand(project.payoutBase ?? 0),
    durationBand: durationBand(project.durationDaysTotal),
    roomsFree: (state.studioRooms ?? []).filter((r) => r.unlocked).length - [state.activeProject, ...(state.activeProjects ?? [])].filter((p) => p?.bookingRoomId).length,
  }, `viewed-${project.id}`);

export const trackEnquiryExpired = (day: number, project: Project): void =>
  telemetry.capture('enquiry_expired', day, {
    service: getProjectBrief(project).serviceType,
    feeBand: feeBand(project.payoutBase ?? 0),
    durationBand: durationBand(project.durationDaysTotal),
  }, `expired-${project.id}`);

export const trackRepairCompleted = (day: number, kind: string, condition: number, equipmentId: string): void =>
  telemetry.capture('repair_completed', day, {
    kind,
    condition: Math.round(condition),
  }, `repair-${equipmentId}-${day}`);


/** Progressive unlocks (#260). Idempotent per run: safe to call on every state change. */
export const trackCareerStarted = (state: GameState, experienced: boolean): void =>
  telemetry.capture('career_started', state.currentDay, { startOption: experienced ? 'experienced' : 'standard' }, `career-${state.saveSeed ?? 'x'}`);

/** Emit one `feature_unlocked` per newly earned technique, with how many sessions it took. */
export const trackFeatureUnlocks = (state: GameState): void => {
  const r = resolveProducerFeatureUnlocks(state);
  for (const f of FEATURE_ORDER) {
    if (!r[f].unlocked || !r[f].newlyUnlocked) continue;
    telemetry.capture('feature_unlocked', state.currentDay, {
      feature: f,
      sessions: state.financials?.reports?.length ?? 0,
      level: state.playerData?.level ?? 1,
    }, `unlock-${f}`);
  }
};

export const trackFeatureUsed = (day: number, feature: ProducerFeature): void =>
  telemetry.capture('feature_used', day, { feature });
