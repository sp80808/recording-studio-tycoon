/**
 * Explainable outcome forecast before booking (issue #55).
 *
 * Pure and presentation-independent. The forecast mirrors the inputs of the
 * real settlement (`generateProjectReview`) but is computed ANALYTICALLY: a
 * deterministic expected value plus a bounded spread built from the known
 * variance of each random term. It never constructs, advances or reads the
 * settlement RNG stream (`${project.id}:review:...`), so it cannot leak the
 * eventual dice roll, and it never reads market popularity for quality.
 *
 * Nothing here is persisted: callers derive it on render from visible state.
 */
import type { Equipment, GameState, PlayerData, Project, StaffMember, StudioRoom } from '@/types/game';
import { evaluateBriefFit, getProjectBrief, pickBookingRoom } from '@/rpg/projectBrief';
import { getRelevantSkillsForProject } from '@/utils/projectReviewUtils';
import { calculateStudioSkillBonus, getEquipmentBonuses, resolveSessionEquipment } from '@/utils/gameUtils';
import { getFocusEffectiveness, getMoodEffectiveness } from '@/utils/playerUtils';
import { getSettlementBonuses } from '@/utils/settlementBonuses';
import { calculateBaseWorkPoints, calculateStaffWorkContribution } from '@/utils/projectUtils';
import { gearReliabilityFacts } from '@/rpg/gearReliability';
import { setupTimeReduction, trackLevel, LEVEL_NAMES } from '@/rpg/houseStyle';
import { calculateStaffProjectFit, rankStaffForProject } from '@/utils/staffFitUtils';

export type ForecastLevel = 'low' | 'medium' | 'high';
export type ForecastImpact = 'small' | 'medium' | 'large';
export type MarginBand = 'poor' | 'thin' | 'healthy' | 'strong';

export interface ForecastReason {
  key: string;
  label: string;
  impact: ForecastImpact;
  /** One actionable way to improve, on risks only. */
  hint?: string;
}

export interface SessionForecast {
  quality: { likelyMin: number; likelyMax: number; confidence: ForecastLevel };
  time: { estimatedWorkUnits: number; lateRisk: ForecastLevel };
  economics: { expectedMargin: number; marginBand: MarginBand };
  fatigueRisk: ForecastLevel;
  positives: ForecastReason[];
  risks: ForecastReason[];
}

/** What the player is choosing between before they commit. */
export interface SessionAssignment {
  staffIds: string[];
  roomId?: string;
  approachId?: string;
}

/** Max reasons surfaced per side, and in the compact "Why?" view overall. */
export const MAX_REASONS_PER_SIDE = 3;
export const MAX_WHY_REASONS = 5;

/**
 * Assumptions about what the player will still contribute during the session.
 * These are the only play-dependent terms in the settlement, so they widen the
 * band instead of being guessed. Calibrated by tests/session-forecast.check.ts.
 */
export const FORECAST_PLAY = {
  /** Work points per work unit (stage progress is floor(points / 4)). */
  pointsPerUnitLow: 4,
  pointsPerUnitHigh: 7,
  /** Extra minigame bonus the player may add on top of what is banked (0-10 cap). */
  minigameSpread: 6,
  /** Per-stage carry from stage grades: Bronze 0 .. Gold 4. */
  carryPerStageHigh: 4,
  /** Half-width of the "likely" band in standard deviations (~85% coverage). */
  zScore: 1.45,
  /** Energy % under which a crew member counts as a fatigue risk. */
  tiredEnergy: 45,
  exhaustedEnergy: 25,
} as const;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const uniformVar = (lo: number, hi: number) => ((hi - lo) ** 2) / 12;

const impactFor = (points: number): ForecastImpact => {
  const m = Math.abs(points);
  return m >= 6 ? 'large' : m >= 3 ? 'medium' : 'small';
};

const IMPACT_RANK: Record<ForecastImpact, number> = { large: 3, medium: 2, small: 1 };

interface Candidate extends ForecastReason {
  points: number;
}

