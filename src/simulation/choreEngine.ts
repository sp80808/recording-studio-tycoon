/**
 * choreEngine.ts
 * Core simulation service for Studio Maintenance & Daily Chores.
 * Manages daily chore lifecycles, condition decay, active session buffs,
 * automatic chore execution via assigned staff, ability-scaled speeds & buffs,
 * and 3-day chore streaks awarding vintage flight case crates.
 */

export type StudioChoreId =
  | 'clean_tape_heads'    // Boosts PocketMeter timing sweet-spot by +10%
  | 'calibrate_outboard'  // Increases session Technical points by +15%
  | 'organize_patchbay'   // Reduces energy burn on Overdrive take (refunds 1⚡)
  | 'tune_acoustics'      // Increases session Creativity points by +15%
  | 'brew_espresso';      // Restores 1 player/staff energy & grants +10% client vibe

export type ChoreCategory = 'maintenance' | 'acoustics' | 'hospitality';

/** Real-time duration keeps chores readable while rewarding better rooms and eras. */
export function getChoreDurationMs(chore: StudioChore, eraId: string, ownedEquipmentCount: number): number {
  const eraBonus = eraId === '1960s' || eraId === '1960' ? 0.92 : eraId === '1970s' || eraId === '1970' ? 0.96 : 1;
  const equipmentBonus = Math.min(0.22, Math.max(0, ownedEquipmentCount) * 0.025);
  const base = chore.category === 'hospitality' ? 900 : chore.category === 'acoustics' ? 1500 : 1800;
  return Math.round(base * eraBonus * (1 - equipmentBonus));
}


export interface StudioChore {
  id: StudioChoreId;
  title: string;
  description: string;
  category: ChoreCategory;
  energyCost: number;       // 0 or 1
  hotspotId: 'console' | 'liveRoom' | 'phone' | 'shelf' | 'tv';
  completed: boolean;
  buffDurationSessions: number; // default 1 session
  buffType: 'timing_bonus' | 'tech_bonus' | 'creativity_bonus' | 'energy_saver' | 'vibe_boost';
  buffMagnitude: number;
  assignedStaffId?: string | null; // Staff assigned to automate this chore
}

export interface ActiveChoreBuff {
  id: string;
  choreId: StudioChoreId;
  buffType: StudioChore['buffType'];
  magnitude: number;
  remainingSessions: number;
  appliedByStaffId?: string | null;
}

export interface StudioChoreState {
  chores: Record<StudioChoreId, StudioChore>;
  activeBuffs: ActiveChoreBuff[];
  dailyCompletedCount: number;
  streakDays: number;
  lastCompletedDay: number;
  autoProcessEnabled?: boolean;
}

export interface StaffLike {
  id: string;
  name: string;
  role: string;
  primaryStats: {
    creativity: number;
    technical: number;
    speed: number;
  };
  energy: number;
  mood?: number;
  xpInRole?: number;
  levelInRole?: number;
}

export const AUTHORED_CHORES: Record<StudioChoreId, Omit<StudioChore, 'completed' | 'assignedStaffId'>> = {
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
    hotspotId: 'liveRoom',
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
    clean_tape_heads: { ...AUTHORED_CHORES.clean_tape_heads, completed: false, assignedStaffId: null },
    calibrate_outboard: { ...AUTHORED_CHORES.calibrate_outboard, completed: false, assignedStaffId: null },
    organize_patchbay: { ...AUTHORED_CHORES.organize_patchbay, completed: false, assignedStaffId: null },
    tune_acoustics: { ...AUTHORED_CHORES.tune_acoustics, completed: false, assignedStaffId: null },
    brew_espresso: { ...AUTHORED_CHORES.brew_espresso, completed: false, assignedStaffId: null },
  };

  return {
    chores,
    activeBuffs: [],
    dailyCompletedCount: 0,
    streakDays: 0,
    lastCompletedDay: 0,
    autoProcessEnabled: true,
  };
}

/**
 * Assigns or unassigns a chore to a staff member for automated execution.
 */
export function assignChoreToStaff(
  state: StudioChoreState,
  choreId: StudioChoreId,
  staffId: string | null
): StudioChoreState {
  const chore = state.chores[choreId];
  if (!chore) return state;

  return {
    ...state,
    chores: {
      ...state.chores,
      [choreId]: {
        ...chore,
        assignedStaffId: staffId,
      },
    },
  };
}

/**
 * Executes a studio chore manually (player action), burning energy and granting an active session buff.
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
    appliedByStaffId: null,
  };

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

  const xpAwarded = chore.category === 'hospitality' ? 25 : 35;

  return {
    nextChoreState,
    energyBurned: chore.energyCost,
    xpAwarded,
    buffGranted: newBuff,
  };
}

/**
 * Automatically processes chores assigned to staff members.
 * Scales execution speed and buff effectiveness based on staff ability:
 * - Speed stat reduces staff energy cost and execution time.
 * - Technical & Creativity stats augment buff magnitude (up to +30% boost).
 */
