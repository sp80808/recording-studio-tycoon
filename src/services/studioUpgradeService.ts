// Studio Upgrade Service for Perks & Specializations
import { 
  StudioPerk, 
  PerkCategory, 
  StudioSpecialization, 
  PerkTree, 
  StudioUpgradeState, 
  UnlockConditions, 
  PerkEffects, 
  ActiveEffect,
  PerkSynergy,
  StudioMilestone,
  IndustryPrestige
} from '../types/studioPerks';
import { MusicGenre } from '../types/charts';
import { GameState, Project, ProjectReport } from '../types/game';

export class StudioUpgradeService {
  private perkTrees: Map<PerkCategory, PerkTree> = new Map();
  private specializations: Map<string, StudioSpecialization> = new Map();
  private upgradeState: StudioUpgradeState;
  private milestones: StudioMilestone[] = [];
  private perkSynergies: PerkSynergy[] = [];
  private industryPrestige: IndustryPrestige;

  constructor() {
    this.initializePerkTrees();
    this.initializeSpecializations();
    this.initializeMilestones();
    this.initializeSynergies();
    this.upgradeState = this.initializeUpgradeState();
    this.industryPrestige = this.initializePrestige();
  }

  /**
   * Initialize perk trees with sample perks
   */
  private initializePerkTrees(): void {
    // Acoustics Tree
    const acousticsTree: PerkTree = {
      category: 'acoustics',
      name: 'Acoustic Mastery',
      description: 'Master the art of room acoustics and sound treatment',
      tiers: [
        {
          tier: 1,
          perks: [
            {
              id: 'basic-treatment',
              name: 'Basic Room Treatment',
              description: 'Improve room acoustics with basic treatment',
              category: 'acoustics',
              tier: 1,
              unlockConditions: { playerLevel: 5 },
              effects: {
                projectQualityBonus: 5,
                flatBonuses: new Map([['recording_quality', 3]])
              },
              cost: { perkPoints: 2, money: 5000 }
            },
            {
              id: 'noise-isolation',
              name: 'Noise Isolation',
              description: 'Reduce external noise interference',
              category: 'acoustics',
              tier: 1,
              unlockConditions: { playerLevel: 5 },
              effects: {
                projectQualityBonus: 3,
                percentageBonuses: new Map([['focus_efficiency', 0.1]])
              },
              cost: { perkPoints: 2, money: 3000 }
            }
          ],
          tierRequirement: { perksFromPreviousTier: 0 }
        },
        {
          tier: 2,
          perks: [
            {
              id: 'advanced-acoustics',
              name: 'Advanced Acoustic Design',
              description: 'Professional-grade acoustic optimization',
              category: 'acoustics',
              tier: 2,
              unlockConditions: { 
                playerLevel: 15,
                completedProjectsTotal: 20 
              },
              effects: {
                projectQualityBonus: 10,
                genreSpecificBonuses: new Map([
                  ['classical', { qualityBonus: 15, speedBonus: 0, costReduction: 0 }],
                  ['jazz', { qualityBonus: 12, speedBonus: 0, costReduction: 0 }]
                ])
              },
              prerequisites: ['basic-treatment'],
              cost: { perkPoints: 5, money: 15000 }
            }
          ],
          tierRequirement: { perksFromPreviousTier: 1 }
        }
      ]
    };

    // Equipment Tree
    const equipmentTree: PerkTree = {
      category: 'equipment',
      name: 'Equipment Mastery',
      description: 'Maximize equipment efficiency and unlock advanced gear',
      tiers: [
        {
          tier: 1,
          perks: [
            {
              id: 'equipment-care',
              name: 'Equipment Maintenance',
              description: 'Proper equipment care extends lifespan',
              category: 'equipment',
              tier: 1,
              unlockConditions: { equipmentValue: 10000 },
              effects: {
                equipmentEfficiency: 0.2,
                operatingCostReduction: 0.1
              },
              cost: { perkPoints: 3 }
            },
            {
              id: 'bulk-discount',
              name: 'Industry Connections',
              description: 'Better deals on equipment purchases',
              category: 'equipment',
              tier: 1,
              unlockConditions: { completedProjectsTotal: 10 },
              effects: {
                equipmentDiscounts: 0.15
              },
              cost: { perkPoints: 2 }
            }
          ],
          tierRequirement: { perksFromPreviousTier: 0 }
        }
      ]
    };

    // Talent Acquisition Tree
    const talentTree: PerkTree = {
      category: 'talent-acquisition',
      name: 'Talent Management',
      description: 'Attract and develop the best talent in the industry',
      tiers: [
        {
          tier: 1,
          perks: [
            {
              id: 'staff-happiness',
              name: 'Great Work Environment',
              description: 'Create a positive workplace culture',
              category: 'talent-acquisition',
              tier: 1,
              unlockConditions: { playerLevel: 8 },
              effects: {
                staffHappiness: 10,
                staffTrainingSpeed: 0.2
              },
              cost: { perkPoints: 3, money: 5000 }
            },
            {
              id: 'talent-scout',
              name: 'Talent Scouting',
              description: 'Find higher quality staff candidates',
              category: 'talent-acquisition',
              tier: 1,
              unlockConditions: { completedProjectsTotal: 15 },
              effects: {
                flatBonuses: new Map([['staff_quality_bonus', 5]])
              },
              cost: { perkPoints: 4 }
            }
          ],
          tierRequirement: { perksFromPreviousTier: 0 }
        }
      ]
    };

    this.perkTrees.set('acoustics', acousticsTree);
    this.perkTrees.set('equipment', equipmentTree);
    this.perkTrees.set('talent-acquisition', talentTree);
  }

