
import { Project, StaffMember } from '@/types/game';

export const generateNewProjects = (count: number): Project[] => {
  const genres = ['Rock', 'Pop', 'Electronic', 'Hip-hop', 'Acoustic'];
  const clientTypes = ['Indie Band', 'Record Label', 'Artist', 'Commercial'];
  const projects: Project[] = [];

  for (let i = 0; i < count; i++) {
    const genre = genres[Math.floor(Math.random() * genres.length)];
    const difficulty = Math.floor(Math.random() * 5) + 1;
    const project: Project = {
      id: `project_${Date.now()}_${i}`,
      title: `${genre} ${['Anthem', 'Song', 'Track', 'Piece'][Math.floor(Math.random() * 4)]}`,
      genre,
      clientType: clientTypes[Math.floor(Math.random() * clientTypes.length)],
      difficulty,
      durationDaysTotal: difficulty + 2,
      payoutBase: 200 + (difficulty * 100),
      repGainBase: difficulty + 2,
      requiredSkills: { [genre]: difficulty },
      stages: [
        {
          stageName: 'Pre-production',
          focusAreas: ['planning', 'arrangement'],
          workUnitsBase: 10,
          workUnitsCompleted: 0
        },
        {
          stageName: 'Recording & Production',
          focusAreas: ['performance', 'soundCapture', 'layering'],
          workUnitsBase: 15,
          workUnitsCompleted: 0
        },
        {
          stageName: 'Mixing & Mastering',
          focusAreas: ['mixing', 'mastering'],
          workUnitsBase: 8,
          workUnitsCompleted: 0
        }
      ],
      matchRating: 'Good',
      accumulatedCPoints: 0,
      accumulatedTPoints: 0,
      currentStageIndex: 0
    };
    projects.push(project);
  }
  return projects;
};

export const generateCandidates = (count: number): StaffMember[] => {
  const names = ['Alex Rivera', 'Sam Chen', 'Jordan Blake', 'Casey Smith', 'Taylor Johnson', 'Morgan Davis', 'Riley Parker', 'Avery Wilson', 'Quinn Martinez', 'Sage Thompson'];
  const roles: ('Engineer' | 'Producer' | 'Songwriter')[] = ['Engineer', 'Producer', 'Songwriter'];
  const genres = ['Rock', 'Pop', 'Electronic', 'Hip-hop', 'Acoustic'];
  const candidates: StaffMember[] = [];

  for (let i = 0; i < count; i++) {
    const role = roles[Math.floor(Math.random() * roles.length)];
    const hasAffinity = Math.random() > 0.6; // 40% chance of genre affinity
    
    const candidate: StaffMember = {
      id: '', // Will be assigned when hired
      name: names[Math.floor(Math.random() * names.length)],
      role,
      primaryStats: {
        creativity: 15 + Math.floor(Math.random() * 25), // 15-40 range
        technical: 15 + Math.floor(Math.random() * 25),
        speed: 15 + Math.floor(Math.random() * 25)
      },
      xpInRole: 0,
      levelInRole: 1,
      genreAffinity: hasAffinity ? {
        genre: genres[Math.floor(Math.random() * genres.length)],
        bonus: 10 + Math.floor(Math.random() * 15) // 10-25% bonus
      } : null,
      energy: 100,
      salary: 80 + Math.floor(Math.random() * 120), // $80-200 per week
      status: 'Idle',
      assignedProjectId: null
    };
    
    candidates.push(candidate);
  }
  return candidates;
};