export function processAutomaticChores(
  state: StudioChoreState,
  staffList: StaffLike[]
): {
  nextChoreState: StudioChoreState;
  completedChores: StudioChoreId[];
  staffEnergyDeltas: Record<string, number>;
  staffXpGained: Record<string, number>;
} {
  const completedChores: StudioChoreId[] = [];
  const staffEnergyDeltas: Record<string, number> = {};
  const staffXpGained: Record<string, number> = {};
  let currentBuffs = [...state.activeBuffs];
  const nextChores = { ...state.chores };
  let dailyCount = state.dailyCompletedCount;

  for (const choreId of Object.keys(nextChores) as StudioChoreId[]) {
    const chore = nextChores[choreId];
    if (chore.completed || !chore.assignedStaffId) continue;

    const staff = staffList.find(s => s.id === chore.assignedStaffId);
    if (!staff || staff.energy < 15) continue;

    // Ability-based calculation:
    // Speed stat (0-100) scales efficiency
    const speed = staff.primaryStats?.speed || 50;
    const speedFactor = 1 + (speed - 50) / 100; // e.g. speed 80 = 1.3x

    // Energy deduction is reduced for faster/higher ability staff
    const energyCost = Math.max(5, Math.round(15 / speedFactor));

    // Stat affinity:
    // Maintenance scales with Technical
    // Acoustics scales with Creativity
    // Hospitality scales with Mood / Speed
    const relevantStat =
      chore.category === 'maintenance'
        ? staff.primaryStats?.technical || 50
        : chore.category === 'acoustics'
        ? staff.primaryStats?.creativity || 50
        : (staff.mood || 50);

    // High ability (>70) boosts buff magnitude
    const abilityMultiplier = relevantStat > 70 ? 1 + (relevantStat - 70) * 0.01 : 1.0;
    const scaledMagnitude = Number((chore.buffMagnitude * abilityMultiplier).toFixed(3));

    const newBuff: ActiveChoreBuff = {
      id: `buff-${choreId}-auto-${Date.now()}`,
      choreId,
      buffType: chore.buffType,
      magnitude: scaledMagnitude,
      remainingSessions: chore.buffDurationSessions,
      appliedByStaffId: staff.id,
    };

    currentBuffs = currentBuffs.filter(b => b.choreId !== choreId);
    currentBuffs.push(newBuff);

    nextChores[choreId] = {
      ...chore,
      completed: true,
    };

    completedChores.push(choreId);
    dailyCount += 1;

    staffEnergyDeltas[staff.id] = (staffEnergyDeltas[staff.id] || 0) - energyCost;
    staffXpGained[staff.id] = (staffXpGained[staff.id] || 0) + 30;
  }

  return {
    nextChoreState: {
      ...state,
      chores: nextChores,
      activeBuffs: currentBuffs,
      dailyCompletedCount: dailyCount,
    },
    completedChores,
    staffEnergyDeltas,
    staffXpGained,
  };
}

/**
 * Automatically assigns available unassigned chores to the most qualified staff member
 * based on role and primary ability stats.
 */
export function autoAssignAvailableChores(
  state: StudioChoreState,
  staffList: StaffLike[]
): StudioChoreState {
  if (!staffList || staffList.length === 0) return state;

  const nextChores = { ...state.chores };

  for (const choreId of Object.keys(nextChores) as StudioChoreId[]) {
    const chore = nextChores[choreId];
    if (chore.assignedStaffId) continue;

    // Pick best staff for this category
    let bestStaff: StaffLike | null = null;
    let bestScore = -1;

    for (const staff of staffList) {
      if (staff.energy < 20) continue;

      let score = staff.primaryStats?.speed || 0;
      if (chore.category === 'maintenance') {
        score += (staff.primaryStats?.technical || 0) * 2;
        if (staff.role === 'Engineer') score += 50;
      } else if (chore.category === 'acoustics') {
        score += (staff.primaryStats?.creativity || 0) * 2;
        if (staff.role === 'Producer') score += 50;
      } else {
        score += ((staff.mood || 50) + (staff.primaryStats?.speed || 50));
      }

      if (score > bestScore) {
        bestScore = score;
        bestStaff = staff;
      }
    }

    if (bestStaff) {
      nextChores[choreId] = {
        ...chore,
        assignedStaffId: bestStaff.id,
      };
    }
  }

  return {
    ...state,
    chores: nextChores,
  };
}

/**
 * Resets daily chores upon day rollover, evaluating streaks and awarding crates.
 * Preserves staff assignments so routines remain active!
 */
export function refreshDailyChores(
  state: StudioChoreState,
  currentDay: number,
  streakThreshold: number = 3
): {
  nextChoreState: StudioChoreState;
  crateAwarded: boolean;
} {
  const metThreshold = state.dailyCompletedCount >= streakThreshold;
  const nextStreak = metThreshold ? state.streakDays + 1 : 0;
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
  state?: StudioChoreState | null,
  buffType?: StudioChore['buffType']
): boolean {
  if (!state || !state.activeBuffs || !buffType) return false;
  return state.activeBuffs.some(b => b.buffType === buffType && b.remainingSessions > 0);
}

/**
 * Gets the total magnitude for an active buff type.
 */
export function getActiveBuffMagnitude(
  state?: StudioChoreState | null,
  buffType?: StudioChore['buffType']
): number {
  if (!state || !state.activeBuffs || !buffType) return 0;
  return state.activeBuffs
    .filter(b => b.buffType === buffType && b.remainingSessions > 0)
    .reduce((sum, b) => sum + b.magnitude, 0);
}
