import { grantsDelegation } from '@/rpg/studioKnowHow';
// Multi-Project Progression System
import { GameState } from '@/types/game';
import { getPhysicalStudioCapacity } from '@/utils/studioRoomUtils';
import { gameEvents } from '@/engine/gameEventBus';

export interface ProgressionMilestone {
  level: number;
  staffCount: number;
  projectsCompleted: number;
  unlockMessage: string;
  features: string[];
}

export interface ProgressionStatus {
  isMultiProjectUnlocked: boolean;
  currentMilestone: ProgressionMilestone | null;
  nextMilestone: ProgressionMilestone | null;
  progressToNext: number; // 0-1
  reason: string;
}

export class ProgressionSystem {
  // Define progression milestones
  private static readonly MILESTONES: ProgressionMilestone[] = [
    {
      level: 1,
      staffCount: 0,
      projectsCompleted: 0,
      unlockMessage: "Welcome to your recording studio! Start with single projects to learn the basics.",
      features: ["Single Project Management", "Basic Staff Hiring", "Equipment Purchasing"]
    },
    {
      level: 3,
      staffCount: 2,
      projectsCompleted: 3,
      unlockMessage: "🎉 Studio Expansion Available! You can now purchase a second production suite.",
      features: ["Second Room Expansion", "Basic Automation", "Project Prioritization"]
    },
    {
      level: 5,
      staffCount: 4,
      projectsCompleted: 8,
      unlockMessage: "🚀 Multi-Project Mastery! A third studio suite can now be brought online.",
      features: ["Third Room Expansion", "Smart Staff Automation", "Advanced Scheduling"]
    },
    {
      level: 8,
      staffCount: 6,
      projectsCompleted: 15,
      unlockMessage: "🏆 Studio Empire Mode! Your facility can now support a fourth production suite.",
      features: ["Fourth Room Expansion", "AI-Powered Optimization", "Advanced Analytics"]
    },
    {
      level: 12,
      staffCount: 8,
      projectsCompleted: 25,
      unlockMessage: "👑 Industry Legend! Your room expansion limit is fully unlocked.",
      features: ["Maximum Room Expansion", "Complete Automation Suite", "Industry Dominance"]
    }
  ];

  /**
   * Check if multi-project mode should be unlocked
   */
  static shouldUnlockMultiProject(gameState: GameState): boolean {
    const status = this.getProgressionStatus(gameState);
    return status.isMultiProjectUnlocked;
  }

  /**
   * Get the current progression status
   */
  static getProgressionStatus(gameState: GameState): ProgressionStatus {
    const playerLevel = gameState.playerData.level;
    const staffCount = gameState.hiredStaff.length;
    const projectsCompleted = this.calculateCompletedProjects(gameState);

    // Find current milestone
    let currentMilestone: ProgressionMilestone | null = null;
    let nextMilestone: ProgressionMilestone | null = null;

    for (let i = 0; i < this.MILESTONES.length; i++) {
      const milestone = this.MILESTONES[i];
      
      if (this.meetsMilestoneRequirements(milestone, playerLevel, staffCount, projectsCompleted)) {
        currentMilestone = milestone;
        nextMilestone = this.MILESTONES[i + 1] || null;
      } else {
        if (!nextMilestone) {
          nextMilestone = milestone;
        }
        break;
      }
    }

    // If no current milestone found, player hasn't reached first milestone
    if (!currentMilestone) {
      currentMilestone = this.MILESTONES[0];
      nextMilestone = this.MILESTONES[1];
    }

    // Calculate progress to next milestone
    let progressToNext = 1;
    if (nextMilestone) {
      const levelProgress = Math.min(1, playerLevel / nextMilestone.level);
      const staffProgress = Math.min(1, staffCount / nextMilestone.staffCount);
      const projectProgress = Math.min(1, projectsCompleted / nextMilestone.projectsCompleted);
      
      progressToNext = (levelProgress + staffProgress + projectProgress) / 3;
    }

    // Multi-project unlocks at milestone 2 (level 3, 2 staff, 3 projects)
    const isMultiProjectUnlocked = currentMilestone && 
      (currentMilestone.level >= 3 && currentMilestone.staffCount >= 2);

    // Generate reason for current status
    const reason = this.generateProgressionReason(
      playerLevel, 
      staffCount, 
      projectsCompleted, 
      nextMilestone
    );

    return {
      isMultiProjectUnlocked: Boolean(isMultiProjectUnlocked),
      currentMilestone,
      nextMilestone,
      progressToNext,
      reason
    };
  }

