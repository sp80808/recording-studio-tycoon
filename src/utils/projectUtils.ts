import { Project, ProjectStage, StaffMember, FocusAllocation, StudioSkill, Equipment, PlayerAttributes } from '@/types/game'; // Changed OwnedEquipment to Equipment
import { generateAIBand } from '@/utils/bandUtils';
import { ERA_DEFINITIONS, getGenrePopularity } from '@/utils/eraProgression';
import { initializeSkillsStaff } from '@/utils/skillUtils'; // Added import
import { calculateStudioSkillBonus, getEquipmentBonuses } from './gameUtils'; // Import from gameUtils
// Assuming getMoodEffectiveness will be moved to playerUtils or passed as arg
// For now, let's define a placeholder or expect it as an argument for calculateStaffWorkContribution

const genres = ['Rock', 'Pop', 'Electronic', 'Hip-hop', 'Acoustic'] as const;
const clientTypes = ['Independent', 'Record Label', 'Commercial', 'Streaming'] as const;

// Early-game project templates (grounded names)
const earlyGameTemplates = [
  {
    titleTemplates: ['Local Band Demo', 'Garage Band Recording', 'Indie Demo Session'],
    genre: 'Rock',
    clientType: 'Independent',
    difficulty: 2,
    baseStages: [
      { stageName: 'Setup & Recording', workUnitsBase: 8, focusAreas: ['soundCapture', 'performance'] },
      { stageName: 'Basic Mixing', workUnitsBase: 10, focusAreas: ['layering', 'soundCapture'] },
      { stageName: 'Demo Master', workUnitsBase: 6, focusAreas: ['performance', 'layering'] }
    ],
    basePayout: 300,
    baseRep: 3,
    baseDuration: 4
  },
  {
    titleTemplates: ['Coffee Shop Sessions', 'Acoustic Evening', 'Songwriter Demo'],
    genre: 'Acoustic',
    clientType: 'Independent',
    difficulty: 1,
    baseStages: [
      { stageName: 'Live Recording', workUnitsBase: 6, focusAreas: ['soundCapture', 'performance'] },
      { stageName: 'Light Production', workUnitsBase: 8, focusAreas: ['layering', 'soundCapture'] }
    ],
    basePayout: 250,
    baseRep: 2,
    baseDuration: 3
  },
  {
    titleTemplates: ['Folk Harmony Sessions', 'Country Ballad Recording', 'Bluegrass Live Taping'],
    genre: 'Folk',
    clientType: 'Independent',
    difficulty: 2,
    baseStages: [
      { stageName: 'Acoustic Setup', workUnitsBase: 7, focusAreas: ['performance', 'soundCapture'] },
      { stageName: 'Multi-Vocal Recording', workUnitsBase: 9, focusAreas: ['layering', 'performance'] },
      { stageName: 'Traditional Mix', workUnitsBase: 5, focusAreas: ['soundCapture', 'layering'] }
    ],
    basePayout: 350,
    baseRep: 3,
    baseDuration: 4
  },
  {
    titleTemplates: ['Soul Vocal Session', 'Motown-Style Recording', 'R&B Groove Track'],
    genre: 'Soul',
    clientType: 'Independent',
    difficulty: 3,
    baseStages: [
      { stageName: 'Rhythm Section Setup', workUnitsBase: 10, focusAreas: ['soundCapture', 'performance'] },
      { stageName: 'Lead Vocal Recording', workUnitsBase: 12, focusAreas: ['performance', 'soundCapture'] },
      { stageName: 'Horn Section Overdubs', workUnitsBase: 8, focusAreas: ['layering', 'performance'] }
    ],
    basePayout: 400,
    baseRep: 4,
    baseDuration: 5
  },
  {
    titleTemplates: ['Jazz Session Recording', 'Big Band Live Session', 'Trumpet & Piano Duo'],
    genre: 'Jazz',
    clientType: 'Independent',
    difficulty: 3,
    baseStages: [
      { stageName: 'Live Setup & Mic Placement', workUnitsBase: 9, focusAreas: ['soundCapture', 'performance'] },
      { stageName: 'Live Recording Session', workUnitsBase: 11, focusAreas: ['performance', 'soundCapture'] },
      { stageName: 'Analog Mix & Press', workUnitsBase: 7, focusAreas: ['soundCapture', 'layering'] }
    ],
    basePayout: 375,
    baseRep: 3,
    baseDuration: 4
  }
];

