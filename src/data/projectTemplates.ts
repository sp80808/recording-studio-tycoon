import { ProjectTemplate, StageTemplate, GameState } from '@/types/game';

export const projectTemplates: ProjectTemplate[] = [
  // Early Game Templates (1960s-1970s)
  {
    id: 'beginner_single_60s',
    titlePattern: '{genre} Demo Session',
    genre: 'Rock',
    clientType: 'Indie Band',
    difficulty: 1,
    durationDaysTotal: 3,
    payoutBase: 300,
    repGainBase: 3,
    era: 'analog60s',
    stages: [
      {
        stageName: 'Basic Recording',
        focusAreas: ['performance', 'soundCapture'],
        workUnitsBase: 1,
        requiredSkills: { recording: 1 },
        stageBonuses: { technical: 1.2 },
        minigameTriggerId: 'vocalRecording'
      },
      {
        stageName: 'Quick Mix',
        focusAreas: ['mixing'],
        workUnitsBase: 1,
        requiredSkills: { mixing: 1 },
        stageBonuses: { technical: 1.3 },
        minigameTriggerId: 'mixingBoard'
      },
      {
        stageName: 'Final Touches',
        focusAreas: ['mastering'],
        workUnitsBase: 1,
        requiredSkills: { mastering: 1 },
        stageBonuses: { technical: 1.4 },
        minigameTriggerId: 'mastering'
      }
    ]
  },
  {
    id: 'standard_album_60s',
    titlePattern: '{genre} Album Track',
    genre: 'Rock',
    clientType: 'Record Label',
    difficulty: 3,
    durationDaysTotal: 12,
    payoutBase: 800,
    repGainBase: 8,
    era: 'analog60s',
    stages: [
      {
        stageName: 'Pre-production',
        focusAreas: ['planning', 'arrangement'],
        workUnitsBase: 3,
        requiredSkills: { composition: 2 },
        stageBonuses: { creativity: 1.2 },
        minigameTriggerId: 'rhythmTiming'
      },
      {
        stageName: 'Recording',
        focusAreas: ['performance', 'soundCapture', 'layering'],
        workUnitsBase: 5,
        stageBonuses: { creativity: 1.3 },
        requiredSkills: { recording: 2 },
        minigameTriggerId: 'vocalRecording'
      },
      {
        stageName: 'Mixing',
        focusAreas: ['mixing'],
        workUnitsBase: 3,
        requiredSkills: { mixing: 3 },
        stageBonuses: { technical: 1.4 },
        minigameTriggerId: 'mixingBoard'
      },
      {
        stageName: 'Mastering',
        focusAreas: ['mastering'],
        workUnitsBase: 1,
        requiredSkills: { mastering: 2 },
        stageBonuses: { technical: 1.5 },
        minigameTriggerId: 'mastering'
      }
    ]
  },
  // Mid Game Templates (1980s-1990s)
  {
    id: 'electronic_single_80s',
    titlePattern: '{genre} Single',
    genre: 'Electronic',
    clientType: 'Record Label',
    difficulty: 4,
    durationDaysTotal: 8,
    payoutBase: 1000,
    repGainBase: 10,
    era: 'digital80s',
    stages: [
      {
        stageName: 'Sound Design',
        focusAreas: ['soundDesign', 'layering'],
        workUnitsBase: 4,
        requiredSkills: { soundDesign: 3 },
        stageBonuses: { creativity: 1.4 },
        minigameTriggerId: 'soundWave'
      },
      {
        stageName: 'Sequencing',
        focusAreas: ['performance', 'arrangement'],
        workUnitsBase: 6,
        stageBonuses: { technical: 1.3 },
        requiredSkills: { sequencing: 3 },
        minigameTriggerId: 'midiProgramming'
      },
      {
        stageName: 'Digital Mix',
        focusAreas: ['mixing', 'mastering'],
        workUnitsBase: 4,
        requiredSkills: { mixing: 3 },
        stageBonuses: { technical: 1.4 },
        minigameTriggerId: 'mixingBoard'
      }
    ]
  },
  // Late Game Templates (2000s-Present)
  {
    id: 'commercial_project_modern',
    titlePattern: '{genre} Commercial Project',
    genre: 'Electronic',
    clientType: 'Commercial',
    difficulty: 6,
    durationDaysTotal: 15,
    payoutBase: 2000,
    repGainBase: 15,
    era: 'modern',
    stages: [
      {
        stageName: 'Concept Development',
        focusAreas: ['planning', 'soundDesign'],
        workUnitsBase: 5,
        requiredSkills: { composition: 4 },
        stageBonuses: { creativity: 1.5 },
        minigameTriggerId: 'soundWave'
      },
      {
        stageName: 'Production',
        focusAreas: ['performance', 'layering', 'soundDesign'],
        workUnitsBase: 8,
        stageBonuses: { creativity: 1.4 },
        requiredSkills: { production: 4 },
        minigameTriggerId: 'instrumentLayering'
      },
      {
        stageName: 'Advanced Mixing',
        focusAreas: ['mixing', 'mastering'],
        workUnitsBase: 6,
        requiredSkills: { mixing: 5 },
        stageBonuses: { technical: 1.5 },
        minigameTriggerId: 'mixingBoard'
      },
      {
        stageName: 'Final Delivery',
        focusAreas: ['mastering', 'delivery'],
        workUnitsBase: 4,
        requiredSkills: { mastering: 4 },
        stageBonuses: { technical: 1.6 },
        minigameTriggerId: 'mastering'
      }
    ]
  },
  // Special Project Templates
  {
    id: 'film_score_modern',
    titlePattern: '{genre} Film Score',
    genre: 'Classical',
    clientType: 'Commercial',
    difficulty: 8,
    durationDaysTotal: 20,
    payoutBase: 3000,
    repGainBase: 20,
    era: 'modern',
    stages: [
      {
        stageName: 'Orchestration',
        focusAreas: ['composition', 'arrangement'],
        workUnitsBase: 6,
        requiredSkills: { composition: 5 },
        stageBonuses: { creativity: 1.6 },
        minigameTriggerId: 'instrumentLayering'
      },
      {
        stageName: 'Recording Session',
        focusAreas: ['performance', 'soundCapture'],
        workUnitsBase: 8,
        requiredSkills: { recording: 5 },
        stageBonuses: { technical: 1.5 },
        minigameTriggerId: 'vocalRecording'
      },
      {
        stageName: 'Post-Production',
        focusAreas: ['mixing', 'mastering'],
        workUnitsBase: 6,
        requiredSkills: { mixing: 5 },
        stageBonuses: { technical: 1.6 },
        minigameTriggerId: 'mixingBoard'
      }
    ]
  }
];

export const getProjectTemplate = (gameState: GameState): ProjectTemplate => {
  const playerLevel = gameState.playerData.level;
  const currentEra = gameState.currentEra;
  
  // Calculate appropriate difficulty based on player level
  const baseDifficulty = Math.min(10, Math.max(1, Math.floor(playerLevel / 2)));
  const difficultyVariation = Math.random() * 2 - 1; // -1 to +1
  const targetDifficulty = Math.max(1, Math.min(10, baseDifficulty + Math.floor(difficultyVariation)));
  
  const filtered = projectTemplates.filter(t => 
    t.difficulty === targetDifficulty && 
    t.era === currentEra
  );
  
  if (filtered.length === 0) {
    // Fallback to any template of appropriate difficulty
    return projectTemplates.find(t => t.difficulty === targetDifficulty) || projectTemplates[0];
  }
  
  return filtered[Math.floor(Math.random() * filtered.length)];
};
