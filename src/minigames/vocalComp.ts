/**
 * vocalComp.ts
 * Pure, seeded logic for the Comp Session mini-game: a lead vocal was tracked several
 * times and the player picks the best take for every line ("comping").
 *
 * Laypeople read the waveforms and plain-language chips. Insiders also weigh the line's
 * mood (a whispered verse wants feel, a big chorus wants time and pitch) and know that
 * hopping between takes on every line makes the comp feel stitched together.
 */
import { createSeededRandom, pickWithRandom, randomInt, type RandomSource } from '@/simulation/seededRandom';
import { tc } from '@/i18n/content';

export const COMP_LINES = 6;
export const COMP_TAKES = 3;
export const WAVE_BARS = 22;

export type CompMood = 'intimate' | 'powerful' | 'playful';
export type CompFlawId = 'cough' | 'pop' | 'dog' | 'sharp';

export const COMP_FLAWS: Record<CompFlawId, { label: string; penalty: number }> = {
  cough: { label: 'Tour-bus cough', penalty: 30 },
  pop: { label: 'Plosive pop', penalty: 22 },
  dog: { label: "Neighbour's dog", penalty: 26 },
  sharp: { label: 'Sharp on the high note', penalty: 18 },
};

const MOOD_WEIGHTS: Record<CompMood, { pitch: number; timing: number; feel: number }> = {
  intimate: { pitch: 0.3, timing: 0.2, feel: 0.5 },
  powerful: { pitch: 0.3, timing: 0.4, feel: 0.3 },
  playful: { pitch: 0.2, timing: 0.4, feel: 0.4 },
};

export const MOOD_LABEL: Record<CompMood, string> = {
  intimate: 'Hushed verse',
  powerful: 'Big chorus',
  playful: 'Cheeky bridge',
};

const LYRICS: Record<CompMood, readonly string[]> = {
  intimate: [
    'Left the porch light on for you',
    'Your coffee went cold on my desk',
    'Two a.m. and the radio knows',
    'I kept the ticket from that night',
  ],
  powerful: [
    'Turn it up, we are not going home',
    'Bigger than this little town',
    'Light the place up, we came to stay',
    'Every seat is on its feet',
  ],
  playful: [
    'I am not lost, it is the scenic route',
    'Sorry I am late, the drummer needed a nap',
    'Nobody asked, but here comes the key change',
    'Take seven was fine, take three was better',
  ],
};

const MOOD_SEQUENCE: readonly CompMood[] = ['intimate', 'intimate', 'powerful', 'playful', 'powerful', 'powerful'];

export interface CompTake {
  /** 1-based take number as it would be labelled on the session sheet. */
  number: number;
  pitch: number;
  timing: number;
  feel: number;
  flaw: CompFlawId | null;
  /** 0..1 bar heights for the mini waveform. */
  wave: number[];
}

export interface CompLine {
  lyric: string;
  mood: CompMood;
  takes: CompTake[];
}

export interface CompSession {
  seed: string | number;
  lines: CompLine[];
}

export interface CompChip {
  label: string;
  tone: 'good' | 'warn' | 'bad';
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const buildWave = (rng: RandomSource, take: Omit<CompTake, 'wave'>): number[] => {
  // Steady timing gives a tidy envelope; shaky timing gives ragged bars.
  const jitter = (100 - take.timing) / 160;
  const body = 0.35 + take.feel / 200;
  const bars = Array.from({ length: WAVE_BARS }, (_, i) => {
    const phrase = Math.sin((i / (WAVE_BARS - 1)) * Math.PI);
    const noise = (rng() - 0.5) * 2 * jitter;
    return clamp(0.18 + phrase * body + noise, 0.08, 1);
  });
  if (take.flaw) {
    bars[randomInt(rng, 3, WAVE_BARS - 4)] = 1;
  }
  return bars;
};

/** Deterministic session: same seed, same lines, same takes. */
export function buildCompSession(
  seed: string | number,
  lineCount: number = COMP_LINES,
  takeCount: number = COMP_TAKES
): CompSession {
  const rng = createSeededRandom(`vocal-comp:${seed}`);
  const lines: CompLine[] = [];

  for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
    const mood = MOOD_SEQUENCE[lineIndex % MOOD_SEQUENCE.length];
    const lyric = pickWithRandom(rng, LYRICS[mood]);
    const takes: CompTake[] = [];

    for (let t = 0; t < takeCount; t++) {
      // Singers warm up: later takes drift slightly better on pitch, earlier takes keep more raw feel.
      const warm = t / Math.max(1, takeCount - 1);
      const base = {
        number: t + 1,
        pitch: clamp(randomInt(rng, 35, 85) + Math.round(warm * 8), 0, 100),
        timing: clamp(randomInt(rng, 35, 90), 0, 100),
        feel: clamp(randomInt(rng, 30, 85) + Math.round((1 - warm) * 8), 0, 100),
        flaw: rng() < 0.22 ? pickWithRandom(rng, Object.keys(COMP_FLAWS) as CompFlawId[]) : (null as CompFlawId | null),
      };
      takes.push({ ...base, wave: buildWave(rng, base) });
    }

    // Every so often the scratch vocal is the magic one. Insiders know the feeling.
    if (rng() < 0.2) {
      const first = takes[0];
      const magic = { ...first, feel: 96, flaw: null as CompFlawId | null };
      takes[0] = { ...magic, wave: buildWave(rng, magic) };
    }

    lines.push({ lyric, mood, takes });
  }