// Mid-to-late game project templates (more epic names)
const advancedGameTemplates = [
  {
    titleTemplates: ['Symphony of Code', 'Digital Orchestra', 'Cyber Symphony'],
    genre: 'Electronic',
    clientType: 'Commercial',
    difficulty: 8,
    baseStages: [
      { stageName: 'Thematic Composition', workUnitsBase: 16, focusAreas: ['performance', 'layering'] },
      { stageName: 'Orchestration & Programming', workUnitsBase: 20, focusAreas: ['layering', 'soundCapture'] },
      { stageName: 'Interactive Implementation', workUnitsBase: 18, focusAreas: ['performance', 'layering'] },
      { stageName: 'Final Mix & Mastering', workUnitsBase: 14, focusAreas: ['layering', 'soundCapture'] }
    ],
    basePayout: 1200,
    baseRep: 12,
    baseDuration: 12
  },
  {
    titleTemplates: ['Bass Drop Empire', 'Electronic Anthem', 'Festival Banger'],
    genre: 'Electronic',
    clientType: 'Commercial',
    difficulty: 6,
    baseStages: [
      { stageName: 'Beat Programming & Sound Design', workUnitsBase: 14, focusAreas: ['layering', 'performance'] },
      { stageName: 'Arrangement & Build-ups', workUnitsBase: 16, focusAreas: ['performance', 'layering'] },
      { stageName: 'Mixing & Master', workUnitsBase: 12, focusAreas: ['layering', 'soundCapture'] }
    ],
    basePayout: 850,
    baseRep: 8,
    baseDuration: 8
  },
  {
    titleTemplates: ['Neon Dreams', 'Synthwave Journey', 'Retro Future'],
    genre: 'Electronic',
    clientType: 'Streaming',
    difficulty: 5,
    baseStages: [
      { stageName: 'Concept & Sound Design', workUnitsBase: 12, focusAreas: ['layering', 'performance'] },
      { stageName: 'Recording & Layering', workUnitsBase: 16, focusAreas: ['soundCapture', 'layering'] },
      { stageName: 'Mixing & Mastering', workUnitsBase: 14, focusAreas: ['layering', 'performance'] }
    ],
    basePayout: 700,
    baseRep: 7,
    baseDuration: 7
  },
  {
    titleTemplates: ['Corporate Harmony', 'Brand Anthem', 'Commercial Melody'],
    genre: 'Pop',
    clientType: 'Commercial',
    difficulty: 4,
    baseStages: [
      { stageName: 'Client Consultation & Concept', workUnitsBase: 8, focusAreas: ['performance', 'soundCapture'] },
      { stageName: 'Multiple Variations & Testing', workUnitsBase: 12, focusAreas: ['layering', 'performance'] },
      { stageName: 'Final Production & Delivery', workUnitsBase: 10, focusAreas: ['soundCapture', 'layering'] }
    ],
    basePayout: 600,
    baseRep: 6,
    baseDuration: 6
  },
  {
    titleTemplates: ['Rock Anthem', 'Power Ballad', 'Stadium Rocker'],
    genre: 'Rock',
    clientType: 'Record Label',
    difficulty: 4,
    baseStages: [
      { stageName: 'Songwriting & Arrangement', workUnitsBase: 10, focusAreas: ['performance', 'soundCapture'] },
      { stageName: 'Tracking & Recording', workUnitsBase: 14, focusAreas: ['soundCapture', 'layering'] },
      { stageName: 'Mixing & Production', workUnitsBase: 12, focusAreas: ['layering', 'performance'] },
      { stageName: 'Mastering & Polish', workUnitsBase: 8, focusAreas: ['soundCapture', 'layering'] }
    ],
    basePayout: 650,
    baseRep: 6,
    baseDuration: 8
  }
];

