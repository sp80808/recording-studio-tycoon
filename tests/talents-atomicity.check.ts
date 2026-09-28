import { upgradePlayerAttribute, resolvePlayerLevelUps } from '@/utils/playerUtils';
import { spendPerkPoint } from '@/utils/gameUtils';
import { GameState } from '@/types/game';

function createInitialState(): GameState {
  return {
    studioName: 'Test Studio',
    funds: 10000,
    reputation: 50,
    currentEra: 'analog60s',
    activeProject: null,
    enquiries: [],
    bands: [],
    completedProjects: [],
    ownedEquipment: [],
    staff: [],
    studioSkills: [],
    notifications: [],
    charts: [],
    marketEvents: [],
    financials: {
      dailyBreakdown: [],
      income: 0,
      expenses: 0,
      profit: 0,
      reports: []
    },
    playerData: {
      name: 'Producer',
      level: 1,
      xp: 0,
      perkPoints: 3,
      attributes: {
        focusMastery: 0,
        creativeIntuition: 0,
        technicalAptitude: 0,
        businessAcumen: 0
      },
      dailyWorkCapacity: 3,
      currentDay: 1,
      historicalMetrics: {
        totalRevenue: 0,
        completedProjects: 0,
        awardsWon: 0
      }
    },
    unlockedEras: ['analog60s'],
    time: { day: 1, month: 1, year: 1960 },
    achievements: [],
    settings: {
      autoSave: true,
      soundVolume: 80,
      musicVolume: 70,
      notifications: true,
      theme: 'dark',
      reducedMotion: false,
      seenMinigameTutorials: {}
    }
  };
}

let state = createInitialState();

// 1. Initial perk spend
state = upgradePlayerAttribute(state, 'focusMastery');
if (state.playerData.perkPoints !== 2 || state.playerData.attributes.focusMastery !== 1) {
  throw new Error(`Failed basic upgrade: points=${state.playerData.perkPoints}, focusMastery=${state.playerData.attributes.focusMastery}`);
}
if (state.playerData.dailyWorkCapacity !== 4) {
  throw new Error(`Failed dailyWorkCapacity increment: capacity=${state.playerData.dailyWorkCapacity}`);
}
console.log('PASS: Basic upgrade and +1 session delta');

// 2. Spent session preservation (e.g. player worked 2 sessions, dailyWorkCapacity is 2 remaining)
state.playerData.dailyWorkCapacity = 2;
state = upgradePlayerAttribute(state, 'focusMastery');
// Daily work capacity should increase by 1 delta to 3, NOT full refill to (focusMastery + 3 = 5)
if (state.playerData.dailyWorkCapacity !== 3) {
  throw new Error(`Spent sessions wiped! capacity=${state.playerData.dailyWorkCapacity}, expected 3`);
}
console.log('PASS: Preserved spent work sessions on upgrade');

// 3. spendPerkPoint alias in gameUtils routes through upgradePlayerAttribute
state = spendPerkPoint(state, 'creativeIntuition');
if (state.playerData.perkPoints !== 0 || state.playerData.attributes.creativeIntuition !== 1) {
  throw new Error(`gameUtils.spendPerkPoint failed: points=${state.playerData.perkPoints}`);
}
console.log('PASS: gameUtils.spendPerkPoint converges on upgradePlayerAttribute');

// 4. Zero perk points guard (cannot spend when perkPoints <= 0)
const stateBeforeZeroSpend = state;
state = upgradePlayerAttribute(state, 'technicalAptitude');
if (state !== stateBeforeZeroSpend || state.playerData.perkPoints < 0) {
  throw new Error(`Zero points guard failed: points=${state.playerData.perkPoints}`);
}
console.log('PASS: Cannot spend with 0 perk points');

// 5. Rank cap of 10
state.playerData.perkPoints = 20;
state.playerData.attributes.businessAcumen = 9;
state = upgradePlayerAttribute(state, 'businessAcumen');
if (state.playerData.attributes.businessAcumen !== 10 || state.playerData.perkPoints !== 19) {
  throw new Error(`Failed reaching rank 10: rank=${state.playerData.attributes.businessAcumen}`);
}
// Attempt to exceed cap
state = upgradePlayerAttribute(state, 'businessAcumen');
if (state.playerData.attributes.businessAcumen !== 10 || state.playerData.perkPoints !== 19) {
  throw new Error(`Rank exceeded 10: rank=${state.playerData.attributes.businessAcumen}, points=${state.playerData.perkPoints}`);
}
console.log('PASS: Rank 10 cap strictly enforced without consuming points');

// 6. Invalid attribute guard
const invalidState = upgradePlayerAttribute(state, 'nonExistentAttr' as any);
if (invalidState !== state) {
  throw new Error('Invalid attribute was not rejected');
}
console.log('PASS: Invalid attribute rejected safely');

console.log('All talent & atomicity checks passed.');
