
import { StaffMember, Project } from '@/types/game';

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

export const calculateStaffProjectMatch = (staff: StaffMember, project: Project): number => {
  // Base compatibility score
  let score = 50;
  
  // Factor in staff skills vs project requirements
  if (project.requiredSkills?.creativity) {
    const creativityMatch = Math.min(100, (staff.primaryStats.creativity / project.requiredSkills.creativity) * 100);
    score += (creativityMatch - 50) * 0.3;
  }
  
  if (project.requiredSkills?.technical) {
    const technicalMatch = Math.min(100, (staff.primaryStats.technical / project.requiredSkills.technical) * 100);
    score += (technicalMatch - 50) * 0.3;
  }
  
  // Factor in genre affinity if available
  if (staff.genreAffinity && staff.genreAffinity.genre === project.genre) {
    score += staff.genreAffinity.bonus * 0.2;
  }
  
  // Factor in project difficulty vs staff experience/level
  const difficultyPenalty = Math.max(0, project.difficulty - staff.levelInRole) * 5;
  score -= difficultyPenalty;
  
  // Factor in staff speed as efficiency indicator
  score += (staff.primaryStats.speed - 50) * 0.1;
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

export const getStaffMatchColor = (matchScore: number): string => {
  if (matchScore >= 80) return 'text-green-500';
  if (matchScore >= 60) return 'text-yellow-500';
  if (matchScore >= 40) return 'text-orange-500';
  return 'text-red-500';
};

export const getStaffMatchDescription = (matchScore: number): string => {
  if (matchScore >= 80) return 'Excellent fit';
  if (matchScore >= 60) return 'Good fit';
  if (matchScore >= 40) return 'Fair fit';
  return 'Poor fit';
};
