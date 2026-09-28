import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

const baseDir = process.cwd();
const pkgPath = path.join(baseDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

assert(pkg.dependencies && pkg.dependencies['tone'], 'Expected tone to be in dependencies');
assert(pkg.dependencies && pkg.dependencies['canvas-confetti'], 'Expected canvas-confetti to be in dependencies');

const kenneyDir = path.join(baseDir, 'public/audio/ui-sfx/kenney');
assert(fs.existsSync(kenneyDir), 'Expected public/audio/ui-sfx/kenney directory to exist');

const requiredFiles = ['click1.wav', 'click2.wav', 'switch1.wav', 'switch2.wav'];
for (const f of requiredFiles) {
  assert(fs.existsSync(path.join(kenneyDir, f)), `Missing expected Kenney asset: ${f}`);
}

console.log('PASS: tools and assets verified');
