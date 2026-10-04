/**
 * Service quote and deposits (#51, first slice).
 *
 * Every enquiry reads as a small quote: the service it is, how many room and staff hours it ties up, what that
 * costs, and a margin band (Thin, Fair, Strong, Premium) instead of spreadsheet maths. New clients put down a
 * deposit at booking. A deposit only moves cash earlier: the fee is unchanged and the deposit is taken off the
 * payout at settlement (the player keeps it if a bad session shrinks the fee below it).
 *
 * Pure and derived from the project and visible state; only `depositPaid` is stored, on the booked project.
 */
import type { GameState, Project } from '@/types/game';
import { getProjectBrief, SERVICE_LABELS, SERVICE_ROLE, type BriefServiceType } from '@/rpg/projectBrief';
import { freelancerFees as freelancerFeesOf, offersFor } from '@/rpg/freelancers';
import { buildBookingCalendar, remainingWorkDays } from '@/rpg/bookingCalendar';
export { REVISION_ROUND_FEE } from '@/rpg/sessionIssues';

/** Revision rounds a booking includes (#51). Mixing, mastering and full production are sold with them. */
export const REVISION_ALLOWANCE: Record<BriefServiceType, number> = {
  tracking: 0, 'vocal-production': 0, mix: 2, master: 1, 'full-production': 2,
};
/** Back-to-back sessions of the same service within this many days reuse the room's setup. */
export const SYNERGY_DAYS = 2;
export const SERVICE_LOG_CAP = 30;

/** One settled session, kept for the studio-use summary. Persisted on the save, capped. */
export interface ServiceRecord {
  projectId: string;
  service: BriefServiceType;
  roomHours: number;
  revenue: number;
  day: number;
}

export type MarginBand = 'thin' | 'fair' | 'strong' | 'premium';
export const MARGIN_LABEL: Record<MarginBand, string> = { thin: 'Thin', fair: 'Fair', strong: 'Strong', premium: 'Premium' };

/** Room hours one session takes, setup hours on top of the first session, and how much of that an engineer is present for. */
const HOURS: Record<BriefServiceType, { session: number; setup: number; staff: number }> = {
  tracking: { session: 6, setup: 2, staff: 1 },
  'vocal-production': { session: 4, setup: 1, staff: 1 },
  mix: { session: 4, setup: 1, staff: 0.7 },
  master: { session: 2, setup: 1, staff: 0.6 },
  'full-production': { session: 8, setup: 3, staff: 1 },
};
/** Room running cost per hour (power, consumables, wear), so long jobs are not free. */
export const ROOM_HOUR_COST = 30;
/** Hours in a staff working day, to turn a daily salary into an hourly cost. */
export const STAFF_DAY_HOURS = 8;
export const DEPOSIT_RATE = 0.4;
/** Clients with fewer finished sessions than this are new enough to need a deposit. */
export const TRUSTED_AFTER_SESSIONS = 2;

export interface DepositTerms {
  required: boolean;
  /** Cash paid at booking; 0 when not required. */
  amount: number;
  reason: string;
}

export interface ServiceQuote {
  service: BriefServiceType;
  serviceLabel: string;
  fee: number;
  roomHours: number;
  staffHours: number;
  /** Room running cost plus the cheapest suitable crew member's time. */
  directCosts: number;
  deadlineDays: number;
  /** Fee less direct costs. */
  margin: number;
  marginBand: MarginBand;
  deposit: DepositTerms;
  revisionAllowance: number;
  /** Fees already agreed with outside specialists (#69); part of direct costs. */
  freelancerFees: number;
  /** Cheapest outside-help option for a stage of this job, if any. Not in the margin until booked. */
  outsideHint?: { stageName: string; from: number };
  /** Setup hours saved because the last session was the same kind of work (0 when not applicable). */
  setupSavedHours: number;
}

export const marginBandFor = (fee: number, costs: number): MarginBand => {
  const ratio = fee > 0 ? (fee - costs) / fee : -1;
  return ratio < 0.3 ? 'thin' : ratio < 0.55 ? 'fair' : ratio < 0.8 ? 'strong' : 'premium';
};

export const depositFor = (state: Pick<GameState, 'clientRelationships'>, project: Project): DepositTerms => {
  if (project.labelTerms) return { required: false, amount: 0, reason: 'Label account terms: paid on delivery' };
  if (project.id.startsWith('filler-')) return { required: false, amount: 0, reason: 'Walk-in: paid on the day' };
  const sessions = project.clientId ? state.clientRelationships?.[project.clientId]?.sessionsCompleted ?? 0 : 0;
  if (sessions >= TRUSTED_AFTER_SESSIONS) return { required: false, amount: 0, reason: 'Regular client: paid on delivery' };
  const amount = Math.round(Math.max(0, project.payoutBase) * DEPOSIT_RATE);
  return { required: amount > 0, amount, reason: `New client: ${Math.round(DEPOSIT_RATE * 100)}% deposit at booking` };
};

