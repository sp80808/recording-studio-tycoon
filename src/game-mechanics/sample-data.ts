import { 
  Genre, 
  SubGenre, 
  Client, 
  RecordLabel, 
  StudioPerk, 
  StaffMemberWellbeing, 
  RandomEvent,
  PerkCategory,
  StaffMoodStatus,
  EventType 
} from '../game-mechanics';

// Example Genres
export const SAMPLE_GENRES: Genre[] = [
  { id: 'pop', name: 'Pop', description: 'Mainstream popular music with broad appeal' },
  { id: 'rock', name: 'Rock', description: 'Guitar-driven music with strong rhythms' },
  { id: 'electronic', name: 'Electronic', description: 'Synthesizer and computer-based music' },
  { id: 'hiphop', name: 'Hip-Hop', description: 'Rhythm and poetry with urban influences' },
  { id: 'country', name: 'Country', description: 'Rural and folk-influenced American music' },
  { id: 'jazz', name: 'Jazz', description: 'Improvisational music with complex harmonies' },
  { id: 'classical', name: 'Classical', description: 'Traditional orchestral and chamber music' },
  { id: 'indie', name: 'Indie', description: 'Independent alternative music' }
];

// Example Sub-Genres
export const SAMPLE_SUBGENRES: SubGenre[] = [
  // Pop sub-genres
  { id: 'synthpop', name: 'Synthpop', mainGenreId: 'pop', description: 'Pop music with synthesizer focus' },
  { id: 'bubblegum', name: 'Bubblegum Pop', mainGenreId: 'pop', description: 'Ultra-catchy, upbeat pop music' },
  { id: 'artpop', name: 'Art Pop', mainGenreId: 'pop', description: 'Experimental and artistic pop music' },
  
  // Electronic sub-genres
  { id: 'house', name: 'House', mainGenreId: 'electronic', description: 'Four-on-the-floor dance music' },
  { id: 'techno', name: 'Techno', mainGenreId: 'electronic', description: 'Hard-hitting electronic dance music' },
  { id: 'ambient', name: 'Ambient', mainGenreId: 'electronic', description: 'Atmospheric soundscape music' },
  { id: 'dubstep', name: 'Dubstep', mainGenreId: 'electronic', description: 'Bass-heavy electronic music with drops' },
  
  // Rock sub-genres
  { id: 'alternative', name: 'Alternative Rock', mainGenreId: 'rock', description: 'Non-mainstream rock music' },
  { id: 'metal', name: 'Heavy Metal', mainGenreId: 'rock', description: 'Aggressive, distorted rock music' },
  { id: 'punk', name: 'Punk Rock', mainGenreId: 'rock', description: 'Fast, raw, rebellious rock music' },
  
  // Hip-Hop sub-genres
  { id: 'trap', name: 'Trap', mainGenreId: 'hiphop', description: 'Southern hip-hop with heavy 808s' },
  { id: 'conscious', name: 'Conscious Rap', mainGenreId: 'hiphop', description: 'Socially aware hip-hop music' },
  { id: 'drill', name: 'Drill', mainGenreId: 'hiphop', description: 'Dark, aggressive urban hip-hop' }
];

// Example Clients
export const SAMPLE_CLIENTS: Client[] = [
  {
    id: 'indie_artist_001',
    name: 'Luna Martinez',
    relationshipScore: 50,
    preferredGenres: ['indie', 'alternative'],
    interactionHistory: [],
    isBlacklisted: false
  },
  {
    id: 'pop_artist_001',
    name: 'Jake Thompson',
    relationshipScore: 65,
    preferredGenres: ['pop', 'synthpop'],
    interactionHistory: [],
    isBlacklisted: false
  },
  {
    id: 'electronic_duo_001',
    name: 'Neon Pulse',
    relationshipScore: 45,
    preferredGenres: ['electronic', 'house', 'techno'],
    interactionHistory: [],
    isBlacklisted: false
  },
  {
    id: 'rapper_001',
    name: 'MC Flow State',
    relationshipScore: 70,
    preferredGenres: ['hiphop', 'trap'],
    interactionHistory: [],
    isBlacklisted: false
  }
];

