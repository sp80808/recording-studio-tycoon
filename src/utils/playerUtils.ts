
import { GameState, PlayerAttributes } from '@/types/game';
import { grantRewardBundle, rewardForProducerLevel } from '@/economy/flightCaseEconomy';
import { FLIGHT_CASES } from '@/data/flightCases';

export const calculateAttributeBonus = (attribute: keyof PlayerAttributes, level: number): number => {
  // Each attribute level provides a percentage bonus
  const bonusPerLevel = 5; // 5% per level
  return (level - 1) * bonusPerLevel;
};

export const getCreativityMultiplier = (gameState: GameState): number => {
  const bonus = calculateAttributeBonus('creativeIntuition', gameState.playerData.attributes.creativeIntuition);
  return 1 + (bonus / 100);
};

export const getTechnicalMultiplier = (gameState: GameState): number => {
  const bonus = calculateAttributeBonus('technicalAptitude', gameState.playerData.attributes.technicalAptitude);
  return 1 + (bonus / 100);
};

export const getBusinessMultiplier = (gameState: GameState): number => {
  const bonus = calculateAttributeBonus('businessAcumen', gameState.playerData.attributes.businessAcumen);
  return 1 + (bonus / 100);
};

export const getFocusEffectiveness = (gameState: GameState): number => {
  const bonus = calculateAttributeBonus('focusMastery', gameState.playerData.attributes.focusMastery);
  return 1 + (bonus / 100);
};

export const getTotalWorkCapacity = (gameState: GameState): number => {
  // Base capacity from focus mastery + assigned staff capacity
  const baseCapacity = gameState.playerData.attributes.focusMastery + 3;
  const staffCapacity = gameState.hiredStaff
    .filter(s => s.status === 'Working' && s.assignedProjectId === gameState.activeProject?.id)
    .reduce((total, staff) => total + Math.floor(staff.primaryStats.speed / 10), 0);
  
  return baseCapacity + staffCapacity;
};

export const getMoodEffectiveness = (mood: number): number => {
  if (mood < 40) return 0.75; // 25% penalty for low mood
  if (mood > 75) return 1.1; // 10% bonus for high mood
  return 1.0; // Normal effectiveness
};

export const xpForPlayerLevel = (level: number): number =>
  Math.floor(100 * Math.pow(1.4, Math.max(0, level - 1) * 0.7));

/** Normalize every XP source at the shared state boundary, including loaded saves. */
export const resolvePlayerLevelUps = (state: GameState): GameState => {
  const player = state.playerData;
  if (!Number.isFinite(player.xp) || player.xp < xpForPlayerLevel(player.level)) return state;
  let { xp, level, perkPoints } = player;
  const crossed: number[] = [];
  while (xp >= xpForPlayerLevel(level)) {
    xp -= xpForPlayerLevel(level);
    level++;
    crossed.push(level);
    perkPoints += level <= 10 ? 2 : level <= 25 ? 1 : 0;
  }
  // Flight-case level rewards (bead fec): grant once per milestone level.
  // The claimed list keeps loaded/legacy saves from double-granting.
  let next: GameState = state;
  const claimed = new Set(state.flightCaseLevelsClaimed ?? []);
  const grantedCaseNames: string[] = [];
  for (const crossedLevel of crossed) {
    const reward = rewardForProducerLevel(crossedLevel);
    if (!reward || claimed.has(crossedLevel)) continue;
    const applied = grantRewardBundle(next, reward);
    next = applied.state;
    claimed.add(crossedLevel);
    for (const c of reward.cases ?? []) grantedCaseNames.push(FLIGHT_CASES[c.tier].name);
  }
  const caseNote =
    grantedCaseNames.length > 0
      ? ` A ${grantedCaseNames.join(' and ')} is waiting in the Flight Case Depot!`
      : '';
  return {
    ...next,
    playerData: {
      ...player, xp, level, perkPoints, xpToNextLevel: xpForPlayerLevel(level),
      dailyWorkCapacity: player.dailyWorkCapacity + level - player.level,
    },
    flightCaseLevelsClaimed: claimed.size > 0 ? [...claimed].sort((a, b) => a - b) : next.flightCaseLevelsClaimed,
    notifications: [...next.notifications, {
      id: `producer-level-${level}`, type: 'success', timestamp: Date.now(), duration: 6000,
      message: `Producer level ${level}! +${perkPoints - player.perkPoints} talent points and +${level - player.level} daily sessions.${caseNote}`,
    }],
  };
};

/** Spend against the latest state; upgrades grant only the extra session earned. */
export const upgradePlayerAttribute = (state: GameState, attribute: keyof PlayerAttributes): GameState => {
  const player = state.playerData;
  if (!Object.prototype.hasOwnProperty.call(player.attributes, attribute) || player.perkPoints < 1 || player.attributes[attribute] >= 10) return state;
  return {
    ...state,
    playerData: {
      ...player,
      perkPoints: player.perkPoints - 1,
      attributes: { ...player.attributes, [attribute]: player.attributes[attribute] + 1 },
      dailyWorkCapacity: player.dailyWorkCapacity + (attribute === 'focusMastery' ? 1 : 0),
    },
  };
};
