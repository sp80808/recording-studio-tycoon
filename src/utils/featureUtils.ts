import { GameState } from '@/types/game';

// Feature categories
export const FEATURE_CATEGORIES = {
  PROJECT_TYPES: 'project_types',
  EQUIPMENT: 'equipment',
  STAFF: 'staff',
  TRAINING: 'training',
  TECHNIQUES: 'techniques',
  MINIGAMES: 'minigames'
} as const;

export type FeatureCategory = typeof FEATURE_CATEGORIES[keyof typeof FEATURE_CATEGORIES];

// Feature requirements lookup
const FEATURE_REQUIREMENTS: Record<string, { level?: number; prerequisiteFeatures?: string[] }> = {
  // Project Types
  'indie_ep': { level: 5 },
  'local_band_album': { level: 5 },
  'major_label_album': { level: 15, prerequisiteFeatures: ['indie_ep'] },
  'soundtrack_production': { level: 15 },
  'film_score': { level: 20, prerequisiteFeatures: ['soundtrack_production'] },
  
  // Equipment
  'pro_condenser_mic': { level: 10 },
  'vintage_preamp': { level: 10 },
  'mastering_suite': { level: 15 },
  'analog_console': { level: 15 },
  'legendary_console': { level: 25 },
  
  // Staff Features
  'basic_staff_training': { level: 5 },
  'advanced_staff_training': { level: 10, prerequisiteFeatures: ['basic_staff_training'] },
  'genre_specialization': { level: 10 },
  'mentorship': { level: 25 },
  
  // Training Courses
  'basic_mixing': { level: 5 },
  'recording_fundamentals': { level: 5 },
  'advanced_mixing': { level: 10, prerequisiteFeatures: ['basic_mixing'] },
  'vocal_production': { level: 10 },
  'master_production': { level: 20, prerequisiteFeatures: ['advanced_mixing'] }
};

/**
 * Check if a specific feature is available to the player
 */
export const isFeatureUnlocked = (gameState: GameState, featureId: string): boolean => {
  // Check if feature exists in requirements
  const requirements = FEATURE_REQUIREMENTS[featureId];
  if (!requirements) {
    console.warn(`No requirements found for feature: ${featureId}`);
    return false;
  }

  // Check level requirement
  if (requirements.level && gameState.playerData.level < requirements.level) {
    return false;
  }

  // Check prerequisite features
  if (requirements.prerequisiteFeatures) {
    const hasAllPrerequisites = requirements.prerequisiteFeatures.every(
      prereq => gameState.unlockedFeatures.includes(prereq)
    );
    if (!hasAllPrerequisites) {
      return false;
    }
  }

  // Check if explicitly unlocked
  return gameState.unlockedFeatures.includes(featureId);
};

/**
 * Get all features available at a specific level
 */
export const getAvailableFeaturesAtLevel = (level: number): string[] => {
  return Object.entries(FEATURE_REQUIREMENTS)
    .filter(([_, requirements]) => requirements.level === level)
    .map(([featureId, _]) => featureId);
};

/**
 * Get all features in a specific category that are available to the player
 */
export const getAvailableFeaturesByCategory = (
  gameState: GameState,
  category: FeatureCategory
): string[] => {
  return gameState.unlockedFeatures.filter(feature => 
    feature.startsWith(category)
  );
};

/**
 * Get requirements for a specific feature
 */
export const getFeatureRequirements = (featureId: string) => {
  return FEATURE_REQUIREMENTS[featureId] || null;
};

/**
 * Check if a feature can be unlocked (meets all requirements except being explicitly unlocked)
 */
export const canUnlockFeature = (gameState: GameState, featureId: string): boolean => {
  const requirements = FEATURE_REQUIREMENTS[featureId];
  if (!requirements) return false;

  // Already unlocked
  if (gameState.unlockedFeatures.includes(featureId)) return false;

  // Check level requirement
  if (requirements.level && gameState.playerData.level < requirements.level) {
    return false;
  }

  // Check prerequisites
  if (requirements.prerequisiteFeatures) {
    return requirements.prerequisiteFeatures.every(
      prereq => gameState.unlockedFeatures.includes(prereq)
    );
  }

  return true;
};

/**
 * Get all features that could potentially be unlocked next
 */
export const getNextAvailableFeatures = (gameState: GameState): string[] => {
  return Object.keys(FEATURE_REQUIREMENTS)
    .filter(featureId => canUnlockFeature(gameState, featureId));
};

/**
 * Get missing prerequisites for a feature
 */
export const getMissingPrerequisites = (gameState: GameState, featureId: string): string[] => {
  const requirements = FEATURE_REQUIREMENTS[featureId];
  if (!requirements?.prerequisiteFeatures) return [];

  return requirements.prerequisiteFeatures.filter(
    prereq => !gameState.unlockedFeatures.includes(prereq)
  );
};