// Example Record Labels
export const SAMPLE_RECORD_LABELS: RecordLabel[] = [
  {
    id: 'major_label_001',
    name: 'Stellar Records',
    relationshipScore: 40,
    preferredGenres: ['pop', 'rock', 'hiphop'],
    influenceTier: 'Global',
    interactionHistory: [],
    isBlacklisted: false
  },
  {
    id: 'indie_label_001',
    name: 'Underground Sounds',
    relationshipScore: 75,
    preferredGenres: ['indie', 'alternative', 'punk'],
    influenceTier: 'Regional',
    interactionHistory: [],
    isBlacklisted: false
  },
  {
    id: 'electronic_label_001',
    name: 'Digital Waves Music',
    relationshipScore: 55,
    preferredGenres: ['electronic', 'house', 'techno', 'dubstep'],
    influenceTier: 'National',
    interactionHistory: [],
    isBlacklisted: false
  },
  {
    id: 'hiphop_label_001',
    name: 'Street Crown Entertainment',
    relationshipScore: 60,
    preferredGenres: ['hiphop', 'trap', 'drill'],
    influenceTier: 'National',
    interactionHistory: [],
    isBlacklisted: false
  }
];

// Example Studio Perks
export const SAMPLE_STUDIO_PERKS: StudioPerk[] = [
  {
    id: 'acoustic_treatment_basic',
    name: 'Basic Acoustic Treatment',
    description: 'Sound-absorbing panels and bass traps improve recording quality',
    category: 'Acoustics' as PerkCategory,
    unlockConditions: [
      { type: 'studioReputation', threshold: 25 }
    ],
    effects: [
      { attribute: 'recordingQualityBonus', value: 0.1, type: 'percentage' },
      { attribute: 'mixingQualityBonus', value: 0.05, type: 'percentage' }
    ],
    cost: 15000,
    isUnlocked: false,
    isActive: false
  },
  {
    id: 'talent_scout_network',
    name: 'Talent Scout Network',
    description: 'Connections help find and recruit better staff members',
    category: 'Talent Acquisition' as PerkCategory,
    unlockConditions: [
      { type: 'staffSkillSum', skillId: 'management', threshold: 200 }
    ],
    effects: [
      { attribute: 'staffRecruitmentQuality', value: 15, type: 'flat' },
      { attribute: 'staffHiringCostReduction', value: 0.2, type: 'percentage' }
    ],
    cost: 25000,
    isUnlocked: false,
    isActive: false
  },
  {
    id: 'genre_specialist_electronic',
    name: 'Electronic Music Specialist',
    description: 'Specialized equipment and expertise for electronic music production',
    category: 'ProductionWorkflow' as PerkCategory,
    unlockConditions: [
      { type: 'completedProjectsInGenre', genreId: 'electronic', threshold: 15 }
    ],
    effects: [
      { attribute: 'projectQualityBonus', value: 0.25, type: 'percentage', scope: 'electronic' },
      { attribute: 'productionSpeedBonus', value: 0.15, type: 'percentage', scope: 'electronic' }
    ],
    cost: 30000,
    isUnlocked: false,
    isActive: false
  },
  {
    id: 'marketing_connections',
    name: 'Industry Marketing Connections',
    description: 'Network of music industry marketers and PR professionals',
    category: 'Marketing' as PerkCategory,
    unlockConditions: [
      { type: 'studioReputation', threshold: 60 },
      { type: 'completedProjectsInGenre', threshold: 25 }
    ],
    effects: [
      { attribute: 'chartPerformanceBonus', value: 0.2, type: 'percentage' },
      { attribute: 'studioReputationGain', value: 0.15, type: 'percentage' }
    ],
    cost: 40000,
    isUnlocked: false,
    isActive: false
  },
  {
    id: 'staff_wellness_program',
    name: 'Staff Wellness Program',
    description: 'Comprehensive health and wellness benefits for all staff',
    category: 'Talent Acquisition' as PerkCategory,
    unlockConditions: [
      { type: 'studioReputation', threshold: 45 }
    ],
    effects: [
      { attribute: 'staffHappinessBonus', value: 10, type: 'flat' },
      { attribute: 'burnoutReduction', value: 5, type: 'flat' },
      { attribute: 'staffRetentionBonus', value: 0.3, type: 'percentage' }
    ],
    cost: 20000,
    isUnlocked: false,
    isActive: false
  }
];

