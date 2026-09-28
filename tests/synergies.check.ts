import {
  evaluateProjectSynergies,
  calculateSynergyBonuses,
  recordDiscoveredSynergies,
  getProjectRoomType
} from '../src/utils/synergyUtils';
import { STUDIO_SYNERGIES } from '../src/data/synergies';
import type { GameState, Project, StaffMember, Equipment, StudioRoom } from '../src/types/game';

let passed = 0;
const ok = (cond: boolean, msg: string): void => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

const mockRooms: StudioRoom[] = [
  {
    id: 'studio-a',
    name: 'Studio A',
    type: 'project-studio',
    unlocked: true,
    level: 1,
    purchaseCost: 0,
    requiredPlayerLevel: 1,
    supportedStageKinds: ['general', 'tracking', 'production', 'mixing', 'mastering'],
    qualityBonus: 0,
    speedBonus: 0
  },
  {
    id: 'vocal-suite',
    name: 'Vocal Suite',
    type: 'vocal-suite',
    unlocked: true,
    level: 1,
    purchaseCost: 1800,
    requiredPlayerLevel: 3,
    supportedStageKinds: ['tracking', 'production'],
    qualityBonus: 4,
    speedBonus: 2
  },
  {
    id: 'live-room',
    name: 'Live Room',
    type: 'live-room',
    unlocked: true,
    level: 1,
    purchaseCost: 5200,
    requiredPlayerLevel: 5,
    supportedStageKinds: ['tracking', 'production'],
    qualityBonus: 6,
    speedBonus: 3
  }
];

function buildMockState(overrides: Partial<GameState> = {}): GameState {
  return {
    studioRooms: mockRooms,
    ownedEquipment: [],
    hiredStaff: [],
    clientRelationships: {},
    discoveredSynergies: [],
    ...overrides
  } as unknown as GameState;
}

function buildMockProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'proj-1',
    title: 'Test Song',
    genre: 'Pop',
    clientType: 'Band',
    difficulty: 3,
    durationDaysTotal: 3,
    payoutBase: 500,
    repGainBase: 5,
    requiredSkills: {},
    stages: [],
    matchRating: 'Good',
    accumulatedCPoints: 0,
    accumulatedTPoints: 0,
    currentStageIndex: 0,
    completedStages: [],
    workSessionCount: 0,
    focusAllocation: { performance: 33, soundCapture: 33, layering: 34 },
    ...overrides
  };
}

// 1. Check catalog size
ok(STUDIO_SYNERGIES.length >= 20, `Catalog contains ${STUDIO_SYNERGIES.length} authored synergies (expected >= 20)`);

// 2. Room helper lookup
const pStudioA = buildMockProject({ bookingRoomId: 'studio-a' });
const pVocal = buildMockProject({ bookingRoomId: 'vocal-suite' });
const stateRooms = buildMockState();
ok(getProjectRoomType(pStudioA, stateRooms) === 'project-studio', 'Maps studio-a to project-studio');
ok(getProjectRoomType(pVocal, stateRooms) === 'vocal-suite', 'Maps vocal-suite to vocal-suite');

// 3. Negative check: Empty state yields zero synergies
const emptySynergies = evaluateProjectSynergies(pStudioA, stateRooms);
ok(emptySynergies.length === 0, 'No synergies when criteria not met');

// 4. Positive check: Vocal Chain triggers with vocal suite + mic + producer
const micEquip: Equipment = {
  id: 'u87_mic',
  name: 'Condenser Mic',
  category: 'microphone',
  price: 1000,
  description: 'Pro mic',
  bonuses: { qualityBonus: 5 },
  icon: '🎤',
  condition: 100
};

const producerStaff: StaffMember = {
  id: 'staff-1',
  name: 'Maya Producer',
  role: 'Producer',
  assignedProjectId: 'proj-vocal',
  primaryStats: { creativity: 25, technical: 15, speed: 10 },
  xpInRole: 0,
  levelInRole: 1,
  genreAffinity: null,
  skills: {} as any,
  energy: 100,
  mood: 100,
  salary: 100,
  hireDate: 1,
  status: 'Working'
};

const vocalProject = buildMockProject({
  id: 'proj-vocal',
  bookingRoomId: 'vocal-suite',
  genre: 'Pop'
});