  /**
   * Initialize studio specializations
   */
  private initializeSpecializations(): void {
    const rockSpecialization: StudioSpecialization = {
      id: 'rock-specialist',
      name: 'Rock & Metal Specialist',
      description: 'Master of heavy, guitar-driven music production',
      focusGenres: ['rock', 'alternative'],
      requiredPerks: ['advanced-acoustics', 'equipment-care'],
      benefits: {
        genreMastery: new Map([
          ['rock', 25],
          ['alternative', 20]
        ]),
        exclusiveContracts: ['metal-festival', 'rock-documentary'],
        industryRecognition: 30,
        specialEquipment: ['tube-amps', 'vintage-mics'],
        marketInfluence: 15,
        mediaAttention: 20
      },
      drawbacks: {
        penalizedGenres: new Map([
          ['classical', -10],
          ['jazz', -5]
        ]),
        increasedCosts: 0.1
      },
      prestigeLevel: 7
    };

    const popSpecialization: StudioSpecialization = {
      id: 'pop-hitmaker',
      name: 'Pop Hitmaker',
      description: 'Specialist in creating chart-topping pop music',
      focusGenres: ['pop', 'r&b'],
      requiredPerks: ['talent-scout', 'bulk-discount'],
      benefits: {
        genreMastery: new Map([
          ['pop', 30],
          ['r&b', 25]
        ]),
        exclusiveContracts: ['major-label-album', 'commercial-campaign'],
        industryRecognition: 40,
        specialEquipment: ['auto-tune-pro', 'pop-vocals-chain'],
        marketInfluence: 25,
        mediaAttention: 35
      },
      prestigeLevel: 8
    };

    this.specializations.set('rock-specialist', rockSpecialization);
    this.specializations.set('pop-hitmaker', popSpecialization);
  }

  private initializeMilestones(): void {
    this.milestones = [
      {
        id: 'first-hit',
        name: 'First Chart Success',
        description: 'Get your first song in the charts',
        category: 'projects',
        requirement: {
          type: 'count',
          target: 'chart_entries',
          value: 1
        },
        reward: {
          perkPoints: 3,
          reputation: 10
        },
        isRepeatable: false,
        prestigeValue: 15
      },
      {
        id: 'equipment-collector',
        name: 'Gear Head',
        description: 'Own equipment worth $50,000',
        category: 'equipment',
        requirement: {
          type: 'threshold',
          target: 'equipment_value',
          value: 50000
        },
        reward: {
          perkPoints: 2,
          unlockPerk: 'equipment-care'
        },
        isRepeatable: false,
        prestigeValue: 10
      }
    ];
  }

