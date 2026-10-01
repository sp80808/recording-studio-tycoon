/**
 * Outcome forecast (#55): determinism, anti-exploit, reasons and a 1,000-seed
 * calibration against the real generateProjectReview settlement.
 */
import { calculateSessionForecast, defaultAssignment, whyReasons, topImprovement, FORECAST_PLAY, MAX_REASONS_PER_SIDE, MAX_WHY_REASONS, type SessionAssignment, type SessionForecast } from '../src/rpg/sessionForecast';
import { createNewGameState } from '../src/utils/newGameState';
import { initializeSkillsStaff } from '../src/utils/skillUtils';
import { generateProjectReview } from '../src/utils/projectReviewUtils';
import { createSeededRandom, randomInt } from '../src/simulation/seededRandom';
import { getEquipmentBonuses, calculateStudioSkillBonus, resolveSessionEquipment } from '../src/utils/gameUtils';
import { getFocusEffectiveness, getMoodEffectiveness } from '../src/utils/playerUtils';
import { getSettlementBonuses } from '../src/utils/settlementBonuses';
import { getBookedStudioRoom } from '../src/utils/studioRoomUtils';
import type { GameState, Project, StaffMember, StudioRoom } from '../src/types/game';

let passed = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); passed++; console.log(`PASS: ${m}`); };

const stage = (name: string, units: number) => ({ stageName: name, focusAreas: [], workUnitsBase: units, workUnitsCompleted: 0, completed: false });
const mkProject = (over: Partial<Project> = {}): Project => ({
  id: 'fx-1', title: 'Fixture', genre: 'Soul', clientType: 'Independent', difficulty: 3, durationDaysTotal: 6, payoutBase: 1500, repGainBase: 20,
  requiredSkills: { Soul: 1 }, stages: [stage('Vocal Tracking', 10), stage('Warm Mix', 10), stage('Master', 6)], matchRating: 'Good',
  accumulatedCPoints: 0, accumulatedTPoints: 0, currentStageIndex: 0, completedStages: [], workSessionCount: 0, stake: 'safe',
  focusAllocation: { performance: 33, soundCapture: 33, layering: 34 }, ...over,
});
const mkStaff = (id: string, over: Partial<StaffMember> = {}): StaffMember => {
  const skills = initializeSkillsStaff();
  return {
    id, name: id, role: 'Engineer', primaryStats: { creativity: 40, technical: 45, speed: 40 }, xpInRole: 0, levelInRole: 1,
    genreAffinity: { genre: 'Soul', bonus: 30 }, energy: 90, mood: 80, salary: 40, status: 'Idle', assignedProjectId: null, skills, ...over,
  } as StaffMember;
};
const withLevels = (s: StaffMember, level: number): StaffMember => {
  const skills = { ...s.skills } as Record<string, { level: number }>;
  for (const k of Object.keys(skills)) skills[k] = { ...skills[k], level };
  return { ...s, skills: skills as unknown as StaffMember['skills'] };
};
const baseState = (): GameState => {
  const g = createNewGameState();
  return { ...g, hiredStaff: [withLevels(mkStaff('Sam'), 3), withLevels(mkStaff('Tired', { energy: 30 }), 3), withLevels(mkStaff('Rookie', { primaryStats: { creativity: 10, technical: 10, speed: 10 }, genreAffinity: undefined }), 0)] };
};

const state = baseState();
const project = mkProject();
const rooms = state.studioRooms;
const roomId = rooms.find((r) => r.unlocked)!.id;
const sam: SessionAssignment = { staffIds: ['Sam'], roomId };

// ---- Determinism and shape ----
const f1 = calculateSessionForecast(state, project, sam);
const f2 = calculateSessionForecast(state, project, sam);
ok(JSON.stringify(f1) === JSON.stringify(f2), 'same visible setup gives an identical forecast');
ok(f1.quality.likelyMin <= f1.quality.likelyMax && f1.quality.likelyMin >= 0 && f1.quality.likelyMax <= 100, 'quality band is ordered and bounded 0-100');
ok(['low', 'medium', 'high'].includes(f1.quality.confidence) && ['low', 'medium', 'high'].includes(f1.time.lateRisk) && ['low', 'medium', 'high'].includes(f1.fatigueRisk), 'levels use the documented vocabulary');
ok(f1.time.estimatedWorkUnits === 26, 'estimated work units sum the remaining stage units');
ok(f1.positives.length <= MAX_REASONS_PER_SIDE && f1.risks.length <= MAX_REASONS_PER_SIDE && whyReasons(f1).length <= MAX_WHY_REASONS, 'reasons are capped');
ok([...f1.positives, ...f1.risks].every((r) => r.label.length > 0 && r.key.length > 0 && ['small', 'medium', 'large'].includes(r.impact)), 'reasons are human readable');

