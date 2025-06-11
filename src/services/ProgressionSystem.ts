// Multi-Project Progression System
import { GameState } from '@/types/game';

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
      unlockMessage: "🎉 Studio Expansion Unlocked! You can now manage 2 projects simultaneously.",
      features: ["Dual Project Management", "Basic Automation", "Project Prioritization"]
    },
    {
      level: 5,
      staffCount: 4,
      projectsCompleted: 8,
      unlockMessage: "🚀 Multi-Project Mastery! Full automation system and up to 3 concurrent projects available.",
      features: ["Multi-Project Dashboard", "Smart Staff Automation", "Advanced Scheduling"]
    },
    {
      level: 8,
      staffCount: 6,
      projectsCompleted: 15,
      unlockMessage: "🏆 Studio Empire Mode! Maximum efficiency with up to 4 concurrent projects.",
      features: ["Enterprise Dashboard", "AI-Powered Optimization", "Advanced Analytics"]
    },
    {
      level: 12,
      staffCount: 8,
      projectsCompleted: 25,
      unlockMessage: "👑 Industry Legend! You can now manage up to 5 concurrent projects with full automation.",
      features: ["Legendary Studio Management", "Complete Automation Suite", "Industry Dominance"]
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
  static getMaxConcurrentProjects(gameState: GameState): number {
    const status = this.getProgressionStatus(gameState);
    
    if (!status.isMultiProjectUnlocked) {
      return 1; // Single project only
    }

    const milestone = status.currentMilestone;
    if (!milestone) return 1;

    // Map milestones to project capacity
    if (milestone.level >= 12) return 5; // Industry Legend
    if (milestone.level >= 8) return 4;  // Studio Empire
    if (milestone.level >= 5) return 3;  // Multi-Project Mastery
    if (milestone.level >= 3) return 2;  // Studio Expansion
    
    return 1; // Default single project
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
}