  private initializeSynergies(): void {
    this.perkSynergies = [
      {
        id: 'acoustic-equipment',
        name: 'Perfect Room',
        description: 'Combining advanced acoustics with proper equipment care',
        requiredPerks: ['advanced-acoustics', 'equipment-care'],
        bonusEffect: {
          projectQualityBonus: 8,
          percentageBonuses: new Map([['recording_efficiency', 0.15]])
        },
        prestigeBonus: 5
      }
    ];
  }

  private initializeUpgradeState(): StudioUpgradeState {
    return {
      unlockedPerks: new Set<string>(),
      availablePerkPoints: 0,
      totalPerkPoints: 0,
      perkCooldowns: new Map<string, number>(),
      activeEffects: []
    };
  }

  private initializePrestige(): IndustryPrestige {
    return {
      level: 0,
      points: 0,
      tier: 'unknown',
      benefits: {
        contractOfferFrequency: 1.0,
        contractQualityBonus: 0,
        mediaAttentionBonus: 0,
        networkingAdvantage: 0,
        equipmentAccessBonus: [],
        staffAttractionBonus: 0
      },
      nextTierRequirement: 100
    };
  }

  /**
   * Check if a perk can be unlocked
   */
  public canUnlockPerk(perkId: string, gameState: GameState): boolean {
    const perk = this.findPerkById(perkId);
    if (!perk) return false;

    // Check if already unlocked
    if (this.upgradeState.unlockedPerks.has(perkId)) return false;

    // Check cost requirements
    if (perk.cost.perkPoints > this.upgradeState.availablePerkPoints) return false;
    if (perk.cost.money && perk.cost.money > gameState.money) return false;

    // Check prerequisites
    if (perk.prerequisites) {
      for (const prereq of perk.prerequisites) {
        if (!this.upgradeState.unlockedPerks.has(prereq)) return false;
      }
    }

    // Check unlock conditions
    return this.checkUnlockConditions(perk.unlockConditions, gameState);
  }

  private checkUnlockConditions(conditions: UnlockConditions, gameState: GameState): boolean {
    if (conditions.playerLevel && gameState.playerData.level < conditions.playerLevel) {
      return false;
    }

    if (conditions.studioReputationThreshold && gameState.reputation < conditions.studioReputationThreshold) {
      return false;
    }

    if (conditions.completedProjectsTotal) {
      const completedCount = gameState.completedProjects?.length || 0;
      if (completedCount < conditions.completedProjectsTotal) return false;
    }

    if (conditions.equipmentValue) {
      const totalValue = gameState.ownedEquipment.reduce((sum, eq) => sum + eq.price, 0);
      if (totalValue < conditions.equipmentValue) return false;
    }

    if (conditions.completedProjectsInGenre) {
      const genreCount = gameState.completedProjects?.filter(
        p => p.genre === conditions.completedProjectsInGenre!.genre
      ).length || 0;
      if (genreCount < conditions.completedProjectsInGenre.count) return false;
    }

    return true;
  }

  /**
   * Unlock a perk
   */
  public unlockPerk(perkId: string, gameState: GameState): boolean {
    if (!this.canUnlockPerk(perkId, gameState)) return false;

    const perk = this.findPerkById(perkId)!;
    
    // Deduct costs
    this.upgradeState.availablePerkPoints -= perk.cost.perkPoints;
    if (perk.cost.money) {
      // Would need to modify gameState.money here
    }

    // Add to unlocked perks
    this.upgradeState.unlockedPerks.add(perkId);

    // Apply effects
    this.applyPerkEffects(perk);

    // Check for synergies
    this.checkAndActivateSynergies();

    return true;
  }

  private applyPerkEffects(perk: StudioPerk): void {
    const activeEffect: ActiveEffect = {
      id: `perk-${perk.id}`,
      name: perk.name,
      sourceType: 'perk',
      sourceId: perk.id,
      effect: perk.effects,
      stackable: false
    };

    this.upgradeState.activeEffects.push(activeEffect);
  }