  /**
   * Get maximum concurrent projects based on progression
   */
  static getRoomExpansionLimit(gameState: GameState): number {
    const status = this.getProgressionStatus(gameState);
    const milestone = status.currentMilestone;

    if (!milestone || !status.isMultiProjectUnlocked) return 1;
    if (milestone.level >= 12) return 5;
    if (milestone.level >= 8) return 4;
    if (milestone.level >= 5) return 3;
    if (milestone.level >= 3) return 2;
    return 1;
  }

  static getMaxConcurrentProjects(gameState: GameState): number {
    const physicalCapacity = getPhysicalStudioCapacity(gameState);
    const progressionLimit = this.getRoomExpansionLimit(gameState);

    // Progression grants permission to expand; an actually purchased/unlocked
    // room creates the physical project slot.
    return Math.max(1, Math.min(physicalCapacity, progressionLimit));
  }

  /**
   * Get automation features available at current progression
   */
  static getAvailableAutomationFeatures(gameState: GameState): string[] {
    const status = this.getProgressionStatus(gameState);
    
    if (!status.currentMilestone) return [];
    
    const milestone = status.currentMilestone;
    const features: string[] = [];

    if (milestone.level >= 3) {
      features.push('basic_automation', 'dual_projects');
    }
    
    if (milestone.level >= 5) {
      features.push('smart_automation', 'priority_system', 'advanced_dashboard');
    }
    
    if (milestone.level >= 8) {
      features.push('ai_optimization', 'advanced_analytics', 'enterprise_features');
    }
    
    if (milestone.level >= 12) {
      features.push('legendary_automation', 'complete_suite', 'industry_tools');
    }

    return features;
  }

  /**
   * Check if a specific feature is unlocked
   */
  static isFeatureUnlocked(gameState: GameState, feature: string): boolean {
    // Delegation Policy (Know-How capability, #66) opens basic automation by play, not producer level.
    if (feature === 'basic_automation' && grantsDelegation(gameState.studioKnowHow)) return true;
    const availableFeatures = this.getAvailableAutomationFeatures(gameState);
    return availableFeatures.includes(feature);
  }

  /**
   * Get next unlock requirements
   */
  static getNextUnlockRequirements(gameState: GameState): {
    levelNeeded: number;
    staffNeeded: number;
    projectsNeeded: number;
    currentLevel: number;
    currentStaff: number;
    currentProjects: number;
  } | null {
    const status = this.getProgressionStatus(gameState);
    
    if (!status.nextMilestone) return null;

    const playerLevel = gameState.playerData.level;
    const staffCount = gameState.hiredStaff.length;
    const projectsCompleted = this.calculateCompletedProjects(gameState);

    return {
      levelNeeded: status.nextMilestone.level,
      staffNeeded: status.nextMilestone.staffCount,
      projectsNeeded: status.nextMilestone.projectsCompleted,
      currentLevel: playerLevel,
      currentStaff: staffCount,
      currentProjects: projectsCompleted
    };
  }

  /**
   * Generate a notification when a new milestone is reached
   */
  static checkForNewMilestone(
    oldGameState: GameState, 
    newGameState: GameState
  ): { unlocked: boolean; milestone: ProgressionMilestone | null } {
    const oldStatus = this.getProgressionStatus(oldGameState);
    const newStatus = this.getProgressionStatus(newGameState);

    const hasProgressed = newStatus.currentMilestone && 
      (!oldStatus.currentMilestone || 
       newStatus.currentMilestone.level > oldStatus.currentMilestone.level);

    return {
      unlocked: hasProgressed,
      milestone: hasProgressed ? newStatus.currentMilestone : null
    };
  }

  /**
   * Private helper methods
   */
  private static meetsMilestoneRequirements(
    milestone: ProgressionMilestone,
    level: number,
    staffCount: number,
    projectsCompleted: number
  ): boolean {
    return level >= milestone.level && 
           staffCount >= milestone.staffCount && 
           projectsCompleted >= milestone.projectsCompleted;
  }

  private static calculateCompletedProjects(gameState: GameState): number {
    // This is a simplified calculation - you may want to track this more explicitly
    // For now, we'll estimate based on player XP and level progression
    const baseProjects = Math.floor(gameState.playerData.xp / 1000);
    const levelBonus = Math.floor(gameState.playerData.level / 2);
    
    return Math.max(0, baseProjects + levelBonus);
  }

