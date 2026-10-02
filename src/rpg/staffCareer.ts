/**
 * Staff careers (issue #67, first slice): disciplines, retained experience and a
 * deliberate promotion with a visible salary change.
 *
 * Evolves the existing StaffMember (role, levelInRole, skills); nothing here
 * replaces them. Career state is optional on the record and derived on read for
 * legacy saves, so no migration can corrupt skill data. Experience only ever
 * grows: switching the active discipline never wipes what was earned.
 * Pure + deterministic.
 */
import type { StaffMember } from '@/types/game';

export type StaffDiscipline = 'recording' | 'mixing' | 'production' | 'technical';
export type Seniority = 'junior' | 'regular' | 'senior' | 'lead';

export interface CareerExperience {
  discipline: StaffDiscipline;
  xp: number;
  level: 0 | 1 | 2 | 3 | 4 | 5;
  /** Distinct settled projects credited in this discipline. */
  creditedSessions: number;
}

export interface StaffCareerState {
  activeDiscipline: StaffDiscipline;
  experience: CareerExperience[];
  seniority: Seniority;
  /** Recently credited project ids: guards against double-fire on reload. */
  credited: string[];
  /** Secondary discipline picked by cross-training (#67). */
  secondaryDiscipline?: StaffDiscipline;
  /** Completed cross-training courses (counts toward the senior path). */
  crossTrained?: number;
  /** Senior who mentors this staff member, if any. */
  mentorId?: string;
}

export const DISCIPLINES: StaffDiscipline[] = ['recording', 'mixing', 'production', 'technical'];
export const SENIORITY_ORDER: Seniority[] = ['junior', 'regular', 'senior', 'lead'];
export const DISCIPLINE_LABEL: Record<StaffDiscipline, string> = {
  recording: 'Recording', mixing: 'Mixing', production: 'Production', technical: 'Technical',
};
/** XP needed for each level (index = level). */
export const CAREER_LEVEL_XP: readonly number[] = [0, 30, 80, 150, 250, 400];
const CREDIT_LOG_CAP = 12;

const SENIOR_TITLE: Record<StaffDiscipline, string> = {
  recording: 'Senior Recording Engineer', mixing: 'Senior Mix Engineer', production: 'Lead Producer', technical: 'Studio Technical Lead',
};

const levelFor = (xp: number): CareerExperience['level'] => {
  let level = 0;
  for (let i = 1; i < CAREER_LEVEL_XP.length; i++) if (xp >= CAREER_LEVEL_XP[i]) level = i;
  return level as CareerExperience['level'];
};

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);

/** Map a legacy staff member to one active discipline from role and skills. */
export function defaultDiscipline(staff: Pick<StaffMember, 'role' | 'skills'>): StaffDiscipline {
  if (staff.role === 'Producer' || staff.role === 'Songwriter') return 'production';
  const mixing = staff.skills?.mixing?.level ?? 0;
  const tracking = staff.skills?.tracking?.level ?? 0;
  return mixing > tracking ? 'mixing' : 'recording';
}

/** Read (and sanitise) a staff member's career; legacy staff derive one without touching skills. */
export function getStaffCareer(staff: Pick<StaffMember, 'role' | 'skills' | 'levelInRole'> & { career?: StaffCareerState }): StaffCareerState {
  const raw = staff.career;
  const active = raw && DISCIPLINES.includes(raw.activeDiscipline) ? raw.activeDiscipline : defaultDiscipline(staff);
  const experience: CareerExperience[] = DISCIPLINES.map((discipline) => {
    const found = raw?.experience?.find((e) => e?.discipline === discipline);
    const xp = num(found?.xp);
    return { discipline, xp, level: levelFor(xp), creditedSessions: num(found?.creditedSessions) };
  });
  const seniority: Seniority = raw && SENIORITY_ORDER.includes(raw.seniority)
    ? raw.seniority
    : (staff.levelInRole ?? 1) >= 3 ? 'regular' : 'junior';
  const secondary = raw?.secondaryDiscipline && DISCIPLINES.includes(raw.secondaryDiscipline) && raw.secondaryDiscipline !== active ? raw.secondaryDiscipline : undefined;
  return {
    activeDiscipline: active, experience, seniority,
    credited: Array.isArray(raw?.credited) ? raw!.credited.filter((x) => typeof x === 'string').slice(-CREDIT_LOG_CAP) : [],
    ...(secondary ? { secondaryDiscipline: secondary } : {}),
    crossTrained: num(raw?.crossTrained),
    ...(typeof raw?.mentorId === 'string' && raw.mentorId ? { mentorId: raw.mentorId } : {}),
  };
}