  private checkAndActivateSynergies(): void {
    for (const synergy of this.perkSynergies) {
      // Check if all required perks are unlocked
      const allPerksUnlocked = synergy.requiredPerks.every(
        perkId => this.upgradeState.unlockedPerks.has(perkId)
      );

      if (allPerksUnlocked) {
        // Check if synergy is already active
        const synergyExists = this.upgradeState.activeEffects.some(
          effect => effect.id === `synergy-${synergy.id}`
        );

        if (!synergyExists) {
          const synergyEffect: ActiveEffect = {
            id: `synergy-${synergy.id}`,
            name: synergy.name,
            sourceType: 'perk',
            sourceId: synergy.id,
            effect: synergy.bonusEffect,
            stackable: false
          };

          this.upgradeState.activeEffects.push(synergyEffect);
        }
      }
    }
  }

  /**
   * Calculate total bonuses from all active perks
   */
  public calculateTotalBonuses(): PerkEffects {
    const totalEffects: PerkEffects = {
      flatBonuses: new Map(),
      percentageBonuses: new Map(),
      projectQualityBonus: 0,
      projectSpeedBonus: 0,
      staffHappiness: 0,
      contractValueMultiplier: 1,
      operatingCostReduction: 0,
      equipmentDiscounts: 0,
      reputationGainMultiplier: 1
    };

    for (const effect of this.upgradeState.activeEffects) {
      this.mergePerkEffects(totalEffects, effect.effect);
    }

    return totalEffects;
  }

  private mergePerkEffects(total: PerkEffects, toAdd: PerkEffects): void {
    // Merge flat bonuses
    if (toAdd.flatBonuses) {
      toAdd.flatBonuses.forEach((value, key) => {
        const current = total.flatBonuses!.get(key) || 0;
        total.flatBonuses!.set(key, current + value);
      });
    }

    // Merge percentage bonuses
    if (toAdd.percentageBonuses) {
      toAdd.percentageBonuses.forEach((value, key) => {
        const current = total.percentageBonuses!.get(key) || 0;
        total.percentageBonuses!.set(key, current + value);
      });
    }

    // Add numeric bonuses
    if (toAdd.projectQualityBonus) total.projectQualityBonus! += toAdd.projectQualityBonus;
    if (toAdd.projectSpeedBonus) total.projectSpeedBonus! += toAdd.projectSpeedBonus;
    if (toAdd.staffHappiness) total.staffHappiness! += toAdd.staffHappiness;
    if (toAdd.operatingCostReduction) total.operatingCostReduction! += toAdd.operatingCostReduction;
    if (toAdd.equipmentDiscounts) total.equipmentDiscounts! += toAdd.equipmentDiscounts;

    // Multiply multipliers
    if (toAdd.contractValueMultiplier) total.contractValueMultiplier! *= toAdd.contractValueMultiplier;
    if (toAdd.reputationGainMultiplier) total.reputationGainMultiplier! *= toAdd.reputationGainMultiplier;
  }

  /**
   * Award perk points for achievements
   */
  public awardPerkPoints(amount: number, reason: string): void {
    this.upgradeState.availablePerkPoints += amount;
    this.upgradeState.totalPerkPoints += amount;
  }

  /**
   * Process project completion for milestone progress
   */
  public processProjectCompletion(project: Project, report: ProjectReport): void {
    // Check milestones
    for (const milestone of this.milestones) {
      if (this.checkMilestoneCompletion(milestone, project, report)) {
        this.completeMilestone(milestone);
      }
    }

    // Award perk points based on project quality
    let perkPointsEarned = 0;
    if (report.qualityScore >= 95) perkPointsEarned = 3;
    else if (report.qualityScore >= 85) perkPointsEarned = 2;
    else if (report.qualityScore >= 75) perkPointsEarned = 1;

    if (perkPointsEarned > 0) {
      this.awardPerkPoints(perkPointsEarned, `High quality project: ${project.title}`);
    }

    // Update prestige
    this.updatePrestige(report.qualityScore, report.finalScore);
  }

  private checkMilestoneCompletion(milestone: StudioMilestone, project: Project, report: ProjectReport): boolean {
    // This is simplified - in a real implementation, you'd track various game statistics
    switch (milestone.requirement.target) {
      case 'chart_entries':
        // Would check if project entered charts
        return report.finalScore > 85; // Simplified check
      case 'equipment_value':
        // Would check against actual equipment value
        return false; // Needs game state context
      default:
        return false;
    }
  }

