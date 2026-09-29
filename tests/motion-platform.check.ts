import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { motionTokens, motionDuration, motionSpring, motionEasing } from '../src/lib/motion/tokens';
import { resolveMotionCapabilities } from '../src/lib/motion/capabilities';

describe('OriginKit Motion Platform Foundation (#72)', () => {
  it('defines valid motion tokens adhering to tactile hardware standards', () => {
    assert.equal(typeof motionTokens.duration.instant, 'number');
    assert.equal(motionTokens.duration.instant, 0);
    assert.ok(motionTokens.duration.fast < motionTokens.duration.panel);
    assert.ok(motionTokens.duration.panel < motionTokens.duration.cinematic);

    // Spring tokens must specify spring type, positive stiffness and damping
    assert.equal(motionSpring.press.type, 'spring');
    assert.ok(motionSpring.press.stiffness > 100);
    assert.ok(motionSpring.press.damping > 0);
    assert.ok(motionSpring.drawer.stiffness > 100);

    // Easing tokens must have 4 cubic bezier coordinates
    assert.equal(motionEasing.hardware.length, 4);
    assert.equal(motionEasing.settle.length, 4);
  });

  it('correctly derives motion capabilities under varying environments', () => {
    // Standard desktop visible tab
    const normal = resolveMotionCapabilities({
      osReducedMotion: false,
      settingReducedMotion: false,
      graphicsPreset: 'high',
      isTabVisible: true,
      focusMode: false,
    });
    assert.equal(normal.reducedMotion, false);
    assert.equal(normal.decorativeMotion, true);
    assert.equal(normal.particles, true);
    assert.equal(normal.heavyEffects, true);

    // Reduced motion enabled (via OS or setting)
    const reduced = resolveMotionCapabilities({
      osReducedMotion: true,
      settingReducedMotion: false,
      graphicsPreset: 'high',
      isTabVisible: true,
      focusMode: false,
    });
    assert.equal(reduced.reducedMotion, true);
    assert.equal(reduced.decorativeMotion, false);
    assert.equal(reduced.particles, false);
    assert.equal(reduced.heavyEffects, false);
    assert.deepEqual(reduced.filterTransition({ duration: 0.5 }), { duration: 0 });

    // Focus mode suppresses decorative motion and heavy effects
    const focus = resolveMotionCapabilities({
      osReducedMotion: false,
      settingReducedMotion: false,
      graphicsPreset: 'high',
      isTabVisible: true,
      focusMode: true,
    });
    assert.equal(focus.decorativeMotion, false);
    assert.equal(focus.particles, false);
    assert.equal(focus.heavyEffects, false);

    // Background hidden tab suppresses all continuous rendering
    const hidden = resolveMotionCapabilities({
      osReducedMotion: false,
      settingReducedMotion: false,
      graphicsPreset: 'high',
      isTabVisible: false,
      focusMode: false,
    });
    assert.equal(hidden.isTabVisible, false);
    assert.equal(hidden.decorativeMotion, false);
    assert.equal(hidden.particles, false);
    assert.equal(hidden.heavyEffects, false);
  });

  it('verifies docs/ORIGINKIT_INTEGRATION.md exists with required sections', () => {
    const docPath = path.resolve(process.cwd(), 'docs/ORIGINKIT_INTEGRATION.md');
    assert.ok(fs.existsSync(docPath), 'docs/ORIGINKIT_INTEGRATION.md must exist');
    const content = fs.readFileSync(docPath, 'utf8');
    assert.ok(content.includes('Executive Summary & Purpose'));
    assert.ok(content.includes('Architectural Boundaries'));
    assert.ok(content.includes('No Competing WebGL Layer'));
    assert.ok(content.includes('Pilot Component Selection'));
    assert.ok(content.includes('Provenance & Licensing Manifest'));
    assert.ok(content.includes('MagneticPress'));
    assert.ok(content.includes('GlowSweep'));
    assert.ok(content.includes('TextScramble'));
    assert.ok(content.includes('AnalogVignette'));
  });

  it('verifies pilot components exist and do not allocate secondary WebGL contexts', () => {
    const originDir = path.resolve(process.cwd(), 'src/components/motion/origin');
    assert.ok(fs.existsSync(originDir));
    const files = fs.readdirSync(originDir);
    assert.ok(files.includes('MagneticPress.tsx'));
    assert.ok(files.includes('GlowSweep.tsx'));
    assert.ok(files.includes('TextScramble.tsx'));
    assert.ok(files.includes('AnalogVignette.tsx'));
    assert.ok(files.includes('index.ts'));

    // Ensure none of the origin components instantiate a WebGL context or canvas
    for (const file of files) {
      const src = fs.readFileSync(path.join(originDir, file), 'utf8');
      assert.ok(!src.includes("getContext('webgl')"), `${file} must not allocate webgl context`);
      assert.ok(!src.includes("getContext('webgl2')"), `${file} must not allocate webgl2 context`);
    }
  });
});
