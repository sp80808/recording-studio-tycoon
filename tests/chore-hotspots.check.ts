import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import {
  createInitialChoreState,
  findPendingChoreForHotspot,
  getChoreCanonicalHotspot,
  AUTHORED_CHORES,
} from '../src/simulation/choreEngine';

console.log('Testing Chore Hotspot Mapping...');

const state = createInitialChoreState();
const chores = Object.values(state.chores);

const consoleChores = chores.filter(c => c.hotspotId === 'console');
const shelfChores = chores.filter(c => c.hotspotId === 'shelf');
const liveroomChores = chores.filter(c => c.hotspotId === 'liveRoom');

assert(consoleChores.length >= 2, 'Console should have tape and calibration chores');
assert(shelfChores.length >= 1, 'Shelf/lounge should have coffee/hospitality chore');
assert(liveroomChores.length >= 1, 'Liveroom should have acoustic chore');

assert.equal(AUTHORED_CHORES.tune_acoustics.hotspotId, 'liveRoom');
assert.equal(getChoreCanonicalHotspot(state.chores.tune_acoustics), 'liveRoom');
assert.equal(findPendingChoreForHotspot(state, 'liveRoom')?.id, 'tune_acoustics');
assert.equal(findPendingChoreForHotspot(state, 'liveroom')?.id, 'tune_acoustics', 'legacy liveroom id still resolves');
assert.equal(findPendingChoreForHotspot(state, 'console')?.hotspotId, 'console');
assert.equal(findPendingChoreForHotspot(state, 'shelf')?.id, 'brew_espresso');

// Older saves may keep a stale hotspotId — authored mapping still wins.
const legacyState = createInitialChoreState();
(legacyState.chores.tune_acoustics as { hotspotId: string }).hotspotId = 'liveroom';
assert.equal(getChoreCanonicalHotspot(legacyState.chores.tune_acoustics), 'liveRoom');
assert.equal(findPendingChoreForHotspot(legacyState, 'liveRoom')?.id, 'tune_acoustics');

const roomSrc = readFileSync('src/components/StudioRoom.tsx', 'utf8');
assert.ok(roomSrc.includes('ChoreHotspotButton'), 'StudioRoom uses shared ChoreHotspotButton');
assert.ok(roomSrc.includes('findPendingChoreForHotspot'), 'StudioRoom resolves chores via canonical helper');
assert.doesNotMatch(roomSrc, /StudioStampChip/, 'floor chore badges are no longer raw stamp chips');

const btnSrc = readFileSync('src/components/chores/ChoreHotspotButton.tsx', 'utf8');
assert.ok(btnSrc.includes('rst-chore-btn'), 'hybrid button uses rst-chore-btn chrome');
assert.ok(btnSrc.includes('working'), 'hybrid button supports working/progress state');

const theme = readFileSync('src/styles/studio-theme.css', 'utf8');
assert.ok(theme.includes('.rst-chore-btn {'), 'theme defines hybrid chore button');
assert.doesNotMatch(
  theme.slice(theme.indexOf('.rst-chore-btn {'), theme.indexOf('.rst-chore-btn--brass')),
  /gradient/,
  'hybrid chore button stays flat (no gradient fill)'
);

console.log('chore-hotspots: all checks passed');
