import assert from 'node:assert';
import { createInitialChoreState } from '../src/simulation/choreEngine';

console.log('Testing Chore Hotspot Mapping...');

const state = createInitialChoreState();
const chores = Object.values(state.chores);

const consoleChores = chores.filter(c => c.hotspotId === 'console');
const shelfChores = chores.filter(c => c.hotspotId === 'shelf');
const liveroomChores = chores.filter(c => c.hotspotId === 'liveRoom');

assert(consoleChores.length >= 2, 'Console should have tape and calibration chores');
assert(shelfChores.length >= 1, 'Shelf/lounge should have coffee/hospitality chore');
assert(liveroomChores.length >= 1, 'Liveroom should have acoustic chore');

console.log('chore-hotspots: all checks passed');