export const disciplineForStage = (stageName: string): StaffDiscipline => {
  const n = stageName.toLowerCase();
  if (n.includes('master') || n.includes('mix')) return 'mixing';
  if (n.includes('produc') || n.includes('arrang') || n.includes('overdub') || n.includes('vocal') || n.includes('song')) return 'production';
  if (n.includes('setup') || n.includes('maint') || n.includes('repair') || n.includes('calibr')) return 'technical';
  return 'recording';
};

export const experienceIn = (career: StaffCareerState, d: StaffDiscipline): CareerExperience =>
  career.experience.find((e) => e.discipline === d)!;

/**
 * Credit a settled project: each distinct discipline among its stages earns XP
 * once for this project. Idempotent per project id; quality only ever adds.
 */
export function creditSession<S extends Parameters<typeof getStaffCareer>[0]>(
  staff: S,
  projectId: string,
  stageNames: string[],
  quality: number,
  /** Mentorship scaling: >1 for a mentored junior, <1 for a mentor with a mentee. Default 1. */
  xpScale = 1,
): S & { career: StaffCareerState } {
  const career = getStaffCareer(staff);
  if (career.credited.includes(projectId)) return { ...staff, career };
  const disciplines = new Set(stageNames.map(disciplineForStage));
  if (disciplines.size === 0) disciplines.add(career.activeDiscipline);
  const gain = Math.max(1, Math.round((8 + Math.round(Math.max(0, Math.min(100, quality)) / 10)) * xpScale));
  const experience = career.experience.map((e) => {
    if (!disciplines.has(e.discipline)) return e;
    const xp = e.xp + gain;
    return { ...e, xp, level: levelFor(xp), creditedSessions: e.creditedSessions + 1 };
  });
  return { ...staff, career: { ...career, experience, credited: [...career.credited, projectId].slice(-CREDIT_LOG_CAP) } };
}

/** Change the active discipline. Past experience is kept untouched. */
export function setActiveDiscipline<S extends Parameters<typeof getStaffCareer>[0]>(staff: S, d: StaffDiscipline): S & { career: StaffCareerState } {
  const career = getStaffCareer(staff);
  return { ...staff, career: { ...career, activeDiscipline: d } };
}

export interface PromotionRequirement { label: string; met: boolean }
export interface PromotionOffer {
  from: Seniority;
  to: Seniority;
  title: string;
  requirements: PromotionRequirement[];
  eligible: boolean;
  salaryBefore: number;
  salaryAfter: number;
  perks: string[];
}

const RAISE: Record<Seniority, number> = { junior: 1.2, regular: 1.3, senior: 1.35, lead: 1 };

/** The next promotion for a staff member, or null at the top (lead is out of scope for this slice). */
export function getPromotionOffer(staff: Parameters<typeof getStaffCareer>[0] & Pick<StaffMember, 'salary'>): PromotionOffer | null {
  const career = getStaffCareer(staff);
  const idx = SENIORITY_ORDER.indexOf(career.seniority);
  const to = SENIORITY_ORDER[idx + 1];
  if (!to || to === 'lead') return null;
  const exp = experienceIn(career, career.activeDiscipline);
  const needLevel = to === 'regular' ? 1 : 3;
  const needSessions = to === 'regular' ? 1 : 3;
  const requirements: PromotionRequirement[] = [
    { label: `${DISCIPLINE_LABEL[career.activeDiscipline]} level ${needLevel} (now ${exp.level})`, met: exp.level >= needLevel },
    { label: `${needSessions} credited ${DISCIPLINE_LABEL[career.activeDiscipline].toLowerCase()} session${needSessions === 1 ? '' : 's'} (now ${exp.creditedSessions})`, met: exp.creditedSessions >= needSessions },
  ];
  if (to === 'senior') requirements.push({ label: `1 completed cross-training (now ${career.crossTrained ?? 0})`, met: (career.crossTrained ?? 0) >= 1 });
  const salaryAfter = Math.round(staff.salary * RAISE[career.seniority]);
  return {
    from: career.seniority,
    to,
    title: to === 'senior' ? SENIOR_TITLE[career.activeDiscipline] : `Regular ${DISCIPLINE_LABEL[career.activeDiscipline]} staff`,
    requirements,
    eligible: requirements.every((r) => r.met),
    salaryBefore: staff.salary,
    salaryAfter,
    perks: to === 'senior' ? ['Stronger fit on this discipline\'s stages', 'Counted as senior in staff-fit reasons'] : ['Counted as a regular in staff-fit reasons'],
  };
}

