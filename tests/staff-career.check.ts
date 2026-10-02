/** Staff careers (#67 first slice): disciplines, retained experience, deliberate promotion, fit reasons. */
import {
  getStaffCareer, creditSession, setActiveDiscipline, getPromotionOffer, promoteStaffInState, careerFitBonus,
  defaultDiscipline, disciplineForStage, experienceIn, CAREER_LEVEL_XP,
  crossTrainOptions, startCrossTrainingInState, completeCrossTraining, parseCrossTrainCourse,
  startMentoringInState, stopMentoringInState, mentorshipScale, canMentor, MENTOR_JUNIOR_SCALE, MENTOR_COST_SCALE,
} from '../src/rpg/staffCareer';
import { calculateStaffProjectFit } from '../src/utils/staffFitUtils';
import { initializeSkillsStaff } from '../src/utils/skillUtils';
import type { Project, StaffMember } from '../src/types/game';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };
const staff = (over: Partial<StaffMember> = {}): StaffMember => ({
  id: 's1', name: 'Sam', role: 'Engineer', primaryStats: { creativity: 40, technical: 45, speed: 40 }, xpInRole: 0, levelInRole: 1,
  genreAffinity: null, energy: 90, mood: 80, salary: 100, status: 'Idle', assignedProjectId: null, skills: initializeSkillsStaff(), ...over,
} as StaffMember);

// Legacy staff map into one discipline without touching skills.
const legacy = staff();
const skillsBefore = JSON.stringify(legacy.skills);
const c0 = getStaffCareer(legacy);
ok(c0.activeDiscipline === 'recording' && c0.seniority === 'junior' && c0.experience.length === 4, 'legacy staff derive a recording junior with four disciplines');
ok(JSON.stringify(legacy.skills) === skillsBefore && legacy.career === undefined, 'reading a career never mutates the staff record or skills');
ok(defaultDiscipline(staff({ role: 'Producer' })) === 'production', 'producers start in production');
ok(getStaffCareer(staff({ levelInRole: 4 })).seniority === 'regular', 'established legacy staff start as regular');
ok(getStaffCareer({ ...legacy, career: { activeDiscipline: 'nope', experience: [{ discipline: 'mixing', xp: -5, level: 9, creditedSessions: 2.7 }], seniority: 'x', credited: [1] } as never }).experience.find(e => e.discipline === 'mixing')!.level === 0, 'corrupt career data is sanitised');

// Stage mapping.
ok(disciplineForStage('Final Mix') === 'mixing' && disciplineForStage('Vocal Tracking') === 'production' && disciplineForStage('Basic Tracking') === 'recording' && disciplineForStage('Gear Setup') === 'technical', 'stages map to disciplines');

// Crediting: per discipline once per project, idempotent, quality adds.
let s = creditSession(legacy, 'p1', ['Basic Tracking', 'Final Mix'], 80);
ok(experienceIn(s.career, 'recording').creditedSessions === 1 && experienceIn(s.career, 'mixing').creditedSessions === 1 && experienceIn(s.career, 'production').xp === 0, 'a project credits only the disciplines its stages used');
ok(JSON.stringify(creditSession(s, 'p1', ['Basic Tracking'], 80).career) === JSON.stringify(s.career), 'crediting the same project twice changes nothing');
ok(experienceIn(creditSession(legacy, 'q', ['Basic Tracking'], 90).career, 'recording').xp > experienceIn(creditSession(legacy, 'q', ['Basic Tracking'], 10).career, 'recording').xp, 'better work earns more experience');
ok(JSON.stringify(legacy) === JSON.stringify(staff()), 'crediting does not mutate the input');

// Switching active discipline keeps experience.
const switched = setActiveDiscipline(s, 'mixing');
ok(switched.career.activeDiscipline === 'mixing' && experienceIn(switched.career, 'recording').xp === experienceIn(s.career, 'recording').xp, 'switching discipline never wipes past experience');

