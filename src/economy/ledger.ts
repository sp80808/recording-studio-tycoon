// Studio ledger (issue #83): a small append-only journal that every money
// movement books into. All views (totals, cash flow, project P&L, runway) are
// derived from it; nothing here reads the UI and nothing edits history.
// Pure: every function returns a new state/value and never mutates its input.
import type { GameState } from '@/types/game';

export type LedgerCategory =
  | 'session-income'
  | 'deposit-income'
  | 'reward-income'
  | 'ambient-income'
  | 'staff-payroll'
  | 'staff-hiring'
  | 'freelancer-fee'
  | 'equipment-purchase'
  | 'equipment-sale'
  | 'equipment-upkeep'
  | 'equipment-repair'
  | 'premises-rent'
  | 'training'
  | 'research'
  | 'marketing'
  | 'event-cost'
  | 'other';

export interface LedgerEntry {
  id: string;
  day: number;
  category: LedgerCategory;
  /** Whole currency units. Positive = inflow, negative = outflow. */
  amount: number;
  projectId?: string;
  roomId?: string;
  staffId?: string;
  equipmentId?: string;
  /** Idempotency key: the same (category, sourceId) is only ever booked once. */
  sourceId?: string;
  memo?: string;
  /** Soft-currency movement (in-game gems only, never real money). Not part of cash totals. */
  gems?: number;
}

/** Non-cash project cost shares shown in the P&L (payroll/upkeep are already booked daily). */
export interface ProjectAllocation {
  projectId: string;
  day: number;
  kind: 'staff' | 'overhead';
  amount: number;
}

export interface LedgerState {
  /** First game day covered by the journal. Older saves start here, never earlier. */
  startDay: number;
  nextSeq: number;
  entries: LedgerEntry[];
  allocations: ProjectAllocation[];
}

export type LedgerEntryInput = Omit<LedgerEntry, 'id' | 'day'> & { day?: number };

export const INFLOW_CATEGORIES: readonly LedgerCategory[] = [
  'session-income', 'deposit-income', 'reward-income', 'ambient-income', 'equipment-sale',
];

export const CATEGORY_LABELS: Record<LedgerCategory, string> = {
  'session-income': 'Session income',
  'deposit-income': 'Deposits',
  'reward-income': 'Rewards & tours',
  'ambient-income': 'Ambient earnings',
  'staff-payroll': 'Payroll',
  'staff-hiring': 'Hiring fees',
  'freelancer-fee': 'Freelancers',
  'equipment-purchase': 'Gear purchases',
  'equipment-sale': 'Gear sales',
  'equipment-upkeep': 'Gear upkeep',
  'equipment-repair': 'Repairs',
  'premises-rent': 'Rent',
  'training': 'Training',
  'research': 'Research',
  'marketing': 'Marketing',
  'event-cost': 'Events',
  'other': 'Other',
};

const MAX_ENTRIES = 5000;

export const emptyLedger = (startDay: number): LedgerState => ({
  startDay, nextSeq: 1, entries: [], allocations: [],
});

/** Read-only accessor that tolerates legacy saves with no ledger. */
export const getLedger = (state: Pick<GameState, 'ledger' | 'currentDay'>): LedgerState =>
  state.ledger ?? emptyLedger(state.currentDay);

/**
 * Book one transaction. Returns the state unchanged (same reference) when the
 * amount is zero or the (category, sourceId) pair was already booked, so a
 * re-run reducer can never double-count. Does NOT touch `state.money`; callers
 * move cash and book in the same state update (see `spend` / `earn`).
 */
