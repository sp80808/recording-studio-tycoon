# Era-Specific Mechanics Implementation Plan
*Recording Studio Tycoon - Detailed Implementation Strategy*

## 🎯 Overview

This document outlines the implementation plan for era-specific mechanics that will transform the game into a historical journey through music industry evolution. The system will provide authentic challenges, equipment progression, and industry dynamics that mirror real music history.

## 📋 Current Implementation Status

### ✅ Already Implemented
- **Basic Era Framework**: `eraProgression.ts` with 4 defined eras
- **Era UI Component**: `EraProgress.tsx` for tracking progression
- **Era Integration**: GameState includes era tracking
- **Transition System**: Basic era transition logic
- **Era-Specific Visuals**: Colors, icons, and descriptions

### 🚧 Partially Implemented
- **Equipment Evolution**: Basic framework exists but needs expansion
- **Genre Availability**: Basic era-specific genre lists exist
- **Year Progression**: Time advances with era but needs refinement

### ❌ Not Yet Implemented
- **Era-Specific Minigames**: Different mechanics per era
- **Technology Adoption Curves**: Equipment becomes obsolete/vintage
- **Historical Events**: Industry disruptions and opportunities
- **Market Dynamics**: Genre popularity cycles
- **Equipment Lifecycle**: Obsolescence and vintage value
- **Era-Specific Challenges**: Unique gameplay obstacles per era

## 🎮 Phase 1: Era-Specific Minigames (Immediate Priority)

### 1.1 Analog Era Minigames (1960s-1970s)
**Focus**: Physical limitations and creative solutions

#### Tape Splicing Minigame
```typescript
interface TapeSplicingGame extends MinigameBase {
  type: 'tape_splicing';
  challenge: {
    tapeSegments: TapeSegment[];
    targetArrangement: string[];
    availableTime: number; // Limited editing time
    spliceAccuracy: number; // Precision requirement
  };
  mechanics: {
    cutTape: (position: number) => boolean;
    spliceTogether: (segment1: TapeSegment, segment2: TapeSegment) => boolean;
    validateEdit: () => { accuracy: number; timing: number };
  };
}
```

#### 4-Track Recording Challenge
```typescript
interface FourTrackChallenge extends MinigameBase {
  type: 'four_track_recording';
  challenge: {
    instrumentParts: InstrumentPart[];
    trackLimitations: 4; // Only 4 tracks available
    overdubComplexity: number;
    mixingChallenge: boolean;
  };
  mechanics: {
    assignToTrack: (part: InstrumentPart, track: number) => boolean;
    bounceDown: (tracks: number[]) => Track; // Combine tracks to free space
    recordOverdub: (track: number, timing: number) => boolean;
  };
}
```

#### Analog Console Operation
```typescript
interface AnalogConsoleGame extends MinigameBase {
  type: 'analog_console';
  challenge: {
    channelCount: number;
    noRecall: true; // Settings can't be saved
    physicalLimitations: ConsoleConstraint[];
    heatDrift: boolean; // Equipment behavior changes over time
  };
  mechanics: {
    adjustFader: (channel: number, value: number) => void;
    setEQ: (channel: number, band: EQBand, value: number) => void;
    manageHeat: () => void; // Prevent equipment drift
  };
}
```

### 1.2 Digital Era Minigames (1980s-1990s)

#### MIDI Programming Challenge
```typescript
interface MIDIProgrammingGame extends MinigameBase {
  type: 'midi_programming';
  challenge: {
    sequenceComplexity: number;
    timingPrecision: number;
    quantizationDecisions: QuantizeOption[];
    velocitySensitivity: boolean;
  };
  mechanics: {
    programSequence: (notes: MIDINote[]) => boolean;
    adjustQuantization: (strength: number) => void;
    setVelocityCurve: (curve: VelocityCurve) => void;
  };
}
```

#### Digital/Analog Hybrid Mixing
```typescript
interface HybridMixingGame extends MinigameBase {
  type: 'hybrid_mixing';
  challenge: {
    analogChannels: number;
    digitalEffects: DigitalEffect[];
    conversionQuality: number;
    syncIssues: boolean;
  };
  mechanics: {
    routeSignal: (source: Source, destination: Destination) => boolean;
    manageConverters: () => void;
    synchronizeClocks: () => boolean;
  };
}
```

### 1.3 Internet Era Minigames (2000s-2010s)

