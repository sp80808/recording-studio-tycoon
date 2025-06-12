import { GameState } from '@/types/game';

const SAVE_KEY = 'recordingStudioTycoonSave';
const CURRENT_VERSION = '1.0.0';
const MIN_SUPPORTED_VERSION = '0.9.0';

interface SaveData {
  gameState: GameState;
  version: string;
  timestamp: number;
  checksum: string;
}

// Validate save data structure
function validateSaveData(data: unknown): data is SaveData {
  if (!data || typeof data !== 'object') return false;
  const saveData = data as SaveData;
  return (
    typeof saveData.version === 'string' &&
    typeof saveData.timestamp === 'number' &&
    typeof saveData.checksum === 'string' &&
    typeof saveData.gameState === 'object' &&
    saveData.gameState !== null &&
    validateGameState(saveData.gameState)
  );
}

// Validate game state structure
function validateGameState(state: unknown): state is GameState {
  if (!state || typeof state !== 'object') return false;
  const gameState = state as GameState;
  
  // Check required properties
  return (
    typeof gameState.player === 'object' &&
    typeof gameState.playerData === 'object' &&
    typeof gameState.currentDay === 'number' &&
    typeof gameState.currentEra === 'string' &&
    typeof gameState.currentYear === 'number' &&
    typeof gameState.selectedEra === 'string' &&
    typeof gameState.eraStartYear === 'number' &&
    typeof gameState.equipmentMultiplier === 'number' &&
    Array.isArray(gameState.projects) &&
    Array.isArray(gameState.completedProjects) &&
    Array.isArray(gameState.staff) &&
    Array.isArray(gameState.ownedEquipment) &&
    typeof gameState.studioSkills === 'object' &&
    Array.isArray(gameState.bands) &&
    Array.isArray(gameState.playerBands) &&
    Array.isArray(gameState.availableSessionMusicians) &&
    Array.isArray(gameState.availableProjects) &&
    Array.isArray(gameState.availableCandidates) &&
    Array.isArray(gameState.ownedUpgrades) &&
    typeof gameState.lastSalaryDay === 'number' &&
    Array.isArray(gameState.notifications) &&
    typeof gameState.studioLevel === 'number' &&
    typeof gameState.studioReputation === 'number' &&
    Array.isArray(gameState.studioSpecialization) &&
    Array.isArray(gameState.studioChallenges) &&
    Array.isArray(gameState.studioAchievements) &&
    Array.isArray(gameState.events)
  );
}

// Generate checksum for save data
function generateChecksum(data: GameState): string {
  const stringified = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < stringified.length; i++) {
    const char = stringified.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// Compare versions
function compareVersions(v1: string, v2: string): number {
  const v1Parts = v1.split('.').map(Number);
  const v2Parts = v2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (v1Parts[i] > v2Parts[i]) return 1;
    if (v1Parts[i] < v2Parts[i]) return -1;
  }
  return 0;
}

// Migrate save data to current version
function migrateSaveData(data: SaveData): SaveData {
  if (data.version === CURRENT_VERSION) return data;

  const migratedState = { ...data.gameState };

  // Version-specific migrations
  if (compareVersions(data.version, '1.0.0') < 0) {
    // Add missing properties for v1.0.0
    if (!migratedState.chartsData) {
      migratedState.chartsData = {
        charts: [],
        contactedArtists: [],
        marketTrends: [],
        discoveredArtists: [],
        lastChartUpdate: 0
      };
    }
  }

  return {
    gameState: migratedState,
    version: CURRENT_VERSION,
    timestamp: Date.now(),
    checksum: generateChecksum(migratedState)
  };
}

// Save game state
export function saveGame(gameState: GameState): boolean {
  try {
    const saveData: SaveData = {
      gameState,
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      checksum: generateChecksum(gameState)
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    return true;
  } catch (error) {
    console.error('Failed to save game:', error);
    return false;
  }
}

// Load game state
export function loadGame(): GameState | null {
  try {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (!savedData) return null;

    const parsed = JSON.parse(savedData);
    if (!validateSaveData(parsed)) {
      console.error('Invalid save data structure');
      return null;
    }

    // Check version compatibility
    if (compareVersions(parsed.version, MIN_SUPPORTED_VERSION) < 0) {
      console.error(`Save version ${parsed.version} is not supported. Minimum version is ${MIN_SUPPORTED_VERSION}`);
      return null;
    }

    // Migrate if needed
    const migratedData = migrateSaveData(parsed);

    // Verify checksum
    const currentChecksum = generateChecksum(migratedData.gameState);
    if (currentChecksum !== migratedData.checksum) {
      console.error('Save data checksum mismatch');
      return null;
    }

    return migratedData.gameState;
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
}

// Delete save game
export function deleteSave(): boolean {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to delete save:', error);
    return false;
  }
}

// Check if save exists
export function hasSaveGame(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch (error) {
    console.error('Failed to check save existence:', error);
    return false;
  }
}

// Declare global window type
declare global {
  interface Window {
    gameState: GameState;
  }
}

// Auto-save functionality
let autoSaveInterval: number | null = null;

export function startAutoSave(interval: number = 60000): void {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
  }

  autoSaveInterval = window.setInterval(() => {
    if (window.gameState) {
      saveGame(window.gameState);
    }
  }, interval);
}

export function stopAutoSave(): void {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
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
    const parsedData: unknown = JSON.parse(decodedData); // Parse to unknown

    // Validate save data structure using the type guard
    if (!validateSaveData(parsedData)) {
      throw new Error('Invalid save data structure provided for import');
    }
    
    // If validation passes, parsedData is confirmed to be SaveData.
    // Store the original decoded string, as loadGame will handle full parsing,
    // validation (including checksum), and migration.
    localStorage.setItem(SAVE_KEY, decodedData);
  } catch (error) {
    console.error('Failed to import save:', error);
    throw error;
  }
}