/** Build the state the real settlement would see once the assignment is made. */
function applyAssignment(state: GameState, project: Project, assignment: SessionAssignment): { state: GameState; project: Project; room?: StudioRoom; crew: StaffMember[] } {
  const ids = new Set(assignment.staffIds);
  const crew = state.hiredStaff.filter((s) => ids.has(s.id));
  const room = (state.studioRooms ?? []).find((r) => r.id === assignment.roomId && r.unlocked);
  const staged: Project = {
    ...project,
    bookingRoomId: room?.id ?? project.bookingRoomId,
    approachId: (assignment.approachId as Project['approachId']) ?? project.approachId,
  };
  const hiredStaff = state.hiredStaff.map((s) => ({ ...s, assignedProjectId: ids.has(s.id) ? project.id : s.assignedProjectId === project.id ? null : s.assignedProjectId }));
  return { state: { ...state, hiredStaff }, project: staged, room: room ?? (state.studioRooms ?? []).find((r) => r.id === staged.bookingRoomId), crew: hiredStaff.filter((s) => ids.has(s.id)) };
}

/** Sensible default: best-fit rested staff member and the room that suits the brief. */
export function defaultAssignment(state: GameState, project: Project): SessionAssignment {
  const brief = getProjectBrief(project);
  const room = pickBookingRoom(state.studioRooms ?? [], serviceRoomType(brief.serviceType), project.bookingRoomId);
  const ranked = rankStaffForProject(state.hiredStaff.filter((s) => !s.assignedProjectId || s.assignedProjectId === project.id), project);
  const lead = ranked[0]?.staff;
  return { staffIds: lead ? [lead.id] : [], roomId: 'id' in room ? room.id : undefined, approachId: project.approachId };
}

const serviceRoomType = (service: ReturnType<typeof getProjectBrief>['serviceType']): StudioRoom['type'] =>
  service === 'tracking' ? 'live-room' : service === 'vocal-production' ? 'vocal-suite' : service === 'mix' || service === 'master' ? 'mix-suite' : 'project-studio';

/**
 * Forecast quality range, delivery risk, fatigue risk and margin for a
 * candidate configuration. Same visible setup in, same forecast out.
 */