#### Digital Distribution Strategy
```typescript
interface DigitalDistributionGame extends MinigameBase {
  type: 'digital_distribution';
  challenge: {
    platforms: DistributionPlatform[];
    formatRequirements: AudioFormat[];
    metadataComplexity: boolean;
    piracyMitigation: AntiPiracyStrategy[];
  };
  mechanics: {
    selectPlatforms: (platforms: DistributionPlatform[]) => void;
    optimizeFormats: (format: AudioFormat) => QualityScore;
    implementDRM: (strategy: AntiPiracyStrategy) => EffectivenessScore;
  };
}
```

#### Social Media Promotion
```typescript
interface SocialMediaGame extends MinigameBase {
  type: 'social_media_promotion';
  challenge: {
    platforms: SocialPlatform[];
    contentTypes: ContentType[];
    algorithmChanges: AlgorithmUpdate[];
    viralPotential: number;
  };
  mechanics: {
    createContent: (type: ContentType, platform: SocialPlatform) => Content;
    schedulePost: (content: Content, timing: PostTiming) => void;
    engageAudience: (engagement: EngagementType) => void;
  };
}
```

### 1.4 Streaming Era Minigames (2020s+)

#### Playlist Placement Strategy
```typescript
interface PlaylistPlacementGame extends MinigameBase {
  type: 'playlist_placement';
  challenge: {
    playlists: StreamingPlaylist[];
    curatorPreferences: CuratorPreference[];
    algorithmFactors: AlgorithmFactor[];
    competitionLevel: number;
  };
  mechanics: {
    pitchToPlaylist: (track: Track, playlist: StreamingPlaylist) => PitchResult;
    optimizeMetadata: (track: Track) => MetadataScore;
    buildRelationships: (curator: PlaylistCurator) => RelationshipLevel;
  };
}
```

#### TikTok Optimization
```typescript
interface TikTokOptimizationGame extends MinigameBase {
  type: 'tiktok_optimization';
  challenge: {
    hookTiming: number; // First 3 seconds crucial
    viralElements: ViralElement[];
    trendAlignment: TrendFactor[];
    shortFormConstraints: Constraint[];
  };
  mechanics: {
    identifyHook: (audio: AudioSegment) => HookPotential;
    createTrend: (element: ViralElement) => TrendProbability;
    optimizeLength: (duration: number) => EngagementScore;
  };
}
```

## 🛠️ Phase 2: Equipment Evolution System

### 2.1 Equipment Lifecycle Management

```typescript
interface EquipmentLifecycle {
  id: string;
  name: string;
  category: EquipmentCategory;
  introducedEra: string;
  peakEra: string;
  obsolescenceEra?: string;
  vintageFactor: number; // How valuable as vintage
  evolutionPath: EquipmentEvolution[];
}

interface EquipmentEvolution {
  fromEquipment: string;
  toEquipment: string;
  transitionEra: string;
  improvementFactor: number;
  replacementType: 'upgrade' | 'obsolete' | 'vintage';
}

class EquipmentEvolutionManager {
  updateEquipmentAvailability(era: string): void {
    // Make new equipment available
    // Mark old equipment as obsolete
    // Calculate vintage value bonuses
    // Update pricing based on era
  }
  
  calculateVintageBonus(equipment: Equipment, currentEra: string): number {
    const eraGap = this.calculateEraDistance(equipment.era, currentEra);
    
    if (eraGap >= 2) {
      // Equipment becomes "vintage" - special sonic character
      return equipment.vintageFactor * eraGap * 0.1;
    }
    
    return 0;
  }
  
  checkObsolescence(equipment: Equipment, currentEra: string): boolean {
    return equipment.obsolescenceEra === currentEra;
  }
}
```

### 2.2 Technology Adoption Curves

```typescript
interface TechnologyAdoption {
  technology: string;
  adoptionPhases: AdoptionPhase[];
  currentPhase: AdoptionPhase;
  marketPenetration: number;
}

interface AdoptionPhase {
  phase: 'early_adopter' | 'early_majority' | 'late_majority' | 'laggards';
  costMultiplier: number;
  availabilityPercentage: number;
  competitiveAdvantage: number;
  riskFactor: number;
}

class TechnologyAdoptionManager {
  calculateAdoptionStrategy(
    technology: string, 
    playerStrategy: 'conservative' | 'moderate' | 'aggressive'
  ): AdoptionOutcome {
    const adoption = this.getTechnologyAdoption(technology);
    const phase = adoption.currentPhase;
    
    const outcome: AdoptionOutcome = {
      cost: this.baseCost * phase.costMultiplier,
      advantage: phase.competitiveAdvantage,
      risk: phase.riskFactor,
      timing: this.calculateOptimalTiming(playerStrategy, phase)
    };
    
    return outcome;
  }
}
```

