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
import { remainingWorkDays } from '@/rpg/bookingCalendar';

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

export const quoteFor = (
  state: Pick<GameState, 'clientRelationships' | 'hiredStaff'>,
  project: Project,
): ServiceQuote => {
  const service = getProjectBrief(project).serviceType;
  const h = HOURS[service];
  const sessions = remainingWorkDays(project);
  const roomHours = h.setup + sessions * h.session;
  const staffHours = Math.round(roomHours * h.staff);
  const role = SERVICE_ROLE[service];
  const salaries = (state.hiredStaff ?? []).filter((s) => s.role === role).map((s) => s.salary);
  const hourly = salaries.length ? Math.min(...salaries) / STAFF_DAY_HOURS : 0;
  const directCosts = Math.round(roomHours * ROOM_HOUR_COST + staffHours * hourly);
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
  };
};

/** Cash still owed at settlement once the deposit has been taken at booking. */
export const settlementAfterDeposit = (moneyGained: number, depositPaid: number | undefined): number =>
  Math.max(0, Math.round(moneyGained) - Math.max(0, depositPaid ?? 0));
