/**
 * Explainable booking forecast (GH #55).
 * Pure, deterministic, presentation-independent.
 * Analytical expected value + bounded variance — never simulates the real
 * resolution RNG, so the player sees risk, not tomorrow's dice roll.
 */
import type { Equipment, GameState, Project, StaffMember } from '@/types/game';

export type ForecastConfidence = 'low' | 'medium' | 'high';
export type RiskBand = 'low' | 'medium' | 'high';
export type MarginBand = 'poor' | 'thin' | 'healthy' | 'strong';

export interface ForecastReason {
  key: string;
  label: string;
  impact: 'small' | 'medium' | 'large';
}

export interface SessionForecast {
  quality: {
    likelyMin: number;
    likelyMax: number;
    confidence: ForecastConfidence;
  };
  time: {
    estimatedDays: number;
    lateRisk: RiskBand;
  };
  economics: {
    expectedMargin: number;
    marginBand: MarginBand;
  };
  fatigueRisk: RiskBand;
  positives: ForecastReason[];
  risks: ForecastReason[];
}

export interface SessionForecastInput {
  difficulty: number; // 1..10
  matchRating: 'Poor' | 'Good' | 'Excellent';
  durationDays: number;
  payout: number;
  genre: string;
  clientSessions: number;
  staff: Array<{
    energy: number;
    mood: number;
    technical: number;
    creativity: number;
    speed: number;
    genreBonus: number;
  }>;
  avgGearCondition: number; // 0..100
  worstGearCondition: number; // 0..100
  gearQualityBonus: number;
  roomTier: number; // 1..5
  workload: number; // 0 idle, 1 occupied
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const avg = (xs: number[], fallback: number): number =>
  xs.length === 0 ? fallback : xs.reduce((a, b) => a + b, 0) / xs.length;

export function forecastSession(input: SessionForecastInput): SessionForecast {
  const difficulty = clamp(Math.round(input.difficulty || 1), 1, 10);
  const durationDays = Math.max(1, Math.round(input.durationDays || 1));
  const payout = Math.max(0, Math.round(input.payout || 0));
  const roomTier = clamp(Math.round(input.roomTier || 1), 1, 5);
  const clientSessions = Math.max(0, Math.floor(input.clientSessions || 0));
  const workload = input.workload > 0 ? 1 : 0;

  const staff = input.staff ?? [];
  const avgTech = avg(staff.map((s) => s.technical), 32);
  const avgSpeed = avg(staff.map((s) => s.speed), 45);
  const avgEnergy = avg(staff.map((s) => s.energy), staff.length === 0 ? 65 : 50);
  const bestGenre = staff.reduce((best, s) => Math.max(best, s.genreBonus || 0), 0);
  const avgCond = clamp(input.avgGearCondition ?? 75, 0, 100);
  const worstCond = clamp(input.worstGearCondition ?? 75, 0, 100);
  const gearQ = clamp(input.gearQualityBonus || 0, -4, 6);

  // ---- Quality expectation (analytical, bounded) ----
  let q = 62;
  q += input.matchRating === 'Excellent' ? 9 : input.matchRating === 'Good' ? 4 : -9;
  q += (10 - difficulty) * 1.6;
  q += (avgTech - 35) * 0.28;
  q += gearQ;
  q += (avgCond - 70) * 0.12;
  q += (roomTier - 1) * 1.2;
  q += Math.min(6, clientSessions * 1.5);
  q -= Math.max(0, 45 - avgEnergy) * 0.3;
  q -= workload * 3;
  const expected = clamp(Math.round(q), 18, 97);

  let halfWidth =
    5.5 +
    difficulty * 0.35 +
    Math.max(0, 60 - avgEnergy) * 0.04 +
    Math.max(0, 70 - worstCond) * 0.05 +
    (staff.length === 0 ? 1.5 : 0);
  halfWidth = clamp(halfWidth, 5, 12);

  const likelyMin = clamp(Math.round(expected - halfWidth), 5, 99);
  let likelyMax = clamp(Math.round(expected + halfWidth * 0.9), 5, 99);
  if (likelyMax <= likelyMin) likelyMax = clamp(likelyMin + 2, 5, 99);

  let confidence: ForecastConfidence = halfWidth <= 6.5 ? 'high' : halfWidth <= 9 ? 'medium' : 'low';
  if (staff.length === 0 && difficulty >= 6 && confidence === 'high') confidence = 'medium';

  // ---- Time ----
  const estimatedDays = Math.max(
    1,
    Math.round(durationDays + (difficulty - 5) * 0.2 - (avgSpeed - 50) * 0.02),
  );
  const lateScore =
    difficulty * 1.0 +
    workload * 3 +
    Math.max(0, 50 - avgEnergy) * 0.08 +
    Math.max(0, 60 - worstCond) * 0.03 -
    (roomTier - 1) * 0.5 -
    Math.min(3, clientSessions * 0.5);
  const lateRisk: RiskBand = lateScore < 5 ? 'low' : lateScore < 8 ? 'medium' : 'high';

  // ---- Economics (rough daily burn, deterministic) ----
  const dailyCost = 160 + (roomTier - 1) * 35 + staff.length * 25;
  const expectedMargin = Math.round(payout - durationDays * dailyCost);
  const marginBand: MarginBand =
    expectedMargin < 0 ? 'poor' : expectedMargin < 700 ? 'thin' : expectedMargin < 1800 ? 'healthy' : 'strong';

  // ---- Fatigue ----
  const fatigueScore =
    durationDays * 0.8 + workload * 2.5 + Math.max(0, 55 - avgEnergy) * 0.15 + (difficulty >= 7 ? 1.5 : 0);
  const fatigueRisk: RiskBand = fatigueScore < 4 ? 'low' : fatigueScore < 7 ? 'medium' : 'high';

  // ---- Reasons (strongest causes only, max 3 each) ----
  const positives: ForecastReason[] = [];
  const risks: ForecastReason[] = [];

  if (input.matchRating === 'Excellent') {
    positives.push({ key: 'fit', label: 'Strong studio fit for this brief', impact: 'large' });
  } else if (input.matchRating === 'Good') {
    positives.push({ key: 'fit', label: 'Good fit for this brief', impact: 'medium' });
  } else {
    risks.push({ key: 'fit', label: 'Stretch booking for current level', impact: 'large' });
  }

  if (avgTech >= 60) {
    positives.push({ key: 'crew-tech', label: 'Technical crew well matched', impact: avgTech >= 75 ? 'large' : 'medium' });
  } else if (avgTech <= 30) {
    risks.push({ key: 'crew-tech', label: 'Crew technique may limit quality', impact: 'medium' });
  }

  if (bestGenre >= 10) {
    positives.push({ key: 'genre', label: 'Genre affinity suits this brief', impact: bestGenre >= 20 ? 'medium' : 'small' });
  }

  if (clientSessions >= 2) {
    positives.push({ key: 'familiarity', label: `Returning client — familiar workflow (${clientSessions} prior sessions)`, impact: 'medium' });
  } else if (clientSessions === 1) {
    positives.push({ key: 'familiarity', label: 'Returning client — some familiarity', impact: 'small' });
  }

  if (roomTier >= 3 && difficulty >= 5) {
    positives.push({ key: 'room', label: 'Room tier suits demanding sessions', impact: 'small' });
  }
  if (roomTier <= 1 && difficulty >= 6) {
    risks.push({ key: 'room', label: 'Home set-up stretched by this brief', impact: 'medium' });
  }

  if (worstCond < 35) {
    risks.push({ key: 'gear', label: 'Worn gear may introduce noise', impact: 'large' });
  } else if (avgCond >= 80) {
    positives.push({ key: 'gear', label: 'Well-kept signal chain', impact: 'small' });
  } else if (avgCond < 55) {
    risks.push({ key: 'gear', label: 'Tired equipment needs attention', impact: 'medium' });
  }

  if (avgEnergy < 38) {
    risks.push({ key: 'energy', label: 'Crew energy low — fatigue risk', impact: 'large' });
  } else if (avgEnergy >= 70) {
    positives.push({ key: 'energy', label: 'Crew rested and ready', impact: 'small' });
  }

  if (workload >= 1) {
    risks.push({ key: 'workload', label: 'Studio occupied — split attention', impact: 'medium' });
  }

  if (marginBand === 'poor') {
    risks.push({ key: 'margin', label: 'Thin margin after daily costs', impact: 'medium' });
  }

  return {
    quality: { likelyMin, likelyMax, confidence },
    time: { estimatedDays, lateRisk },
    economics: { expectedMargin, marginBand },
    fatigueRisk,
    positives: positives.slice(0, 3),
    risks: risks.slice(0, 3),
  };
}

export interface BookingForecastOptions {
  /** An explicit production approach is picked on the enquiry card. */
  approachId?: string | null;
  /** Signal-chain composer state for this enquiry. */
  chainState?: 'none' | 'valid' | 'broken';
  /** Contract stake riding on this booking. */
  stake?: string | null;
}

export function forecastSessionForBooking(project: Project, state: GameState, options?: BookingForecastOptions): SessionForecast {
  const staffList: StaffMember[] = state.hiredStaff ?? [];
  const staff = staffList.map((s) => ({
    energy: s.energy ?? 50,
    mood: s.mood ?? 50,
    technical: s.primaryStats?.technical ?? 30,
    creativity: s.primaryStats?.creativity ?? 30,
    speed: s.primaryStats?.speed ?? 40,
    genreBonus:
      s.genreAffinity && project.genre && s.genreAffinity.genre.toLowerCase() === project.genre.toLowerCase()
        ? s.genreAffinity.bonus ?? 0
        : 0,
  }));

  const gear: Equipment[] = state.ownedEquipment ?? [];
  const conditions = gear.map((g) => (typeof g.condition === 'number' ? g.condition : 75));
  const avgGearCondition = conditions.length > 0 ? conditions.reduce((a, b) => a + b, 0) / conditions.length : 75;
  const worstGearCondition = conditions.length > 0 ? Math.min(...conditions) : 75;
  const gearQualityBonus = gear.reduce((sum, g) => sum + (g.bonuses?.qualityBonus ?? 0), 0);

  const roomTier = clamp(Math.round(state.studioLevel ?? state.studioTier ?? 1), 1, 5);
  const clientSessions =
    project.clientId && state.clientRelationships?.[project.clientId]?.sessionsCompleted
      ? state.clientRelationships[project.clientId].sessionsCompleted
      : 0;
  const workload =
    state.activeProject || (Array.isArray(state.activeProjects) && state.activeProjects.length > 0) ? 1 : 0;

  const base = forecastSession({
    difficulty: project.difficulty ?? 3,
    matchRating: project.matchRating ?? 'Good',
    durationDays: project.durationDaysTotal ?? 3,
    payout: project.payoutBase ?? 0,
    genre: project.genre ?? '',
    clientSessions,
    staff,
    avgGearCondition,
    worstGearCondition,
    gearQualityBonus,
    roomTier,
    workload,
  });

  if (!options) return base;

  // Booking picks nudge the analytical forecast — same picks always give the
  // same numbers, and nothing here touches resolution RNG.
  const hasApproach = Boolean(options.approachId);
  const chainState = options.chainState ?? 'none';
  const stake = (options.stake ?? 'safe').toLowerCase();
  if (!hasApproach && chainState === 'none' && (stake === 'safe' || stake === '')) return base;

  const qualityShift =
    (hasApproach ? 2 : 0) +
    (chainState === 'valid' ? 3 : chainState === 'broken' ? -4 : 0) +
    (stake === 'ambitious' ? 2 : stake === 'moonshot' ? 4 : 0);
  const widthShift =
    (hasApproach ? -0.5 : 0) + (stake === 'ambitious' ? 2 : stake === 'moonshot' ? 3.5 : 0);

  const span = base.quality.likelyMax - base.quality.likelyMin;
  const mid = (base.quality.likelyMin + base.quality.likelyMax) / 2 + qualityShift;
  const half = Math.max(2.5, Math.min(13, span / 2 + widthShift));
  const likelyMin = clamp(Math.round(mid - half), 5, 99);
  let likelyMax = clamp(Math.round(mid + half * 0.9), 5, 99);
  if (likelyMax <= likelyMin) likelyMax = clamp(likelyMin + 2, 5, 99);
  const confidence: ForecastConfidence = half <= 6.5 ? 'high' : half <= 9 ? 'medium' : 'low';

  const lateBump = (stake === 'ambitious' ? 1 : stake === 'moonshot' ? 2 : 0) + (chainState === 'broken' ? 1 : 0);
  const lateScore =
    (base.time.lateRisk === 'low' ? 3 : base.time.lateRisk === 'medium' ? 6.5 : 9) + lateBump;
  const lateRisk: RiskBand = lateScore < 5 ? 'low' : lateScore < 8 ? 'medium' : 'high';

  const positives: ForecastReason[] = [...base.positives];
  const risks: ForecastReason[] = [...base.risks];
  if (hasApproach) positives.unshift({ key: 'approach', label: 'Chosen approach focuses the session', impact: 'small' });
  if (chainState === 'valid') positives.unshift({ key: 'chain', label: 'Signal chain tested and valid', impact: 'small' });
  if (chainState === 'broken') risks.unshift({ key: 'chain', label: 'Signal chain has unresolved clashes', impact: 'medium' });
  if (stake === 'ambitious') risks.unshift({ key: 'stake', label: 'Ambitious stake raises the ceiling — and the risk', impact: 'small' });
  if (stake === 'moonshot') risks.unshift({ key: 'stake', label: 'Moonshot stake: big payout or big miss', impact: 'medium' });

  return {
    quality: { likelyMin, likelyMax, confidence },
    time: { estimatedDays: base.time.estimatedDays, lateRisk },
    economics: base.economics,
    fatigueRisk: base.fatigueRisk,
    positives: positives.slice(0, 3),
    risks: risks.slice(0, 3),
  };
}
