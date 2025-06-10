import { GameState } from './types';
import { createInitialGameState, advanceDay } from './gameState';
import { initializeUI, updateUI, simulateProjectWork } from './uiManager';

// Create and store game state
let gameState: GameState = createInitialGameState();

/**
 * Updates game state and UI
 */
function updateGameState(): void {
  // Save game state (could implement local storage here)
  saveGameState();
  
  // Update UI to reflect current state
  updateUI(gameState);
}

/**
 * Advances to the next day
 */
function nextDay(): void {
  // Process day advancement
  advanceDay(gameState);
  
  // Update UI
  updateGameState();
}

/**
 * Simulates working on the current project
 */
function simulateWork(): void {
  // Only simulate if there's an active project
  if (gameState.activeProject) {
    simulateProjectWork(gameState);
  }
}

/**
 * Saves game state to local storage
 */
function saveGameState(): void {
  try {
    localStorage.setItem('musicStudioTycoon', JSON.stringify(gameState));
  } catch (e) {
    console.error('Failed to save game state:', e);
  }
}

/**
 * Loads game state from local storage
 */
function loadGameState(): boolean {
  try {
    const savedState = localStorage.getItem('musicStudioTycoon');
    if (savedState) {
      gameState = JSON.parse(savedState);
      return true;
    }
  } catch (e) {
    console.error('Failed to load game state:', e);
  }
  return false;
}

/**
 * Adds a next day button to the UI
 */
function addNextDayButton(): void {
  const topBar = document.getElementById('top-bar');
  if (!topBar) return;
  
  const nextDayButton = document.createElement('button');
  nextDayButton.id = 'next-day-button';
  nextDayButton.className = 'action-button';
  nextDayButton.style.marginLeft = 'auto';
  nextDayButton.textContent = 'Next Day';
  
  nextDayButton.addEventListener('click', nextDay);
  
  topBar.appendChild(nextDayButton);
}

/**
 * Initializes the game
 */
function initGame(): void {
  // Try to load saved state
  if (!loadGameState()) {
    // If no saved state, use initial state
    gameState = createInitialGameState();
  }
  
  // Initialize UI
  initializeUI(gameState, updateGameState);
  
  // Add next day button
  addNextDayButton();
  
  // Start work simulation timer (runs every 3 seconds)
  setInterval(simulateWork, 3000);
  
  // Initial UI update
  updateUI(gameState);
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);