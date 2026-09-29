/**
 * choreEngine.ts
 * Core simulation service for Studio Maintenance & Daily Chores.
 * Manages daily chore lifecycles, condition decay, active session buffs,
 * and 3-day chore streaks awarding vintage flight case crates.
 */

export type StudioChoreId =
  | 'clean_tape_heads'    // Boosts PocketMeter timing sweet-spot by +10%
  | 'calibrate_outboard'  // Increases session Technical points by +15%
  | 'organize_patchbay'   // Reduces energy burn on Overdrive take (refunds 1⚡)
  | 'tune_acoustics'      // Increases session Creativity points by +15%
  | 'brew_espresso';      // Restores 1 player/staff energy & grants +10% client vibe

export type ChoreCategory = 'maintenance' | 'acoustics' | 'hospitality';

export interface StudioChore {
  id: StudioChoreId;
  title: string;
  description: string;
  category: ChoreCategory;
  energyCost: number;       // 0 or 1
  hotspotId: 'console' | 'liveroom' | 'phone' | 'shelf' | 'crt';
  completed: boolean;
  buffDurationSessions: number; // default 1 session
  buffType: 'timing_bonus' | 'tech_bonus' | 'creativity_bonus' | 'energy_saver' | 'vibe_boost';
  buffMagnitude: number;
}

export interface ActiveChoreBuff {
  id: string;
  choreId: StudioChoreId;
  buffType: StudioChore['buffType'];
  magnitude: number;
  remainingSessions: number;
}

export interface StudioChoreState {
  chores: Record<StudioChoreId, StudioChore>;
  activeBuffs: ActiveChoreBuff[];
  dailyCompletedCount: number;
  streakDays: number;
  lastCompletedDay: number;
}

export const AUTHORED_CHORES: Record<StudioChoreId, Omit<StudioChore, 'completed'>> = {
  clean_tape_heads: {
    id: 'clean_tape_heads',
    title: 'Clean Tape Heads',
    description: 'Swab isopropyl alcohol over the reel-to-reel playback & record heads to stabilize tape flutter.',
    category: 'maintenance',
    energyCost: 1,
    hotspotId: 'console',
    buffDurationSessions: 1,
    buffType: 'timing_bonus',
    buffMagnitude: 0.10, // +10% sweet-spot tolerance
  },
  calibrate_outboard: {
    id: 'calibrate_outboard',
    title: 'Calibrate Outboard Rack',
    description: 'Align stereo compressor gains and zero VU meters for optimal analog headroom.',
    category: 'maintenance',
    energyCost: 1,
    hotspotId: 'console',
    buffDurationSessions: 1,
    buffType: 'tech_bonus',
    buffMagnitude: 0.15, // +15% technical gain
  },
  organize_patchbay: {
    id: 'organize_patchbay',
    title: 'Organize Patchbay & Cabling',
    description: 'Neatly dress studio snakes and routing jacks to prevent grounding hum and quicken session changes.',
    category: 'maintenance',
    energyCost: 1,
    hotspotId: 'console',
    buffDurationSessions: 1,
    buffType: 'energy_saver',
    buffMagnitude: 1, // 1 energy cost refund
  },
  tune_acoustics: {
    id: 'tune_acoustics',
    title: 'Tune Acoustic Baffles',
    description: 'Position gobos and diffuser panels around the drum booth for richer room ambience.',
    category: 'acoustics',
    energyCost: 1,
    hotspotId: 'liveroom',
    buffDurationSessions: 1,
    buffType: 'creativity_bonus',
    buffMagnitude: 0.15, // +15% creativity gain
  },
  brew_espresso: {
    id: 'brew_espresso',
    title: 'Brew Fresh Espresso',
    description: 'Grind dark roast beans in the studio lounge to elevate artist mood and producer alertness.',
    category: 'hospitality',
    energyCost: 0,
    hotspotId: 'shelf',
    buffDurationSessions: 1,
    buffType: 'vibe_boost',
    buffMagnitude: 0.10, // +10% client vibe & mood
  },
};

/**
 * Initializes a clean chore state.
 */
export function createInitialChoreState(): StudioChoreState {
  const chores: Record<StudioChoreId, StudioChore> = {
    clean_tape_heads: { ...AUTHORED_CHORES.clean_tape_heads, completed: false },
    calibrate_outboard: { ...AUTHORED_CHORES.calibrate_outboard, completed: false },
    organize_patchbay: { ...AUTHORED_CHORES.organize_patchbay, completed: false },
    tune_acoustics: { ...AUTHORED_CHORES.tune_acoustics, completed: false },
    brew_espresso: { ...AUTHORED_CHORES.brew_espresso, completed: false },
  };

  return {
    chores,
    activeBuffs: [],
    dailyCompletedCount: 0,
    streakDays: 0,
    lastCompletedDay: 0,
  };
}

