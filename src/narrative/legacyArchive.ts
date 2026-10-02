import type { GameState } from '@/types/game';

export interface LegacyArchiveEntry {
  id: string;
  title: string;
  era: string;
  text: string;
  unlockHint: string;
  flags?: readonly string[];
  always?: boolean;
}

/** Optional lore recovered after the campaign; flags make replay choices feel materially different. */
export const LEGACY_ARCHIVE: readonly LegacyArchiveEntry[] = [
  {
    id: 'the-first-room',
    title: 'The First Room',
    era: 'Before the red light',
    text: 'Every studio begins as an argument between rent and possibility. Yours began with one borrowed microphone, a stubborn clock, and a promise that nobody would be rushed through the take.',
    unlockHint: 'Complete the opening act',
    always: true,
  },
  {
    id: 'the-crew-ledger',
    title: 'Names in the margin',
    era: 'The people behind the record',
    text: 'The best rooms are remembered by the names that never appear on the poster: the assistant who caught the hum, the runner who stayed late, the engineer who knew when silence was the arrangement.',
    unlockHint: 'Choose a crew-first outcome',
    flags: ['credited_the_crew', 'gave_crew_time_off', 'offered_profit_share', 'held_the_line'],
  },
  {
    id: 'the-signature-sound',
    title: 'A sound with fingerprints',
    era: 'The room becomes an instrument',
    text: 'A signature is not a preset. It is the trail of decisions made under pressure until artists can recognize the room before anyone says its name.',
    unlockHint: 'Leave a mark on the format',
    flags: ['owned_signature_sound', 'went_stereo', 'defended_mono', 'kept_it_raw'],
  },
  {
    id: 'the-clean-master',
    title: 'Nothing hidden in the waveform',
    era: 'The cost of being trusted',
    text: 'A clean master is more than an untouched file. It is the moment the studio stops asking what it can get away with and starts asking what it can stand behind years later.',
    unlockHint: 'Protect the record when shortcuts appear',
    flags: ['guaranteed_clean_master', 'declined_payola', 'refused_voice_clone', 'published_voice_policy'],
  },
  {
    id: 'the-second-offer',
    title: 'The door that stays open',
    era: 'After the ending',
    text: 'The campaign does not end when the rival leaves. It ends when the next artist walks in and asks whether the legend in the papers still sounds like the room in front of them.',
    unlockHint: 'Finish a campaign',
    flags: ['campaign_completed'],
  },
];

export const getUnlockedLegacyArchive = (state: GameState): LegacyArchiveEntry[] => {
  const flags = state.storylineState?.storyFlags ?? {};
  const campaignComplete = Boolean(state.storylineState?.campaignCompleted);
  return LEGACY_ARCHIVE.filter((entry) => {
    if (entry.always) return true;
    if (entry.id === 'the-second-offer') return campaignComplete;
    return entry.flags?.some((flag) => Boolean(flags[flag])) ?? false;
  });
};

export const getReplayRoutes = (state: GameState): Array<{ label: string; detail: string; chosen: boolean }> => {
  const history = state.storylineState?.branchHistory ?? [];
  const chosenIds = new Set(history.map((record) => record.chosenOptionId));
  return [
    { label: 'Protect the room', detail: 'A slower, cleaner route through the pressure points.', chosen: [...chosenIds].some((id) => id.includes('protect') || id.includes('clean') || id.includes('hold')) },
    { label: 'Chase the moment', detail: 'Bigger swings, brighter lights, sharper consequences.', chosen: [...chosenIds].some((id) => id.includes('commercial') || id.includes('spotlight') || id.includes('offer')) },
    { label: 'Write your own history', detail: 'Start in another era or with another producer origin.', chosen: false },
  ];
};

export const getArchiveProgress = (state: GameState): { unlocked: number; total: number } => ({
  unlocked: getUnlockedLegacyArchive(state).length,
  total: LEGACY_ARCHIVE.length,
});

export const legacyArchiveForTest = { LEGACY_ARCHIVE, getUnlockedLegacyArchive, getReplayRoutes, getArchiveProgress };
