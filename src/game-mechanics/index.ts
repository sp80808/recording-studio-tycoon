import { MarketService } from './market-trends';
import { RelationshipService } from './relationship-management';
import { StudioUpgradeService } from './studio-perks';
import { StaffWellbeingService } from './staff-wellbeing';
import { AdvancedContractService } from './advanced-contracts';
import { RandomEventService } from './random-events';

// Game Mechanics Module - Phase 2 Enhancements for Recording Studio Tycoon
// This module provides advanced game mechanics for strategic depth and player engagement

// Core Types
export * from './common.types';

// 1. Dynamic Market Trends & Sub-Genre Evolution
export * from './market-trends';

// 2. Reputation & Relationship Management
export * from './relationship-management';

// 3. Studio Perks & Specializations
export * from './studio-perks';

// 4. Staff Mood & Burnout System
export * from './staff-wellbeing';

// 5. Advanced Contract Negotiation
export * from './advanced-contracts';

// 6. Random Events & Dynamic Challenges
export * from './random-events';

// Service Integration Helper
export interface GameMechanicsServices {
  marketService: import('./market-trends').MarketService;
  relationshipService: import('./relationship-management').RelationshipService;
  studioUpgradeService: import('./studio-perks').StudioUpgradeService;
  staffWellbeingService: import('./staff-wellbeing').StaffWellbeingService;
  advancedContractService: import('./advanced-contracts').AdvancedContractService;
  randomEventService: import('./random-events').RandomEventService;
}

// Example service initialization helper
export function createGameMechanicsServices(
  config: {
    genres: import('./market-trends').Genre[];
    subGenres: import('./market-trends').SubGenre[];
    clients: import('./relationship-management').Client[];
    recordLabels: import('./relationship-management').RecordLabel[];
    studioPerks: import('./studio-perks').StudioPerk[];
    staffMembers: import('./staff-wellbeing').StaffMemberWellbeing[];
    randomEvents: import('./random-events').RandomEvent[];
  }
): GameMechanicsServices {
  const marketService = new MarketService(config.genres, config.subGenres);
  const relationshipService = new RelationshipService(config.clients, config.recordLabels);
  const studioUpgradeService = new StudioUpgradeService(config.studioPerks);
  const staffWellbeingService = new StaffWellbeingService(config.staffMembers);
  const advancedContractService = new AdvancedContractService();
  const randomEventService = new RandomEventService(config.randomEvents);

  return {
    marketService,
    relationshipService,
    studioUpgradeService,
    staffWellbeingService,
    advancedContractService,
    randomEventService
  };
}
