import { Project, StaffMember } from '@/types/game';
import { careerFitBonus } from '@/rpg/staffCareer';
import { inferProjectStageKind } from '@/utils/studioRoomUtils';

export interface StaffProjectFit {
  score: number;
  stageSkill: string;
  stageSkillLevel: number;
  genreBonus: number;
  clientSessions: number;
  readiness: number;
  reasons: string[];
}

const getStageSkill = (
  staff: StaffMember,
  project: Project
): { name: keyof StaffMember['skills']; level: number } => {
  const stageName = project.stages?.[project.currentStageIndex || 0]?.stageName?.toLowerCase() || '';
  const kind = inferProjectStageKind(project);

  let skillName: keyof StaffMember['skills'];

  if (stageName.includes('vocal')) {
    skillName = 'vocalComping';
  } else if (kind === 'mastering') {
    skillName = 'mastering';
  } else if (kind === 'mixing') {
    skillName = 'mixing';
  } else if (kind === 'tracking') {
    skillName = 'tracking';
  } else if (stageName.includes('sound design') || project.genre.toLowerCase() === 'electronic') {
    skillName = 'soundDesign';
  } else if (stageName.includes('sample') || project.genre.toLowerCase() === 'hip-hop') {
    skillName = 'sampleWarping';
  } else {
    skillName = 'songwriting';
  }

  return {
    name: skillName,
    level: staff.skills[skillName]?.level || 0
  };
};

export const calculateStaffProjectFit = (
  staff: StaffMember,
  project: Project
): StaffProjectFit => {
  const stageSkill = getStageSkill(staff, project);
  const baseStat =
    (staff.primaryStats.creativity + staff.primaryStats.technical + staff.primaryStats.speed) / 3;

  const genreBonus =
    staff.genreAffinity?.genre.toLowerCase() === project.genre.toLowerCase()
      ? staff.genreAffinity.bonus
      : 0;

  const clientSessions =
    project.clientId && staff.clientFamiliarity
      ? staff.clientFamiliarity[project.clientId] || 0
      : 0;

  const readiness = Math.max(
    0.15,
    Math.min(1, ((staff.energy / 100) * 0.6) + ((staff.mood / 100) * 0.4))
  );

  const roleBonus =
    (staff.role === 'Engineer' && ['tracking', 'mixing', 'mastering'].includes(inferProjectStageKind(project))) ||
    (staff.role === 'Producer' && inferProjectStageKind(project) === 'production') ||
    (staff.role === 'Songwriter' && stageSkill.name === 'songwriting')
      ? 8
      : 0;

  const familiarityBonus = Math.min(10, clientSessions * 2);
  const career = careerFitBonus(staff, project.stages?.[project.currentStageIndex || 0]?.stageName ?? '');

  const rawScore =
    baseStat * 0.45 +
    stageSkill.level * 7 +
    genreBonus * 0.35 +
    roleBonus +
    familiarityBonus +
    career.points;

  const score = Math.max(1, Math.min(100, Math.round(rawScore * readiness)));

  const reasons = [
    `${stageSkill.name} ${stageSkill.level}`,
    ...(genreBonus > 0 ? [`${project.genre} affinity +${genreBonus}%`] : []),
    ...(career.reason ? [career.reason] : []),
    ...(clientSessions > 0 ? [`${clientSessions} prior client session${clientSessions === 1 ? '' : 's'}`] : []),
    `${Math.round(staff.energy)}% energy`,
    `${Math.round(staff.mood)}% mood`
  ];

  return {
    score,
    stageSkill: stageSkill.name,
    stageSkillLevel: stageSkill.level,
    genreBonus,
    clientSessions,
    readiness,
    reasons
  };
};

export const rankStaffForProject = (
  staff: StaffMember[],
  project: Project
): Array<{ staff: StaffMember; fit: StaffProjectFit }> =>
  staff
    .map(member => ({
      staff: member,
      fit: calculateStaffProjectFit(member, project)
    }))
    .sort((a, b) => b.fit.score - a.fit.score);