  return { seed, lines };
}

/** 0..100 quality of one take for a line's mood, after flaw penalties. */
export function takeQuality(mood: CompMood, take: CompTake): number {
  const w = MOOD_WEIGHTS[mood];
  const raw = take.pitch * w.pitch + take.timing * w.timing + take.feel * w.feel;
  const penalty = take.flaw ? COMP_FLAWS[take.flaw].penalty : 0;
  return clamp(Math.round(raw - penalty), 0, 100);
}

/** Two plain-language hints (the most extreme traits) plus any flaw. Not the full truth on purpose. */
export function traitChips(take: CompTake): CompChip[] {
  const traits: { key: 'pitch' | 'timing' | 'feel'; value: number }[] = [
    { key: 'pitch', value: take.pitch },
    { key: 'timing', value: take.timing },
    { key: 'feel', value: take.feel },
  ];
  traits.sort((a, b) => Math.abs(b.value - 60) - Math.abs(a.value - 60));

  const words = {
    pitch: { high: tc('mg.vocalComp.chip_in_tune', 'In tune'), low: tc('mg.vocalComp.chip_pitchy', 'Pitchy') },
    timing: { high: tc('mg.vocalComp.chip_tight', 'Tight'), low: tc('mg.vocalComp.chip_rushing', 'Rushing') },
    feel: { high: tc('mg.vocalComp.chip_full_of_feeling', 'Full of feeling'), low: tc('mg.vocalComp.chip_flat_delivery', 'Flat delivery') },
  };

  const chips: CompChip[] = traits.slice(0, 2).map(({ key, value }) => {
    if (value >= 70) return { label: words[key].high, tone: 'good' as const };
    if (value <= 50) return { label: words[key].low, tone: 'bad' as const };
    return { label: key === 'feel' ? tc('mg.vocalComp.chip_decent_feel', 'Decent feel') : key === 'pitch' ? tc('mg.vocalComp.chip_mostly_in_tune', 'Mostly in tune') : tc('mg.vocalComp.chip_mostly_on_grid', 'Mostly on the grid'), tone: 'warn' as const };
  });

  if (take.flaw) chips.push({ label: tc(`mg.vocalComp.flaw_${take.flaw}`, COMP_FLAWS[take.flaw].label), tone: 'bad' });
  return chips;
}

export interface CompScore {
  total: number;
  lineScores: number[];
  bestLineScores: number[];
  switches: number;
  continuityBonus: number;
  verdict: string;
}

const VERDICTS: readonly { min: number; text: string }[] = [
  { min: 900, text: 'Seamless. The singer asks who sang the second verse, then remembers it was them.' },
  { min: 700, text: 'A very good comp. The label will say it was all one take.' },
  { min: 450, text: 'Solid. Nobody will notice the joins unless they are in the room.' },
  { min: 0, text: 'It is a vocal. There is, at least, a vocal.' },
];

/**
 * Score a comp. Picks are take indices (0-based), one per line.
 * 850 points for choosing well (squared, so a bad pick hurts) and up to 150 for a
 * natural-sounding comp with few hops between takes.
 */
export function scoreComp(session: CompSession, picks: number[]): CompScore {
  const lineCount = session.lines.length;
  const lineScores: number[] = [];
  const bestLineScores: number[] = [];
  let ratioSum = 0;

  session.lines.forEach((line, i) => {
    const qualities = line.takes.map((take) => takeQuality(line.mood, take));
    const best = Math.max(...qualities);
    const pick = clamp(picks[i] ?? 0, 0, line.takes.length - 1);
    lineScores.push(qualities[pick]);
    bestLineScores.push(best);
    const ratio = best <= 0 ? 1 : qualities[pick] / best;
    ratioSum += ratio * ratio;
  });

  let switches = 0;
  for (let i = 1; i < lineCount; i++) {
    if (picks[i] !== picks[i - 1]) switches += 1;
  }

  const pickScore = lineCount === 0 ? 0 : (ratioSum / lineCount) * 850;
  const continuityBonus = lineCount <= 1 ? 150 : Math.round(150 * (1 - switches / (lineCount - 1)));
  const total = clamp(Math.round(pickScore + continuityBonus), 0, 1000);
  const verdictEntry = VERDICTS.find((v) => total >= v.min) ?? VERDICTS[VERDICTS.length - 1];
  const verdict = tc(`mg.vocalComp.verdict_${verdictEntry.min}`, verdictEntry.text);

  return { total, lineScores, bestLineScores, switches, continuityBonus, verdict };
}