export function bookEntry<S extends Pick<GameState, 'ledger' | 'currentDay'>>(
  state: S, input: LedgerEntryInput,
): S {
  const amount = Math.round(input.amount);
  const gems = input.gems ? Math.round(input.gems) : undefined;
  if (!Number.isFinite(amount) || (amount === 0 && !gems)) return state;
  const ledger = getLedger(state);
  const key = input.sourceId ? `${input.category}:${input.sourceId}` : undefined;
  if (key && ledger.entries.some(e => e.sourceId && `${e.category}:${e.sourceId}` === key)) return state;
  const day = input.day ?? state.currentDay;
  const entry: LedgerEntry = { ...input, amount, gems, day, id: key ?? `L${ledger.nextSeq}` };
  const entries = [...ledger.entries, entry];
  return {
    ...state,
    ledger: {
      ...ledger,
      nextSeq: ledger.nextSeq + 1,
      // Oldest rows roll off; startDay moves with them so derived totals stay honest.
      entries: entries.length > MAX_ENTRIES ? entries.slice(entries.length - MAX_ENTRIES) : entries,
      startDay: entries.length > MAX_ENTRIES ? entries[entries.length - MAX_ENTRIES].day : ledger.startDay,
    },
  };
}

/** Pay out of cash and book it in one step (cost is a positive number). */
export function spend<S extends Pick<GameState, 'ledger' | 'currentDay' | 'money'>>(
  state: S, cost: number, input: Omit<LedgerEntryInput, 'amount'>,
): S {
  const next = bookEntry(state, { ...input, amount: -Math.abs(cost) });
  return next === state ? state : { ...next, money: state.money - Math.abs(Math.round(cost)) };
}

/** Take cash in and book it in one step (amount is a positive number). */
export function earn<S extends Pick<GameState, 'ledger' | 'currentDay' | 'money'>>(
  state: S, amount: number, input: Omit<LedgerEntryInput, 'amount'>,
): S {
  const next = bookEntry(state, { ...input, amount: Math.abs(amount) });
  return next === state ? state : { ...next, money: state.money + Math.abs(Math.round(amount)) };
}

/** Book an in-game gem movement (positive = gained). Cash totals are untouched. */
export function bookGems<S extends Pick<GameState, 'ledger' | 'currentDay'>>(
  state: S, gems: number, input: Omit<LedgerEntryInput, 'amount' | 'gems' | 'category'> & { category?: LedgerCategory },
): S {
  return bookEntry(state, { category: 'reward-income', ...input, amount: 0, gems });
}

export const getGemFlow = (s: HasLedger, range?: DayRange): { gained: number; spent: number } =>
  getLedger(s).entries.reduce((t, e) => {
    if (!e.gems || !inRange(e, range)) return t;
    return e.gems > 0 ? { ...t, gained: t.gained + e.gems } : { ...t, spent: t.spent - e.gems };
  }, { gained: 0, spent: 0 });

export function addAllocations<S extends Pick<GameState, 'ledger' | 'currentDay'>>(
  state: S, rows: ProjectAllocation[],
): S {
  const ledger = getLedger(state);
  const fresh = rows.filter(r => r.amount > 0 && !ledger.allocations.some(
    a => a.projectId === r.projectId && a.kind === r.kind));
  if (!fresh.length) return state;
  return { ...state, ledger: { ...ledger, allocations: [...ledger.allocations, ...fresh] } };
}

// ---- Derived views --------------------------------------------------------

type HasLedger = Pick<GameState, 'ledger' | 'currentDay'>;
export interface DayRange { from: number; to: number }

const inRange = (e: { day: number }, r?: DayRange) => !r || (e.day >= r.from && e.day <= r.to);

export const getTotalIncome = (s: HasLedger, range?: DayRange): number =>
  getLedger(s).entries.reduce((t, e) => (e.amount > 0 && inRange(e, range) ? t + e.amount : t), 0);

export const getTotalExpenses = (s: HasLedger, range?: DayRange): number =>
  getLedger(s).entries.reduce((t, e) => (e.amount < 0 && inRange(e, range) ? t - e.amount : t), 0);

export const getProfit = (s: HasLedger, range?: DayRange): number =>
  getTotalIncome(s, range) - getTotalExpenses(s, range);

/** Inflow/outflow over the last `n` game days, including today. */
export function getCashFlowForDays(s: HasLedger, n: number) {
  const range = { from: s.currentDay - Math.max(1, n) + 1, to: s.currentDay };
  const inflow = getTotalIncome(s, range);
  const outflow = getTotalExpenses(s, range);
  return { inflow, outflow, net: inflow - outflow, range };
}

