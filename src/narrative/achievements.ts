/**
 * Achievements — a pure catalog evaluated on every story tick.
 *
 * Each achievement is a predicate over GameState plus an optional progress readout for the trophy case.
 * Unlocks are stamped with the game day in `state.unlockedAchievements` (id → day) and never revoked, so a later
 * dip in cash or reputation can't take a trophy off the wall. They are prestige, not currency: no payouts, so
 * the economy stays where the balance harness measured it.
 */
import type { GameState, GameNotification } from '@/types/game';
import { toGameEraId } from './rivalCast';

export type AchievementCategory = 'craft' | 'business' | 'studio' | 'story';
export type AchievementTier = 'bronze' | 'silver' | 'gold';

export interface AchievementProgress {
  current: number;
  target: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  /** Lucide icon name resolved by the UI (kept as a string so this module stays UI-free). */
  icon: string;
  /** Hidden achievements show "???" until earned. */
  hidden?: boolean;
  check: (state: GameState) => boolean;
  progress?: (state: GameState) => AchievementProgress;
}

const reports = (s: GameState) => s.financials?.reports ?? [];
const bestQuality = (s: GameState) => reports(s).reduce((m, r) => Math.max(m, r.overallQualityScore ?? 0), 0);
const flagOf = (s: GameState, key: string) => Boolean(s.storylineState?.storyFlags?.[key]);
const anyFlagStartingWith = (s: GameState, prefix: string) =>
  Object.keys(s.storylineState?.storyFlags ?? {}).some((k) => k.startsWith(prefix));
const rooms = (s: GameState) => s.studioRooms?.filter((r) => r.unlocked).length ?? 0;
const genreCounts = (s: GameState): Record<string, number> =>
  reports(s).reduce<Record<string, number>>((acc, r) => {
    const g = (r.genre || '').trim();
    if (g) acc[g] = (acc[g] ?? 0) + 1;
    return acc;
  }, {});

const count = (target: number, current: (s: GameState) => number) => ({
  check: (s: GameState) => current(s) >= target,
  progress: (s: GameState): AchievementProgress => ({ current: Math.min(target, current(s)), target }),
});