## 🎵 Phase 3: Dynamic Market Evolution

### 3.1 Genre Lifecycle System

```typescript
interface GenreLifecycle {
  genre: string;
  phases: GenrePhase[];
  currentPhase: GenrePhase;
  culturalFactors: CulturalFactor[];
  influenceNetwork: GenreInfluence[];
}

interface GenrePhase {
  phase: 'emergence' | 'growth' | 'peak' | 'decline' | 'revival';
  duration: number; // in game days
  popularityMultiplier: number;
  projectDemand: number;
  revenueMultiplier: number;
  competitionLevel: number;
}

interface GenreInfluence {
  influencer: string; // Another genre
  influenced: string; // This genre
  influenceType: 'fusion' | 'evolution' | 'reaction';
  strength: number;
}

class GenreEvolutionManager {
  updateGenrePopularity(currentEra: string, currentDay: number): void {
    for (const genre of this.genres) {
      const lifecycle = this.getGenreLifecycle(genre, currentEra);
      const newPhase = this.calculatePhaseTransition(lifecycle, currentDay);
      
      if (newPhase !== lifecycle.currentPhase) {
        this.transitionGenrePhase(genre, newPhase);
        this.triggerIndustryEvent({
          type: 'genre_shift',
          genre: genre,
          oldPhase: lifecycle.currentPhase.phase,
          newPhase: newPhase.phase
        });
      }
    }
  }
  
  calculateProjectDemand(genre: string, era: string): number {
    const lifecycle = this.getGenreLifecycle(genre, era);
    const baseDemand = lifecycle.currentPhase.projectDemand;
    const culturalBonus = this.calculateCulturalBonus(genre, era);
    
    return baseDemand * culturalBonus;
  }
}
```

### 3.2 Historical Events System

```typescript
interface HistoricalEvent {
  id: string;
  name: string;
  era: string;
  triggerDay: number;
  type: 'technology' | 'cultural' | 'business' | 'legal' | 'economic';
  description: string;
  impact: EventImpact;
  playerChoices: EventChoice[];
  consequences: EventConsequence[];
}

interface EventImpact {
  equipmentChanges: EquipmentChange[];
  genreEffects: GenreEffect[];
  marketShifts: MarketShift[];
  businessModelChanges: BusinessModelChange[];
}

interface EventChoice {
  id: string;
  description: string;
  requirements: ChoiceRequirement[];
  immediateEffects: Effect[];
  longTermConsequences: Consequence[];
  riskLevel: number;
}

class HistoricalEventManager {
  private upcomingEvents: HistoricalEvent[] = [
    {
      id: 'mtv_launch',
      name: 'MTV Launches',
      era: 'digital80s',
      triggerDay: 300,
      type: 'cultural',
      description: 'Music Television revolutionizes music promotion',
      impact: {
        equipmentChanges: [
          { add: 'video_production_equipment', requirement: 'video_capability' }
        ],
        genreEffects: [
          { genre: 'new_wave', popularityBonus: 0.3 },
          { genre: 'hair_metal', popularityBonus: 0.4 }
        ],
        marketShifts: [
          { factor: 'visual_appeal', importance: 0.5 }
        ],
        businessModelChanges: [
          { addRevenue: 'music_video_licensing' }
        ]
      },
      playerChoices: [
        {
          id: 'invest_video',
          description: 'Invest in video production capabilities',
          requirements: [{ type: 'money', amount: 50000 }],
          immediateEffects: [
            { type: 'add_capability', value: 'video_production' },
            { type: 'spend_money', amount: 50000 }
          ],
          longTermConsequences: [
            { type: 'revenue_boost', factor: 'video_projects', multiplier: 1.5 }
          ],
          riskLevel: 0.2
        },
        {
          id: 'partner_video',
          description: 'Partner with existing video production company',
          requirements: [{ type: 'reputation', minimum: 75 }],
          immediateEffects: [
            { type: 'add_partnership', value: 'video_company' }
          ],
          longTermConsequences: [
            { type: 'revenue_share', factor: 'video_projects', percentage: 0.7 }
          ],
          riskLevel: 0.1
        },
        {
          id: 'ignore_trend',
          description: 'Focus on audio quality, ignore video trend',
          requirements: [],
          immediateEffects: [
            { type: 'reputation_boost', value: 'audio_purist' }
          ],
          longTermConsequences: [
            { type: 'market_disadvantage', factor: 'visual_genres', penalty: 0.3 }
          ],
          riskLevel: 0.4
        }
      ]
    },
    {
      id: 'napster_crisis',
      name: 'Napster File Sharing',
      era: 'internet2000s',
      triggerDay: 150,
      type: 'business',
      description: 'File sharing threatens traditional music sales',
      impact: {
        marketShifts: [
          { factor: 'physical_sales', decline: 0.4 },
          { factor: 'piracy_concern', importance: 0.6 }
        ],
        businessModelChanges: [
          { modifyRevenue: 'album_sales', multiplier: 0.6 },
          { addConcern: 'piracy_protection' }
        ]
      },
      playerChoices: [
        {
          id: 'embrace_digital',
          description: 'Embrace digital distribution early',
          requirements: [{ type: 'technology_level', minimum: 'digital' }],
          immediateEffects: [
            { type: 'add_capability', value: 'digital_distribution' }
          ],
          longTermConsequences: [
            { type: 'competitive_advantage', factor: 'digital_transition', years: 3 }
          ],
          riskLevel: 0.3
        },
        {
          id: 'fight_piracy',
          description: 'Invest in anti-piracy measures',
          requirements: [{ type: 'money', amount: 25000 }],
          immediateEffects: [
            { type: 'spend_money', amount: 25000 },
            { type: 'add_capability', value: 'drm_protection' }
          ],
          longTermConsequences: [
            { type: 'customer_friction', penalty: 0.2 },
            { type: 'piracy_reduction', factor: 0.3 }
          ],
          riskLevel: 0.5
        }
      ]
    }
  ];
  
  checkEventTriggers(gameState: GameState): HistoricalEvent[] {
    return this.upcomingEvents.filter(event => 
      event.era === gameState.currentEra && 
      event.triggerDay <= gameState.currentDay &&
      !gameState.triggeredEvents?.includes(event.id)
    );
  }
  
  presentEventToPlayer(event: HistoricalEvent): void {
    // Show event modal with choices
    // Apply immediate effects based on choice
    // Schedule long-term consequences
  }
}
```