/** Spend (positive number) in one category; inflow categories return income. */
export function getCategorySpend(s: HasLedger, category: LedgerCategory, range?: DayRange): number {
  return getLedger(s).entries.reduce(
    (t, e) => (e.category === category && inRange(e, range) ? t + Math.abs(e.amount) : t), 0);
}

/** Outflow by category, largest first. */
export function getCostBreakdown(s: HasLedger, range?: DayRange): { category: LedgerCategory; amount: number }[] {
  const by = new Map<LedgerCategory, number>();
  for (const e of getLedger(s).entries) {
    if (e.amount < 0 && inRange(e, range)) by.set(e.category, (by.get(e.category) ?? 0) - e.amount);
  }
  return [...by].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
}

export interface ProjectPnl {
  projectId: string;
  revenue: number;
  /** Costs booked directly against the project (freelancers, packages…). */
  directCosts: number;
  staffAllocation: number;
  overheadAllocation: number;
  contribution: number;
}

export function getProjectPnl(s: HasLedger, projectId: string): ProjectPnl {
  const ledger = getLedger(s);
  let revenue = 0;
  let directCosts = 0;
  for (const e of ledger.entries) {
    if (e.projectId !== projectId) continue;
    if (e.amount > 0) revenue += e.amount; else directCosts -= e.amount;
  }
  const alloc = (kind: ProjectAllocation['kind']) => ledger.allocations
    .filter(a => a.projectId === projectId && a.kind === kind).reduce((t, a) => t + a.amount, 0);
  const staffAllocation = alloc('staff');
  const overheadAllocation = alloc('overhead');
  return {
    projectId, revenue, directCosts, staffAllocation, overheadAllocation,
    contribution: revenue - directCosts - staffAllocation - overheadAllocation,
  };
}

export type RunwayBand = 'comfortable' | 'watch' | 'tight' | 'critical';

export interface Runway {
  cash: number;
  dailyBurn: number;
  /** Infinity when there are no fixed costs. */
  days: number;
  band: RunwayBand;
  explanation: string;
}

export const RUNWAY_BANDS: { band: RunwayBand; minDays: number }[] = [
  { band: 'comfortable', minDays: 60 },
  { band: 'watch', minDays: 30 },
  { band: 'tight', minDays: 14 },
  { band: 'critical', minDays: 0 },
];

/** Unavoidable daily burn = payroll + baseline upkeep + rent (all passed in as today's daily figure). */
export function getRunway(s: HasLedger & Pick<GameState, 'money'>, dailyFixedCosts: number): Runway {
  const dailyBurn = Math.max(0, dailyFixedCosts);
  const cash = s.money;
  let days: number;
  let explanation: string;
  if (dailyBurn <= 0) {
    days = Infinity;
    explanation = 'No fixed daily costs right now.';
  } else if (cash <= 0) {
    days = 0;
    explanation = `Cash is $${Math.round(cash).toLocaleString()} against $${Math.round(dailyBurn)}/day of payroll, rent and upkeep. Finish a session or sell gear to recover.`;
  } else {
    days = cash / dailyBurn;
    explanation = `$${Math.round(cash).toLocaleString()} cash ÷ $${Math.round(dailyBurn)}/day of payroll, rent and upkeep.`;
  }
  const band = RUNWAY_BANDS.find(b => days >= b.minDays)!.band;
  return { cash, dailyBurn, days, band, explanation };
}

/** Day-by-day net for the last `n` days (oldest first), for a chart. */
export function getDailyNetSeries(s: HasLedger, n: number): { day: number; inflow: number; outflow: number; net: number }[] {
  const from = s.currentDay - n + 1;
  const rows = Array.from({ length: n }, (_, i) => ({ day: from + i, inflow: 0, outflow: 0, net: 0 }));
  for (const e of getLedger(s).entries) {
    const row = rows[e.day - from];
    if (!row) continue;
    if (e.amount > 0) row.inflow += e.amount; else row.outflow -= e.amount;
    row.net += e.amount;
  }
  return rows;
}
