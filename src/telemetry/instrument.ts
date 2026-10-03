import type { GameState, Project, ProjectReport } from '@/types/game';
import { quoteFor } from '@/rpg/serviceQuote';
import { getProjectBrief } from '@/rpg/projectBrief';
import { telemetry } from './sink';
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
