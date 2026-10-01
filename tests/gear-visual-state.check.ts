/** #81 gear visual state: mapping, archetypes, conditions, deterministic demo meter, cleanup. */
import assert from 'node:assert';
import fs from 'node:fs';
import {
  GEAR_ARCHETYPES, GEAR_ARCHETYPE_LIST, GEAR_FIDELITY, activityBand, conditionBand,
  conditionVisuals, demoMeterLevel, dimTint, gearConditionKey, shelfConditionStyle,
  toSpriteVisualState,
} from '@/features/gearStudio/gearVisualState';

let passed = 0;
const ok = (c: boolean, m: string) => { assert(c, `FAIL: ${m}`); passed += 1; console.log(`PASS: ${m}`); };

ok(GEAR_ARCHETYPE_LIST.length === 10, 'ten archetypes registered');
ok(GEAR_ARCHETYPE_LIST.every((a) => GEAR_ARCHETYPES[a].primitives.length > 0 && GEAR_ARCHETYPES[a].archetype === a), 'every archetype maps to primitives');

ok(conditionBand(95) === 'pristine' && conditionBand(70) === 'used' && conditionBand(40) === 'worn' && conditionBand(10) === 'failing', 'condition bands');
ok(conditionVisuals(95).scratchOpacity === 0 && !conditionVisuals(95).warningLed, 'pristine has no wear');
ok(conditionVisuals(10).warningLed && conditionVisuals(10).lampFlicker && conditionVisuals(10).meterNoise > conditionVisuals(70).meterNoise, 'failing is noisy with warning LED');

const args = { seed: 'unit-1176', base: 0.5, wobble: 0.1 };
ok(demoMeterLevel({ ...args, timeMs: 5000 }) === demoMeterLevel({ ...args, timeMs: 5000 }), 'demo meter deterministic');
ok(demoMeterLevel({ ...args, timeMs: 5000 }) === demoMeterLevel({ ...args, timeMs: 5100 }), 'demo meter steady within a step');
let inRange = true;
for (let t = 0; t < 60000; t += 250) { const v = demoMeterLevel({ ...args, timeMs: t }); if (v < 0.05 || v > 0.98) inRange = false; }
ok(inRange, 'demo meter stays in range');

ok(activityBand(0) === 'idle' && activityBand(0.5) === 'mid' && activityBand(0.95) === 'peak', 'activity bands');
const base = { powered: true, activity: 0.7, condition: 90 };
ok(toSpriteVisualState('eq1', 'compressor', base).activityBand === 'high', 'sprite state maps activity');
ok(toSpriteVisualState('eq1', 'compressor', { ...base, powered: false }).activityBand === 'idle', 'powered off is idle');
ok(toSpriteVisualState('eq1', 'compressor', base, 'minimal').activityBand === 'idle', 'minimal fidelity is static');
ok(toSpriteVisualState('eq1', 'tape-machine', { ...base, condition: 10 }).warning, 'failing condition raises warning');
ok(JSON.parse(JSON.stringify(toSpriteVisualState('eq1', 'synth', base))).archetype === 'synth', 'sprite state serializable');
ok(GEAR_FIDELITY.minimal.updateHz === 0 && !GEAR_FIDELITY.minimal.animated, 'minimal fidelity stops updates');
ok(GEAR_FIDELITY['living-studio'].updateHz < GEAR_FIDELITY.inspector.updateHz, 'living studio updates slower than inspector');

ok(shelfConditionStyle(95).dim === 1 && !shelfConditionStyle(95).warn, 'pristine shelf face is full brightness');
ok(shelfConditionStyle(70).dim < 1 && !shelfConditionStyle(70).warn, 'used shelf face is slightly dimmed');
ok(shelfConditionStyle(40).dim < shelfConditionStyle(70).dim && !shelfConditionStyle(40).warn, 'worn shelf face is dimmer still');
ok(shelfConditionStyle(10).warn && shelfConditionStyle(10).dim < shelfConditionStyle(40).dim, 'failing shelf face warns');
ok(dimTint(0xffffff, 1) === 0xffffff && dimTint(0xffffff, 0) === 0x000000, 'dimTint spans full to black');
ok(dimTint(0xd9a441, 0.5) < 0xd9a441, 'dimTint darkens tints');
ok(gearConditionKey({ a: 90, b: 88 }) === gearConditionKey({ b: 95, a: 99 }), 'condition key is band-stable and order-free');
ok(gearConditionKey({ a: 90 }) !== gearConditionKey({ a: 10 }), 'condition key changes on band change');
ok(gearConditionKey(undefined) === '' && gearConditionKey(null) === '', 'condition key tolerates absence');

const domain = fs.readFileSync('src/features/gearStudio/gearVisualState.ts', 'utf8');
ok(!/from 'react'|pixi|Math\.random/.test(domain), 'domain module has no React/Pixi/Math.random');
const canvas = fs.readFileSync('src/components/WebGLCanvas.tsx', 'utf8');
ok(canvas.includes('gearConditions') && canvas.includes('shelfConditionStyle'), 'shelf reads authoritative conditions');
ok(canvas.includes('gearConditionKey(state?.gearConditions)'), 'shelf rebuilds on band change only');
const room = fs.readFileSync('src/components/StudioRoom.tsx', 'utf8');
ok(room.includes('gearConditions'), 'floor passes gear conditions into the scene');
const hook = fs.readFileSync('src/features/gearStudio/useDemoMeter.ts', 'utf8');
ok(hook.includes('clearInterval') && hook.includes('removeEventListener') && hook.includes('document.hidden'), 'hook cleans interval/listener and pauses when hidden');
const rack = fs.readFileSync('src/features/gearStudio/InteractiveStudioRackGear.tsx', 'utf8');
ok(!rack.includes('Math.random') && rack.includes('reducedMotion') && rack.includes('./primitives'), 'rack gear uses shared primitives, no random, honours reduced motion');

console.log(`${passed} gear visual checks passed`);