## 🎯 Phase 4: Era-Specific Challenges

### 4.1 Challenge Framework

```typescript
interface EraChallenge {
  id: string;
  era: string;
  name: string;
  description: string;
  type: 'technical' | 'business' | 'creative' | 'social';
  difficulty: number;
  duration: number; // How long challenge persists
  triggers: ChallengeTrigger[];
  effects: ChallengeEffect[];
  solutions: ChallengeSolution[];
}

interface ChallengeSolution {
  id: string;
  description: string;
  requirements: SolutionRequirement[];
  effectiveness: number;
  cost: number;
  sideEffects: SolutionSideEffect[];
}

class EraChallengeManager {
  private challenges: Map<string, EraChallenge[]> = new Map([
    ['analog60s', [
      {
        id: 'limited_tracks',
        era: 'analog60s',
        name: 'Limited Track Count',
        description: 'Only 4-8 tracks available, requiring creative arrangement',
        type: 'technical',
        difficulty: 0.6,
        duration: -1, // Persistent throughout era
        triggers: [
          { type: 'project_complexity', threshold: 0.7 }
        ],
        effects: [
          { type: 'arrangement_difficulty', multiplier: 1.5 },
          { type: 'creative_bonus', value: 0.2 } // Limitation breeds creativity
        ],
        solutions: [
          {
            id: 'bounce_down',
            description: 'Bounce multiple tracks to mono to free space',
            requirements: [{ type: 'skill', skill: 'mixing', level: 3 }],
            effectiveness: 0.7,
            cost: 0,
            sideEffects: [
              { type: 'audio_quality', penalty: 0.1 },
              { type: 'flexibility', penalty: 0.3 }
            ]
          },
          {
            id: 'arrange_creatively',
            description: 'Use creative arrangement to minimize track usage',
            requirements: [{ type: 'skill', skill: 'arrangement', level: 4 }],
            effectiveness: 0.9,
            cost: 0,
            sideEffects: [
              { type: 'time_required', multiplier: 1.3 },
              { type: 'artistic_value', bonus: 0.2 }
            ]
          }
        ]
      },
      {
        id: 'equipment_maintenance',
        era: 'analog60s',
        name: 'Equipment Maintenance',
        description: 'Analog equipment requires constant maintenance and calibration',
        type: 'technical',
        difficulty: 0.4,
        duration: -1,
        triggers: [
          { type: 'random', frequency: 0.1 },
          { type: 'usage_hours', threshold: 100 }
        ],
        effects: [
          { type: 'session_interruption', probability: 0.2 },
          { type: 'sound_quality', variability: 0.15 }
        ],
        solutions: [
          {
            id: 'hire_tech',
            description: 'Hire dedicated equipment technician',
            requirements: [{ type: 'money', amount: 2000 }],
            effectiveness: 0.8,
            cost: 500, // Monthly cost
            sideEffects: []
          },
          {
            id: 'learn_maintenance',
            description: 'Learn equipment maintenance yourself',
            requirements: [{ type: 'time', hours: 20 }],
            effectiveness: 0.6,
            cost: 0,
            sideEffects: [
              { type: 'time_allocation', reduction: 0.1 }
            ]
          }
        ]
      }
    ]],
    ['digital80s', [
      {
        id: 'digital_learning_curve',
        era: 'digital80s',
        name: 'Digital Technology Learning',
        description: 'New digital equipment requires significant learning investment',
        type: 'technical',
        difficulty: 0.7,
        duration: 180, // 6 months to fully adapt
        triggers: [
          { type: 'equipment_purchase', category: 'digital' }
        ],
        effects: [
          { type: 'efficiency', penalty: 0.3 },
          { type: 'project_time', multiplier: 1.4 }
        ],
        solutions: [
          {
            id: 'training_course',
            description: 'Take professional training course',
            requirements: [{ type: 'money', amount: 5000 }],
            effectiveness: 0.9,
            cost: 5000,
            sideEffects: [
              { type: 'downtime', days: 14 }
            ]
          },
          {
            id: 'learn_gradually',
            description: 'Learn through trial and error',
            requirements: [],
            effectiveness: 0.5,
            cost: 0,
            sideEffects: [
              { type: 'project_quality', variability: 0.2 },
              { type: 'client_patience', risk: 0.1 }
            ]
          }
        ]
      }
    ]]
  ]);
}
```