/** Longest run of consecutive reports at or above `min`. */
const longestStreak = (s: GameState, min: number): number => {
  let best = 0;
  let run = 0;
  for (const r of reports(s)) {
    run = (r.overallQualityScore ?? 0) >= min ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
};

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  // ─────────── Craft ───────────
  { id: 'first_cut', title: 'First Cut', description: 'Deliver your first finished session.', category: 'craft', tier: 'bronze', icon: 'Disc3', ...count(1, (s) => reports(s).length) },
  { id: 'solid_hands', title: 'Solid Hands', description: 'Deliver a B-rank session (Quality 55+).', category: 'craft', tier: 'bronze', icon: 'ThumbsUp', check: (s) => bestQuality(s) >= 55, progress: (s) => ({ current: Math.min(55, bestQuality(s)), target: 55 }) },
  { id: 'golden_ears', title: 'Golden Ears', description: 'Deliver an A-rank session (Quality 80+).', category: 'craft', tier: 'silver', icon: 'Ear', check: (s) => bestQuality(s) >= 80, progress: (s) => ({ current: Math.min(80, bestQuality(s)), target: 80 }) },
  { id: 'perfect_pitch', title: 'Perfect Pitch', description: 'Deliver an S-rank session (Quality 90+).', category: 'craft', tier: 'gold', icon: 'Crown', check: (s) => bestQuality(s) >= 90, progress: (s) => ({ current: Math.min(90, bestQuality(s)), target: 90 }) },
  { id: 'hat_trick', title: 'Hat-Trick', description: 'Three sessions in a row at B-rank or better.', category: 'craft', tier: 'silver', icon: 'Repeat', check: (s) => longestStreak(s, 55) >= 3, progress: (s) => ({ current: Math.min(3, longestStreak(s, 55)), target: 3 }) },
  { id: 'working_producer', title: 'Working Producer', description: 'Deliver 10 sessions.', category: 'craft', tier: 'bronze', icon: 'Headphones', ...count(10, (s) => reports(s).length) },
  { id: 'studio_lifer', title: 'Studio Lifer', description: 'Deliver 50 sessions.', category: 'craft', tier: 'gold', icon: 'Library', ...count(50, (s) => reports(s).length) },
  { id: 'genre_specialist', title: 'Genre Specialist', description: 'Deliver 5 sessions in a single genre.', category: 'craft', tier: 'silver', icon: 'Music2', ...count(5, (s) => Math.max(0, ...Object.values(genreCounts(s)))) },
  { id: 'well_rounded', title: 'Well-Rounded', description: 'Deliver sessions in 4 different genres.', category: 'craft', tier: 'silver', icon: 'Shapes', ...count(4, (s) => Object.keys(genreCounts(s)).length) },

  // ─────────── Business ───────────
  { id: 'rainy_day_fund', title: 'Rainy-Day Fund', description: 'Hold $5,000 in the bank.', category: 'business', tier: 'bronze', icon: 'PiggyBank', ...count(5000, (s) => s.money) },
  { id: 'five_figures', title: 'Five Figures', description: 'Hold $10,000 in the bank.', category: 'business', tier: 'silver', icon: 'Banknote', ...count(10000, (s) => s.money) },
  { id: 'six_figures', title: 'Six Figures', description: 'Hold $100,000 in the bank.', category: 'business', tier: 'gold', icon: 'Landmark', ...count(100000, (s) => s.money) },
  { id: 'first_hire', title: 'First Hire', description: 'Put someone on the payroll.', category: 'business', tier: 'bronze', icon: 'UserPlus', ...count(1, (s) => s.hiredStaff?.length ?? 0) },
  { id: 'full_crew', title: 'Full Crew', description: 'Employ five people at once.', category: 'business', tier: 'silver', icon: 'Users', ...count(5, (s) => s.hiredStaff?.length ?? 0) },
  { id: 'name_on_the_door', title: 'Name on the Door', description: 'Reach 50 reputation.', category: 'business', tier: 'silver', icon: 'BadgeCheck', ...count(50, (s) => s.reputation) },

  // ─────────── Studio ───────────
  { id: 'second_room', title: 'Room to Grow', description: 'Open a second studio room.', category: 'studio', tier: 'bronze', icon: 'DoorOpen', ...count(2, rooms) },
  { id: 'complex', title: 'Studio Complex', description: 'Open three studio rooms.', category: 'studio', tier: 'silver', icon: 'Building2', ...count(3, rooms) },
  { id: 'gear_head', title: 'Gear Head', description: 'Own ten pieces of gear.', category: 'studio', tier: 'silver', icon: 'SlidersHorizontal', ...count(10, (s) => s.ownedEquipment?.length ?? 0) },
  {
    id: 'era_hopper',
    title: 'Era-Hopper',
    description: 'Carry your studio into a new era of recording.',
    category: 'studio',
    tier: 'gold',
    icon: 'Hourglass',
    check: (s) => Boolean(s.currentEra && s.selectedEra) && toGameEraId(s.currentEra) !== toGameEraId(s.selectedEra),
  },

  // ─────────── Story ───────────
  { id: 'first_rival', title: 'Noticed', description: 'Finish Act I and draw the rival’s attention.', category: 'story', tier: 'bronze', icon: 'Swords', check: (s) => flagOf(s, 'rewarded_act1_genesis') },
  { id: 'crossroads', title: 'Crossroads', description: 'Finish Act II and choose your legacy.', category: 'story', tier: 'silver', icon: 'Split', check: (s) => anyFlagStartingWith(s, 'rewarded_act2_') },
  { id: 'campaign_complete', title: 'Last Word', description: 'Finish the campaign.', category: 'story', tier: 'gold', icon: 'Trophy', check: (s) => Boolean(s.storylineState?.campaignCompleted) },
  { id: 'rivals_respect', title: 'Rival’s Respect', description: 'Deliver a story contract.', category: 'story', tier: 'silver', icon: 'Handshake', check: (s) => reports(s).some((r) => r.projectId?.startsWith('story-')) },
  { id: 'storyteller', title: 'Storyteller', description: 'See three studio stories through to the end.', category: 'story', tier: 'silver', icon: 'Feather', ...count(3, (s) => s.storylineState?.resolvedSubplotIds?.length ?? 0) },
  { id: 'chronicler', title: 'Chronicler', description: 'See eight studio stories through to the end.', category: 'story', tier: 'gold', icon: 'ScrollText', hidden: true, ...count(8, (s) => s.storylineState?.resolvedSubplotIds?.length ?? 0) },
];

export const getAchievement = (id: string): AchievementDef | undefined => ACHIEVEMENTS.find((a) => a.id === id);

export interface AchievementEvaluation {
  state: GameState;
  newlyUnlocked: AchievementDef[];
}

/** Unlock every achievement whose predicate now holds. Pure and idempotent; returns the same state if nothing changed. */
export const evaluateAchievements = (state: GameState): AchievementEvaluation => {
  const unlocked = state.unlockedAchievements ?? {};
  const fresh = ACHIEVEMENTS.filter((a) => !(a.id in unlocked) && a.check(state));
  if (fresh.length === 0) return { state, newlyUnlocked: [] };

  const stamped = { ...unlocked };
  for (const a of fresh) stamped[a.id] = state.currentDay;

  const notes: GameNotification[] = fresh.map((a) => ({
    id: `achievement-${a.id}`,
    message: `Achievement unlocked: ${a.title} — ${a.description}`,
    type: 'success',
    timestamp: state.currentDay * 86_400_000,
    duration: 7000,
    priority: a.tier === 'gold' ? 'high' : 'medium',
  }));

  return {
    state: { ...state, unlockedAchievements: stamped, notifications: [...(state.notifications ?? []), ...notes] },
    newlyUnlocked: fresh,
  };
};

export const countUnlocked = (state: Pick<GameState, 'unlockedAchievements'>): number =>
  ACHIEVEMENTS.filter((a) => a.id in (state.unlockedAchievements ?? {})).length;