// ---- Does not touch the state or the settlement RNG ----
const snapshot = JSON.stringify(state);
const origRandom = Math.random;
let randomCalls = 0;
Math.random = () => { randomCalls++; return origRandom(); };
calculateSessionForecast(state, project, sam);
Math.random = origRandom;
ok(randomCalls === 0, 'forecast never calls Math.random');
ok(JSON.stringify(state) === snapshot, 'forecast does not mutate state');
const reviewOnce = () => JSON.stringify(generateProjectReview(project, { type: 'player', id: 'player', name: 'You' }, 60, state.playerData, state.hiredStaff));
const before = reviewOnce();
calculateSessionForecast(state, project, sam);
ok(reviewOnce() === before, 'final outcome for the same inputs is unchanged by forecasting');

// ---- Market popularity never moves quality ----
const marketState = { ...state, marketTrends: { Soul: 0.1 }, genrePopularity: { Soul: 5 } } as unknown as GameState;
const mq = calculateSessionForecast(marketState, project, sam);
ok(mq.quality.likelyMin === f1.quality.likelyMin && mq.quality.likelyMax === f1.quality.likelyMax, 'market state cannot change the quality forecast');

// ---- Staff, room and approach move the forecast predictably ----
const tired = calculateSessionForecast(state, project, { staffIds: ['Tired'], roomId });
ok(tired.fatigueRisk !== 'low' && tired.risks.some((r) => r.key === 'crew-energy' && /30% energy/.test(r.label)), 'tired crew raises fatigue risk and is named as a cause');
const rookie = calculateSessionForecast(state, project, { staffIds: ['Rookie'], roomId });
ok(rookie.quality.likelyMax < f1.quality.likelyMax, 'a weaker crew member lowers the forecast');
ok(rookie.risks.length > 0, 'a weak setup shows up as a risk');
ok(f1.positives.length > 0, 'a strong setup names at least one positive');
const goodRoom: StudioRoom[] = rooms.map((r, i) => (i === 0 ? { ...r, unlocked: true, qualityBonus: 8 } : r));
const better = calculateSessionForecast({ ...state, studioRooms: goodRoom }, project, { staffIds: ['Sam'], roomId: goodRoom[0].id });
const plain = calculateSessionForecast({ ...state, studioRooms: rooms.map((r, i) => (i === 0 ? { ...r, qualityBonus: 0 } : r)) }, project, { staffIds: ['Sam'], roomId: rooms[0].id });
ok(better.quality.likelyMax >= plain.quality.likelyMax, 'a better room never lowers the forecast');
const none = calculateSessionForecast(state, project, { staffIds: [], roomId });
ok(none.risks.some((r) => r.key === 'no-crew'), 'booking with nobody assigned says so');
const approachA = calculateSessionForecast(state, project, { ...sam, approachId: 'clean-commercial' });
const approachB = calculateSessionForecast(state, project, { ...sam, approachId: 'experimental-layers' });
ok(JSON.stringify(approachA) !== JSON.stringify(approachB), 'changing the production approach changes the forecast');

// ---- Time pressure ----
const rush = calculateSessionForecast(state, mkProject({ durationDaysTotal: 3, stages: [stage('Tracking', 60), stage('Mix', 60)] }), sam);
ok(rush.time.lateRisk === 'high' && rush.risks.some((r) => r.key === 'deadline'), 'a huge job in a short booking is a high late risk with a stated cause');
const roomy = calculateSessionForecast(state, mkProject({ durationDaysTotal: 30, stages: [stage('Tracking', 4)] }), sam);
ok(roomy.time.lateRisk === 'low', 'a small job in a long booking is low late risk');

// ---- Actionable improvement ----
const poorWorst = calculateSessionForecast({ ...state, ownedEquipment: state.ownedEquipment.map((e) => ({ ...e, condition: 20 })) }, project, { staffIds: ['Tired'], roomId });
ok(poorWorst.risks.length > 0 && Boolean(topImprovement(poorWorst)), 'a poor forecast offers an actionable way to improve');
const d = defaultAssignment({ ...state, hiredStaff: state.hiredStaff.filter((s) => s.id !== 'Tired') }, project);
ok(d.staffIds.length === 1 && Boolean(d.roomId), 'default assignment picks a crew member and a room');

// ---- Calibration against the real settlement (1,000 seeds per fixture) ----
interface Fixture { name: string; state: GameState; project: Project; assign: SessionAssignment }
const gearWorn = (s: GameState): GameState => ({ ...s, ownedEquipment: s.ownedEquipment.map((e) => ({ ...e, condition: 35 })) });
const fixtures: Fixture[] = [
  { name: 'rested specialist, soul, easy', state, project, assign: sam },
  { name: 'solo player, rock', state: { ...state, hiredStaff: [] }, project: mkProject({ genre: 'Rock', requiredSkills: { Rock: 1 } }), assign: { staffIds: [], roomId } },
  { name: 'tired crew, worn gear', state: gearWorn(state), project, assign: { staffIds: ['Tired'], roomId } },
  { name: 'rookie crew, hard job', state, project: mkProject({ difficulty: 7, payoutBase: 3000 }), assign: { staffIds: ['Rookie'], roomId } },
  { name: 'veteran crew, long job', state: { ...state, hiredStaff: state.hiredStaff.map((s) => withLevels(s, 8)) }, project: mkProject({ stages: [stage('Tracking', 20), stage('Mix', 20), stage('Master', 12)], durationDaysTotal: 12 }), assign: sam },
];
const SEEDS = 1000;
const play = FORECAST_PLAY;

