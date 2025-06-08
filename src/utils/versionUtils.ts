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
export interface FileModification {
  filePath: string;
  version: string;
  modifiedDate: string;
  modifiedBy: string;
  changeType: 'created' | 'modified' | 'deprecated' | 'deleted';
  description: string;
  lineCount?: number;
}

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
      'src/components/ChartsPanel_enhanced.tsx',
      'src/components/ChartsPanel_backup.tsx',
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

/**
 * File modification history
 */
export const FILE_MODIFICATIONS: FileModification[] = [
  {
    filePath: 'src/components/ChartsPanel.tsx',
    version: '0.3.0',
    modifiedDate: '2025-06-08',
    modifiedBy: 'GitHub Copilot',
    changeType: 'modified',
    description: 'Fixed compilation errors and added enhanced features',
    lineCount: 542
  },
  {
    filePath: 'src/components/ChartsPanel_enhanced.tsx',
    version: '0.3.0',
    modifiedDate: '2025-06-08',
    modifiedBy: 'GitHub Copilot',
    changeType: 'created',
    description: 'Enhanced version with improved UI and audio features',
    lineCount: 537
  },
  {
    filePath: 'src/components/ChartsPanel_backup.tsx',
    version: '0.3.0',
    modifiedDate: '2025-06-08',
    modifiedBy: 'GitHub Copilot',
    changeType: 'created',
    description: 'Experimental backup with additional features',
    lineCount: 661
  },
  {
    filePath: 'docs/VERSION_HISTORY.md',
    version: '0.3.0',
    modifiedDate: '2025-06-08',
    modifiedBy: 'GitHub Copilot',
    changeType: 'created',
    description: 'Comprehensive version tracking documentation',
    lineCount: 200
  }
];

/**
 * Generate a file header comment with version information
 */
export function generateFileHeader(
  fileDescription: string,
  filePath: string,
  createdDate: string = BUILD_DATE,
  modifiedDate: string = BUILD_DATE,
  author: string = 'GitHub Copilot'
): string {
  return `/**
 * @fileoverview ${fileDescription}
 * @version ${CURRENT_VERSION}
 * @author Recording Studio Tycoon Development Team
 * @created ${createdDate}
 * @modified ${modifiedDate}
 * @lastModifiedBy ${author}
 */

// filepath: ${filePath}`;
}

/**
 * Track a file modification
 */
export function trackFileModification(
  filePath: string,
  changeType: 'created' | 'modified' | 'deprecated' | 'deleted',
  description: string,
  lineCount?: number
): FileModification {
  const modification: FileModification = {
    filePath,
    version: CURRENT_VERSION,
    modifiedDate: BUILD_DATE,
    modifiedBy: 'GitHub Copilot',
    changeType,
    description,
    lineCount
  };

  FILE_MODIFICATIONS.push(modification);
  return modification;
}

/**
 * Get version information for a specific file
 */
export function getFileVersion(filePath: string): FileModification | null {
  return FILE_MODIFICATIONS
    .filter(mod => mod.filePath === filePath)
    .sort((a, b) => new Date(b.modifiedDate).getTime() - new Date(a.modifiedDate).getTime())[0] || null;
}

/**
 * Get all files modified in a specific version
 */
export function getFilesInVersion(version: string): FileModification[] {
  return FILE_MODIFICATIONS.filter(mod => mod.version === version);
}

/**
 * Generate changelog for a version
 */
export function generateChangelog(version: string): string {
  const versionInfo = VERSION_HISTORY.find(v => v.version === version);
  if (!versionInfo) return '';

  let changelog = `## Version ${version} - ${versionInfo.date}\n\n`;
  changelog += `**${versionInfo.description}**\n\n`;

  if (versionInfo.newFeatures && versionInfo.newFeatures.length > 0) {
    changelog += `### 🚀 New Features\n`;
    versionInfo.newFeatures.forEach(feature => {
      changelog += `- ${feature}\n`;
    });
    changelog += '\n';
  }

  if (versionInfo.bugFixes && versionInfo.bugFixes.length > 0) {
    changelog += `### 🐛 Bug Fixes\n`;
    versionInfo.bugFixes.forEach(fix => {
      changelog += `- ${fix}\n`;
    });
    changelog += '\n';
  }

  const filesInVersion = getFilesInVersion(version);
  if (filesInVersion.length > 0) {
    changelog += `### 📁 Files Modified\n`;
    filesInVersion.forEach(file => {
      changelog += `- \`${file.filePath}\` (${file.changeType}) - ${file.description}\n`;
    });
  }

  return changelog;
}

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
