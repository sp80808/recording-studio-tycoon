import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const baseDir = process.cwd();
const juicePath = path.join(baseDir, 'src/utils/confettiJuice.ts');
assert(fs.existsSync(juicePath), 'confettiJuice.ts must exist');

const content = fs.readFileSync(juicePath, 'utf8');
assert(content.includes('triggerMilestoneCelebration'), 'must export triggerMilestoneCelebration');
assert(content.includes('canvas-confetti'), 'must use canvas-confetti');
assert(content.includes('typeof window'), 'must guard against non-browser environments');

console.log('PASS: confetti juice verified');
