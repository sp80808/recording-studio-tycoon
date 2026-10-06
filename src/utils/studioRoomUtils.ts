import { GameState, Project, StudioRoom, StudioRoomStageKind } from '@/types/game';

export const createDefaultStudioRooms = (): StudioRoom[] => [
  {
    id: 'studio-a',
    name: 'Studio A',
    type: 'project-studio',
    unlocked: true,
    level: 1,
    purchaseCost: 0,
    requiredPlayerLevel: 1,
    supportedStageKinds: ['general', 'tracking', 'production', 'mixing', 'mastering'],
    qualityBonus: 0,
    speedBonus: 0
  },
  {
    id: 'vocal-suite',
    name: 'Vocal Suite',
    type: 'vocal-suite',
    unlocked: false,
    level: 1,
    purchaseCost: 1800,
    requiredPlayerLevel: 3,
    supportedStageKinds: ['tracking', 'production'],
    qualityBonus: 4,
    speedBonus: 2
  },
  {
    id: 'live-room',
    name: 'Live Room',
    type: 'live-room',
    unlocked: false,
    level: 1,
    purchaseCost: 5200,
    requiredPlayerLevel: 5,
    supportedStageKinds: ['tracking', 'production'],
    qualityBonus: 6,
    speedBonus: 3
  },
  {
    id: 'mix-suite',
    name: 'Mix Suite',
    type: 'mix-suite',
    unlocked: false,
    level: 1,
    purchaseCost: 9000,
    requiredPlayerLevel: 8,
    supportedStageKinds: ['mixing', 'mastering', 'production'],
    qualityBonus: 8,
    speedBonus: 5
  }
];

export const getOperationalStudioRooms = (gameState: Pick<GameState, 'studioRooms'>): StudioRoom[] =>
  (gameState.studioRooms || []).filter(room => room.unlocked);

/** Premises tier that first allows each extra suite (#248/#250): rooms arrive with the move, not with cash alone. */
export const ROOM_REQUIRED_PREMISES_TIER: Record<string, number> = { 'vocal-suite': 1, 'live-room': 2, 'mix-suite': 3 };

export type StudioRoomPurchaseAvailability =
  | { available: true; room: StudioRoom }
  | {
      available: false;
      room?: StudioRoom;
      reason: 'not-found' | 'already-owned' | 'invalid-state' | 'premises' | 'level' | 'expansion-limit' | 'funds';
      explanation: string;
    };

export const getStudioRoomPurchaseAvailability = (
  gameState: Pick<GameState, 'money' | 'playerData' | 'studioRooms'> & { premisesTier?: number },
  roomId: string,
  roomExpansionLimit: number
): StudioRoomPurchaseAvailability => {
  const room = gameState.studioRooms.find(candidate => candidate.id === roomId);
  if (!room) {
    return { available: false, reason: 'not-found', explanation: 'This studio room does not exist.' };
  }
  if (room.unlocked) {
    return { available: false, room, reason: 'already-owned', explanation: `${room.name} is already operational.` };
  }
  if (
    !Number.isFinite(gameState.money) ||
    !Number.isFinite(gameState.playerData.level) ||
    !Number.isFinite(room.purchaseCost) ||
    room.purchaseCost < 0 ||
    !Number.isFinite(room.requiredPlayerLevel) ||
    !Number.isFinite(roomExpansionLimit) ||
    roomExpansionLimit < 0
  ) {
    return { available: false, room, reason: 'invalid-state', explanation: 'Room purchase data is invalid.' };
  }
  const neededTier = ROOM_REQUIRED_PREMISES_TIER[room.id];
  if (neededTier !== undefined && gameState.premisesTier !== undefined && gameState.premisesTier < neededTier) {
    return {
      available: false,
      room,
      reason: 'premises',
      explanation: 'A bigger space comes first: move to better premises before adding this room.'
    };
  }
  if (gameState.playerData.level < room.requiredPlayerLevel) {
    return {
      available: false,
      room,
      reason: 'level',
      explanation: `Reach level ${room.requiredPlayerLevel} to consider this expansion.`
    };
  }
  if (getOperationalStudioRooms(gameState).length >= Math.floor(roomExpansionLimit)) {
    return {
      available: false,
      room,
      reason: 'expansion-limit',
      explanation: 'Grow your staff and studio track record before adding another production suite.'
    };
  }
  if (gameState.money < room.purchaseCost) {
    return {
      available: false,
      room,
      reason: 'funds',
      explanation: `You need $${room.purchaseCost.toLocaleString()} for ${room.name}.`
    };
  }
  return { available: true, room };
};

