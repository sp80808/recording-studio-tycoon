/**
 * @fileoverview Version tracking and code history utilities
 * @version 0.3.0
 * @author Recording Studio Tycoon Development Team
 * @created 2025-06-08
 * @modified 2025-06-08
 * @lastModifiedBy GitHub Copilot
 */

/**
 * Interface for tracking code changes and versions
 */
export interface CodeVersion {
  version: string;
  date: string;
  author: string;
  description: string;
  filesChanged: string[];
  breakingChanges?: string[];
  bugFixes?: string[];
  newFeatures?: string[];
}

/**
 * Interface for file modification tracking
 */
// This interface is no longer used by any active code in this file after removals.
// export interface FileModification {
//   filePath: string;
//   version: string;
//   modifiedDate: string;
//   modifiedBy: string;
//   changeType: 'created' | 'modified' | 'deprecated' | 'deleted';
//   description: string;
//   lineCount?: number;
// }

/**
 * Current version information
 */
export const CURRENT_VERSION = '0.3.0';
export const BUILD_DATE = '2025-06-08';
export const DEVELOPMENT_PHASE = 'Phase 2B - Charts & Industry Integration';

/**
 * Version history tracking
 */
export const VERSION_HISTORY: CodeVersion[] = [
  {
    version: '0.3.0',
    date: '2025-06-08',
    author: 'GitHub Copilot',
    description: 'Charts & Industry Integration - Major milestone with enhanced charts system',
    filesChanged: [
      'src/components/ChartsPanel.tsx',
      // 'src/components/ChartsPanel_enhanced.tsx', // Removed as file does not exist
      // 'src/components/ChartsPanel_backup.tsx', // Removed as file does not exist
      'src/components/EquipmentDetailModal.tsx',
      'src/components/animations/',
      'docs/CODEBASE_ANALYSIS_2025.md'
    ],
    newFeatures: [
      'Billboard-style charts display',
      'Audio preview system with 25-second clips',
      'Artist contact system with level gates',
      'Market trends analysis',
      'Equipment technical specifications',
      'Enhanced animation system'
    ],
    bugFixes: [
      'Fixed compilation errors in ChartsPanel',
      'Resolved TypeScript type safety issues',
      'Fixed audio playback timing',
      'Corrected minigame trigger frequency'
    ]
  },
  {
    version: '0.2.0',
    date: '2025-06-08',
    author: 'GitHub Copilot',
    description: 'Advanced Minigames Suite - Complete minigame system overhaul',
    filesChanged: [
      'src/components/minigames/EffectChainGame.tsx',
      'src/components/minigames/AcousticTreatmentGame.tsx',
      'src/components/minigames/InstrumentLayeringGame.tsx',
      'src/components/minigames/MinigameManager.tsx',
      'src/utils/minigameUtils.ts',
      'src/hooks/useBackgroundMusic.tsx'
    ],
    newFeatures: [
      'Effect Chain Building Game',
      'Acoustic Treatment Game',
      'Instrument Layering Game',
      'Enhanced trigger system',
      'Background music optimization'
    ],
    bugFixes: [
      'Fixed background music delay',
      'Resolved focus allocation compatibility',
      'Fixed minigame anti-spam logic'
    ]
  },
  {
    version: '0.1.0',
    date: '2025-06-01',
    author: 'Development Team',
    description: 'Foundation & Core Systems - Initial implementation',
    filesChanged: [
      'src/',
      'docs/',
      'public/'
    ],
    newFeatures: [
      'Core recording studio mechanics',
      'Staff management system',
      'Equipment progression',
      'Basic minigames suite',
      'Tutorial system',
      'Era-based progression'
    ]
  }
];

// FILE_MODIFICATIONS array and related functions (generateFileHeader, trackFileModification, getFileVersion, getFilesInVersion, generateChangelog)
// have been removed as they appear unused within the src/ directory and FILE_MODIFICATIONS data was outdated.
// The FileModification interface is also commented out as it's no longer used by active code in this file.

/**
 * Validate version format (semver)
 */
export function isValidVersion(version: string): boolean {
  const semverPattern = /^\d+\.\d+\.\d+$/;
  return semverPattern.test(version);
}

/**
 * Compare versions (returns -1, 0, or 1)
 */
export function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (v1Parts[i] < v2Parts[i]) return -1;
    if (v1Parts[i] > v2Parts[i]) return 1;
  }
  return 0;
}

/**
 * Get the latest version
 */
export function getLatestVersion(): string {
  return VERSION_HISTORY
    .map(v => v.version)
    .sort(compareVersions)
    .reverse()[0];
}

/**
 * Export version information for save system
 */
export function getVersionInfo() {
  return {
    version: CURRENT_VERSION,
    buildDate: BUILD_DATE,
    phase: DEVELOPMENT_PHASE,
    features: VERSION_HISTORY.find(v => v.version === CURRENT_VERSION)?.newFeatures || []
  };
}
