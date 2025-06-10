
import { StaffMember, Project } from '../types/game';

export const getStaffStatusColor = (status: string) => {
  switch (status) {
    case 'Working': return 'text-green-400';
    case 'Resting': return 'text-blue-400';
    case 'Idle': return 'text-gray-400';
    default: return 'text-gray-400';
  }
};

export const getEnergyColor = (energy: number) => {
  if (energy > 60) return 'text-green-400';
  if (energy > 30) return 'text-yellow-400';
  return 'text-red-400';
};

export const calculateStaffProjectMatch = (
  staff: StaffMember, 
  project: Project
): number => {
  // Default skill requirements for project genre
  const genreRequirements: Record<string, {technical: number, creative: number}> = {
    rock: { technical: 70, creative: 60 },
    pop: { technical: 60, creative: 70 },
    electronic: { technical: 80, creative: 50 }
  };

  const requirements = genreRequirements[project.genre] || { technical: 60, creative: 60 };

  // Skill match (60% weight)
  const technicalSkill = staff.skills['technical'] || 0;
  const creativeSkill = staff.skills['creative'] || 0;
  
  const skillMatch = Math.min(
    (technicalSkill / requirements.technical) * 30,
    30
  ) + Math.min(
    (creativeSkill / requirements.creative) * 30,
    30
  );

  // Genre experience (20% weight)
  const genreMatch = staff.skills[project.genre] 
    ? (staff.skills[project.genre] / 100) * 20 
    : 10; // Default 50% if no specific genre skill

  // Energy level (20% weight)
  const energyScore = (staff.energy / 100) * 20;

  return Math.round(skillMatch + genreMatch + energyScore);
};
