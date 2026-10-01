import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  CLOCK_MINUTES_PER_REAL_SECOND,
  getDaynessFromClockMinutes,
  getStudioClockMinutes,
  getWallClockTime,
  STUDIO_DAY_MINUTES,
} from '../src/components/studio/studioDecorConfig';
import {
  ACCESSORIES,
  BOTTOM_STYLES,
  CHARACTER_PRESETS,
  FACINGS,
  HAIR_STYLES,
  POSES,
  TOP_STYLES,
  facingTowards,
  getLayers,
  getPresetLook,
} from '../src/components/studio/characters';

const studioDir = path.join(process.cwd(), 'public', 'assets', 'studio');

describe('studio clock', () => {
  // Ported to the shared wall-clock stream (getStudioClockMinutes/getWallClockTime):
  // 4 in-game minutes per real second, so one in-game hour drifts by 15 real seconds.
  it('keeps a calm pace on the shared clock', () => {
    const minutesAfter30s = getStudioClockMinutes(0, 30);
    assert.equal(minutesAfter30s, 30 * CLOCK_MINUTES_PER_REAL_SECOND);
    assert.equal(getStudioClockMinutes(0, 15) % 60, 0, 'one in-game hour every 15 real seconds');
    assert.ok(Number.isInteger(minutesAfter30s), 'clock advances in whole minutes');
  });

  it('ticks whole minutes, at most two per second', () => {
    let last = getStudioClockMinutes(0, 0);
    for (let t = 0.05; t < 60; t += 0.05) {
      const now = getStudioClockMinutes(0, t);
      assert.ok(Number.isInteger(now));
      const steps = now - last;
      assert.ok(steps <= 1, `minute jumped by ${steps} at t=${t}`);
      last = now;
    }
  });

  it('wraps after one day and keeps dayness in 0..1', () => {
    const daySeconds = STUDIO_DAY_MINUTES / CLOCK_MINUTES_PER_REAL_SECOND;
    const a = getWallClockTime(0, 1);
    const b = getWallClockTime(0, 1 + daySeconds);
    assert.equal(a.minutesOfDay, b.minutesOfDay);
    for (let t = 0; t <= daySeconds; t += 7) {
      const d = getDaynessFromClockMinutes(getStudioClockMinutes(0, t));
      assert.ok(d >= 0 && d <= 1);
    }
  });

  it('is bright in the afternoon and dark at night, following the clock', () => {
    const at = (hour: number) => getDaynessFromClockMinutes(hour * 60);
    assert.ok(at(13) > 0.95, '13:00 is full daylight');
    assert.ok(at(1) < 0.05, '01:00 is deepest night');
    assert.ok(at(9) > at(3), 'morning brighter than the small hours');
  });
});

describe('studio sprites', () => {
  it('ships every console tier with fader and meter anchors', () => {
    const data = JSON.parse(fs.readFileSync(path.join(studioDir, 'console.json'), 'utf8'));
    const channels = [4, 8, 12, 16, 20];
    for (let tier = 1; tier <= 5; tier++) {
      assert.ok(fs.existsSync(path.join(studioDir, `console_t${tier}.png`)), `console_t${tier}.png`);
      assert.equal(data.tiers[String(tier)].faders.length, channels[tier - 1]);
      assert.equal(data.tiers[String(tier)].meters.length, Math.min(channels[tier - 1], 12));
    }
  });

  it('ships the booth and clock art', () => {
    for (const f of ['booth_back.png', 'booth_front.png', 'clock_face.png']) {
      assert.ok(fs.existsSync(path.join(studioDir, f)), f);
    }
  });

  it('has a rendered PNG for every character layer, facing and pose', () => {
    const looks = [...CHARACTER_PRESETS];
    // Every style the game can name must exist on disk, not just the presets.
    const layers = new Set<string>(['skin', 'face', 'shoes']);
    TOP_STYLES.forEach((s) => layers.add(`top_${s}`));
    BOTTOM_STYLES.forEach((s) => layers.add(`bottom_${s}`));
    HAIR_STYLES.filter((s) => s !== 'none').forEach((s) => layers.add(`hair_${s}`));
    ACCESSORIES.forEach((s) => layers.add(`acc_${s}`));
    for (const look of looks) getLayers(look).forEach((l) => assert.ok(layers.has(l.layer), l.layer));
    for (const layer of layers) {
      for (const f of FACINGS) {
        for (const p of POSES) {
          assert.ok(fs.existsSync(path.join(studioDir, 'characters', `${layer}_${f}_${p}.png`)), `${layer}_${f}_${p}`);
        }
      }
    }
  });

  it('gives crew distinct looks and recolours headphones to the era accent', () => {
    const skins = new Set(CHARACTER_PRESETS.map((l) => `${l.skin}|${l.hair.style}|${l.top.style}`));
    assert.equal(skins.size, CHARACTER_PRESETS.length);
    const look = getPresetLook(0, 0x123456);
    assert.equal(look.accessories.find((a) => a.kind === 'headphones')?.color, 0x123456);
    assert.equal(getPresetLook(CHARACTER_PRESETS.length).skin, CHARACTER_PRESETS[0].skin);
  });

  it('faces characters towards the point of interest', () => {
    assert.equal(facingTowards({ x: 0, y: 0 }, { x: 3, y: 1 }), 'se');
    assert.equal(facingTowards({ x: 0, y: 0 }, { x: -3, y: 1 }), 'nw');
    assert.equal(facingTowards({ x: 0, y: 0 }, { x: 1, y: 4 }), 'sw');
    assert.equal(facingTowards({ x: 0, y: 0 }, { x: 1, y: -4 }), 'ne');
  });
});