/** Deliberate promotion: applies the exact previewed salary. Ineligible requests are no-ops. */
export function promoteStaffInState<G extends { hiredStaff: StaffMember[] }>(state: G, staffId: string): G {
  const member = state.hiredStaff.find((s) => s.id === staffId);
  if (!member) return state;
  const offer = getPromotionOffer(member);
  if (!offer || !offer.eligible) return state;
  const career = getStaffCareer(member);
  return {
    ...state,
    hiredStaff: state.hiredStaff.map((s) => s.id === staffId ? { ...s, salary: offer.salaryAfter, career: { ...career, seniority: offer.to } } : s),
  };
}

/** Small, capped fit contribution (0-10) from discipline experience and seniority. */
export function careerFitBonus(staff: Parameters<typeof getStaffCareer>[0], stageName: string): { points: number; reason?: string } {
  const career = getStaffCareer(staff);
  const d = disciplineForStage(stageName);
  const exp = experienceIn(career, d);
  const rank = SENIORITY_ORDER.indexOf(career.seniority);
  const onActive = d === career.activeDiscipline;
  const onSecondary = d === career.secondaryDiscipline;
  const points = Math.min(10, exp.level * 1.5 + (onActive ? rank * 1.5 : onSecondary ? rank * 0.75 : 0));
  if (points <= 0) return { points: 0 };
  const who = onActive && rank >= 2 ? `${career.seniority} ` : '';
  return { points, reason: `${who}${DISCIPLINE_LABEL[d].toLowerCase()} experience (level ${exp.level})` };
}

// ---- Cross-training (#67): a trainee is off the floor, experience is only ever added ----

export const CROSS_TRAIN_DAYS = 3;
export const CROSS_TRAIN_COST = 400;
const CROSS_TRAIN_COURSE_PREFIX = 'cross:';
/** Base XP for a cross-training course; halves once the discipline is already level 3+ (diminishing gains). */
const crossTrainXp = (level: number) => (level >= 3 ? 20 : 40);

export const crossTrainCourseId = (d: StaffDiscipline) => `${CROSS_TRAIN_COURSE_PREFIX}${d}`;
export const parseCrossTrainCourse = (courseId?: string): StaffDiscipline | null => {
  if (!courseId || !courseId.startsWith(CROSS_TRAIN_COURSE_PREFIX)) return null;
  const d = courseId.slice(CROSS_TRAIN_COURSE_PREFIX.length) as StaffDiscipline;
  return DISCIPLINES.includes(d) ? d : null;
};

export interface CrossTrainOffer { discipline: StaffDiscipline; days: number; cost: number; xp: number }

/** Disciplines this staff member could cross-train into, with the exact cost and days off the floor. */
export function crossTrainOptions(staff: Parameters<typeof getStaffCareer>[0]): CrossTrainOffer[] {
  const career = getStaffCareer(staff);
  return DISCIPLINES.filter((d) => d !== career.activeDiscipline).map((discipline) => ({
    discipline, days: CROSS_TRAIN_DAYS, cost: CROSS_TRAIN_COST, xp: crossTrainXp(experienceIn(career, discipline).level),
  }));
}