## 🚀 Implementation Timeline

### Week 1-2: Era-Specific Minigames Foundation
- [ ] Create base classes for era-specific minigames
- [ ] Implement analog era minigames (tape splicing, 4-track challenge)
- [ ] Add minigame selection logic based on current era
- [ ] Test analog era minigame integration

### Week 3-4: Equipment Evolution System
- [ ] Implement equipment lifecycle management
- [ ] Create technology adoption curves
- [ ] Add vintage value calculation
- [ ] Update equipment pricing based on era

### Week 5-6: Historical Events System
- [ ] Create historical event framework
- [ ] Implement major industry events (MTV, Napster, etc.)
- [ ] Add player choice consequences
- [ ] Test event trigger system

### Week 7-8: Era Challenges & Polish
- [ ] Implement era-specific challenge system
- [ ] Add challenge solutions and consequences
- [ ] Polish minigame transitions between eras
- [ ] Complete integration testing

### Week 9-10: Market Dynamics & Balancing
- [ ] Implement genre lifecycle system
- [ ] Add dynamic market conditions
- [ ] Balance difficulty curves across eras
- [ ] Final testing and bug fixes

## 🎯 Success Metrics

### Player Engagement
- **Era Transition Rate**: 80% of players should progress through at least 2 eras
- **Minigame Completion**: 70% completion rate for era-specific minigames
- **Choice Diversity**: Players should make different choices in historical events

### Educational Value
- **Historical Accuracy**: Events and equipment should be historically accurate
- **Learning Outcomes**: Players should understand music industry evolution
- **Authentic Challenges**: Challenges should reflect real industry issues

### Technical Performance
- **Load Times**: Era transitions should complete in <2 seconds
- **Memory Usage**: Era-specific content shouldn't exceed 50MB additional memory
- **Save Compatibility**: Era progression should save/load reliably

## 🔧 Technical Considerations

### Data Management
- **Era Definition Storage**: JSON configuration files for easy modification
- **Event Scheduling**: Efficient system for triggering time-based events
- **Save Game Expansion**: Support for era progression in save files

### Performance Optimization
- **Lazy Loading**: Load era-specific content only when needed
- **Asset Management**: Efficient loading/unloading of era assets
- **Memory Management**: Prevent memory leaks during era transitions

### User Experience
- **Smooth Transitions**: Seamless movement between eras
- **Clear Feedback**: Players understand why events occur
- **Educational Context**: Historical information presented engagingly

This comprehensive plan provides a roadmap for implementing rich, educational, and engaging era-specific mechanics that will transform the game into a journey through music history while maintaining compelling gameplay throughout each era.
