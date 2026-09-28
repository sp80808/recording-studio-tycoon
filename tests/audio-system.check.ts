import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const baseDir = process.cwd();
const audioSystemPath = path.join(baseDir, 'src/utils/audioSystem.ts');
const content = fs.readFileSync(audioSystemPath, 'utf8');

assert(content.includes('playTactileClick'), 'audioSystem must export playTactileClick');
assert(content.includes('playGearSwitch'), 'audioSystem must export playGearSwitch');
assert(content.includes("from 'tone'") || content.includes('Tone.'), 'audioSystem must integrate Tone.js');
assert(content.includes('ui-tactile-click') || content.includes('kenney/click'), 'audioSystem must preload tactile click');
assert(content.includes('ui-gear-switch') || content.includes('kenney/switch'), 'audioSystem must preload gear switch');

console.log('PASS: audioSystem interfaces verified');
