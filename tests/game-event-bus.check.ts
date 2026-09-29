import assert from 'node:assert';
import { gameEvents, GameEventPayloads } from '../src/engine/gameEventBus';

console.log('Testing Typed Game Event Bus...');

// 1. Basic emit and subscribe
let receivedPayload: GameEventPayloads['project:take_locked'] | null = null;
const unsub = gameEvents.on('project:take_locked', (payload) => {
  receivedPayload = payload;
});

gameEvents.emit('project:take_locked', {
  projectId: 'proj-1',
  grade: 'Gold',
  energyBurned: 2,
  score: 950,
  takeNumber: 3,
});

assert.deepStrictEqual(receivedPayload, {
  projectId: 'proj-1',
  grade: 'Gold',
  energyBurned: 2,
  score: 950,
  takeNumber: 3,
});
console.log('PASS: Event emit delivers typed payload');

// 2. Unsubscribe behavior
unsub();
receivedPayload = null;
gameEvents.emit('project:take_locked', {
  projectId: 'proj-2',
  grade: 'Silver',
  energyBurned: 1,
  score: 750,
  takeNumber: 4,
});
assert.strictEqual(receivedPayload, null, 'Unsubscribed listener should not receive events');
console.log('PASS: Unsubscribe functions accurately');

// 3. Once listener
let onceCount = 0;
gameEvents.once('studio:tier_upgraded', () => {
  onceCount += 1;
});

gameEvents.emit('studio:tier_upgraded', { oldTier: 1, newTier: 2 });
gameEvents.emit('studio:tier_upgraded', { oldTier: 2, newTier: 3 });
assert.strictEqual(onceCount, 1, 'Once listener should only trigger on the first emission');
console.log('PASS: once() triggers exactly once');

console.log('game-event-bus: all checks passed');
