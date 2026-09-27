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