export const generateNewProjects = (count: number, playerLevel: number = 1, currentEra: string = 'analog60s'): Project[] => {
  const projects: Project[] = [];
  const usedTitles = new Set<string>();
  
  // Get available genres for current era
  const currentEraDefinition = ERA_DEFINITIONS.find(era => era.id === currentEra);
  const baseAvailableGenres = currentEraDefinition?.availableGenres || ['Rock', 'Folk', 'Soul', 'Motown', 'Country', 'Jazz'];
  const availableGenresSet = new Set(baseAvailableGenres); // Use a Set for O(1) lookups
  
  // Filter templates by era-appropriate genres
  const eraAppropriateTemplates = earlyGameTemplates.filter(template => 
    availableGenresSet.has(template.genre)
  );
  
  const advancedEraTemplates = advancedGameTemplates.filter(template => 
    availableGenresSet.has(template.genre)
  );
  
  // Choose appropriate template pool based on player level and era
  const isEarlyGame = playerLevel < 5;
  const templatePool = isEarlyGame ? eraAppropriateTemplates : [...eraAppropriateTemplates, ...advancedEraTemplates];
  const weightedPool = isEarlyGame ? eraAppropriateTemplates : advancedEraTemplates;
  
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let project: Project;
    
    do {
      // 70% chance to use level-appropriate templates, 30% chance for variety
      const useAppropriateLevel = Math.random() < 0.7;
      const selectedPool = useAppropriateLevel ? weightedPool : templatePool;
      const template = selectedPool[Math.floor(Math.random() * selectedPool.length)];
      
      // Pick a random title from the template's title array
      const titleIndex = Math.floor(Math.random() * template.titleTemplates.length);
      const selectedTitle = template.titleTemplates[titleIndex];
      
      const difficultyVariation = Math.random() * 2 - 1; // -1 to +1
      let finalDifficulty = Math.max(1, Math.min(10, template.difficulty + Math.floor(difficultyVariation)));
      
      // Cap difficulty for early game
      if (isEarlyGame) {
        finalDifficulty = Math.min(finalDifficulty, 4);
      }
      
      // Create stages with variation
      const stages: ProjectStage[] = template.baseStages.map(stageTemplate => ({
        stageName: stageTemplate.stageName,
        focusAreas: stageTemplate.focusAreas,
        workUnitsBase: Math.max(4, stageTemplate.workUnitsBase + Math.floor(Math.random() * 4 - 2)),
        workUnitsCompleted: 0,
        completed: false
      }));

      // Calculate dynamic pricing based on difficulty, market conditions, and era popularity
      const genrePopularity = getGenrePopularity(template.genre, currentEra);
      const marketMultiplier = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      const difficultyMultiplier = 1 + (finalDifficulty - 1) * 0.15; // Scales with difficulty
      const eraPopularityMultiplier = genrePopularity / 100; // Convert to 0-1 scale
      
      const finalPayout = Math.floor(template.basePayout * marketMultiplier * difficultyMultiplier * eraPopularityMultiplier);
      const finalRep = Math.floor(template.baseRep * difficultyMultiplier * eraPopularityMultiplier);
      const finalDuration = Math.max(3, template.baseDuration + Math.floor(Math.random() * 3 - 1));

      // Generate required skills based on genre and difficulty
      const requiredSkills: Record<string, number> = {};
      requiredSkills[template.genre] = Math.max(1, Math.floor(finalDifficulty / 2));

      // Determine match rating based on difficulty relative to player level
      const matchRating: 'Poor' | 'Good' | 'Excellent' = 
        finalDifficulty <= playerLevel ? 'Excellent' :
        finalDifficulty <= playerLevel + 2 ? 'Good' : 'Poor';

      // Generate associated AI band
      const associatedBand = generateAIBand(template.genre);

      project = {
        id: `project-${Date.now()}-${i}`,
        title: selectedTitle,
        genre: template.genre,
        clientType: template.clientType,
        difficulty: finalDifficulty,
        payoutBase: finalPayout,
        repGainBase: finalRep,
        durationDaysTotal: finalDuration,
        requiredSkills,
        matchRating,
        stages,
        currentStageIndex: 0,
        completedStages: [],
        accumulatedCPoints: 0,
        accumulatedTPoints: 0,
        workSessionCount: 0,
        associatedBandId: associatedBand.id
      };

      attempts++;
    } while (usedTitles.has(project.title) && attempts < 50); // Prevent infinite loops
    
    // Add the unique title to our set and the project to our list
    usedTitles.add(project.title);
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
      mood: 75, // Start with good mood
      salary: 80 + Math.floor(Math.random() * 120), // $80-200 per week
      status: 'Idle',
      assignedProjectId: null,
      skills: initializeSkillsStaff() // Initialize staff skills
    };
    
    candidates.push(candidate);
  }
  return candidates;
};

export const calculateProjectDifficulty = (project: Project): number => {
  const totalWorkUnits = project.stages.reduce((sum, stage) => sum + stage.workUnitsBase, 0);
  const baseComplexity = totalWorkUnits / 10;
  const genreComplexity = project.genre === 'Electronic' ? 1.2 : 
                         project.genre === 'Hip-hop' ? 1.1 : 
                         project.genre === 'Acoustic' ? 0.9 : 1.0;
  
  return Math.min(10, Math.max(1, Math.floor(baseComplexity * genreComplexity)));
};

export const getProjectRequirements = (project: Project) => {
  const requirements = {
    minPlayerLevel: Math.max(1, Math.floor(project.difficulty / 2)),
    recommendedSkillLevel: Math.max(1, Math.floor(project.difficulty / 3)),
    estimatedWorkSessions: project.stages.reduce((sum, stage) => sum + Math.ceil(stage.workUnitsBase / 3), 0)
  };
  
  return requirements;
};