/** Start cross-training: staff must be idle and the studio must afford it. No-op otherwise. */
export function startCrossTrainingInState<G extends { hiredStaff: StaffMember[]; money: number; currentDay: number }>(
  state: G, staffId: string, discipline: StaffDiscipline, charge: (s: G, cost: number, staffId: string, memo: string) => G,
): G {
  const member = state.hiredStaff.find((s) => s.id === staffId);
  if (!member || member.status !== 'Idle') return state;
  const offer = crossTrainOptions(member).find((o) => o.discipline === discipline);
  if (!offer || state.money < offer.cost) return state;
  const charged = charge(state, offer.cost, staffId, `Cross-training: ${DISCIPLINE_LABEL[discipline]}`);
  return {
    ...charged,
    hiredStaff: charged.hiredStaff.map((s) => s.id === staffId
      ? { ...s, status: 'Training' as const, trainingEndDay: state.currentDay + offer.days, trainingCourse: crossTrainCourseId(discipline) }
      : s),
  };
}

/** Finish a cross-training course: adds XP in the new discipline, keeps everything else. */
export function completeCrossTraining<S extends Parameters<typeof getStaffCareer>[0]>(staff: S, discipline: StaffDiscipline): S & { career: StaffCareerState } {
  const career = getStaffCareer(staff);
  const gain = crossTrainXp(experienceIn(career, discipline).level);
  const experience = career.experience.map((e) => {
    if (e.discipline !== discipline) return e;
    const xp = e.xp + gain;
    return { ...e, xp, level: levelFor(xp) };
  });
  return { ...staff, career: { ...career, experience, secondaryDiscipline: discipline, crossTrained: (career.crossTrained ?? 0) + 1 } };
}

// ---- Mentorship (#67): pays only while the mentor is actually working or training ----

export const APPRENTICE_XP_SCALE = 1.25;
export const MENTOR_JUNIOR_SCALE = 1.3;
export const MENTOR_COST_SCALE = 0.85;

const mentorActive = (m?: StaffMember) => !!m && (m.status === 'Working' || m.status === 'Training');

export function canMentor(mentor: StaffMember, junior: StaffMember): boolean {
  if (mentor.id === junior.id) return false;
  const mc = getStaffCareer(mentor), jc = getStaffCareer(junior);
  return SENIORITY_ORDER.indexOf(mc.seniority) >= 2 && SENIORITY_ORDER.indexOf(jc.seniority) <= 1 && !jc.mentorId;
}

/** A senior takes one junior under their wing. A senior mentors at most one. */
export function startMentoringInState<G extends { hiredStaff: StaffMember[] }>(state: G, mentorId: string, juniorId: string): G {
  const mentor = state.hiredStaff.find((s) => s.id === mentorId);
  const junior = state.hiredStaff.find((s) => s.id === juniorId);
  if (!mentor || !junior || !canMentor(mentor, junior)) return state;
  if (state.hiredStaff.some((s) => getStaffCareer(s).mentorId === mentorId)) return state;
  return { ...state, hiredStaff: state.hiredStaff.map((s) => s.id === juniorId ? { ...s, career: { ...getStaffCareer(s), mentorId } } : s) };
}

export function stopMentoringInState<G extends { hiredStaff: StaffMember[] }>(state: G, juniorId: string): G {
  return { ...state, hiredStaff: state.hiredStaff.map((s) => {
    if (s.id !== juniorId) return s;
    const { mentorId: _drop, ...rest } = getStaffCareer(s);
    void _drop;
    return { ...s, career: rest };
  }) };
}

/** XP scale for a staff member being credited right now. Nobody working = no bonus, so no passive XP. */
export function mentorshipScale(staff: StaffMember, all: StaffMember[]): number {
  const career = getStaffCareer(staff);
  // Apprentices (College Placement) learn faster while the active discipline is still below level 3.
  const apprentice = staff.apprentice && experienceIn(career, career.activeDiscipline).level < 3 ? APPRENTICE_XP_SCALE : 1;
  if (career.mentorId) {
    const mentor = all.find((s) => s.id === career.mentorId);
    if (mentorActive(mentor)) return MENTOR_JUNIOR_SCALE * apprentice;
  }
  // A mentor with a mentee pays a small price on their own sessions.
  if (all.some((s) => s.id !== staff.id && getStaffCareer(s).mentorId === staff.id)) return MENTOR_COST_SCALE;
  return apprentice;
}
