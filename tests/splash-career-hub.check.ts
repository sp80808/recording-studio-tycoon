import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { inspectSaveGame } from '../src/utils/savePreview';
import { GameState, Project } from '../src/types/game';

// Mock storage for testing inspectSaveGame
function createMockStorage(initialData: Record<string, string> = {}): Storage {
  const store = new Map<string, string>(Object.entries(initialData));
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => { store.set(key, val); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() { return store.size; },
  };
}

describe('Splash Save Inspection & Preview', () => {
  test('returns hasSave=false when localStorage has no save', () => {
    const storage = createMockStorage();
    const result = inspectSaveGame(storage);
    assert.equal(result.hasSave, false);
    assert.equal(result.isCorrupt, false);
    assert.equal(result.preview, null);
  });

  test('returns isCorrupt=true when JSON is malformed', () => {
    const storage = createMockStorage({
      recordingStudioTycoonSave: '{ not-valid-json: ;'
    });
    const result = inspectSaveGame(storage);
    assert.equal(result.hasSave, true);
    assert.equal(result.isCorrupt, true);
    assert.equal(result.preview, null);
    assert.ok(result.error);
  });

  test('returns isCorrupt=true when gameState is missing from object', () => {
    const storage = createMockStorage({
      recordingStudioTycoonSave: JSON.stringify({ version: '1.0.0', timestamp: 12345 })
    });
    const result = inspectSaveGame(storage);
    assert.equal(result.hasSave, true);
    assert.equal(result.isCorrupt, true);
    assert.equal(result.preview, null);
  });

  test('extracts accurate preview (day, level, money, era) from valid save', () => {
    const validSave = {
      gameState: {
        currentDay: 14,
        money: 8450.75,
        currentEra: 'analog60s',
        playerData: {
          level: 4,
          xp: 120,
          xpToNextLevel: 250
        }
      },
      timestamp: Date.now(),
      version: '1.0.0'
    };

    const storage = createMockStorage({
      recordingStudioTycoonSave: JSON.stringify(validSave)
    });
    const result = inspectSaveGame(storage);
    assert.equal(result.hasSave, true);
    assert.equal(result.isCorrupt, false);
    assert.ok(result.preview);
    assert.equal(result.preview.day, 14);
    assert.equal(result.preview.level, 4);
    assert.equal(result.preview.money, 8450);
    assert.equal(result.preview.era, 'The Analog Foundation');
  });
});

describe('CareerHub Next-Action Priority Logic', () => {
  function createStubGameState(overrides: Partial<GameState> = {}): GameState {
    return {
      currentDay: 1,
      currentYear: 1960,
      money: 10000,
      reputation: 10,
      currentEra: 'analog60s',
      playerData: {
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        perkPoints: 0,
        dailyWorkCapacity: 3,
        attributes: { audioEngineering: 10, musicalCreativity: 10, businessAcumen: 10, leadership: 10 },
      },
      hiredStaff: [],
      ownedEquipment: [],
      activeProject: null,
      availableProjects: [],
      completedProjects: [],
      clientRelationships: [],
      activeSynergies: [],
      discoveredSynergies: [],
      ...overrides
    } as unknown as GameState;
  }

  // Reproduces nextAction resolution logic from CareerHub.tsx
  function resolveCareerHubAction(gameState: GameState) {
    const project = gameState.activeProject;
    const awaitingReview = Boolean(project?.awaitingReview);
    const tired = gameState.playerData.dailyWorkCapacity <= 0;

    if (awaitingReview) {
      return {
        type: 'awaitingReview',
        label: 'Review & release',
        subtext: 'Master complete · Ready to review and release',
      };
    }
    if (tired) {
      return {
        type: 'rest',
        label: 'Rest & advance day',
      };
    }
    if (project) {
      return {
        type: 'continue',
        label: 'Continue session',
        subtext: project.title,
      };
    }
    return {
      type: 'book',
      label: gameState.completedProjects.length === 0 ? 'Book your first session' : 'Find a gig',
      subtext: 'Your next record starts with a booking.',
    };
  }

  test('prioritizes awaitingReview over tired and in-progress session', () => {
    const state = createStubGameState({
      activeProject: { id: 'p1', title: 'Summer Hit', awaitingReview: true } as unknown as Project,
      playerData: {
        dailyWorkCapacity: 0, // Even if tired!
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        perkPoints: 0,
        attributes: { audioEngineering: 10, musicalCreativity: 10, businessAcumen: 10, leadership: 10 },
      }
    });

    const action = resolveCareerHubAction(state);
    assert.equal(action.type, 'awaitingReview');
    assert.equal(action.label, 'Review & release');
  });

  test('prioritizes rest when out of work capacity and no review pending', () => {
    const state = createStubGameState({
      activeProject: { id: 'p1', title: 'Summer Hit', awaitingReview: false } as unknown as Project,
      playerData: {
        dailyWorkCapacity: 0,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        perkPoints: 0,
        attributes: { audioEngineering: 10, musicalCreativity: 10, businessAcumen: 10, leadership: 10 },
      }
    });

    const action = resolveCareerHubAction(state);
    assert.equal(action.type, 'rest');
    assert.equal(action.label, 'Rest & advance day');
  });

  test('continues active session when capacity remains', () => {
    const state = createStubGameState({
      activeProject: { id: 'p1', title: 'Echoes of Love', awaitingReview: false } as unknown as Project,
      playerData: {
        dailyWorkCapacity: 2,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        perkPoints: 0,
        attributes: { audioEngineering: 10, musicalCreativity: 10, businessAcumen: 10, leadership: 10 },
      }
    });

    const action = resolveCareerHubAction(state);
    assert.equal(action.type, 'continue');
    assert.equal(action.label, 'Continue session');
    assert.equal(action.subtext, 'Echoes of Love');
  });

  test('prompts booking first session when new player with no project', () => {
    const state = createStubGameState({
      activeProject: null,
      completedProjects: [],
      playerData: {
        dailyWorkCapacity: 3,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        perkPoints: 0,
        attributes: { audioEngineering: 10, musicalCreativity: 10, businessAcumen: 10, leadership: 10 },
      }
    });

    const action = resolveCareerHubAction(state);
    assert.equal(action.type, 'book');
    assert.equal(action.label, 'Book your first session');
  });

  test('prompts finding a gig when existing player has no active project', () => {
    const state = createStubGameState({
      activeProject: null,
      completedProjects: [{ id: 'old-1' }] as unknown as Project[],
      playerData: {
        dailyWorkCapacity: 3,
        level: 2,
        xp: 50,
        xpToNextLevel: 150,
        perkPoints: 0,
        attributes: { audioEngineering: 10, musicalCreativity: 10, businessAcumen: 10, leadership: 10 },
      }
    });

    const action = resolveCareerHubAction(state);
    assert.equal(action.type, 'book');
    assert.equal(action.label, 'Find a gig');
  });
});