const vocalState = buildMockState({
  ownedEquipment: [micEquip],
  hiredStaff: [producerStaff]
});

const vocalActiveSynergies = evaluateProjectSynergies(vocalProject, vocalState);
ok(
  vocalActiveSynergies.some(s => s.id === 'vocal_chain'),
  'Vocal Chain activates with Vocal Suite + Microphone + Producer'
);

// 5. Positive check: Producer’s Touch triggers with Pop + Producer with Creativity >= 20
ok(
  vocalActiveSynergies.some(s => s.id === 'producers_touch'),
  'Producer’s Touch activates with Pop + Producer with Creativity >= 20'
);

// 6. Negative check: Vocal Chain fails if in Studio A
const studioAProject = buildMockProject({
  id: 'proj-vocal',
  bookingRoomId: 'studio-a',
  genre: 'Pop'
});
const studioASynergies = evaluateProjectSynergies(studioAProject, vocalState);
ok(
  !studioASynergies.some(s => s.id === 'vocal_chain'),
  'Vocal Chain does NOT activate in Studio A (requires vocal-suite)'
);

// 7. Client relationship synergy: Trusted Pair
const loyalClientProject = buildMockProject({
  id: 'proj-loyal',
  clientId: 'client-1'
});
const clientState = buildMockState({
  hiredStaff: [producerStaff],
  clientRelationships: {
    'client-1': {
      clientId: 'client-1',
      clientName: 'The Legends',
      primaryGenre: 'Rock',
      relationshipXp: 500,
      tier: 'Loyal',
      sessionsCompleted: 5,
      lastSessionDay: 10,
      bestQualityScore: 85,
      referralCount: 2
    }
  }
});
const loyalStaff: StaffMember = { ...producerStaff, assignedProjectId: 'proj-loyal' };
clientState.hiredStaff = [loyalStaff];
const loyalSynergies = evaluateProjectSynergies(loyalClientProject, clientState);
ok(
  loyalSynergies.some(s => s.id === 'trusted_pair'),
  'Trusted Pair activates for Loyal client with assigned staff'
);

// 8. Bounded bonus aggregation & capping
const multiSynergies = STUDIO_SYNERGIES.slice(0, 10);
const bonuses = calculateSynergyBonuses(multiSynergies);
ok(bonuses.creativityMultiplier <= 1.6, `Creativity multiplier bounded: ${bonuses.creativityMultiplier} <= 1.6`);
ok(bonuses.technicalMultiplier <= 1.6, `Technical multiplier bounded: ${bonuses.technicalMultiplier} <= 1.6`);
ok(bonuses.workUnitSpeedMultiplier <= 1.5, `Work speed multiplier bounded: ${bonuses.workUnitSpeedMultiplier} <= 1.5`);
ok(bonuses.reviewQualityBonus <= 12, `Quality bonus bounded: ${bonuses.reviewQualityBonus} <= 12`);
ok(bonuses.staffXpMultiplier <= 1.8, `Staff XP multiplier bounded: ${bonuses.staffXpMultiplier} <= 1.8`);

// 9. Discovery tracking
const firstBatch = [STUDIO_SYNERGIES[0], STUDIO_SYNERGIES[1]];
const res1 = recordDiscoveredSynergies([], firstBatch);
ok(res1.newlyDiscovered.length === 2, 'Detects 2 brand new discoveries');
ok(res1.updatedDiscovered.length === 2, 'Updates discovered list to 2 items');

// Calling again with the same batch produces 0 new discoveries (idempotent)
const res2 = recordDiscoveredSynergies(res1.updatedDiscovered, firstBatch);
ok(res2.newlyDiscovered.length === 0, 'No duplicate discoveries on repeated run');
ok(res2.updatedDiscovered.length === 2, 'Discovered list unchanged');

// Adding a third synergy identifies only the new one
const thirdBatch = [STUDIO_SYNERGIES[0], STUDIO_SYNERGIES[2]];
const res3 = recordDiscoveredSynergies(res2.updatedDiscovered, thirdBatch);
ok(res3.newlyDiscovered.length === 1 && res3.newlyDiscovered[0].id === STUDIO_SYNERGIES[2].id, 'Detects only the 3rd synergy as new');
ok(res3.updatedDiscovered.length === 3, 'Discovered set now contains 3 items');

console.log(`\nAll ${passed} Studio Synergy checks passed successfully!`);
