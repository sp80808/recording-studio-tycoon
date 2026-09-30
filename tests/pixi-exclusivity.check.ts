import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  claimPixiApplication,
  activePixiOwners,
  PixiExclusivityError,
  STUDIO_FLOOR_OWNER,
} from '../src/lib/motion/pixiGuard';

describe('pixi GPU exclusivity guard', () => {
  it('refuses a second owner while the studio floor holds the claim', () => {
    const release = claimPixiApplication(STUDIO_FLOOR_OWNER);
    assert.throws(() => claimPixiApplication('project-cards-bridge'), PixiExclusivityError);
    release();
    assert.deepEqual(activePixiOwners(), []);
  });

  it('lets the same owner overlap (StrictMode remount) and releases idempotently', () => {
    const a = claimPixiApplication(STUDIO_FLOOR_OWNER);
    const b = claimPixiApplication(STUDIO_FLOOR_OWNER);
    a();
    a();
    assert.deepEqual(activePixiOwners(), [STUDIO_FLOOR_OWNER]);
    b();
    assert.deepEqual(activePixiOwners(), []);
  });

  it('every `new Application` in src is behind the guard', () => {
    for (const file of ['src/components/WebGLCanvas.tsx', 'src/components/PixiProjectCardsBridge.tsx']) {
      assert.match(fs.readFileSync(file, 'utf8'), /claimPixiApplication\(/, `${file} must claim the GPU viewport`);
    }
  });
});