// Helper type for work points
export interface WorkPoints {
  creativity: number;
  technical: number;
}

export const calculateBaseWorkPoints = (
  dailyWorkCapacity: number,
  attributes: { creativeIntuition: number; technicalAptitude: number }
): WorkPoints => {
  const baseWorkCapacity = Math.max(dailyWorkCapacity, 1);
  const attributeMultiplier =
    1 +
    (attributes.creativeIntuition - 1) * 0.5 +
    (attributes.technicalAptitude - 1) * 0.5;
  
  // Enhanced base points calculation (matches useStageWork)
  const baseCreativityWork = Math.floor(baseWorkCapacity * 8 * attributeMultiplier);
  const baseTechnicalWork = Math.floor(baseWorkCapacity * 8 * attributeMultiplier);

  return { creativity: baseCreativityWork, technical: baseTechnicalWork };
};

export const applyFocusAndMultipliers = (
  basePoints: WorkPoints,
  focusAllocation: FocusAllocation,
  creativityMultiplier: number,
  technicalMultiplier: number,
  focusEffectiveness: number
): WorkPoints => {
  // Apply focus allocation with enhanced effectiveness (matches useStageWork)
  const creativityGain = Math.floor(
    basePoints.creativity * creativityMultiplier * focusEffectiveness * (
      (focusAllocation.performance / 100) * 0.8 + 
      (focusAllocation.layering / 100) * 0.6
    )
  );
  const technicalGain = Math.floor(
    basePoints.technical * technicalMultiplier * focusEffectiveness * (
      (focusAllocation.soundCapture / 100) * 0.8 + 
      (focusAllocation.layering / 100) * 0.4
    )
  );
  return { creativity: creativityGain, technical: technicalGain };
};

export const applyStudioSkillBonusesToWorkPoints = (
  currentPoints: WorkPoints,
  projectGenre: string,
  studioSkills: { [key: string]: StudioSkill }
): WorkPoints => {
  let { creativity, technical } = currentPoints;
  const genreSkill = studioSkills[projectGenre];

  if (genreSkill) {
    const creativityBonusPercent = calculateStudioSkillBonus(genreSkill, 'creativity');
    const technicalBonusPercent = calculateStudioSkillBonus(genreSkill, 'technical');
    
    creativity += Math.floor(creativity * (creativityBonusPercent / 100));
    technical += Math.floor(technical * (technicalBonusPercent / 100));
  }
  return { creativity, technical };
};

export const applyEquipmentBonusesToWorkPoints = (
  currentPoints: WorkPoints,
  ownedEquipment: Equipment[], // Changed OwnedEquipment to Equipment
  projectGenre: string
): WorkPoints => {
  let { creativity, technical } = currentPoints;
  const equipmentBonuses = getEquipmentBonuses(ownedEquipment, projectGenre);

  creativity += Math.floor(creativity * (equipmentBonuses.creativity / 100));
  technical += Math.floor(technical * (equipmentBonuses.technical / 100));
  creativity += equipmentBonuses.genre; // Direct points bonus for genre

  return { creativity, technical };
};

// Placeholder for getMoodEffectiveness if not moved yet, or assume it's passed.
// For this refactoring, we'll assume it's passed to calculateStaffWorkContribution.
export const calculateStaffWorkContribution = (
  currentPoints: WorkPoints,
  assignedStaff: StaffMember[],
  projectGenre: string,
  getMoodEffectiveness: (mood: number) => number // Pass as argument
): WorkPoints => {
  let { creativity, technical } = currentPoints;

  assignedStaff.forEach(staff => {
    if (staff.energy < 20) {
      const penalty = 0.3;
      creativity += Math.floor(staff.primaryStats.creativity * 0.5 * penalty);
      technical += Math.floor(staff.primaryStats.technical * 0.5 * penalty);
    } else {
      const moodMultiplier = getMoodEffectiveness(staff.mood);
      let staffCreativity = Math.floor(staff.primaryStats.creativity * 0.8 * moodMultiplier);
      let staffTechnical = Math.floor(staff.primaryStats.technical * 0.8 * moodMultiplier);

      if (staff.genreAffinity && staff.genreAffinity.genre === projectGenre) {
        const bonus = staff.genreAffinity.bonus / 100;
        staffCreativity += Math.floor(staffCreativity * bonus);
        staffTechnical += Math.floor(staffTechnical * bonus);
      }
      creativity += staffCreativity;
      technical += staffTechnical;
    }
  });
  return { creativity, technical };
};
