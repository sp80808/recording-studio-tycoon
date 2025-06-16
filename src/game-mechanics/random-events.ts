import { GameState, GenreId, ProjectId } from './common.types';
import { MarketTrend } from './market-trends';
import { StaffMemberWellbeing } from './staff-wellbeing';

export type EventType = 
  | 'MarketShift' 
  | 'TechnologyBreakthrough' 
  | 'IndustryScandal'
  | 'AwardCeremony'
  | 'EconomicRecession'
  | 'ViralTrend'
  | 'CompetitorAction'
  | 'NaturalDisaster'
  | 'CelebrityEndorsement'
  | 'TechnicalFailure';

export type EventImpactTarget = 
  | 'StudioReputation'
  | 'GenrePopularity'
  | 'ContractValue'
  | 'StaffMood'
  | 'EquipmentEfficiency'
  | 'MarketDemand'
  | 'OperatingCosts';

export interface EventEffect {
  target: EventImpactTarget;
  magnitude: number; // Can be positive or negative
  duration: number; // In game days, 0 for permanent
  scope?: string; // Optional scope (e.g., specific genre, equipment type)
  description: string;
}

export interface RandomEvent {
  id: string;
  name: string;
  description: string;
  type: EventType;
  
  // Trigger conditions
  triggerChance: number; // 0-1, base chance per evaluation period
  triggerConditions?: Array<{
    condition: 'StudioReputationAbove' | 'StudioReputationBelow' | 'GenrePopularityAbove' | 'CompletedProjectsAbove' | 'TimeAfter';
    value: number;
    genreId?: GenreId;
  }>;
  
  // Event effects
  effects: EventEffect[];
  
  // Player choice (optional)
  playerChoices?: Array<{
    id: string;
    description: string;
    effects: EventEffect[];
    cost?: number; // Optional cost in currency
  }>;
  
  // Event lifecycle
  isActive: boolean;
  startDate?: number; // Game time when event started
  endDate?: number; // Game time when event ends (for timed events)
  hasTriggered: boolean; // To prevent duplicate triggers
}

/**
 * RandomEventService: Manages dynamic game events that create challenges and opportunities.
 */
export class RandomEventService {
  private eventPool: Map<string, RandomEvent> = new Map();
  private activeEvents: Map<string, RandomEvent> = new Map();
  private triggeredEventHistory: Array<{ eventId: string; date: number; playerChoice?: string }> = [];

  constructor(initialEvents: RandomEvent[]) {
    initialEvents.forEach(event => {
      this.eventPool.set(event.id, { ...event, isActive: false, hasTriggered: false });
    });
  }

  /**
   * Evaluates and potentially triggers random events.
   * Called periodically by the game loop (e.g., weekly).
   */
  evaluateEvents(gameState: GameState, currentTime: number): RandomEvent[] {
    const newlyTriggeredEvents: RandomEvent[] = [];

    this.eventPool.forEach(event => {
      if (event.hasTriggered && !this.canEventRetrigger(event)) return;
      
      // Check trigger conditions
      if (!this.checkTriggerConditions(event, gameState, currentTime)) return;
      
      // Roll for trigger chance
      if (Math.random() <= event.triggerChance) {
        const triggeredEvent = this.triggerEvent(event.id, currentTime);
        if (triggeredEvent) {
          newlyTriggeredEvents.push(triggeredEvent);
        }
      }
    });

    // Clean up expired events
    this.cleanupExpiredEvents(currentTime);

    return newlyTriggeredEvents;
  }

  private checkTriggerConditions(event: RandomEvent, gameState: GameState, currentTime: number): boolean {
    if (!event.triggerConditions) return true;

    for (const condition of event.triggerConditions) {
      switch (condition.condition) {
        case 'StudioReputationAbove':
          if (gameState.studioReputation <= condition.value) return false;
          break;
        case 'StudioReputationBelow':
          if (gameState.studioReputation >= condition.value) return false;
          break;
        case 'CompletedProjectsAbove':
          if (gameState.completedProjects.length <= condition.value) return false;
          break;
        case 'TimeAfter':
          if (currentTime <= condition.value) return false;
          break;
        case 'GenrePopularityAbove':
          // Would need access to MarketService to check genre popularity
          // const popularity = this.marketService.getPopularity(condition.genreId!);
          // if (popularity <= condition.value) return false;
          break;
        default:
          return false;
      }
    }
    return true;
  }