export const applyStudioRoomPurchase = (
  gameState: GameState,
  roomId: string,
  roomExpansionLimit: number
): GameState => {
  const availability = getStudioRoomPurchaseAvailability(gameState, roomId, roomExpansionLimit);
  if (!availability.available) return gameState;

  return {
    ...gameState,
    money: gameState.money - availability.room.purchaseCost,
    studioRooms: gameState.studioRooms.map(room =>
      room.id === availability.room.id ? { ...room, unlocked: true } : room
    )
  };
};

export const getOccupiedRoomIds = (
  gameState: Pick<GameState, 'activeProject' | 'activeProjects'>
): Set<string> => {
  const roomIds = new Set<string>();

  if (gameState.activeProject?.bookingRoomId) {
    roomIds.add(gameState.activeProject.bookingRoomId);
  }

  (gameState.activeProjects || []).forEach(project => {
    if (project.bookingRoomId) roomIds.add(project.bookingRoomId);
  });

  return roomIds;
};

/**
 * The project whose session is shown in a viewed room. Extra rooms only show a project
 * booked into them (primary or concurrent); Studio A (roomId undefined/'studio-a') shows the
 * primary project.
 */
export const getProjectForRoom = (
  gameState: Pick<GameState, 'activeProject' | 'activeProjects'>,
  roomId?: string | null
): Project | null => {
  if (!roomId || roomId === 'studio-a') return gameState.activeProject ?? null;
  const all = [gameState.activeProject, ...(gameState.activeProjects || [])];
  return all.find((p): p is Project => !!p && p.bookingRoomId === roomId) ?? null;
};

export const inferProjectStageKind = (project: Project): StudioRoomStageKind => {
  const stage = project.stages?.[project.currentStageIndex || 0];
  const name = stage?.stageName?.toLowerCase() || '';

  if (name.includes('master')) return 'mastering';
  if (name.includes('mix')) return 'mixing';
  if (
    name.includes('record') ||
    name.includes('tracking') ||
    name.includes('vocal') ||
    name.includes('mic') ||
    name.includes('setup')
  ) return 'tracking';
  if (
    name.includes('production') ||
    name.includes('arrangement') ||
    name.includes('composition') ||
    name.includes('sound design') ||
    name.includes('layer')
  ) return 'production';

  return 'general';
};

export const roomSupportsProject = (room: StudioRoom, project: Project): boolean => {
  const kind = inferProjectStageKind(project);
  return (
    room.supportedStageKinds.includes('general') ||
    room.supportedStageKinds.includes(kind)
  );
};

export const findAvailableStudioRoom = (
  gameState: Pick<GameState, 'studioRooms' | 'activeProject' | 'activeProjects'>,
  project: Project
): StudioRoom | undefined => {
  const occupied = getOccupiedRoomIds(gameState);

  const candidates = getOperationalStudioRooms(gameState)
    .filter(room => !occupied.has(room.id))
    .sort((a, b) => {
      const aSupports = roomSupportsProject(a, project) ? 1 : 0;
      const bSupports = roomSupportsProject(b, project) ? 1 : 0;
      if (aSupports !== bSupports) return bSupports - aSupports;
      return (b.qualityBonus + b.speedBonus) - (a.qualityBonus + a.speedBonus);
    });

  return candidates[0];
};

export const getPhysicalStudioCapacity = (
  gameState: Pick<GameState, 'studioRooms'>
): number => Math.max(1, getOperationalStudioRooms(gameState).length);


export const getBookedStudioRoom = (
  gameState: Pick<GameState, 'studioRooms'>,
  project?: Pick<Project, 'bookingRoomId'> | null
): StudioRoom | undefined => {
  if (!project?.bookingRoomId) return undefined;
  return (gameState.studioRooms || []).find(room => room.id === project.bookingRoomId);
};