// Promotion is deliberate, previewed and gated.
let m = staff();
const first = getPromotionOffer(m)!;
ok(first.to === 'regular' && !first.eligible && first.salaryAfter === 120 && first.salaryBefore === 100, 'junior sees a regular promotion with the exact salary change');
ok(promoteStaffInState({ hiredStaff: [m] }, 's1').hiredStaff[0].salary === 100, 'ineligible promotion is a no-op');
for (let i = 0; i < 4; i++) m = creditSession(m, `t${i}`, ['Basic Tracking'], 90);
ok(getPromotionOffer(m)!.eligible, 'enough credited sessions unlock the promotion');
const regular = promoteStaffInState({ hiredStaff: [m] }, 's1').hiredStaff[0];
ok(regular.salary === first.salaryAfter && regular.career!.seniority === 'regular', 'promotion applies exactly the previewed salary');
ok(experienceIn(regular.career!, 'recording').xp === experienceIn(m.career!, 'recording').xp, 'promotion keeps retained experience');
const toSenior = getPromotionOffer(regular)!;
ok(toSenior.to === 'senior' && toSenior.title === 'Senior Recording Engineer' && toSenior.salaryAfter > regular.salary, 'regular sees a senior path with a higher salary');
ok(!toSenior.eligible, 'senior needs more than a single promotion step');
let grind = regular;
for (let i = 0; i < 12; i++) grind = creditSession(grind, `g${i}`, ['Basic Tracking'], 95);
ok(!getPromotionOffer(grind)!.eligible, 'senior also needs a completed cross-training');
ok(promoteStaffInState({ hiredStaff: [grind] }, 's1').hiredStaff[0].salary === grind.salary, 'senior promotion without cross-training is a no-op');
grind = completeCrossTraining(grind, 'mixing');
ok(getPromotionOffer(grind)!.eligible, 'grinding plus a cross-training earns the senior promotion');
const senior = promoteStaffInState({ hiredStaff: [grind] }, 's1').hiredStaff[0];
ok(senior.career!.seniority === 'senior' && senior.salary === getPromotionOffer(grind)!.salaryAfter && senior.salary > regular.salary, 'senior promotion raises the salary visibly');
ok(getPromotionOffer(senior) === null, 'no further promotion in this slice');

// No hidden salary change anywhere else.
ok(creditSession(grind, 'z', ['Basic Tracking'], 99).salary === grind.salary, 'experience never changes salary by itself');

