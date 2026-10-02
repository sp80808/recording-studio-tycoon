/** Studio house style (#71): growth, diminishing repeats, idempotence, migration, and the setup-time link. */
import {
  awardExpertise, baseXp, createInitialExpertise, houseStyleProfile, levelForXp, migrateExpertise,
  setupTimeReduction, SETUP_REDUCTION_CAP, LEVEL_XP, trackLevel, type ExpertiseEvent,
} from '../src/rpg/houseStyle';
import { calculateSessionForecast, defaultAssignment } from '../src/rpg/sessionForecast';
import { createNewGameState } from '../src/utils/newGameState';
import { initializeSkillsStaff } from '../src/utils/skillUtils';
import type { Project, StaffMember } from '../src/types/game';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };
const ev = (id: string, over: Partial<ExpertiseEvent> = {}): ExpertiseEvent => ({ projectId: id, genre: 'Pop', serviceType: 'tracking', approachId: 'clean-commercial', quality: 70, difficulty: 3, ...over });

// Growth and levels.
ok(levelForXp(0) === 0 && levelForXp(LEVEL_XP[1]) === 1 && levelForXp(LEVEL_XP[5]) === 5 && levelForXp(9999) === 5, 'xp maps to levels 0-5');
let e = awardExpertise(undefined, ev('a'));
ok(e.genres.Pop.xp > 0 && e.services.tracking.xp > 0 && e.approaches['clean-commercial'].xp > 0, 'a finished job builds genre, service and approach tracks');
ok(e.genres.Pop.completedCount === 1, 'completed count tracks the job');
ok(awardExpertise(createInitialExpertise(), ev('a')).genres.Pop.xp === e.genres.Pop.xp, 'undefined and empty state award the same');

// Weak work still teaches; strong and hard work teaches more.
ok(baseXp(10, 1) > 0, 'a weak project still grants some familiarity');
ok(baseXp(90, 5) > baseXp(40, 3) && baseXp(40, 3) > baseXp(10, 1), 'excellent and challenging work grants more');

// Idempotent per project.
ok(awardExpertise(e, ev('a')) === e, 'the same project cannot pay twice (save/reload safe)');

// Diminishing repeats: easy low-value jobs cannot rapidly max a track.
let spam = createInitialExpertise();
for (let i = 0; i < 12; i++) spam = awardExpertise(spam, ev(`easy-${i}`, { quality: 30, difficulty: 1 }));
ok(spam.genres.Pop.level < 3, 'twelve trivial jobs do not get past level 2');
let first = awardExpertise(createInitialExpertise(), ev('x1')).genres.Pop.xp;
let second = awardExpertise(awardExpertise(createInitialExpertise(), ev('x1')), ev('x2')).genres.Pop.xp - first;
ok(second < first, 'the second identical job pays less than the first');

// Specialist vs generalist: switching genre starts fresh, nothing is lost.
let mixed = awardExpertise(e, ev('b', { genre: 'Rock', serviceType: 'mix' }));
ok(mixed.genres.Pop.xp === e.genres.Pop.xp && mixed.genres.Rock.xp > 0, 'switching genre keeps the old track and starts a new one');

// Notable sessions: only strong work, capped.
let notable = createInitialExpertise();
for (let i = 0; i < 6; i++) notable = awardExpertise(notable, ev(`n-${i}`, { quality: 90 }));
ok(notable.genres.Pop.notableProjectIds.length === 3, 'notable sessions are capped at three');
ok(awardExpertise(createInitialExpertise(), ev('weak', { quality: 40 })).genres.Pop.notableProjectIds.length === 0, 'weak sessions are not notable');

// Immutability.
const frozen = JSON.stringify(e);
awardExpertise(e, ev('c'));
ok(JSON.stringify(e) === frozen, 'awarding does not mutate the previous state');

// Migration.
ok(migrateExpertise(undefined).awarded.length === 0, 'legacy saves migrate to an empty state');
ok(migrateExpertise('junk' as unknown).genres && Object.keys(migrateExpertise(42).genres).length === 0, 'corrupt blobs repair to empty');
const repaired = migrateExpertise({ genres: { Pop: { xp: 60.7, level: 99, completedCount: -3, notableProjectIds: ['a', 1] } } });
ok(repaired.genres.Pop.xp === 60 && repaired.genres.Pop.level === 2 && repaired.genres.Pop.completedCount === 0 && repaired.genres.Pop.notableProjectIds.length === 1, 'a damaged track is sanitised and level re-derived');
ok(JSON.stringify(migrateExpertise(JSON.parse(JSON.stringify(e)))) === JSON.stringify(e), 'save/reload round-trips exactly');

// Effect is bounded and information-only.
ok(setupTimeReduction(undefined, 'Pop', 'tracking') === 0, 'no expertise means no setup change');
let pro = createInitialExpertise();
for (let i = 0; i < 40; i++) pro = awardExpertise(pro, ev(`p-${i}`, { quality: 95, difficulty: 5 }));
ok(trackLevel(pro, 'genres', 'Pop') >= 1, 'long strong work does reach levels');
ok(setupTimeReduction(pro, 'Pop', 'tracking') <= SETUP_REDUCTION_CAP, 'setup reduction is capped');
ok(setupTimeReduction(pro, 'Jazz', 'master') === 0, 'expertise in one niche does not discount another');

// Profile surface.
const profile = houseStyleProfile(pro, 3);
ok(profile.length === 3 && profile[0].xp >= profile[1].xp, 'profile lists the strongest tracks first');

// Market demand / project fit / expertise stay separate: the forecast quality range does not read expertise.
const stage = (name: string, units: number) => ({ stageName: name, focusAreas: [], workUnitsBase: units, workUnitsCompleted: 0, completed: false });
const project: Project = {
  id: 'hs-1', title: 'Fixture', genre: 'Pop', clientType: 'Independent', difficulty: 3, durationDaysTotal: 4, payoutBase: 1500, repGainBase: 20,
  requiredSkills: { Pop: 1 }, stages: [stage('Vocal Tracking', 14), stage('Warm Mix', 12), stage('Master', 8)], matchRating: 'Good',
  accumulatedCPoints: 0, accumulatedTPoints: 0, currentStageIndex: 0, completedStages: [], workSessionCount: 0, stake: 'safe',
  focusAllocation: { performance: 33, soundCapture: 33, layering: 34 },
} as Project;
const staff = (): StaffMember => ({
  id: 's1', name: 'Sam', role: 'Engineer', primaryStats: { creativity: 40, technical: 45, speed: 40 }, xpInRole: 0, levelInRole: 1,
  genreAffinity: null, energy: 90, mood: 80, salary: 40, status: 'Idle', assignedProjectId: null, skills: initializeSkillsStaff(),
} as unknown as StaffMember);
const base = { ...createNewGameState(), hiredStaff: [staff()] } as ReturnType<typeof createNewGameState>;
const trained = { ...base, studioExpertise: pro };
const brief = (project as any);
const f0 = calculateSessionForecast(base, project, defaultAssignment(base, project));
const f1 = calculateSessionForecast(trained, project, defaultAssignment(trained, project));
ok(JSON.stringify(f0.quality) === JSON.stringify(f1.quality), 'expertise never moves the forecast quality range');
ok(f1.time.estimatedWorkUnits <= f0.time.estimatedWorkUnits, 'expertise only shortens the setup/work estimate');
void brief;
console.log(`house-style: all ${n} checks passed`);
