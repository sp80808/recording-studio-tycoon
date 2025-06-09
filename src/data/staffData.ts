
import { StaffMember } from '@/types/game';

export const generateStaffCandidates = (count: number): StaffMember[] => {
  const names = ['Alex Johnson', 'Sam Davis', 'Jordan Taylor', 'Casey Brown', 'Riley Wilson'];
  const roles: StaffMember['role'][] = ['Engineer', 'Producer', 'Songwriter'];
  
  return Array.from({ length: count }, (_, index) => ({
    id: `candidate_${Date.now()}_${index}`,
    name: names[index % names.length],
    role: roles[index % roles.length],
    primaryStats: {
      creativity: Math.floor(Math.random() * 20) + 10,
      technical: Math.floor(Math.random() * 20) + 10,
      speed: Math.floor(Math.random() * 20) + 10
    },
    xpInRole: 0,
    levelInRole: 1,
    genreAffinity: null,
    energy: 100,
    mood: 75,
    salary: Math.floor(Math.random() * 200) + 100,
    status: 'Idle',
    assignedProjectId: null
  }));
};
