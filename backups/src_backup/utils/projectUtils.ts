
import { Project, StaffMember, ProjectTemplate } from '@/types/game';
import { getProjectTemplate } from '@/data/projectTemplates';

export const generateNewProjects = (count: number): Project[] => {
  const genres = ['Rock', 'Pop', 'Electronic', 'Hip-hop', 'Acoustic'];
  const projects: Project[] = [];

  for (let i = 0; i < count; i++) {
    const genre = genres[Math.floor(Math.random() * genres.length)];
    const difficulty = Math.floor(Math.random() * 5) + 1;
    const template = getProjectTemplate(difficulty, genre);
    
    const project: Project = {
      id: `project_${Date.now()}_${i}`,
      title: template.titlePattern.replace('{genre}', genre),
      genre: template.genre,
      clientType: template.clientType,
      difficulty: template.difficulty,
      durationDaysTotal: template.durationDaysTotal,
      payoutBase: template.payoutBase,
      repGainBase: template.repGainBase,
      requiredSkills: {},
      stages: template.stages.map(stage => ({
        ...stage,
        workUnitsCompleted: 0,
        completed: false
      })),
      matchRating: 'Good',
      accumulatedCPoints: 0,
      accumulatedTPoints: 0,
      currentStageIndex: 0,
      completedStages: []
    };

    // Copy required skills from stages to project
    template.stages.forEach(stage => {
      if (stage.requiredSkills) {
        Object.entries(stage.requiredSkills).forEach(([skill, level]) => {
          if (!project.requiredSkills[skill] || project.requiredSkills[skill] < level) {
            project.requiredSkills[skill] = level;
          }
        });
      }
    });

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
      assignedProjectId: null,
      xp: 0,
      xpToNextLevelInRole: 100
    };
    
    candidates.push(candidate);
  }
  return candidates;
};
