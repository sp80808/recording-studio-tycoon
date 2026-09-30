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
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(entry.name)) {
          const src = fs.readFileSync(p, 'utf8');
          if (/new Application\(/.test(src) && !/claimPixiApplication\(/.test(src)) offenders.push(p);
        }
      }
    };
    walk('src');
    assert.deepEqual(offenders, [], 'Pixi Applications must claim the GPU viewport first');
  });
});
