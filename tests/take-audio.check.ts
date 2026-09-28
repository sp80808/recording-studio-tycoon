import { gameAudio } from '@/utils/audioSystem';

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

ok(typeof (gameAudio as any).playTakeChord === 'function', 'gameAudio has playTakeChord method');
// Safe invocation in headless node environment (should gracefully no-op without browser Web Audio)
try {
  (gameAudio as any).playTakeChord('Rock', 'Gold');
  (gameAudio as any).playTakeChord('Soul', 'Silver');
  (gameAudio as any).playTakeChord('Electronic', 'Solid');
  ok(true, 'playTakeChord executed safely in headless environment');
} catch (e) {
  throw new Error(`playTakeChord threw error: ${e}`);
}

console.log(`take-audio: all ${passed} checks passed`);