  private canEventRetrigger(event: RandomEvent): boolean {
    // Some events can only happen once, others can retrigger after a cooldown
    const timeSinceLastTrigger = this.getTimeSinceLastTrigger(event.id);
    switch (event.type) {
      case 'MarketShift':
      case 'ViralTrend':
        return timeSinceLastTrigger > 90; // Can retrigger after 90 days
      case 'AwardCeremony':
        return timeSinceLastTrigger > 365; // Annual events
      case 'TechnologyBreakthrough':
      case 'IndustryScandal':
        return false; // One-time events
      default:
        return timeSinceLastTrigger > 180; // Default 180-day cooldown
    }
  }

  private getTimeSinceLastTrigger(eventId: string): number {
    const lastTrigger = this.triggeredEventHistory
      .filter(h => h.eventId === eventId)
      .sort((a, b) => b.date - a.date)[0];
    return lastTrigger ? (Date.now() - lastTrigger.date) : Infinity;
  }

  private triggerEvent(eventId: string, currentTime: number): RandomEvent | null {
    const event = this.eventPool.get(eventId);
    if (!event) return null;

    const activeEvent = {
      ...event,
      isActive: true,
      hasTriggered: true,
      startDate: currentTime,
      endDate: this.calculateEndDate(event, currentTime)
    };

    this.activeEvents.set(eventId, activeEvent);
    this.triggeredEventHistory.push({ eventId, date: currentTime });

    // Apply immediate effects (permanent or start of timed effects)
    this.applyEventEffects(activeEvent);

    return activeEvent;
  }

  private calculateEndDate(event: RandomEvent, startTime: number): number | undefined {
    const maxDuration = Math.max(...event.effects.map(e => e.duration));
    return maxDuration > 0 ? startTime + maxDuration : undefined;
  }

  private applyEventEffects(event: RandomEvent): void {
    // This would integrate with other game systems to apply the effects
    event.effects.forEach(effect => {
      switch (effect.target) {
        case 'StudioReputation':
          // gameState.studioReputation += effect.magnitude;
          break;
        case 'GenrePopularity':
          // marketService.modifyGenrePopularity(effect.scope!, effect.magnitude);
          break;
        case 'StaffMood':
          // staffWellbeingService.applyGlobalMoodModifier(effect.magnitude, effect.description);
          break;
        // ... other effect types
      }
    });
  }

  private cleanupExpiredEvents(currentTime: number): void {
    const expiredEvents: string[] = [];
    
    this.activeEvents.forEach((event, eventId) => {
      if (event.endDate && currentTime >= event.endDate) {
        expiredEvents.push(eventId);
        // Reverse any temporary effects
        this.reverseEventEffects(event);
      }
    });

    expiredEvents.forEach(eventId => {
      this.activeEvents.delete(eventId);
    });
  }

  private reverseEventEffects(event: RandomEvent): void {
    event.effects.forEach(effect => {
      if (effect.duration > 0) { // Only reverse temporary effects
        switch (effect.target) {
          case 'StudioReputation':
            // gameState.studioReputation -= effect.magnitude;
            break;
          // ... other reversible effects
        }
      }
    });
  }

