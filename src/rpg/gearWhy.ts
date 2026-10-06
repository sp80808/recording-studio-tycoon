/**
 * "Why does a pro reach for this?" (issue #306, backlog 3). Pure gating + text lookup.
 * The hint is a quiet, optional line on gear; it only appears for a gear category the player
 * has already owned or met the concept for, so it never lectures about gear they have not touched.
 */
import { conceptsForGearCategory } from './audioConcepts';
import { hasMetConcept, type StudioKnowHow } from './studioKnowHow';

export type GearWhyKind =
  | 'compressor' | 'preamp' | 'reverb'
  | 'microphone' | 'monitor' | 'interface' | 'outboard' | 'recorder' | 'mixer';

/** English fallback text; locale content files hold English until translated. */
export const GEAR_WHY_TEXT: Record<GearWhyKind, string> = {
  compressor: 'A compressor evens out loud and quiet moments, so a vocal or drum sits steady in the mix instead of jumping out and vanishing.',
  preamp: 'A preamp lifts a tiny mic signal to a usable level. Set it hot enough to beat noise, but not so hot that it clips, and its tone colors everything after it.',
  reverb: 'Reverb places a sound in a space. A little makes a dry take feel real; a lot pushes it back behind everything else.',
  microphone: 'Where you place a mic changes the sound more than the mic itself. Closer is fuller and drier, farther is airier and roomier.',
  monitor: 'Monitors are your reference. You can only fix what you can hear, and a flat, honest speaker keeps mixes translating to other systems.',
  interface: 'An interface turns analog signal into digital. Healthy gain here keeps takes clean: low enough to avoid clipping, high enough to stay above the noise.',
  outboard: 'Outboard gear shapes tone and dynamics with hardware character. Pros reach for it to add color and control before the mix gets crowded.',
  recorder: 'The recorder is where the signal is captured. Knowing the path into it helps you find where noise or loss creeps in.',
  mixer: 'A mixer blends many sources and sets their levels. Gain staging channel by channel keeps the whole path clean.',
};

/** Which hint kind applies to a piece of gear (name hints refine the broad category). */
export const gearWhyKind = (gear: { id?: string; name?: string; category?: string }): GearWhyKind | null => {
  if (gear.category !== 'outboard' && gear.category !== 'microphone' && gear.category !== 'monitor'
    && gear.category !== 'interface' && gear.category !== 'recorder' && gear.category !== 'mixer') return null;
  if (gear.category === 'outboard') {
    const key = `${gear.id ?? ''} ${gear.name ?? ''}`.toLowerCase();
    if (/compress|limiting|1176|fairchild|dbx/.test(key)) return 'compressor';
    if (/reverb|plate|lexicon/.test(key)) return 'reverb';
    if (/preamp|1073|\bpre\b/.test(key)) return 'preamp';
  }
  return gear.category;
};

/** Unlocked once the player owns gear of this category, or has already met a matching concept. */
export const gearWhyUnlocked = (
  gear: { category?: string },
  ownedCategories: readonly (string | undefined)[],
  kh: StudioKnowHow | undefined,
): boolean => {
  if (!gear.category) return false;
  if (ownedCategories.includes(gear.category)) return true;
  return conceptsForGearCategory(gear.category).some(c => hasMetConcept(kh, c));
};

/** The hint to show, or null while locked / not applicable. */
export const gearWhyHint = (
  gear: { id?: string; name?: string; category?: string },
  ownedCategories: readonly (string | undefined)[],
  kh: StudioKnowHow | undefined,
): { id: string; english: string } | null => {
  const kind = gearWhyKind(gear);
  if (!kind || !gearWhyUnlocked(gear, ownedCategories, kh)) return null;
  return { id: `gear.why.${kind}`, english: GEAR_WHY_TEXT[kind] };
};
