import type { GameState } from '@/types/game';
import {
  applyStudioRoomPurchase,
  createDefaultStudioRooms,
  getStudioRoomPurchaseAvailability
} from '@/utils/studioRoomUtils';

const makeState = (overrides: Partial<GameState> = {}): GameState => ({
  money: 10_000,
  playerData: { level: 8 } as GameState['playerData'],
  studioRooms: createDefaultStudioRooms(),
  ...overrides
} as GameState);

const initial = makeState();
const purchased = applyStudioRoomPurchase(initial, 'vocal-suite', 4);
if (purchased.money !== 8_200 || !purchased.studioRooms.find(room => room.id === 'vocal-suite')?.unlocked) {
  throw new Error('Valid room purchase did not unlock the room and charge its current cost');
}

const repeated = applyStudioRoomPurchase(purchased, 'vocal-suite', 4);
if (repeated !== purchased || repeated.money !== 8_200) {
  throw new Error('Repeated room purchase charged twice');
}

const staleAffordable = makeState({ money: 10_000 });
const latestUnaffordable = { ...staleAffordable, money: 1_000 };
const rejectedForFunds = applyStudioRoomPurchase(latestUnaffordable, 'vocal-suite', 4);
if (rejectedForFunds !== latestUnaffordable || rejectedForFunds.money !== 1_000) {
  throw new Error('Purchase did not validate funds against the latest state');
}

const capped = makeState({
  studioRooms: createDefaultStudioRooms().map(room =>
    room.id === 'vocal-suite' ? { ...room, unlocked: true } : room
  )
});
const rejectedAtLimit = applyStudioRoomPurchase(capped, 'live-room', 2);
if (rejectedAtLimit !== capped || rejectedAtLimit.money !== 10_000) {
  throw new Error('Purchase bypassed the latest expansion limit');
}

const levelExplanation = getStudioRoomPurchaseAvailability(
  makeState({ playerData: { level: 2 } as GameState['playerData'] }),
  'vocal-suite',
  4
);
if (levelExplanation.available || levelExplanation.reason !== 'level') {
  throw new Error('Locked room did not explain its level requirement');
}

const invalid = makeState({ money: Number.NaN });
if (applyStudioRoomPurchase(invalid, 'vocal-suite', 4) !== invalid) {
  throw new Error('Non-finite purchase state was accepted');
}

console.log('PASS: Studio room purchases are atomic, idempotent, and explain unavailable rooms');
