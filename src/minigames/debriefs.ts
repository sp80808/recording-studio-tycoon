/**
 * debriefs.ts
 * Pure "what actually went wrong" debriefs for Gain Staging, EQ Match, Phase Check and Chain Recall.
 * Each function reads the finished result data and returns at most two short lines in plain engineer
 * language, as i18n keys with English fallbacks plus interpolation vars. `renderDebrief` resolves them
 * through `tc`. No DOM, no randomness: the same result always gives the same debrief.
 */
import { tc } from '@/i18n/content';
import { checkTake, peaks, CLIP_DB, NOISE_FLOOR_DB, TARGET_MIN, STAGE_LABELS, type GainState } from './gainStaging';
import { fullness, IN_PHASE, minFlips, type PhaseState } from './phaseCheck';
import type { ChainRecallState } from './chainRecall';

export interface DebriefLine {
  /** Stable i18n key under mg.debrief.* */
  key: string;
  /** English fallback, with {{var}} placeholders. */
  en: string;
  vars?: Record<string, string | number>;
}

const MAX_LINES = 2;
const sig = (n: number) => (n > 0 ? `+${n}` : `${n}`);

export const renderDebrief = (lines: readonly DebriefLine[]): string[] => lines.map((l) => tc(l.key, l.en, l.vars));

/** Gain Staging: the worst committed take, named by stage and by dB. */
export function debriefGainStaging(state: GainState): DebriefLine[] {
  const out: DebriefLine[] = [];
  const takes = state.takes.map((t, i) => ({ t, n: i + 1 })).filter(({ t }) => t.committed);

  // Worst clip first: it is the loudest mistake.
  let worstClip: { n: number; stage: number; over: number } | null = null;
  for (const { t, n } of takes) {
    const p = peaks(t.source, t.gains);
    const stage = p.findIndex((x) => x > CLIP_DB);
    if (stage < 0) continue;
    const over = Math.round(Math.max(...p) - CLIP_DB);
    if (!worstClip || over > worstClip.over) worstClip = { n, stage, over };
  }
  if (worstClip) {
    out.push({
      key: 'mg.debrief.gain.clipped',
      en: 'Take {{n}} peaked {{db}} dB hot at the {{stage}}, so everything after it clipped. Pull that stage back before the next one adds more.',
      vars: { n: worstClip.n, db: worstClip.over, stage: STAGE_LABELS[worstClip.stage].toLowerCase() },
    });
  }

  const noisy = takes.find(({ t }) => checkTake(t).noisy);
  if (noisy) {
    const pre = peaks(noisy.t.source, noisy.t.gains)[0];
    out.push({
      key: 'mg.debrief.gain.noisy',
      en: 'Take {{n}} left the preamp at {{db}} dBFS, {{gap}} dB under where it should sit, so the fader had to lift the noise floor with it.',
      vars: { n: noisy.n, db: Math.round(pre), gap: Math.round(NOISE_FLOOR_DB - pre) },
    });
  }

  if (!out.length) {
    const off = takes.find(({ t }) => !checkTake(t).inWindow);
    if (off) {
      const c = checkTake(off.t);
      const low = c.final < TARGET_MIN;
      out.push({
        key: low ? 'mg.debrief.gain.low' : 'mg.debrief.gain.high',
        en: low
          ? 'Take {{n}} printed {{db}} dB too quiet. Clean, but the mix will have to make it up later.'
          : 'Take {{n}} printed {{db}} dB too hot for the print window. Nothing clipped, but there is no headroom left.',
        vars: { n: off.n, db: Math.round(c.distance) },
      });
    }
  }
  return out.slice(0, MAX_LINES);
}

const EQ_REGIONS = [
  { en: 'low end' },
  { en: 'low mids' },
  { en: 'midrange' },
  { en: 'top end' },
] as const;