  private completeMilestone(milestone: StudioMilestone): void {
    if (milestone.reward.perkPoints) {
      this.awardPerkPoints(milestone.reward.perkPoints, `Milestone: ${milestone.name}`);
    }

    // Add prestige points
    this.industryPrestige.points += milestone.prestigeValue;
    this.updatePrestigeTier();
  }

  private updatePrestige(qualityScore: number, finalScore: number): void {
    let prestigeGain = 0;
    
    if (finalScore >= 95) prestigeGain = 5;
    else if (finalScore >= 85) prestigeGain = 3;
    else if (finalScore >= 75) prestigeGain = 1;

    this.industryPrestige.points += prestigeGain;
    this.updatePrestigeTier();
  }

  private updatePrestigeTier(): void {
    const points = this.industryPrestige.points;
    
    if (points >= 1000) {
      this.industryPrestige.tier = 'legendary';
      this.industryPrestige.level = 100;
    } else if (points >= 500) {
      this.industryPrestige.tier = 'international';
      this.industryPrestige.level = 80;
    } else if (points >= 250) {
      this.industryPrestige.tier = 'national';
      this.industryPrestige.level = 60;
    } else if (points >= 100) {
      this.industryPrestige.tier = 'regional';
      this.industryPrestige.level = 40;
    } else if (points >= 25) {
      this.industryPrestige.tier = 'local';
      this.industryPrestige.level = 20;
    }

    // Update benefits based on tier
    this.updatePrestigeBenefits();
  }

  private updatePrestigeBenefits(): void {
    const tier = this.industryPrestige.tier;
    const benefits = this.industryPrestige.benefits;

    switch (tier) {
      case 'legendary':
        benefits.contractOfferFrequency = 3.0;
        benefits.contractQualityBonus = 50;
        benefits.mediaAttentionBonus = 100;
        benefits.networkingAdvantage = 50;
        benefits.staffAttractionBonus = 25;
        break;
      case 'international':
        benefits.contractOfferFrequency = 2.5;
        benefits.contractQualityBonus = 30;
        benefits.mediaAttentionBonus = 60;
        benefits.networkingAdvantage = 30;
        benefits.staffAttractionBonus = 15;
        break;
      case 'national':
        benefits.contractOfferFrequency = 2.0;
        benefits.contractQualityBonus = 20;
        benefits.mediaAttentionBonus = 40;
        benefits.networkingAdvantage = 20;
        benefits.staffAttractionBonus = 10;
        break;
      case 'regional':
        benefits.contractOfferFrequency = 1.5;
        benefits.contractQualityBonus = 10;
        benefits.mediaAttentionBonus = 20;
        benefits.networkingAdvantage = 10;
        benefits.staffAttractionBonus = 5;
        break;
      case 'local':
        benefits.contractOfferFrequency = 1.2;
        benefits.contractQualityBonus = 5;
        benefits.mediaAttentionBonus = 10;
        benefits.networkingAdvantage = 5;
        benefits.staffAttractionBonus = 2;
        break;
    }
  }

  private findPerkById(perkId: string): StudioPerk | null {
    for (const tree of this.perkTrees.values()) {
      for (const tier of tree.tiers) {
        const perk = tier.perks.find(p => p.id === perkId);
        if (perk) return perk;
      }
    }
    return null;
  }

  /**
   * Get all available perk trees
   */
  public getPerkTrees(): PerkTree[] {
    return Array.from(this.perkTrees.values());
  }

  /**
   * Get unlocked perks
   */
  public getUnlockedPerks(): string[] {
    return Array.from(this.upgradeState.unlockedPerks);
  }

  /**
   * Get available perk points
   */
  public getAvailablePerkPoints(): number {
    return this.upgradeState.availablePerkPoints;
  }

  /**
   * Get current specialization
   */
  public getCurrentSpecialization(): StudioSpecialization | null {
    if (!this.upgradeState.activeSpecialization) return null;
    return this.specializations.get(this.upgradeState.activeSpecialization) || null;
  }

  /**
   * Get industry prestige
   */
  public getIndustryPrestige(): IndustryPrestige {
    return { ...this.industryPrestige };
  }

  /**
   * Get current studio upgrade state
   */
  public getUpgradeState(): StudioUpgradeState {
    return { ...this.upgradeState };
  }
}

// Singleton instance
export const studioUpgradeService = new StudioUpgradeService();