// Fit integration is small, capped and explained.
const stage = (stageName: string) => ({ stageName, focusAreas: [], workUnitsBase: 10, workUnitsCompleted: 0, completed: false });
const project = { id: 'p', title: 'T', genre: 'Pop', difficulty: 3, stages: [stage('Basic Tracking')], currentStageIndex: 0, clientType: 'Independent' } as unknown as Project;
const fitJunior = calculateStaffProjectFit(staff(), project);
const fitSenior = calculateStaffProjectFit(senior, project);
ok(fitSenior.score >= fitJunior.score && fitSenior.reasons.some(r => /experience/.test(r)), 'discipline experience raises fit and is listed as a reason');
ok(!fitJunior.reasons.some(r => /experience/.test(r)), 'no career reason for staff without experience');
ok(careerFitBonus(senior, 'Basic Tracking').points <= 10, 'career fit bonus is capped');
ok(careerFitBonus(senior, 'Final Mix').points < careerFitBonus(senior, 'Basic Tracking').points, 'experience helps most on its own discipline');
ok(CAREER_LEVEL_XP.length === 6, 'six level thresholds (0-5)');
// Cross-training: costs money, takes staff off the floor, keeps all experience.
const charge = (g: any, cost: number) => ({ ...g, money: g.money - cost });
const idle = staff();
const base = { hiredStaff: [idle], money: 1000, currentDay: 10 };
ok(crossTrainOptions(idle).length === 3 && !crossTrainOptions(idle).some(o => o.discipline === 'recording'), 'cross-training offers every discipline but the active one');
const started = startCrossTrainingInState(base, 's1', 'mixing', charge);
const trainee = started.hiredStaff[0];
ok(trainee.status === 'Training' && trainee.trainingEndDay === 13 && parseCrossTrainCourse(trainee.trainingCourse) === 'mixing' && started.money < 1000, 'cross-training takes the trainee off the floor for days and charges the exact cost');
ok(startCrossTrainingInState(started, 's1', 'production', charge) === started, 'a trainee cannot start a second course');
ok(startCrossTrainingInState({ ...base, money: 10 }, 's1', 'mixing', charge).hiredStaff[0].status === 'Idle', 'cross-training needs the cash');
ok(startCrossTrainingInState({ ...base, hiredStaff: [{ ...idle, status: 'Working' }] } as never, 's1', 'mixing', charge).hiredStaff[0].status === 'Working', 'working staff cannot cross-train');
const worked = creditSession(idle, 'w', ['Basic Tracking'], 80);
const trained = completeCrossTraining(worked, 'mixing');
ok(experienceIn(trained.career, 'mixing').xp === 40 && trained.career.secondaryDiscipline === 'mixing', 'cross-training adds xp in the new discipline');
ok(experienceIn(trained.career, 'recording').xp === experienceIn(worked.career, 'recording').xp && trained.career.activeDiscipline === 'recording', 'cross-training never erases earlier experience');
let deep = trained;
for (let i = 0; i < 3; i++) deep = completeCrossTraining(deep, 'mixing');
ok(experienceIn(deep.career, 'mixing').level >= 3 && experienceIn(completeCrossTraining(deep, 'mixing').career, 'mixing').xp - experienceIn(deep.career, 'mixing').xp === 20, 'repeat cross-training has diminishing gains');
ok(careerFitBonus(trained, 'Final Mix').points > 0, 'cross-training changes what the staff member can credibly do');

// Mentorship: only pays while the mentor is working; never passive.
const mentor = { ...senior, id: 'm1', status: 'Working' as const };
const junior = staff({ id: 'j1' });
const team = { hiredStaff: [mentor, junior] };
ok(canMentor(mentor, junior) && !canMentor(junior, mentor), 'only a senior can mentor a junior');
const linked = startMentoringInState(team, 'm1', 'j1');
const j1 = linked.hiredStaff[1];
ok(getStaffCareer(j1).mentorId === 'm1' && j1.skills === junior.skills, 'mentoring links without touching skills');
ok(startMentoringInState({ hiredStaff: [...linked.hiredStaff, staff({ id: 'j2' })] }, 'm1', 'j2').hiredStaff[2].career === undefined, 'a senior mentors only one junior');
ok(mentorshipScale(j1, linked.hiredStaff) === MENTOR_JUNIOR_SCALE, 'a mentored junior learns faster while the mentor works');
const idleMentor = linked.hiredStaff.map(s => s.id === 'm1' ? { ...s, status: 'Idle' as const } : s);
ok(mentorshipScale(j1, idleMentor) === 1, 'no bonus when the mentor is idle (no passive xp)');
ok(mentorshipScale(linked.hiredStaff[0], linked.hiredStaff) === MENTOR_COST_SCALE, 'the mentor pays a small cost on their own sessions');
ok(experienceIn(creditSession(j1, 'k', ['Basic Tracking'], 80, MENTOR_JUNIOR_SCALE).career, 'recording').xp > experienceIn(creditSession(j1, 'k', ['Basic Tracking'], 80).career, 'recording').xp, 'mentored junior earns more xp');
ok(mentorshipScale(stopMentoringInState(linked, 'j1').hiredStaff[1], idleMentor) === 1, 'ending mentorship removes the link');

console.log(`staff-career: all ${n} checks passed`);