// Example Staff Members with Wellbeing Data
export const SAMPLE_STAFF_WELLBEING: StaffMemberWellbeing[] = [
  {
    id: 'engineer_001',
    name: 'Sarah Chen',
    moodScore: 75,
    currentMood: StaffMoodStatus.HAPPY,
    burnoutLevel: 20,
    moodFactors: [
      { description: 'Successful Pop Album Project', impact: 10, source: 'Project' },
      { description: 'Competitive Salary', impact: 5, source: 'Salary' },
      { description: 'Good Studio Equipment', impact: 3, source: 'Equipment' }
    ],
    skills: new Map([
      ['recording', 85],
      ['mixing', 78],
      ['mastering', 65]
    ]),
    experience: 450,
    salary: 65000,
    assignedProjects: ['project_001', 'project_003'],
    isTakingLeave: false
  },
  {
    id: 'producer_001',
    name: 'Marcus Johnson',
    moodScore: 85,
    currentMood: StaffMoodStatus.HAPPY,
    burnoutLevel: 15,
    moodFactors: [
      { description: 'Recent Industry Award Recognition', impact: 15, source: 'Recognition' },
      { description: 'Creative Freedom on Projects', impact: 8, source: 'Project' },
      { description: 'Team Collaboration', impact: 5, source: 'Social' }
    ],
    skills: new Map([
      ['producing', 92],
      ['arrangement', 88],
      ['composition', 85]
    ]),
    experience: 680,
    salary: 85000,
    assignedProjects: ['project_002'],
    isTakingLeave: false
  },
  {
    id: 'assistant_001',
    name: 'Emma Rodriguez',
    moodScore: 45,
    currentMood: StaffMoodStatus.NEUTRAL,
    burnoutLevel: 55,
    moodFactors: [
      { description: 'Heavy Workload', impact: -10, source: 'Workload' },
      { description: 'Below Market Salary', impact: -8, source: 'Salary' },
      { description: 'Learning New Skills', impact: 5, source: 'Development' }
    ],
    skills: new Map([
      ['organization', 70],
      ['communication', 75],
      ['technical_support', 45]
    ]),
    experience: 120,
    salary: 35000,
    assignedProjects: ['project_001', 'project_002', 'project_003'],
    isTakingLeave: false
  }
];

