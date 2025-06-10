import { GameState, PlayerAttributes } from './types';
import { canUnlockHiring } from './gameState';
import { generateCandidateEngineers } from './hiringSystem';

/**
 * Adds XP to the player and handles level ups
 * Returns the updated game state and a boolean indicating if a level up occurred.
 */
export function addPlayerXP(gameState: GameState, amount: number): { newState: GameState, levelUpOccurred: boolean } {
  // Create a deep copy of the state to maintain immutability
  const newState = JSON.parse(JSON.stringify(gameState));

  // Add XP
  newState.playerData.xp += amount;
  
  let levelUpOccurred = false;
  // Check for level up
  while (newState.playerData.xp >= newState.playerData.xpToNextLevel) {
    const { newState: stateAfterLevelUp, anotherLevelUp } = levelUpPlayer(newState);
    newState.playerData = stateAfterLevelUp.playerData; // Update player data from the levelUp result
    levelUpOccurred = true;
    if (!anotherLevelUp) break; // Stop if no more level ups with current XP
  }
  
  return { newState, levelUpOccurred };
}

/**
 * Levels up the player and awards perk points
 * Returns the updated game state and a boolean indicating if another level up might occur.
 */
export function levelUpPlayer(gameState: GameState): { newState: GameState, anotherLevelUp: boolean } {
  // Create a deep copy of the state to maintain immutability
  const newState = JSON.parse(JSON.stringify(gameState));

  // Subtract XP needed for level up
  newState.playerData.xp -= newState.playerData.xpToNextLevel;
  
  // Increase level
  newState.playerData.level++;
  
  // Calculate new XP threshold (increases by 25% each level)
  newState.playerData.xpToNextLevel = Math.floor(
    newState.playerData.xpToNextLevel * 1.25
  );
  
  // Award perk point
  newState.playerData.perkPoints++;
  
  // Check if hiring system should be unlocked
  if (newState.playerData.level >= 2 && !newState.hiringUnlocked) {
    // Assuming canUnlockHiring is pure or will be refactored if needed
    // const { canUnlockHiring } = require('./gameState'); // Keep require for now, might need refactor
    if (canUnlockHiring(newState)) {
      newState.hiringUnlocked = true;
      
      // Generate initial candidates - This function also modifies state and needs refactoring.
      // For now, directly update the newState. We will refactor generateCandidateEngineers later if necessary.
      // const { generateCandidateEngineers } = require('./hiringSystem'); // Keep require for now
      // Assuming generateCandidateEngineers returns the new candidates and they should be added to newState.availableCandidates
      // **TODO: Refactor generateCandidateEngineers to be pure**
      const newCandidates = generateCandidateEngineers(3); // Assuming it returns new candidates
      newState.availableCandidates = [...newState.availableCandidates, ...newCandidates];
    }
  }
  
  // Check for another level up if there's excess XP
  let anotherLevelUp = false;
  if (newState.playerData.xp >= newState.playerData.xpToNextLevel) {
    anotherLevelUp = true; // Indicate that another level up is possible
  }
  
  // Remove the direct UI call
  // showLevelUpModal(gameState); 
  
  return { newState, anotherLevelUp };
}

/**
 * Spends a perk point to increase a player attribute
 * Returns the updated game state and a boolean indicating success.
 */
export function spendPlayerPerkPoint(gameState: GameState, attributeName: keyof PlayerAttributes): { newState: GameState, success: boolean } {
  // Create a deep copy of the state to maintain immutability
  const newState = JSON.parse(JSON.stringify(gameState));

  // Check if player has perk points to spend
  if (newState.playerData.perkPoints <= 0) {
    return { newState, success: false };
  }
  
  // Check if the attribute exists
  if (!(attributeName in newState.playerData.attributes)) {
    return { newState, success: false };
  }
  
  // Increase the attribute
  newState.playerData.attributes[attributeName]++;
  
  // Decrease perk points
  newState.playerData.perkPoints--;
  
  return { newState, success: true };
}

/**
 * Calculates the player's skill bonus for a specific genre
 */
export function getPlayerSkillBonus(gameState: GameState, genre: string): number {
  // Base value
  let bonus = 1.0;
  
  // Add bonus from studio skill level
  if (gameState.studioSkills[genre]) {
    bonus += (gameState.studioSkills[genre].level - 1) * 0.1;
  }
  
  // Add bonus from player attributes
  bonus += (gameState.playerData.attributes.creativeIntuition - 1) * 0.05;
  bonus += (gameState.playerData.attributes.technicalAptitude - 1) * 0.05;
  
  return bonus;
}