  private static generateProgressionReason(
    level: number,
    staffCount: number,
    projectsCompleted: number,
    nextMilestone: ProgressionMilestone | null
  ): string {
    if (!nextMilestone) {
      return "You've reached the highest progression level!";
    }

    const requirements = [];
    
    if (level < nextMilestone.level) {
      requirements.push(`Level ${nextMilestone.level} (currently ${level})`);
    }
    
    if (staffCount < nextMilestone.staffCount) {
      requirements.push(`${nextMilestone.staffCount} staff members (currently ${staffCount})`);
    }
    
    if (projectsCompleted < nextMilestone.projectsCompleted) {
      requirements.push(`${nextMilestone.projectsCompleted} completed projects (currently ${projectsCompleted})`);
    }

    if (requirements.length === 0) {
      return "Ready for next milestone!";
    }

    return `To unlock next features, you need: ${requirements.join(', ')}`;
  }

  /** Map milestone level requirement to studio tier (1-5) */
  static getStudioTierFromMilestone(milestoneLevel?: number): 1 | 2 | 3 | 4 | 5 {
    if (!milestoneLevel || milestoneLevel < 3) return 1;
    if (milestoneLevel < 5) return 2;
    if (milestoneLevel < 8) return 3;
    if (milestoneLevel < 12) return 4;
    return 5;
  }

  /**
   * Authoritative studio tier (1-5).
   * Prioritizes authoritative gameState.studioLevel, falling back to milestone status.
   */
  static getStudioTier(gameState: GameState): 1 | 2 | 3 | 4 | 5 {
    if (typeof gameState.studioLevel === 'number') {
      const clamped = Math.max(1, Math.min(5, Math.floor(gameState.studioLevel)));
      return clamped as 1 | 2 | 3 | 4 | 5;
    }
    const status = this.getProgressionStatus(gameState);
    return this.getStudioTierFromMilestone(status.currentMilestone?.level);
  }

  /** Metadata, console hardware, and unlock details for each tier */
  static getStudioTierDetails(tier: number) {
    const t = (Math.max(1, Math.min(5, Math.floor(tier)))) as 1 | 2 | 3 | 4 | 5;
    const names = [
      'HOME STUDIO',
      'BEDROOM+ STUDIO',
      'PROJECT STUDIO',
      'STUDIO A',
      'HIT FACTORY',
    ];
    const desks = [
      '4-channel compact valve desk',
      '8-channel analog slate console with rack bay',
      '12-channel British console (SSL/Neve) with analog VU meters',
      '16-channel large-format console with digital telemetry displays',
      '20-channel custom flagship master console with gold accents',
    ];
    const perks = [
      ['4-track analog warmth', 'Single project focus', 'Vintage valve chassis'],
      ['8-channel summing', 'Second room expansion', 'Basic automation routing'],
      ['12-channel British EQ', 'Third room expansion', 'Smart staff automation'],
      ['16-channel multitrack', 'Fourth room expansion', 'AI-assisted routing'],
      ['20-channel mastering suite', 'Maximum expansion limit', 'Complete automation suite'],
    ];
    return {
      tier: t,
      name: names[t - 1],
      desk: desks[t - 1],
      perks: perks[t - 1],
    };
  }

  /**
   * Authoritative upgrade of studio tier.
   * State updates FIRST before presentation.
   * Idempotent: cannot downgrade or double-grant bonuses.
   */
  static advanceStudioTier(
    gameState: GameState,
    targetTier?: number
  ): { newGameState: GameState; oldTier: number; newTier: number; upgraded: boolean } {
    const oldTier = this.getStudioTier(gameState);
    const newTier = targetTier !== undefined
      ? (Math.max(1, Math.min(5, Math.floor(targetTier))) as 1 | 2 | 3 | 4 | 5)
      : (Math.min(5, oldTier + 1) as 1 | 2 | 3 | 4 | 5);

    if (newTier <= oldTier) {
      return {
        newGameState: gameState,
        oldTier,
        newTier: oldTier,
        upgraded: false,
      };
    }

    const newGameState: GameState = {
      ...gameState,
      studioLevel: newTier,
      studioTier: newTier,
      reputation: gameState.reputation + 25,
    };

    try {
      gameEvents.emit('studio:tier_upgraded', { oldTier, newTier });
    } catch {
      // EventBus fallback in isolated test runners
    }

    return {
      newGameState,
      oldTier,
      newTier,
      upgraded: true,
    };
  }
}
