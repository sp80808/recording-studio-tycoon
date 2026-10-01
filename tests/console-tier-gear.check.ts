/** #81 console tiers 2-5 gear animation: plan, attention budget (#46/#74), state-driven lamps, wiring. */
import assert from 'node:assert';
import fs from 'node:fs';
import {
  CONSOLE_TIER_GEAR, STATUS_LED_HEX, gearAttention, getConsoleTierGear, gearVisualKey, statusLedColor, tubeGlowLevel,
} from '@/features/gearStudio/consoleTierGear';
import { toSpriteVisualState } from '@/features/gearStudio/gearVisualState';
import { reelAnimationSpeed } from '@/features/gearStudio/gearReelMath';

let passed = 0;
const ok = (c: boolean, m: string) => { assert(c, `FAIL: ${m}`); passed += 1; console.log(`PASS: ${m}`); };

for (const t of [1, 2, 3, 4, 5]) ok(getConsoleTierGear(t).tier === t, `tier ${t} has a gear plan`);
ok(getConsoleTierGear(0).tier === 1 && getConsoleTierGear(9).tier === 5 && getConsoleTierGear(2.4).tier === 2, 'tier is clamped');
ok([2, 3, 4, 5].every((t) => CONSOLE_TIER_GEAR[t as 2].reelPairs === 1), 'tiers 2-5 each get a reel pair');
ok(CONSOLE_TIER_GEAR[1].tubes === 0 && CONSOLE_TIER_GEAR[1].statusLeds === 0, 'tier 1 baked machine gets no extra lamps');
ok(CONSOLE_TIER_GEAR[2].tubes > 0 && CONSOLE_TIER_GEAR[3].tubes > 0 && CONSOLE_TIER_GEAR[4].tubes === 0 && CONSOLE_TIER_GEAR[5].tubes === 0, 'valve glow only on valve-era tiers');
ok(CONSOLE_TIER_GEAR[5].statusLeds > CONSOLE_TIER_GEAR[2].statusLeds, 'LED count grows with tier');

// Attention budget: one continuous effect max, zero when calm
const live = { hasActiveProject: true };
ok(gearAttention(live).reelsSpin && gearAttention(live).continuousEffects === 1, 'normal play, session active: reels spin (1 effect)');
ok(!gearAttention({ hasActiveProject: false }).reelsSpin, 'idle: reels parked');
ok(gearAttention({ ...live, focusMode: true }).continuousEffects === 0, 'Focus mode: 0 continuous effects');
ok(gearAttention({ ...live, reducedMotion: true }).continuousEffects === 0, 'reduced motion: 0 continuous effects');
ok(gearAttention({ ...live, hidden: true }).continuousEffects === 0, 'hidden tab: 0 continuous effects');

// State-driven lamps
const base = { powered: true, activity: 0.7, condition: 90, transport: 'play' as const };
const hot = toSpriteVisualState('deck', 'tape-machine', base);
const off = toSpriteVisualState('deck', 'tape-machine', { ...base, powered: false });
const failing = toSpriteVisualState('deck', 'tape-machine', { ...base, condition: 10 });
const peak = toSpriteVisualState('deck', 'tape-machine', { ...base, activity: 0.97, condition: 10 });
ok(tubeGlowLevel(off) === 0, 'powered off: tubes dark');
ok(tubeGlowLevel(hot) > tubeGlowLevel(toSpriteVisualState('deck', 'tape-machine', { ...base, activity: 0.1 })), 'tube glow rises with activity');
ok(tubeGlowLevel(failing) < tubeGlowLevel(hot), 'failing condition dims the glow (static, no flicker timer)');
ok(statusLedColor(hot) === 'green' && statusLedColor(off) === 'off' && statusLedColor(failing) === 'amber' && statusLedColor(peak) === 'red', 'status LED colours map state');
ok(Object.keys(STATUS_LED_HEX).length === 4, 'LED palette covers all colours');

// Reels: tier decks use the same speed contract as tier 1; parked when calm
ok(reelAnimationSpeed(hot, false) > 0 && reelAnimationSpeed(hot, true) === 0, 'reels spin in play, park under reduced motion');
ok(gearVisualKey(hot, gearAttention(live)) === gearVisualKey(hot, gearAttention(live)), 'visual key is stable');
ok(gearVisualKey(hot, gearAttention(live)) !== gearVisualKey(hot, gearAttention({ ...live, focusMode: true })), 'visual key changes when Focus engages');

// Wiring: deck is built for tiers >= 2 with a procedural fallback, driven by the attention budget
const src = fs.readFileSync('src/components/WebGLCanvas.tsx', 'utf8');
ok(src.includes('if (tier >= 2) {') && src.includes('getConsoleTierGear(tier)'), 'scene builds the tier 2-5 deck');
ok(src.includes('} else {\n      deckReels.forEach'), 'procedural ellipse fallback when no renderer');
ok(src.includes('gearAttention(') && src.includes('if (attention.reelsSpin)'), 'ticker only advances reels when the budget allows');
ok(!/gearTubes[^;]*setInterval|setInterval[^;]*gearTubes/.test(src), 'no timers for lamps');

console.log(`console-tier-gear: ${passed} checks passed`);