/**
 * Executes a studio chore, burning energy and granting an active session buff.
 */
export function executeStudioChore(
  state: StudioChoreState,
  choreId: StudioChoreId,
  playerEnergy: number,
  buffDurationOverride?: number
): {
  nextChoreState: StudioChoreState;
  energyBurned: number;
  xpAwarded: number;
  buffGranted: ActiveChoreBuff;
} | null {
  const chore = state.chores[choreId];
  if (!chore || chore.completed) {
    return null;
  }

  if (playerEnergy < chore.energyCost) {
    return null;
  }

  const buffDuration = buffDurationOverride ?? chore.buffDurationSessions;
  const newBuff: ActiveChoreBuff = {
    id: `buff-${choreId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    choreId,
    buffType: chore.buffType,
    magnitude: chore.buffMagnitude,
    remainingSessions: buffDuration,
  };

  // Filter out any existing buff of the same choreId to refresh it
  const remainingBuffs = state.activeBuffs.filter(b => b.choreId !== choreId);

  const nextChores: Record<StudioChoreId, StudioChore> = {
    ...state.chores,
    [choreId]: {
      ...chore,
      completed: true,
    },
  };

  const nextChoreState: StudioChoreState = {
    ...state,
    chores: nextChores,
    activeBuffs: [...remainingBuffs, newBuff],
    dailyCompletedCount: state.dailyCompletedCount + 1,
  };

  // XP is 35 for maintenance/acoustics, 25 for hospitality
  const xpAwarded = chore.category === 'hospitality' ? 25 : 35;

  return {
    nextChoreState,
    energyBurned: chore.energyCost,
    xpAwarded,
    buffGranted: newBuff,
  };
}

/**
 * Resets daily chores upon day rollover, evaluating streaks and awarding crates.
 */
export function refreshDailyChores(
  state: StudioChoreState,
  currentDay: number,
  streakThreshold: number = 3
): {
  nextChoreState: StudioChoreState;
  crateAwarded: boolean;
} {
  // Check if player met the daily threshold (>= 3 chores completed)
  const metThreshold = state.dailyCompletedCount >= streakThreshold;
  const nextStreak = metThreshold ? state.streakDays + 1 : 0;
  // 3-day streak awards a vintage flight case crate
  const crateAwarded = nextStreak > 0 && nextStreak % 3 === 0;

  const resetChores: Record<StudioChoreId, StudioChore> = {
    clean_tape_heads: { ...state.chores.clean_tape_heads, completed: false },
    calibrate_outboard: { ...state.chores.calibrate_outboard, completed: false },
    organize_patchbay: { ...state.chores.organize_patchbay, completed: false },
    tune_acoustics: { ...state.chores.tune_acoustics, completed: false },
    brew_espresso: { ...state.chores.brew_espresso, completed: false },
  };

  return {
    nextChoreState: {
      ...state,
      chores: resetChores,
      dailyCompletedCount: 0,
      streakDays: nextStreak,
      lastCompletedDay: currentDay,
    },
    crateAwarded,
  };
}

/**
 * Consumes 1 session count from all active buffs after a session or stage completes.
 */
export function consumeChoreBuffSession(state: StudioChoreState): StudioChoreState {
  const updatedBuffs = state.activeBuffs
    .map(buff => ({
      ...buff,
      remainingSessions: buff.remainingSessions - 1,
    }))
    .filter(buff => buff.remainingSessions > 0);

  return {
    ...state,
    activeBuffs: updatedBuffs,
  };
}

/**
 * Queries if a buff type is currently active.
 */
export function hasActiveChoreBuff(
  state: StudioChoreState,
  buffType: StudioChore['buffType']
): boolean {
  if (!state || !state.activeBuffs) return false;
  return state.activeBuffs.some(b => b.buffType === buffType && b.remainingSessions > 0);
}

/**
 * Gets the total magnitude for an active buff type.
 */
export function getActiveBuffMagnitude(
  state: StudioChoreState,
  buffType: StudioChore['buffType']
): number {
  if (!state || !state.activeBuffs) return 0;
  return state.activeBuffs
    .filter(b => b.buffType === buffType && b.remainingSessions > 0)
    .reduce((sum, b) => sum + b.magnitude, 0);
}
