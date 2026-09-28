import { ERA_DEFINITIONS, visualEraId } from './eraProgression';

export interface SavePreviewData {
  day: number;
  level: number;
  money: number;
  era: string;
}

export interface SaveInspectionResult {
  hasSave: boolean;
  isCorrupt: boolean;
  preview: SavePreviewData | null;
  error?: string;
}

const STORAGE_KEY = 'recordingStudioTycoonSave';

/**
 * Inspects localStorage for existing save data, validating structure and extracting a preview.
 */
export function inspectSaveGame(storage: Storage = window.localStorage): SaveInspectionResult {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return { hasSave: false, isCorrupt: false, preview: null };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {
        hasSave: true,
        isCorrupt: true,
        preview: null,
        error: 'Save file format is corrupted.'
      };
    }

    if (!parsed || typeof parsed !== 'object') {
      return {
        hasSave: true,
        isCorrupt: true,
        preview: null,
        error: 'Save data root is invalid.'
      };
    }

    const rec = parsed as Record<string, unknown>;
    const gs = rec.gameState;
    if (!gs || typeof gs !== 'object') {
      return {
        hasSave: true,
        isCorrupt: true,
        preview: null,
        error: 'Save data is missing game state.'
      };
    }

    const state = gs as Record<string, unknown>;
    const day = typeof state.currentDay === 'number' ? state.currentDay : 1;
    const money = typeof state.money === 'number' ? Math.floor(state.money) : 0;
    const playerData = (state.playerData && typeof state.playerData === 'object')
      ? (state.playerData as Record<string, unknown>)
      : null;
    const level = typeof playerData?.level === 'number' ? playerData.level : 1;

    const rawEra = typeof state.currentEra === 'string' ? state.currentEra : 'analog60s';
    const eraDef = ERA_DEFINITIONS.find(e => e.id === visualEraId(rawEra)) ?? ERA_DEFINITIONS.find(e => e.id === rawEra);
    const eraName = eraDef ? eraDef.name.replace(/\s*\(.*\)/, '').trim() : rawEra;

    return {
      hasSave: true,
      isCorrupt: false,
      preview: {
        day,
        level,
        money,
        era: eraName
      }
    };
  } catch (err) {
    return {
      hasSave: true,
      isCorrupt: true,
      preview: null,
      error: err instanceof Error ? err.message : 'Unknown save error'
    };
  }
}