// Example Random Events
export const SAMPLE_RANDOM_EVENTS: RandomEvent[] = [
  {
    id: 'viral_tiktok_trend',
    name: 'Viral TikTok Dance Trend',
    description: 'A new dance on TikTok has made electronic music extremely popular!',
    type: 'ViralTrend' as EventType,
    triggerChance: 0.03,
    triggerConditions: [
      { condition: 'TimeAfter', value: 60 }
    ],
    effects: [
      {
        target: 'GenrePopularity',
        magnitude: 25,
        duration: 45,
        scope: 'electronic',
        description: 'Electronic music demand surge from viral trend'
      }
    ],
    isActive: false,
    hasTriggered: false
  },
  {
    id: 'famous_artist_endorsement',
    name: 'Celebrity Studio Endorsement',
    description: 'A famous artist has publicly praised your studio on social media!',
    type: 'CelebrityEndorsement' as EventType,
    triggerChance: 0.015,
    triggerConditions: [
      { condition: 'StudioReputationAbove', value: 70 },
      { condition: 'CompletedProjectsAbove', value: 20 }
    ],
    effects: [
      {
        target: 'StudioReputation',
        magnitude: 20,
        duration: 0,
        description: 'Celebrity endorsement reputation boost'
      },
      {
        target: 'ContractValue',
        magnitude: 15,
        duration: 90,
        description: 'Increased contract offers and values'
      }
    ],
    isActive: false,
    hasTriggered: false
  },
  {
    id: 'equipment_breakthrough',
    name: 'Revolutionary Audio Technology',
    description: 'A new breakthrough in audio technology has been announced!',
    type: 'TechnologyBreakthrough' as EventType,
    triggerChance: 0.008,
    triggerConditions: [
      { condition: 'TimeAfter', value: 180 }
    ],
    effects: [
      {
        target: 'EquipmentEfficiency',
        magnitude: 30,
        duration: 0,
        description: 'New technology improves all equipment efficiency'
      }
    ],
    playerChoices: [
      {
        id: 'early_adopter',
        description: 'Invest early in the new technology ($50,000)',
        effects: [
          {
            target: 'EquipmentEfficiency',
            magnitude: 25,
            duration: 0,
            description: 'Additional boost from early adoption'
          },
          {
            target: 'StudioReputation',
            magnitude: 10,
            duration: 0,
            description: 'Recognition as technology leader'
          }
        ],
        cost: 50000
      },
      {
        id: 'wait_and_see',
        description: 'Wait for the technology to mature before investing',
        effects: []
      }
    ],
    isActive: false,
    hasTriggered: false
  },
  {
    id: 'industry_recession',
    name: 'Music Industry Economic Downturn',
    description: 'The music industry is experiencing an economic recession.',
    type: 'EconomicRecession' as EventType,
    triggerChance: 0.005,
    triggerConditions: [
      { condition: 'TimeAfter', value: 365 }
    ],
    effects: [
      {
        target: 'ContractValue',
        magnitude: -25,
        duration: 180,
        description: 'Reduced contract budgets across the industry'
      },
      {
        target: 'MarketDemand',
        magnitude: -20,
        duration: 180,
        description: 'Overall decreased demand for studio services'
      }
    ],
    playerChoices: [
      {
        id: 'cost_cutting',
        description: 'Implement cost-cutting measures',
        effects: [
          {
            target: 'OperatingCosts',
            magnitude: -15,
            duration: 180,
            description: 'Reduced operating expenses'
          },
          {
            target: 'StaffMood',
            magnitude: -10,
            duration: 60,
            description: 'Staff unhappy with cost-cutting measures'
          }
        ]
      },
      {
        id: 'weather_storm',
        description: 'Maintain current operations and weather the downturn',
        effects: [
          {
            target: 'StaffMood',
            magnitude: 5,
            duration: 90,
            description: 'Staff appreciate job security during tough times'
          }
        ]
      }
    ],
    isActive: false,
    hasTriggered: false
  },
  {
    id: 'power_outage_disaster',
    name: 'Extended Power Outage',
    description: 'A severe storm has caused extended power outages in your area.',
    type: 'NaturalDisaster' as EventType,
    triggerChance: 0.01,
    effects: [
      {
        target: 'EquipmentEfficiency',
        magnitude: -75,
        duration: 7,
        description: 'Cannot operate without power'
      }
    ],
    playerChoices: [
      {
        id: 'backup_generator',
        description: 'Rent emergency backup generators ($5,000)',
        effects: [
          {
            target: 'EquipmentEfficiency',
            magnitude: 50,
            duration: 7,
            description: 'Partial operations restored with backup power'
          }
        ],
        cost: 5000
      },
      {
        id: 'remote_work',
        description: 'Have staff work remotely on non-studio tasks',
        effects: [
          {
            target: 'StaffMood',
            magnitude: -5,
            duration: 14,
            description: 'Staff frustrated with disruption but appreciate flexibility'
          }
        ]
      }
    ],
    isActive: false,
    hasTriggered: false
  }
];
