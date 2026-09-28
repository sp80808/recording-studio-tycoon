import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const baseDir = process.cwd();
const beatMakingPath = path.join(baseDir, 'src/components/minigames/BeatMakingGame.tsx');
const mixingBoardPath = path.join(baseDir, 'src/components/minigames/MixingBoardGame.tsx');
const tapeSplicingPath = path.join(baseDir, 'src/components/minigames/TapeSplicingGame.tsx');

// Check BeatMakingGame uses Tone.js Transport or Draw for drift-free timing
const beatContent = fs.readFileSync(beatMakingPath, 'utf8');
assert(beatContent.includes('Tone') || beatContent.includes('getTransport'), 'BeatMakingGame must integrate Tone.js timing');
assert(beatContent.includes('playTactileClick'), 'BeatMakingGame must use tactile click feedback');

// Check MixingBoardGame has celebration juice on perfect mix
const mixContent = fs.readFileSync(mixingBoardPath, 'utf8');
assert(mixContent.includes('triggerMilestoneCelebration') || mixContent.includes('triggerProjectCompleteJuice'), 'MixingBoardGame must integrate celebration juice');

// Check TapeSplicingGame has tactile audio feedback
const tapeContent = fs.readFileSync(tapeSplicingPath, 'utf8');
assert(tapeContent.includes('gameAudio'), 'TapeSplicingGame must use gameAudio');
assert(tapeContent.includes('playTactileClick') || tapeContent.includes('playGearSwitch'), 'TapeSplicingGame must use tactile audio feedback');

console.log('PASS: minigames audio and juice enhancements verified');