const settle = (fx: Fixture, seed: number) => {
  const rng = createSeededRandom(`calibration:${fx.name}:${seed}`);
  const ap = { ...fx.assign };
  const ids = new Set(ap.staffIds);
  const st: GameState = { ...fx.state, hiredStaff: fx.state.hiredStaff.map((s) => ({ ...s, assignedProjectId: ids.has(s.id) ? `cal-${seed}` : null })) };
  const units = fx.project.stages.reduce((s, x) => s + x.workUnitsBase, 0);
  const pts = Math.round(units * (play.pointsPerUnitLow + rng() * (play.pointsPerUnitHigh - play.pointsPerUnitLow)));
  const cShare = 0.3 + rng() * 0.4;
  const grades = fx.project.stages.map(() => (['Bronze', 'Silver', 'Gold'] as const)[Math.floor(rng() * 3)]);
  const p: Project = {
    ...fx.project, id: `cal-${seed}`, bookingRoomId: ap.roomId, workSessionCount: 1 + Math.floor(units / 3),
    accumulatedCPoints: Math.round(pts * cShare), accumulatedTPoints: pts - Math.round(pts * cShare),
    minigamePoints: randomInt(rng, 0, play.minigameSpread), stageGrades: [...grades],
  };
  const crew = st.hiredStaff.filter((s) => s.assignedProjectId === p.id);
  const room = getBookedStudioRoom(st, p);
  const eq = resolveSessionEquipment(st, room?.id ?? p.bookingRoomId);
  const avg = eq.length ? eq.reduce((s, e) => s + (e.condition ?? 100), 0) / eq.length : 50;
  const bon = getEquipmentBonuses(eq, p.genre);
  const eqQ = Math.max(0, Math.min(100, Math.round(avg * 0.6 + Math.min(40, bon.quality || 0) + (room?.qualityBonus || 0))));
  const staffC = crew.length === 0 ? 0 : Math.max(0, Math.min(10, Math.round(crew.reduce((s, m) => s + ((m.primaryStats.creativity + m.primaryStats.technical) / 2) * 0.08 * getMoodEffectiveness(m.mood) + (m.genreAffinity?.genre === p.genre ? m.genreAffinity.bonus / 10 : 0), 0) / crew.length)));
  const gs = st.studioSkills[p.genre];
  const lead = crew[0];
  return generateProjectReview(p, lead ? { type: 'staff', id: lead.id, name: lead.name } : { type: 'player', id: 'player', name: 'You' }, eqQ, st.playerData, st.hiredStaff, {
    focusEffectiveness: getFocusEffectiveness(st), staffContribution: staffC, studioQualityBonus: gs ? calculateStudioSkillBonus(gs, 'quality') : 0,
    equipmentQualityBonus: Math.max(0, Math.min(10, Math.round((bon.quality || 0) / 2 + (bon.genre || 0) / 4))), marketMultiplier: 1,
    ...getSettlementBonuses(st, p, 1),
  }).overallQualityScore;
};

const report: string[] = ['fixture | likely range | hit rate | mean actual'];
const forecasts: SessionForecast[] = [];
for (const fx of fixtures) {
  const f = calculateSessionForecast(fx.state, fx.project, fx.assign);
  forecasts.push(f);
  let hit = 0, sum = 0;
  for (let i = 0; i < SEEDS; i++) { const q = settle(fx, i); sum += q; if (q >= f.quality.likelyMin && q <= f.quality.likelyMax) hit++; }
  const rate = hit / SEEDS;
  report.push(`${fx.name} | ${f.quality.likelyMin}-${f.quality.likelyMax} (${f.quality.confidence}) | ${(rate * 100).toFixed(1)}% | ${(sum / SEEDS).toFixed(1)}`);
  ok(rate >= 0.8, `calibration: ${fx.name} lands ${(rate * 100).toFixed(1)}% inside the displayed range (>= 80%)`);
}
console.log('\n--- 1,000-seed calibration report ---\n' + report.join('\n') + '\n');
ok(forecasts.every((f) => f.quality.likelyMax - f.quality.likelyMin <= 30), 'ranges stay informative (<= 30 points wide)');
const mid = (f: SessionForecast) => (f.quality.likelyMin + f.quality.likelyMax) / 2;
ok(mid(forecasts[2]) < mid(forecasts[0]), 'the high-risk config forecasts lower than the low-risk one');
let lowActual = 0, highActual = 0;
for (let i = 0; i < SEEDS; i++) { lowActual += settle(fixtures[0], i); highActual += settle(fixtures[2], i); }
ok(highActual / SEEDS < lowActual / SEEDS, 'high-risk configs empirically underperform low-risk ones');
console.log(`\n${passed} checks passed`);