  /**
   * Player makes a choice in response to an event.
   */
  makeEventChoice(eventId: string, choiceId: string, currentTime: number): boolean {
    const event = this.activeEvents.get(eventId);
    if (!event || !event.playerChoices) return false;

    const choice = event.playerChoices.find(c => c.id === choiceId);
    if (!choice) return false;

    // Apply choice effects
    choice.effects.forEach(effect => {
      // Similar to applyEventEffects but for player choice
    });

    // Record the choice
    const historyEntry = this.triggeredEventHistory.find(h => h.eventId === eventId);
    if (historyEntry) {
      historyEntry.playerChoice = choiceId;
    }

    // Remove event from active events if it's resolved by the choice
    this.activeEvents.delete(eventId);

    return true;
  }

  getActiveEvents(): RandomEvent[] {
    return Array.from(this.activeEvents.values());
  }

  getEventHistory(): Array<{ eventId: string; date: number; playerChoice?: string }> {
    return [...this.triggeredEventHistory];
  }
}

// Example event definitions
export const SAMPLE_EVENTS: RandomEvent[] = [
  {
    id: 'viral_genre_boom',
    name: 'Viral Genre Explosion',
    description: 'A new social media trend has made [Genre] extremely popular overnight!',
    type: 'ViralTrend',
    triggerChance: 0.05, // 5% chance per evaluation
    triggerConditions: [
      { condition: 'TimeAfter', value: 30 } // Only after 30 days of gameplay
    ],
    effects: [
      {
        target: 'GenrePopularity',
        magnitude: 30,
        duration: 60, // Lasts 60 days
        scope: 'Electronic', // Would be randomized in practice
        description: 'Electronic music demand surge'
      }
    ],
    isActive: false,
    hasTriggered: false
  },
  {
    id: 'equipment_malfunction',
    name: 'Studio Equipment Malfunction',
    description: 'Your main mixing console has developed a critical fault during a busy period.',
    type: 'TechnicalFailure',
    triggerChance: 0.02,
    triggerConditions: [
      { condition: 'StudioReputationAbove', value: 30 }
    ],
    effects: [
      {
        target: 'EquipmentEfficiency',
        magnitude: -50,
        duration: 14, // 2 weeks
        description: 'Reduced mixing quality'
      }
    ],
    playerChoices: [
      {
        id: 'emergency_repair',
        description: 'Pay for emergency repair service ($5000)',
        effects: [
          {
            target: 'EquipmentEfficiency',
            magnitude: 40, // Partially offset the malfunction
            duration: 14,
            description: 'Emergency repair completed'
          }
        ],
        cost: 5000
      },
      {
        id: 'work_around',
        description: 'Work around the issue with backup equipment',
        effects: [
          {
            target: 'StaffMood',
            magnitude: -10,
            duration: 14,
            description: 'Staff frustrated with subpar equipment'
          }
        ]
      }
    ],
    isActive: false,
    hasTriggered: false
  },
  {
    id: 'industry_award',
    name: 'Industry Recognition',
    description: 'Your studio has been nominated for a prestigious industry award!',
    type: 'AwardCeremony',
    triggerChance: 0.01,
    triggerConditions: [
      { condition: 'StudioReputationAbove', value: 70 },
      { condition: 'CompletedProjectsAbove', value: 20 }
    ],
    effects: [
      {
        target: 'StudioReputation',
        magnitude: 15,
        duration: 0, // Permanent
        description: 'Award recognition boost'
      },
      {
        target: 'StaffMood',
        magnitude: 20,
        duration: 90,
        description: 'Team morale boost from recognition'
      }
    ],
    isActive: false,
    hasTriggered: false
  }
];

/*
Integration with Game Systems:

1. Event Effect Application:
   - Events would trigger callbacks or use dependency injection to affect other systems
   - Example: When a GenrePopularity event triggers, it calls marketService.modifyGenrePopularity()
   - When StaffMood events trigger, they call staffWellbeingService.applyGlobalMoodModifier()

2. UI Integration:
   - Events would trigger notifications or modal dialogs
   - Player choices would be presented through interactive UI components
   - Event history could be displayed in a "News" or "Events Log" screen

3. Save/Load Integration:
   - activeEvents and triggeredEventHistory would be serialized with game state
   - Event effects would be reapplied on game load to maintain consistency
*/
