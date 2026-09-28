import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const baseDir = process.cwd();
const interactionPath = path.join(baseDir, 'src/utils/userInteraction.ts');
const content = fs.readFileSync(interactionPath, 'utf8');

assert(content.includes('userGestureSignal'), 'userInteraction must call userGestureSignal on audioSystem');
assert(!content.includes('ensureInitialized'), 'userInteraction must not attempt to call private ensureInitialized');

console.log('PASS: user gesture unlock correctly wired');
