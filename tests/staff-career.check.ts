/** Staff careers (#67 first slice): disciplines, retained experience, deliberate promotion, fit reasons. */
import {
  getStaffCareer, creditSession, setActiveDiscipline, getPromotionOffer, promoteStaffInState, careerFitBonus,
  defaultDiscipline, disciplineForStage, experienceIn, CAREER_LEVEL_XP,
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
ok(getPromotionOffer(grind)!.eligible, 'grinding the discipline eventually earns the senior promotion');
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
console.log(`staff-career: all ${n} checks passed`);