export function calculateSessionForecast(state: GameState, project: Project, assignment: SessionAssignment): SessionForecast {
  const applied = applyAssignment(state, project, assignment);
  const { crew, room } = applied;
  const staged = applied.project;
  const vstate = applied.state;
  const play = FORECAST_PLAY;

  // ---- Inputs the real settlement uses (mirrors Index.tsx handleShowProjectReview) ----
  const equipment: Equipment[] = resolveSessionEquipment(vstate, staged.bookingRoomId);
  const avgCondition = equipment.length > 0 ? equipment.reduce((s, e) => s + (e.condition ?? 100), 0) / equipment.length : 50;
  const eqBonuses = getEquipmentBonuses(equipment, project.genre);
  const equipmentQuality = clamp(Math.round(avgCondition * 0.6 + Math.min(40, eqBonuses.quality || 0) + (room?.qualityBonus || 0)), 0, 100);
  const equipBonusExtra = clamp(Math.round((eqBonuses.quality || 0) / 2 + (eqBonuses.genre || 0) / 4), 0, 10);
  const staffBonus = crew.length === 0 ? 0 : clamp(Math.round(crew.reduce((sum, s) => {
    const base = (s.primaryStats.creativity + s.primaryStats.technical) / 2;
    const affinity = s.genreAffinity && s.genreAffinity.genre === project.genre ? s.genreAffinity.bonus / 10 : 0;
    return sum + base * 0.08 * getMoodEffectiveness(s.mood) + affinity;
  }, 0) / crew.length), 0, 10);
  const genreSkill = state.studioSkills?.[project.genre];
  const studioBonus = clamp(Math.round(genreSkill ? calculateStudioSkillBonus(genreSkill, 'quality') : 0), 0, 10);
  const focusEff = getFocusEffectiveness(state);
  const focusBonus = clamp(Math.round((focusEff - 1) * 60), 0, 12);
  // Market multiplier is intentionally NOT passed: quality never reads popularity.
  const bonuses = getSettlementBonuses(vstate, staged, 1);
  const synergyBonus = clamp(Math.round(bonuses.synergyQualityBonus ?? 0), 0, 12);
  const originBonus = clamp(Math.round(bonuses.originQualityBonus ?? 0), 0, 12);
  const artistBonus = clamp(Math.round(bonuses.artistQualityBonus ?? 0), 0, 8);
  const sharedSkillBonus = Math.round((focusBonus + staffBonus + studioBonus + equipBonusExtra) / 4);

  // ---- Skill term: the lead (first crew member) or the player does the work ----
  const lead = crew[0];
  const skills = (lead ? lead.skills : state.playerData.skills) as PlayerData['skills'] | StaffMember['skills'];
  const keys = getRelevantSkillsForProject(staged, skills);
  const diffMod = (project.difficulty - 3) * 3;
  const equipBonus = Math.floor(equipmentQuality / 7);
  const synergyMean = 2; // pointsSynergyBonus is 0..5 depending on play style
  const skillScores = keys.map((k) => {
    const lvl = (skills as Record<string, { level: number }>)[k as string]?.level ?? 0;
    const contribution = lvl * 3 + Math.pow(lvl, 1.2);
    return clamp(Math.round(contribution + equipBonus + diffMod + 10 + synergyMean + sharedSkillBonus), 5, 100);
  });
  const k = Math.max(1, skillScores.length);
  const avgSkill = skillScores.length ? skillScores.reduce((a, b) => a + b, 0) / skillScores.length : 0;

  // ---- Remaining work and the play-dependent terms ----
  const remaining = staged.stages.reduce((s, st) => s + (st.completed ? 0 : Math.max(0, st.workUnitsBase - st.workUnitsCompleted)), 0);
  const stagesLeft = staged.stages.filter((st) => !st.completed).length;
  const accC = (staged.accumulatedCPoints ?? 0) + (staged.accumulatedTPoints ?? 0);
  const pfLo = clamp((accC + play.pointsPerUnitLow * remaining) / 15, 0, 15);
  const pfHi = clamp((accC + play.pointsPerUnitHigh * remaining) / 15, 0, 15);
  const mg0 = clamp(staged.minigamePoints ?? 0, 0, 10);
  const mgHi = clamp(mg0 + play.minigameSpread, 0, 10);
  const bankedCarry = (staged.stageGrades ?? []).reduce((s, g) => s + ({ Gold: 4, Silver: 2, Bronze: 0 }[g] ?? 0), 0);
  const carryHi = clamp(bankedCarry + stagesLeft * play.carryPerStageHigh, 0, 12);
  const carryLo = clamp(bankedCarry, 0, 12);

  const fixed = avgSkill * 0.5 + staged.difficulty * 1.5 + focusBonus + staffBonus + studioBonus + equipBonusExtra + synergyBonus + originBonus + artistBonus;
  const mean = fixed + (pfLo + pfHi) / 2 + (mg0 + mgHi) / 2 + (carryLo + carryHi) / 2 + -0.5; // final randomInt(-5, 4) has mean -0.5
  const variance =
    (10 / k) * 0.25 + // average of k per-skill randomInt(5, 15) terms, halved
    (uniformVar(0, 5) / k) * 0.25 +
    uniformVar(pfLo, pfHi) +
    uniformVar(mg0, mgHi) +
    uniformVar(carryLo, carryHi) +
    8.25; // variance of randomInt(-5, 4)
  const half = play.zScore * Math.sqrt(variance);
  const likelyMin = clamp(Math.round(mean - half), 0, 100);
  const likelyMax = clamp(Math.round(mean + half), 0, 100);
  const width = likelyMax - likelyMin;
  const confidence: ForecastLevel = width <= 12 ? 'high' : width <= 18 ? 'medium' : 'low';

  // ---- Time: attended sessions needed versus the booked duration ----
  const attrs = state.playerData.attributes;
  const capacity = attrs.focusMastery + 3;
  const base = calculateBaseWorkPoints(capacity, attrs);
  const focusSplit = staged.focusAllocation ?? { performance: 33, soundCapture: 33, layering: 34 };
  const sessionPoints = calculateStaffWorkContribution(
    {
      creativity: Math.floor(base.creativity * focusEff * (focusSplit.performance / 100 * 0.8 + focusSplit.layering / 100 * 0.6)),
      technical: Math.floor(base.technical * focusEff * (focusSplit.soundCapture / 100 * 0.8 + focusSplit.layering / 100 * 0.4)),
    },
    crew,
    project.genre,
    getMoodEffectiveness,
  );
  const unitsPerSession = Math.max(1, Math.floor((Math.max(1, Math.round(sessionPoints.creativity)) + Math.max(1, Math.round(sessionPoints.technical))) / 4));
  // House style (#71): a familiar setup shaves the work estimate. Time only, never quality.
  const houseBrief = getProjectBrief(staged);
  const setupCut = setupTimeReduction(state.studioExpertise, project.genre, houseBrief.serviceType);
  const remainingWork = Math.ceil(remaining * (1 - setupCut));
  const sessionsNeeded = Math.ceil(remainingWork / unitsPerSession);
  const pressure = sessionsNeeded / Math.max(1, project.durationDaysTotal);
  const lateRisk: ForecastLevel = pressure <= 0.6 ? 'low' : pressure <= 0.9 ? 'medium' : 'high';

  // ---- Fatigue ----
  const minEnergy = crew.length ? Math.min(...crew.map((s) => s.energy)) : 100;
  const fatigueRisk: ForecastLevel = minEnergy < play.exhaustedEnergy ? 'high' : minEnergy < play.tiredEnergy ? 'medium' : 'low';

  // ---- Economics: payout at the mid forecast, less the crew time it ties up ----
  const midQuality = (likelyMin + likelyMax) / 2;
  const payout = project.payoutBase * (0.5 + (midQuality / 100) * 1.5) * (1 + (project.difficulty - 1) * 0.08);
  const crewCost = crew.reduce((s, m) => s + m.salary, 0) * Math.max(1, project.durationDaysTotal);
  const expectedMargin = Math.round(payout - crewCost);
  const ratio = payout > 0 ? expectedMargin / payout : -1;
  const marginBand: MarginBand = ratio < 0.15 ? 'poor' : ratio < 0.4 ? 'thin' : ratio < 0.7 ? 'healthy' : 'strong';

  // ---- Reasons (every term above that moves the band appears here) ----
  const cands: Candidate[] = [];
  const add = (c: Candidate) => cands.push(c);

  if (lead) {
    const fit = calculateStaffProjectFit(lead, staged);
    const skillName = fit.stageSkill.replace(/([A-Z])/g, ' $1').toLowerCase();
    const pts = (fit.score - 45) / 8;
    if (fit.score >= 55) add({ key: 'staff-fit', label: `${lead.name} is strong at ${skillName}`, impact: impactFor(pts), points: pts });
    else if (fit.score < 35) add({ key: 'staff-fit', label: `${lead.name} is a weak fit for ${skillName}`, impact: impactFor(pts), points: pts, hint: 'Pick a crew member stronger at this stage.' });
  } else if (state.hiredStaff.length > 0) {
    add({ key: 'no-crew', label: 'Nobody assigned: you carry the session alone', impact: 'small', points: -1, hint: 'Assign a rested staff member.' });
  }
  const tired = crew.filter((s) => s.energy < play.tiredEnergy).sort((a, b) => a.energy - b.energy)[0];
  if (tired) {
    const pts = -(play.tiredEnergy - tired.energy) / 6;
    add({ key: 'crew-energy', label: `${tired.name} is already at ${Math.round(tired.energy)}% energy`, impact: tired.energy < play.exhaustedEnergy ? 'large' : 'medium', points: pts, hint: 'Swap in a rested crew member or rest first.' });
  }
  const grumpy = crew.find((s) => s.mood < 40);
  if (grumpy) add({ key: 'crew-mood', label: `${grumpy.name}'s mood is low`, impact: 'medium', points: -3, hint: 'Boost morale before booking.' });

  const brief = getProjectBrief(staged);
  const fit = evaluateBriefFit(brief, {
    room: room ?? { type: 'project-studio', name: 'Project Studio' },
    staff: crew,
    equipment,
    clientId: project.clientId,
    clientSessions: project.clientId ? state.clientRelationships?.[project.clientId]?.sessionsCompleted ?? 0 : 0,
    approachId: staged.approachId,
  });
  (fit.effects ?? []).forEach((e, i) => {
    if (e.delta === 0) return;
    const pts = e.delta / 3; // the real multiplier is bounded, so brief fit moves the forecast gently
    add({ key: `brief-${i}`, label: e.reason, impact: impactFor(pts * 2), points: pts, ...(e.delta < 0 ? { hint: 'Change room, crew or approach to match the brief.' } : {}) });
  });

  if (equipment.length > 0 && avgCondition < 60) {
    add({ key: 'gear-worn', label: `Room gear is worn (${Math.round(avgCondition)}% condition)`, impact: avgCondition < 40 ? 'large' : 'medium', points: -(60 - avgCondition) / 8, hint: 'Service or replace tired gear.' });
  } else if (equipBonusExtra >= 5) {
    add({ key: 'gear-bonus', label: 'The gear chain is a real asset here', impact: impactFor(equipBonusExtra), points: equipBonusExtra });
  }
  for (const fact of gearReliabilityFacts(vstate, equipment)) add({ key: fact.key, label: fact.label, impact: fact.impact, points: fact.points, ...(fact.hint ? { hint: fact.hint } : {}) });
  if (equipment.length === 0) add({ key: 'gear-none', label: 'No gear seated for this room', impact: 'medium', points: -4, hint: 'Seat gear in the booked room.' });

  if (setupCut > 0) {
    const lvl = Math.max(trackLevel(state.studioExpertise, 'genres', project.genre), trackLevel(state.studioExpertise, 'services', houseBrief.serviceType));
    add({ key: 'house-style', label: `${LEVEL_NAMES[lvl]} at this kind of work: setup runs quicker`, impact: 'small', points: setupCut * 20 });
  }
  if (studioBonus >= 3) add({ key: 'studio-skill', label: `Your studio's ${project.genre} experience helps`, impact: impactFor(studioBonus), points: studioBonus });
  if (synergyBonus >= 3) add({ key: 'synergy', label: 'Studio synergies are active for this setup', impact: impactFor(synergyBonus), points: synergyBonus });
  if (originBonus >= 3) add({ key: 'origin', label: `Your background suits ${project.genre}`, impact: impactFor(originBonus), points: originBonus });
  if (artistBonus >= 3) add({ key: 'artist', label: 'A signed artist lifts the session', impact: impactFor(artistBonus), points: artistBonus });

  const skillGap = project.difficulty - Math.round(avgSkill / 12);
  if (avgSkill > 0 && skillGap >= 3) add({ key: 'skill-gap', label: `Difficulty ${project.difficulty} outpaces ${lead ? `${lead.name}'s` : 'your'} skills`, impact: impactFor(skillGap), points: -skillGap, hint: 'Assign a more skilled crew member or take an easier gig first.' });

  if (lateRisk !== 'low') add({ key: 'deadline', label: `Tight deadline: about ${sessionsNeeded} sessions for ${project.durationDaysTotal} days`, impact: lateRisk === 'high' ? 'large' : 'medium', points: lateRisk === 'high' ? -6 : -3, hint: 'Add faster crew or pick a longer booking.' });
  if (marginBand === 'poor') add({ key: 'margin', label: 'Crew cost eats most of the fee', impact: 'medium', points: -3, hint: 'Skip the extra crew on this one.' });

  const positives = cands.filter((c) => c.points > 0 && !c.hint).sort(byImpact).slice(0, MAX_REASONS_PER_SIDE).map(strip);
  const risks = cands.filter((c) => c.points < 0).sort(byImpact).slice(0, MAX_REASONS_PER_SIDE).map(strip);

  return {
    quality: { likelyMin: Math.min(likelyMin, likelyMax), likelyMax, confidence },
    time: { estimatedWorkUnits: remainingWork, lateRisk },
    economics: { expectedMargin, marginBand },
    fatigueRisk,
    positives,
    risks,
  };
}

const byImpact = (a: Candidate, b: Candidate) => IMPACT_RANK[b.impact] - IMPACT_RANK[a.impact] || Math.abs(b.points) - Math.abs(a.points) || a.key.localeCompare(b.key);
const strip = ({ points: _points, ...reason }: Candidate): ForecastReason => reason;

/** The compact "Why?" list: at most five reasons, strongest first, risks and positives interleaved. */
export function whyReasons(f: SessionForecast): { reason: ForecastReason; kind: 'positive' | 'risk' }[] {
  const all = [
    ...f.positives.map((reason) => ({ reason, kind: 'positive' as const })),
    ...f.risks.map((reason) => ({ reason, kind: 'risk' as const })),
  ].sort((a, b) => IMPACT_RANK[b.reason.impact] - IMPACT_RANK[a.reason.impact]);
  return all.slice(0, MAX_WHY_REASONS);
}

/** The single most useful fix for a poor forecast, if any. */
export function topImprovement(f: SessionForecast): string | undefined {
  return f.risks.find((r) => r.hint)?.hint;
}

export interface BookingStakeOptions {
  /** Signal-chain composer state for this enquiry (booking-time pick). */
  chainState?: 'none' | 'valid' | 'broken';
  /** Contract stake riding on this booking. */
  stake?: string | null;
}

/**
 * Booking-time extension: chain validity and contract stake nudge the
 * assignment forecast. Same picks in, same numbers out; resolution RNG
 * untouched. Reasons stay capped per side so cards never sprawl.
 */
export function withBookingStakes(base: SessionForecast, options?: BookingStakeOptions): SessionForecast {
  const chainState = options?.chainState ?? 'none';
  const stake = (options?.stake ?? 'safe').toLowerCase();
  if (chainState === 'none' && (stake === 'safe' || stake === '')) return base;

  const qualityShift =
    (chainState === 'valid' ? 3 : chainState === 'broken' ? -4 : 0) +
    (stake === 'ambitious' ? 2 : stake === 'moonshot' ? 4 : 0);
  const widthShift = stake === 'ambitious' ? 2 : stake === 'moonshot' ? 3.5 : 0;

  const span = base.quality.likelyMax - base.quality.likelyMin;
  const mid = (base.quality.likelyMin + base.quality.likelyMax) / 2 + qualityShift;
  const half = Math.max(2.5, Math.min(14, span / 2 + widthShift));
  const likelyMin = clamp(Math.round(mid - half), 0, 100);
  let likelyMax = clamp(Math.round(mid + half * 0.9), 0, 100);
  if (likelyMax <= likelyMin) likelyMax = clamp(likelyMin + 2, 0, 100);
  const width = likelyMax - likelyMin;
  const confidence: ForecastLevel = width <= 12 ? 'high' : width <= 18 ? 'medium' : 'low';

  const lateScore =
    (base.time.lateRisk === 'low' ? 3 : base.time.lateRisk === 'medium' ? 6.5 : 9) +
    (stake === 'ambitious' ? 1 : stake === 'moonshot' ? 2 : 0) +
    (chainState === 'broken' ? 1 : 0);
  const lateRisk: ForecastLevel = lateScore < 5 ? 'low' : lateScore < 8 ? 'medium' : 'high';

  const positives: ForecastReason[] = [...base.positives];
  const risks: ForecastReason[] = [...base.risks];
  if (chainState === 'valid') positives.unshift({ key: 'chain', label: 'Signal chain tested and valid', impact: 'small' });
  if (chainState === 'broken') {
    risks.unshift({ key: 'chain', label: 'Signal chain has unresolved clashes', impact: 'medium', hint: 'Fix the chain before booking.' });
  }
  if (stake === 'ambitious') risks.unshift({ key: 'stake', label: 'Ambitious stake raises the ceiling — and the risk', impact: 'small' });
  if (stake === 'moonshot') risks.unshift({ key: 'stake', label: 'Moonshot stake: big payout or big miss', impact: 'medium' });

  return {
    quality: { likelyMin, likelyMax, confidence },
    time: { estimatedWorkUnits: base.time.estimatedWorkUnits, lateRisk },
    economics: base.economics,
    fatigueRisk: base.fatigueRisk,
    positives: positives.slice(0, MAX_REASONS_PER_SIDE),
    risks: risks.slice(0, MAX_REASONS_PER_SIDE),
  };
}