/** EQ Match: the band furthest from the reference, in words a mix engineer would use. */
export function debriefEQMatch(targets: readonly number[], values: readonly number[]): DebriefLine[] {
  const diffs = targets
    .map((t, i) => ({ i, delta: Math.round((values[i] ?? 0) - t), target: t }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.i - b.i);
  const worst = diffs[0];
  if (!worst || Math.abs(worst.delta) < 2) return [];
  const region = EQ_REGIONS[worst.i] ?? { en: 'band' };
  const boosted = worst.delta > 0;
  const lines: DebriefLine[] = [{
    key: boosted ? 'mg.debrief.eq.too_much' : 'mg.debrief.eq.too_little',
    en: boosted
      ? 'The {{region}} ended {{db}} dB too much. The reference sits at {{target}} dB there.'
      : 'The {{region}} ended {{db}} dB short. The reference sits at {{target}} dB there.',
    vars: { region: region.en, db: Math.abs(worst.delta), target: sig(worst.target) },
  }];
  const second = diffs[1];
  if (second && Math.abs(second.delta) >= 4 && EQ_REGIONS[second.i]) {
    lines.push({
      key: second.delta > 0 ? 'mg.debrief.eq.also_high' : 'mg.debrief.eq.also_low',
      en: second.delta > 0 ? 'The {{region}} was also {{db}} dB high.' : 'The {{region}} was also {{db}} dB low.',
      vars: { region: EQ_REGIONS[second.i].en, db: Math.abs(second.delta) },
    });
  }
  return lines.slice(0, MAX_LINES);
}

/** Phase Check: which mics were still fighting the rest of the kit, and how thin the sum went. */
export function debriefPhaseCheck(state: PhaseState): DebriefLine[] {
  const out: DebriefLine[] = [];
  const kits = state.kits.map((k, i) => ({ k, n: i + 1 })).filter(({ k }) => k.committed);
  const bad = kits.filter(({ k }) => fullness(k) < IN_PHASE).sort((a, b) => fullness(a.k) - fullness(b.k))[0];
  if (bad) {
    const sgn = (c: { invertedAtSource: boolean; flipped: boolean }) => (c.invertedAtSource !== c.flipped ? -1 : 1);
    const sum = bad.k.channels.reduce((n, c) => n + sgn(c) * c.weight, 0);
    const majority = sum >= 0 ? 1 : -1;
    const culprits = bad.k.channels.filter((c) => sgn(c) !== majority).map((c) => c.label);
    out.push({
      key: 'mg.debrief.phase.thin',
      en: 'Kit {{n}} went out with {{mics}} still out of polarity, so the mono sum only reached {{pct}}% and the low end thinned out.',
      vars: { n: bad.n, mics: culprits.join(' and '), pct: Math.round(fullness(bad.k) * 100) },
    });
  }
  const wasteful = kits.find(({ k }) => k.flips > minFlips(k) + 2);
  if (wasteful) {
    out.push({
      key: 'mg.debrief.phase.flips',
      en: 'Kit {{n}} took {{flips}} flips where {{min}} would do. A listen shows which mic disagrees with the first channel before you touch a switch.',
      vars: { n: wasteful.n, flips: wasteful.k.flips, min: minFlips(wasteful.k) },
    });
  }
  return out.slice(0, MAX_LINES);
}

/** Chain Recall: the stage where the chain broke and what should have come next. */
export function debriefChainRecall(state: ChainRecallState): DebriefLine[] {
  const out: DebriefLine[] = [];
  const label = (id: string | undefined) => state.rack.find((r) => r.id === id)?.label ?? '';
  if (!state.won && state.phase === 'done') {
    const at = Math.min(state.inputIndex, state.sequence.length - 1);
    const expected = label(state.sequence[at]);
    if (at === 0) {
      out.push({
        key: 'mg.debrief.chain.lost_first',
        en: 'The chain broke at the very first stage. The signal starts at the {{expected}}.',
        vars: { expected },
      });
    } else {
      out.push({
        key: 'mg.debrief.chain.lost',
        en: 'The chain broke at stage {{stage}}. After the {{prev}} the signal goes to the {{expected}}, not somewhere else on the rack.',
        vars: { stage: at + 1, prev: label(state.sequence[at - 1]), expected },
      });
    }
  } else if (state.strikes > 0) {
    out.push({
      key: 'mg.debrief.chain.slips',
      en: 'Got there, but with {{n}} wrong tap(s) along the way. Say the path out loud as it lights.',
      vars: { n: state.strikes },
    });
  }
  if (state.replays > 0 && out.length < MAX_LINES) {
    out.push({
      key: 'mg.debrief.chain.replays',
      en: 'You leaned on the replay {{n}} time(s). Hum each pad pitch to lock the order in.',
      vars: { n: state.replays },
    });
  }
  return out.slice(0, MAX_LINES);
}
