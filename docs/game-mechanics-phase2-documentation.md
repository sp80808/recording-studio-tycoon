# Game Mechanics Documentation - Phase 2 Enhancements

## Overview

This document describes the advanced game mechanics implemented for Recording Studio Tycoon Phase 2. These mechanics enhance strategic depth, foster player engagement through meaningful choices, and provide clear feedback systems.

## Table of Contents

1. [Dynamic Market Trends & Sub-Genre Evolution](#1-dynamic-market-trends--sub-genre-evolution)
2. [Reputation & Relationship Management](#2-reputation--relationship-management)
3. [Studio Perks & Specializations](#3-studio-perks--specializations)
4. [Staff Mood & Burnout System](#4-staff-mood--burnout-system)
5. [Advanced Contract Negotiation](#5-advanced-contract-negotiation)
6. [Random Events & Dynamic Challenges](#6-random-events--dynamic-challenges)
7. [Integration Guide](#integration-guide)
8. [API Reference](#api-reference)

---

## 1. Dynamic Market Trends & Sub-Genre Evolution

### Purpose
Creates an evolving music market that requires players to adapt their strategies, making genre selection more strategic and time-sensitive.

### Key Components

#### MarketTrend Interface
```typescript
interface MarketTrend {
  genreId: GenreId;
  subGenreId?: SubGenreId;
  popularity: number; // 0-100
  trendDirection: 'rising' | 'stable' | 'falling';
  lastUpdated: number;
}
```

#### SubGenre System
- Extends the existing genre system with more specific sub-categories
- Each SubGenre belongs to a main Genre
- Allows for more nuanced market dynamics

#### MarketService Features
- **Periodic Updates**: Trends evolve based on time, player actions, and random events
- **Player Impact**: Successful releases influence genre popularity
- **Global Events**: Random events can boost or harm specific genres
- **Query Methods**: Easy access to current popularity and trend data

### Integration Points

#### With Projects & Charts
```typescript
// Example: Modify project appeal based on market trends
const marketPopularity = marketService.getPopularity(project.genreId, project.subGenreId);
const popularityFactor = 1 + (marketPopularity - 50) / 100; // 0.5x to 1.5x multiplier
const finalAppeal = baseAppeal * popularityFactor;
```

#### With Contract System
- High-popularity genres offer better contract rates
- Trending genres may unlock exclusive contract opportunities

### UI Components
- **Music Industry Report**: Dashboard showing current trends
- **Genre Popularity Charts**: Visual representation of market shifts
- **Trend Notifications**: Alerts for significant market changes

---

## 2. Reputation & Relationship Management

### Purpose
Makes interactions with clients and labels more impactful, building long-term strategic relationships that affect contract availability and terms.

### Key Components

#### Entity Types
```typescript
interface Client {
  id: EntityId;
  name: string;
  relationshipScore: number; // 0-100
  preferredGenres: GenreId[];
  preferredMoods?: MoodId[];
  interactionHistory?: InteractionHistoryItem[];
  isBlacklisted: boolean;
}

interface RecordLabel extends Client {
  influenceTier: 'Indie' | 'Regional' | 'National' | 'Global';
}
```

#### RelationshipService Features
- **Score Management**: Track relationship scores with all entities
- **Automatic Updates**: Project completion affects relationships
- **Blacklisting System**: Poor relationships can lead to blacklisting
- **History Tracking**: Detailed interaction history for context

### Relationship Factors

#### Positive Impacts
- **High-Quality Projects**: +10 to +15 points
- **On-Time Delivery**: +3 to +5 points
- **Genre Matching**: Bonus for preferred genres
- **Successful Chart Performance**: Additional bonus for original music

#### Negative Impacts
- **Poor Quality**: -10 to -15 points
- **Late Delivery**: -5 to -10 points
- **Project Cancellation**: -20 points
- **Public Disputes**: -30 points

### Consequences

#### High Relationships (70+)
- Access to premium contracts
- Better negotiation terms
- Exclusive opportunities
- Higher contract values

#### Low Relationships (20-)
- Reduced contract offers
- Worse negotiation terms
- Risk of blacklisting

#### Blacklisting (0-10)
- No new contracts from entity
- Potential negative PR events
- Difficulty with other entities in same network

---

## 3. Studio Perks & Specializations

### Purpose
Provides long-term strategic choices for studio development, allowing players to define their studio's identity and create meaningful progression paths.

### Key Components

#### StudioPerk Interface
```typescript
interface StudioPerk {
  id: string;
  name: string;
  description: string;
  category: PerkCategory;
  unlockConditions: UnlockCondition[];
  effects: StudioPerkEffect[];
  cost?: number;
  isUnlocked: boolean;
  isActive: boolean;
}
```

#### Perk Categories
- **Acoustics**: Room treatments, sound isolation, acoustic modeling
- **Talent Acquisition**: Staff recruitment, retention, training bonuses
- **Marketing**: Reputation boosts, contract visibility, chart performance
- **Production Workflow**: Efficiency bonuses, automation, quality improvements
- **Financial**: Cost reductions, revenue bonuses, investment opportunities

#### Unlock Conditions
- **Studio Reputation**: Minimum reputation threshold
- **Completed Projects**: Number of projects in specific genres
- **Staff Skills**: Total skill points in specific areas
- **Research Points**: Currency spent on development
- **Prerequisite Perks**: Chain dependencies

#### Effect Types
- **Percentage Bonuses**: Multiplicative improvements (e.g., +15% mixing quality)
- **Flat Bonuses**: Additive improvements (e.g., +10 staff happiness)
- **Scoped Effects**: Apply only to specific genres or situations

### Example Perks

#### "Acoustic Excellence" (Acoustics)
- **Unlock**: 50+ Studio Reputation, 20+ completed projects
- **Effect**: +20% recording quality, +10% mixing quality
- **Cost**: $50,000

#### "Talent Magnet" (Talent Acquisition)
- **Unlock**: 5+ staff members with 80+ skills
- **Effect**: +25% staff skill gain, -20% staff turnover
- **Cost**: 100 Research Points

#### "Genre Specialist: Electronic" (Production Workflow)
- **Unlock**: 15+ completed Electronic projects
- **Effect**: +30% quality for Electronic projects, +15% production speed
- **Scope**: Electronic genre only

---

## 4. Staff Mood & Burnout System

### Purpose
Simulates staff well-being, making staff management more nuanced and impactful, adding emotional depth to human resource management.

### Key Components

#### Staff Mood States
```typescript
enum StaffMoodStatus {
  ECSTATIC = 'Ecstatic',     // 90-100: Maximum performance
  HAPPY = 'Happy',           // 75-89: High performance
  CONTENT = 'Content',       // 60-74: Normal performance
  NEUTRAL = 'Neutral',       // 40-59: Baseline performance
  STRESSED = 'Stressed',     // 25-39: Reduced performance
  UNHAPPY = 'Unhappy',       // 10-24: Poor performance
  MISERABLE = 'Miserable',   // 0-9: Minimal performance
  BURNOUT_RISK = 'Burnout Risk' // High burnout level override
}
```

#### Mood Factors
- **Project Outcomes**: Success/failure impact
- **Workload**: Overtime and project intensity
- **Salary Satisfaction**: Compared to skills/experience
- **Studio Environment**: Perks and working conditions
- **Personal Events**: Random life events

#### Burnout System
- **Accumulation**: Builds up from sustained stress
- **Consequences**: Sick days, extended leave, resignation risk
- **Recovery**: Slow natural recovery, faster with time off

### Performance Impact

#### Productivity Modifiers
- **Ecstatic**: 120% performance
- **Happy**: 110% performance
- **Content**: 100% performance
- **Stressed**: 90% performance
- **Unhappy**: 75% performance
- **Miserable**: 60% performance

#### Skill Development
- **High Mood**: +30% skill gain rate
- **Normal Mood**: Normal skill gain
- **Low Mood**: -40% skill gain rate

#### Error Rates
- **Good Mood**: -20% error chance
- **Poor Mood**: +150% error chance
- **High Burnout**: +250% error chance

### Management Strategies
- **Salary Adjustments**: Maintain competitive compensation
- **Workload Balancing**: Avoid excessive overtime
- **Studio Perks**: Environmental improvements
- **Time Off**: Forced breaks for high burnout risk
- **Team Building**: Future enhancement for inter-staff relationships

---

## 5. Advanced Contract Negotiation

### Purpose
Replaces simple "accept/reject" contract decisions with multi-round negotiations, creating more engaging and strategic contract acquisition.

### Key Components

#### Contract Types
- **Standard Track**: Single song production
- **Album Production**: Full album development
- **Soundtrack Gig**: Music for media
- **Jingle Creation**: Commercial music
- **Remix Project**: Reimagining existing tracks
- **Ghost Production**: Uncredited production work

#### Negotiation Points
```typescript
enum ContractNegotiationPoint {
  DEADLINE = 'Deadline',
  BUDGET = 'Budget',
  ROYALTY_PERCENTAGE = 'RoyaltyPercentage',
  CREATIVE_FREEDOM = 'CreativeFreedom',
  UPFRONT_PAYMENT_PERCENTAGE = 'UpfrontPaymentPercentage',
  FEATURED_ARTIST_QUALITY = 'FeaturedArtistQuality'
}
```

#### Negotiation Mechanics
- **Hidden Ranges**: Clients have secret minimum/maximum acceptable values
- **Multi-Round**: Up to 3 rounds of offers and counter-offers
- **Relationship Impact**: Better relationships improve negotiation outcomes
- **Market Influence**: Popular genres command better terms

### Negotiation Strategy

#### Player Advantages
- **High Reputation**: Better starting positions
- **Strong Relationships**: More flexible client terms
- **Market Timing**: Leverage popular genres
- **Studio Specializations**: Command premium for expertise

#### Risk/Reward Balance
- **Aggressive Negotiation**: Higher rewards but relationship risk
- **Conservative Approach**: Safer but lower profits
- **Time Pressure**: Contracts expire if negotiations drag on

---

## 6. Random Events & Dynamic Challenges

### Purpose
Creates unpredictable challenges and opportunities that test player adaptability and prevent gameplay from becoming too routine.

### Key Components

#### Event Types
- **Market Shifts**: Sudden genre popularity changes
- **Technology Breakthroughs**: New equipment or techniques
- **Industry Scandals**: Reputation and relationship impacts
- **Award Ceremonies**: Recognition and prestige boosts
- **Economic Events**: Market-wide cost or demand changes
- **Viral Trends**: Short-term popularity spikes
- **Technical Failures**: Equipment malfunctions
- **Natural Disasters**: Operational disruptions

#### Event Structure
```typescript
interface RandomEvent {
  id: string;
  name: string;
  description: string;
  type: EventType;
  triggerChance: number;
  triggerConditions?: TriggerCondition[];
  effects: EventEffect[];
  playerChoices?: PlayerChoice[];
  // ... lifecycle properties
}
```

#### Player Choices
Many events offer player decisions that modify outcomes:
- **Investment Opportunities**: Spend money for better results
- **Risk Management**: Choose safe or aggressive responses
- **Resource Allocation**: Decide how to handle disruptions

### Example Events

#### "Viral Genre Explosion"
- **Trigger**: Random chance after 30 days
- **Effect**: +30 popularity to random genre for 60 days
- **Impact**: Creates rush for contracts in that genre

#### "Equipment Malfunction"
- **Trigger**: Higher chance with more equipment
- **Effect**: -50% equipment efficiency for 2 weeks
- **Choices**: 
  - Pay $5,000 for emergency repair
  - Work around with backup equipment (staff mood penalty)

#### "Industry Award Nomination"
- **Trigger**: High reputation + many completed projects
- **Effect**: +15 permanent reputation, +20 staff mood for 90 days
- **Impact**: Unlocks premium contracts and better staff recruitment

---

## Integration Guide

### Service Dependencies
The game mechanics services have the following integration requirements:

#### MarketService
- **Depends on**: Genre/SubGenre data
- **Integrates with**: Contract generation, Project appeal calculation
- **Updates**: Called by game loop (weekly/monthly)

#### RelationshipService
- **Depends on**: Client/Label data
- **Integrates with**: Contract generation, Project completion
- **Updates**: Called after project milestones

#### StudioUpgradeService
- **Depends on**: GameState for unlock conditions
- **Integrates with**: All performance calculations
- **Updates**: Player-triggered unlocks

#### StaffWellbeingService
- **Depends on**: Staff data, Studio perks
- **Integrates with**: Task performance, Skill development
- **Updates**: Daily game loop

#### AdvancedContractService
- **Depends on**: Market trends, Relationships
- **Integrates with**: Project management
- **Updates**: Contract generation cycles

#### RandomEventService
- **Depends on**: GameState for trigger conditions
- **Integrates with**: All systems via effects
- **Updates**: Weekly evaluation cycles

### Game Loop Integration
```typescript
// Example daily update cycle
function dailyGameUpdate(gameState: GameState, services: GameMechanicsServices) {
  // 1. Update staff wellbeing
  const staffEvents = services.staffWellbeingService.dailyUpdate(
    services.studioUpgradeService.getActivePerks()
  );
  
  // 2. Process any staff events (resignations, leave requests)
  staffEvents.forEach(event => handleStaffEvent(event));
  
  // 3. Check for random events (weekly)
  if (gameState.time % 7 === 0) {
    const newEvents = services.randomEventService.evaluateEvents(gameState, gameState.time);
    newEvents.forEach(event => presentEventToPlayer(event));
  }
  
  // 4. Update market trends (monthly)
  if (gameState.time % 30 === 0) {
    services.marketService.updateMarketTrends(
      gameState.time,
      getRecentSuccessfulReleases(),
      services.randomEventService.getActiveEvents()
    );
  }
}
```

### Performance Calculation Integration
```typescript
// Example: Calculate staff performance with all modifiers
function calculateStaffPerformance(staffId: string, task: string, services: GameMechanicsServices): number {
  const basePerformance = getBaseStaffPerformance(staffId, task);
  
  // Apply wellbeing modifiers
  const wellbeing = services.staffWellbeingService.getStaffWellbeing(staffId);
  const moodModifier = getMoodPerformanceModifier(wellbeing?.currentMood);
  const burnoutModifier = getBurnoutPerformanceModifier(wellbeing?.burnoutLevel);
  
  // Apply studio perk modifiers
  const perkModifier = services.studioUpgradeService.getAggregatedEffectValue(
    'staffPerformanceBonus', 
    1.0, 
    task
  );
  
  return basePerformance * moodModifier * burnoutModifier * perkModifier;
}
```

---

## API Reference

### Common Types
- `GenreId`: String identifier for music genres
- `SubGenreId`: String identifier for music sub-genres
- `EntityId`: String identifier for clients, labels, staff
- `ProjectId`: String identifier for projects and contracts
- `SkillId`: String identifier for staff skills
- `MoodId`: String identifier for musical moods

### Service Interfaces
Each service provides:
- Constructor for initialization
- Update methods for game loop integration
- Query methods for current state
- Event handling methods for game integration

### Error Handling
All services include:
- Null checks for missing entities
- Bounds checking for numeric values
- Graceful degradation for missing dependencies
- Clear error messages for debugging

### Performance Considerations
- Services use Maps for O(1) lookups
- Large arrays are processed in chunks
- Expensive calculations are cached when possible
- Event subscriptions minimize unnecessary updates

---

## Future Enhancements

### Planned Additions
1. **Multi-Studio Management**: Expand to multiple studio locations
2. **Artist Development**: Long-term artist career management
3. **Label Management**: Start and run your own record label
4. **International Markets**: Global expansion with regional preferences
5. **Streaming Analytics**: Modern music distribution mechanics

### Technical Debt
1. **Service Coupling**: Reduce dependencies between services
2. **Event System**: Implement proper pub/sub for loose coupling
3. **Save/Load**: Add serialization support for all services
4. **Testing**: Comprehensive unit tests for all mechanics
5. **Documentation**: Interactive examples and tutorials

This completes the Phase 2 game mechanics implementation. Each system is designed to be modular, extensible, and well-integrated with the existing codebase while providing meaningful strategic depth and player engagement.
