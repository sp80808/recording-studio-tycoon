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
  return { activeDiscipline: active, experience, seniority, credited: Array.isArray(raw?.credited) ? raw!.credited.filter((x) => typeof x === 'string').slice(-CREDIT_LOG_CAP) : [] };
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
): S & { career: StaffCareerState } {
  const career = getStaffCareer(staff);
  if (career.credited.includes(projectId)) return { ...staff, career };
  const disciplines = new Set(stageNames.map(disciplineForStage));
  if (disciplines.size === 0) disciplines.add(career.activeDiscipline);
  const gain = 8 + Math.round(Math.max(0, Math.min(100, quality)) / 10);
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
  const points = Math.min(10, exp.level * 1.5 + (onActive ? rank * 1.5 : 0));
  if (points <= 0) return { points: 0 };
  const who = onActive && rank >= 2 ? `${career.seniority} ` : '';
  return { points, reason: `${who}${DISCIPLINE_LABEL[d].toLowerCase()} experience (level ${exp.level})` };
}
