/**
 * Studio history and band-culture flavour for the lore codex and rider-adjacent systems.
 *
 * Flag keys intentionally overlap subplot / creed storyFlags where the same attitude applies
 * (e.g. signed_union_scale, embraced_the_leak) so a riders agent can key off the same vocabulary.
 * Content is append-only; ids are stable.
 */
export interface StudioHistoryEntry {
  id: string;
  name: string;
  foundedBlurb: string;
  eras: readonly string[];
  /** Optional storyFlags that unlock a deeper line in codex UI. */
  unlockFlags?: readonly string[];
  deeperLore?: string;
}

export interface BandAttitude {
  id: string;
  label: string;
  eraHint: string;
  riderFlavour: string;
  /** Shared with subplot / creed flags when present. */
  relatedFlags: readonly string[];
  dialogueHook: string;
}

export const STUDIO_HISTORIES: readonly StudioHistoryEntry[] = [
  {
    id: 'history-marquee-cellar-room',
    name: 'The Cellar Inheritance',
    foundedBlurb:
      'Before it was your room, it was a rehearsal cellar under a jazz club. The brick still remembers brass sections that never went home before dawn.',
    eras: ['analog60s'],
    unlockFlags: ['defended_mono', 'signed_union_scale'],
    deeperLore:
      'Union cards still turn up taped inside the baffle covers. Whoever ran this place before you paid scale — or pretended to.',
  },
  {
    id: 'history-neon-rack-wing',
    name: 'The Neon Rack Wing',
    foundedBlurb:
      'An 80s expansion bolted a second room onto the building for video-era tracking. The carpet has never forgiven the smoke machines.',
    eras: ['digital80s'],
    unlockFlags: ['went_big_eighties', 'kept_it_raw'],
    deeperLore:
      'A faded gate-reverb note is still stuck to the patchbay: “SNARE — SHORT. DO NOT EXTEND.” Someone learned the hard way.',
  },
  {
    id: 'history-dial-up-suite',
    name: 'The Dial-Up Suite',
    foundedBlurb:
      'Early broadband arrived here as a miracle and a curse. Hard disks filled faster than the air conditioning could cope.',
    eras: ['internet2000s'],
    unlockFlags: ['settled_sample_claim', 'embraced_the_leak'],
    deeperLore:
      'The old sample clearance folder is labelled in three different handwritings. Every era leaves paper trails.',
  },
  {
    id: 'history-stream-loft',
    name: 'The Stream Loft',
    foundedBlurb:
      'A mezzanine was converted for livestream sessions and playlist listening parties. The kettle is still the most reliable piece of kit upstairs.',
    eras: ['streaming2020s'],
    unlockFlags: ['declined_payola', 'refused_voice_clone', 'creed_protect_the_take'],
    deeperLore:
      'A printed studio policy on synthetic voices hangs crooked by the stairs — either yours, or a previous tenant’s unfinished argument.',
  },
] as const;

export const BAND_ATTITUDES: readonly BandAttitude[] = [
  {
    id: 'attitude-tape-purists',
    label: 'Tape purists',
    eraHint: 'analog60s',
    riderFlavour: 'No click. Real amps. Tea with milk, not oat. Silence between takes is sacred.',
    relatedFlags: ['defended_mono', 'creed_protect_the_take', 'golden_reel_purity'],
    dialogueHook: 'If you can hear the edit, we already lost.',
  },
  {
    id: 'attitude-arena-glam',
    label: 'Arena glam packs',
    eraHint: 'digital80s',
    riderFlavour: 'Extra tom mics, fog on standby, and a rider clause about “no brown M&Ms” that is absolutely a test.',
    relatedFlags: ['went_big_eighties', 'chose_commercial_scale'],
    dialogueHook: 'Make it sound expensive. Then make it louder.',
  },
  {
    id: 'attitude-scene-kids',
    label: 'Scene kids',
    eraHint: 'internet2000s',
    riderFlavour: 'Pizza, a working toilet, and permission to film everything. Sample clearance is someone else’s problem until it isn’t.',
    relatedFlags: ['embraced_the_leak', 'made_scene_comp', 'open_stem_revolution'],
    dialogueHook: 'If the blog hates it, we did something right.',
  },
  {
    id: 'attitude-stream-natives',
    label: 'Stream natives',
    eraHint: 'streaming2020s',
    riderFlavour: 'Phone mounts at every mic stand, a quiet room for lives, and a hard no on unpaid “exposure” remixes.',
    relatedFlags: ['declined_payola', 'refused_voice_clone', 'published_voice_policy'],
    dialogueHook: 'Hook in fifteen seconds or the algorithm walks.',
  },
  {
    id: 'attitude-session-lifers',
    label: 'Session lifers',
    eraHint: 'any',
    riderFlavour: 'Scale rates, clear call times, and a green room that is not also the cable closet.',
    relatedFlags: ['signed_union_scale', 'vouched_for_scale', 'hosted_union_benefit'],
    dialogueHook: 'Pay us properly and we make you sound like a band.',
  },
] as const;

export const getStudioHistories = (eraId?: string): readonly StudioHistoryEntry[] =>
  eraId ? STUDIO_HISTORIES.filter((h) => h.eras.includes(eraId) || h.eras.length === 0) : STUDIO_HISTORIES;

export const getBandAttitudes = (eraId?: string): readonly BandAttitude[] =>
  eraId
    ? BAND_ATTITUDES.filter((a) => a.eraHint === eraId || a.eraHint === 'any')
    : BAND_ATTITUDES;

/** Attitudes whose relatedFlags intersect the studio’s current storyFlags — useful for riders / inbox tone. */
export const getActiveBandAttitudes = (
  flags: Record<string, boolean | number | string> | undefined,
): BandAttitude[] => {
  if (!flags) return [];
  return BAND_ATTITUDES.filter((a) => a.relatedFlags.some((f) => Boolean(flags[f])));
};

export const getUnlockedStudioHistory = (
  entry: StudioHistoryEntry,
  flags: Record<string, boolean | number | string> | undefined,
): { blurb: string; deeper?: string } => {
  const unlocked = entry.unlockFlags?.some((f) => Boolean(flags?.[f]));
  return {
    blurb: entry.foundedBlurb,
    deeper: unlocked ? entry.deeperLore : undefined,
  };
};
