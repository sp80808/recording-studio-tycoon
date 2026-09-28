import assert from 'node:assert/strict';
import type { GameState } from '../src/types/game';
import { getFirstSessionGuideStep } from '../src/utils/firstSessionGuide';
const state = {
  activeProject: null, ownedEquipment: [{ id: 'basic_mic' }, { id: 'basic_monitors' }],
  hiredStaff: [], ownedUpgrades: [], financials: { reports: [], income: 0 },
} as unknown as GameState;
assert.equal(getFirstSessionGuideStep(state), 'book');
const booked = { ...state, activeProject: { stages: [{ workUnitsCompleted: 0, completed: false }] } } as GameState;
assert.equal(getFirstSessionGuideStep(booked), 'work');
const working = { ...booked, activeProject: { ...booked.activeProject!, stages: [{ workUnitsCompleted: 1, completed: false }] } } as GameState;
assert.equal(getFirstSessionGuideStep(working), 'deliver');
assert.equal(getFirstSessionGuideStep({ ...booked, activeProject: { ...booked.activeProject!, awaitingReview: true } }), 'deliver');
assert.equal(getFirstSessionGuideStep({ ...state, financials: { ...state.financials, income: 100 } }), 'book', 'non-session income must not skip onboarding');
const paid = { ...state, financials: { ...state.financials, reports: [{}] } } as GameState;
assert.equal(getFirstSessionGuideStep(paid), 'reinvest');
assert.equal(getFirstSessionGuideStep({ ...paid, ownedEquipment: [{ id: 'upgrade' }] } as GameState), 'complete');
assert.equal(getFirstSessionGuideStep({ ...paid, hiredStaff: [{}] } as GameState), 'complete');
assert.equal(getFirstSessionGuideStep({ ...state, hiredStaff: [{}] } as GameState), 'book', 'upgrade alone is not a paid session');
console.log('PASS first-session guide: booking, work, review, payout, reinvestment and loaded state');
