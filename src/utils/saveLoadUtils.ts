import { GameState } from '@/types/game';

const SAVE_KEY = 'recording_studio_tycoon_save';
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes

export interface SaveData {
  gameState: GameState;
  timestamp: number;
  version: string;
}

export function saveGame(gameState: GameState): void {
  const saveData: SaveData = {
    gameState,
    timestamp: Date.now(),
    version: '1.0.0' // Update this when making breaking changes
  };

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch (error) {
    console.error('Failed to save game:', error);
  }
}

export function loadGame(): GameState | null {
  try {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (!savedData) return null;

    const { gameState, version } = JSON.parse(savedData) as SaveData;
    
    // Handle version migrations here if needed
    if (version !== '1.0.0') {
      console.warn('Save version mismatch, attempting migration...');
      // Add migration logic here when needed
    }

    return gameState;
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
}

export function deleteSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (error) {
    console.error('Failed to delete save:', error);
  }
}

export function hasSaveGame(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function getLastSaveTimestamp(): number | null {
  try {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (!savedData) return null;

    const { timestamp } = JSON.parse(savedData) as SaveData;
    return timestamp;
  } catch (error) {
    console.error('Failed to get last save timestamp:', error);
    return null;
  }
}

export function setupAutoSave(gameState: GameState): () => void {
  const autoSaveInterval = setInterval(() => {
    saveGame(gameState);
  }, AUTO_SAVE_INTERVAL);

  // Return cleanup function
  return () => clearInterval(autoSaveInterval);
}

export function exportSave(): string {
  try {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (!savedData) throw new Error('No save data found');

    return btoa(savedData); // Base64 encode the save data
  } catch (error) {
    console.error('Failed to export save:', error);
    throw error;
  }
}

export function importSave(encodedData: string): void {
  try {
    const decodedData = atob(encodedData); // Base64 decode the save data
    const saveData = JSON.parse(decodedData) as SaveData;
    
    // Validate save data structure
    if (!saveData.gameState || !saveData.timestamp || !saveData.version) {
      throw new Error('Invalid save data structure');
    }

    localStorage.setItem(SAVE_KEY, decodedData);
  } catch (error) {
    console.error('Failed to import save:', error);
    throw error;
  }
} 