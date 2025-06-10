import { GameState, PlayerData, StudioSkill, Project, StaffMember } from './types';
import { generateNewProjects } from './projectManager';
import { generateCandidates } from './staffSystem';

// Define initial skills
const initialSkills: Record<string, StudioSkill> = {
  rock: {
    name: 'Rock',
    level: 1,
    xp: 0,
    xpToNextLevel: 20,
    color: '#e74c3c'
  },
  pop: {
    name: 'Pop',
    level: 1,
    xp: 0,
    xpToNextLevel: 20,
    color: '#3498db'
  },
  electronic: {
    name: 'Electronic',
    level: 1,
    xp: 0,
    xpToNextLevel: 20,
    color: '#9b59b6'
  },
  hiphop: {
    name: 'Hiphop',
    level: 1,
    xp: 0,
    xpToNextLevel: 20,
    color: '#2c3e50'
  },
  acoustic: {
    name: 'Acoustic',
    level: 1,
    xp: 0,
    xpToNextLevel: 20,
    color: '#27ae60'
  }
};

// Define available upgrades
export const availableUpgrades = [
  {
    id: 'pro-mic-bundle',
    name: 'Pro Mic Bundle',
    description: 'Professional microphones for better acoustic and pop recordings',
    cost: 800,
    skillBonuses: { acoustic: 2, pop: 1 }
  },
  {
    id: 'faster-daw',
    name: 'Faster DAW',
    description: 'Upgraded digital audio workstation for faster project completion',
    cost: 1200,
    skillBonuses: { electronic: 1, pop: 1, rock: 1 }
  }
];

/**
 * Creates a new game state with initial values
 */
export function createInitialGameState(): GameState {
  // Initial player data
  const playerData: PlayerData = {
    xp: 0,
    level: 1,
    xpToNextLevel: 100,
    perkPoints: 0,
    attributes: {
      focusMastery: 1,
      creativeIntuition: 1,
      technicalAptitude: 1,
      businessAcumen: 1
    }
  };

  // Create initial game state
  const gameState: GameState = {
    money: 1000,
    reputation: 10,
    currentDay: 1,
    completedProjects: 0,
    playerData,
    studioSkills: { ...initialSkills },
    ownedUpgrades: [],
    availableProjects: [],
    activeProject: null,
    hiredStaff: [],
    availableCandidates: [],
    hiringUnlocked: false,
    lastSalaryDay: 1
  };

  // Generate initial projects
  gameState.availableProjects = generateNewProjects(3, gameState);
  
  // Generate initial candidates if hiring is unlocked
  if (canUnlockHiring(gameState)) {
    gameState.hiringUnlocked = true;
    gameState.availableCandidates = generateCandidates(3);
  }

  return gameState;
}

/**
 * Checks if hiring system can be unlocked
 */
export function canUnlockHiring(gameState: GameState): boolean {
  return gameState.playerData.level >= 3 && gameState.money >= 500;
}

/**
 * Updates the game state for a new day
 */
export function advanceDay(gameState: GameState): void {
  gameState.currentDay++;
  
  // Process active project work
  if (gameState.activeProject) {
    gameState.activeProject.daysWorked++;
  }
  
  // Refresh projects occasionally
  if (gameState.currentDay % 5 === 0 && gameState.availableProjects.length < 3) {
    const newProjects = generateNewProjects(
      3 - gameState.availableProjects.length, 
      gameState
    );
    gameState.availableProjects = [...gameState.availableProjects, ...newProjects];
  }
  
  // Refresh candidates occasionally
  if (gameState.hiringUnlocked && gameState.currentDay % 7 === 0) {
    const newCandidates = generateCandidates(3);
    gameState.availableCandidates = newCandidates;
  }
  
  // Update staff
  const { updateStaffDaily } = require('./staffSystem');
  updateStaffDaily(gameState);
}

/**
 * Purchases an upgrade if player has enough money
 */
export function purchaseUpgrade(gameState: GameState, upgradeId: string): boolean {
  const upgrade = availableUpgrades.find(u => u.id === upgradeId);
  
  if (!upgrade || gameState.ownedUpgrades.includes(upgradeId) || gameState.money < upgrade.cost) {
    return false;
  }
  
  // Apply the purchase
  gameState.money -= upgrade.cost;
  gameState.ownedUpgrades.push(upgradeId);
  
  // Apply skill bonuses from the upgrade
  Object.entries(upgrade.skillBonuses).forEach(([skillId, bonus]) => {
    if (gameState.studioSkills[skillId]) {
      gameState.studioSkills[skillId].xp += bonus * 10;
      checkAndLevelUpSkill(gameState, skillId);
    }
  });
  
  return true;
}

/**
 * Checks if a skill has enough XP to level up and applies the level up
 */
export function checkAndLevelUpSkill(gameState: GameState, skillId: string): void {
  const skill = gameState.studioSkills[skillId];
  if (!skill) return;
  
  while (skill.xp >= skill.xpToNextLevel) {
    skill.xp -= skill.xpToNextLevel;
    skill.level += 1;
    skill.xpToNextLevel = Math.floor(skill.xpToNextLevel * 1.5);
  }
}