/** Hours of setup saved when the previous settled session was the same service, recently. */
export const setupSynergyHours = (
  state: Pick<GameState, 'serviceLog' | 'currentDay'>,
  service: BriefServiceType,
): number => {
  const last = state.serviceLog?.[state.serviceLog.length - 1];
  if (!last || last.service !== service || state.currentDay - last.day > SYNERGY_DAYS) return 0;
  return Math.max(1, Math.round(HOURS[service].setup * 0.5));
};

type QuoteState = Pick<GameState, 'clientRelationships' | 'hiredStaff'> & Partial<Pick<GameState, 'serviceLog' | 'currentDay' | 'saveSeed' | 'money' | 'freelancers' | 'premisesTier'>>;

const outsideHintFor = (state: QuoteState, project: Project): ServiceQuote['outsideHint'] => {
  if (!project.stages?.length) return undefined;
  const net = { saveSeed: state.saveSeed, currentDay: state.currentDay ?? 0, money: state.money ?? 0, freelancers: state.freelancers, premisesTier: state.premisesTier, clientRelationships: state.clientRelationships, hiredStaff: state.hiredStaff };
  let best: { stageName: string; from: number } | undefined;
  for (let i = 0; i < project.stages.length; i++) {
    const offers = offersFor(net, project, i);
    if (offers[0] && (!best || offers[0].fee < best.from)) best = { stageName: project.stages[i].stageName, from: offers[0].fee };
  }
  return best;
};

export const quoteFor = (
  state: QuoteState,
  project: Project,
): ServiceQuote => {
  const service = getProjectBrief(project).serviceType;
  const h = HOURS[service];
  const sessions = remainingWorkDays(project);
  const setupSavedHours = setupSynergyHours({ serviceLog: state.serviceLog, currentDay: state.currentDay ?? 0 }, service);
  const roomHours = h.setup - setupSavedHours + sessions * h.session;
  const staffHours = Math.round(roomHours * h.staff);
  const role = SERVICE_ROLE[service];
  const salaries = (state.hiredStaff ?? []).filter((s) => s.role === role).map((s) => s.salary);
  const hourly = salaries.length ? Math.min(...salaries) / STAFF_DAY_HOURS : 0;
  const freelancerFees = freelancerFeesOf(project);
  const directCosts = Math.round(roomHours * ROOM_HOUR_COST + staffHours * hourly) + freelancerFees;
  const fee = Math.round(project.payoutBase ?? 0);
  return {
    service,
    serviceLabel: SERVICE_LABELS[service],
    fee,
    roomHours,
    staffHours,
    directCosts,
    deadlineDays: project.durationDaysTotal,
    margin: fee - directCosts,
    marginBand: marginBandFor(fee, directCosts),
    deposit: depositFor(state, project),
    revisionAllowance: REVISION_ALLOWANCE[service],
    freelancerFees,
    outsideHint: outsideHintFor(state, project),
    setupSavedHours,
  };
};

/** Cash still owed at settlement once the deposit has been taken at booking. */
export const settlementAfterDeposit = (moneyGained: number, depositPaid: number | undefined): number =>
  Math.max(0, Math.round(moneyGained) - Math.max(0, depositPaid ?? 0));

/** Append one settled session to the log, once per project, oldest rolling off. */
export const recordService = (log: ServiceRecord[] | undefined, rec: ServiceRecord): ServiceRecord[] => {
  const cur = log ?? [];
  if (cur.some((r) => r.projectId === rec.projectId)) return cur;
  return [...cur, rec].slice(-SERVICE_LOG_CAP);
};

export interface ServiceSummary {
  /** Share of this week's commercially available slots that are booked (0-1). */
  weekUtilization: number;
  /** Days this week with no booking at all. */
  idleDays: number;
  sessions: number;
  bookedHours: number;
  revenuePerHour: number;
  topServices: Array<{ service: BriefServiceType; label: string; count: number }>;
}

export const SUMMARY_DAYS = 14;

/** Studio use over the last two weeks, for the books panel. Full utilization is not the goal, so no target is shown. */
export const serviceSummary = (
  state: Pick<GameState, 'serviceLog' | 'currentDay' | 'studioRooms' | 'activeProject' | 'activeProjects'>,
): ServiceSummary => {
  const recent = (state.serviceLog ?? []).filter((r) => state.currentDay - r.day < SUMMARY_DAYS);
  const bookedHours = recent.reduce((t, r) => t + r.roomHours, 0);
  const revenue = recent.reduce((t, r) => t + r.revenue, 0);
  const counts = new Map<BriefServiceType, number>();
  for (const r of recent) counts.set(r.service, (counts.get(r.service) ?? 0) + 1);
  const cal = buildBookingCalendar(state);
  return {
    weekUtilization: cal.utilization,
    idleDays: cal.days.filter((d) => d.booked === 0).length,
    sessions: recent.length,
    bookedHours,
    revenuePerHour: bookedHours > 0 ? Math.round(revenue / bookedHours) : 0,
    topServices: [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 3)
      .map(([service, count]) => ({ service, label: SERVICE_LABELS[service], count })),
  };
};
