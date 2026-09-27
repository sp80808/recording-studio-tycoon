// Room capacity model for GH #14 (slice 1, model only). No UI/calendar.
// Pure, deterministic helpers only: no Math.random, no Date.now.

export interface Room {
  id: string;
  name: string;
  /** Lowercase stage-name matchers, e.g. ['recording', 'tracking']. */
  supportedStages: string[];
  /** Concurrent occupants. */
  slots: number;
  modifiers: {
    qualityBonus?: number;
    speedBonus?: number;
  };
  unlocked: boolean;
  unlockLevel?: number;
}

export function getDefaultRooms(): Room[] {
  return [
    {
      id: 'live-room',
      name: 'Live Room',
      supportedStages: ['recording', 'tracking', 'mixing', 'mastering'],
      slots: 1,
      modifiers: {},
      unlocked: true,
    },
    {
      id: 'iso-booth',
      name: 'Iso Booth',
      supportedStages: ['recording', 'tracking'],
      slots: 1,
      modifiers: { qualityBonus: 5 },
      unlocked: false,
      unlockLevel: 3,
    },
    {
      id: 'mix-suite',
      name: 'Mix Suite',
      supportedStages: ['mixing', 'mastering'],
      slots: 1,
      modifiers: { qualityBonus: 8 },
      unlocked: false,
      unlockLevel: 5,
    },
  ];
}

/** Case-insensitive substring match of stageName against the room's supportedStages. */
export function canHost(room: Room, stageName: string): boolean {
  const normalizedStage = (stageName ?? '').toLowerCase().trim();
  if (!normalizedStage) return false;
  return room.supportedStages.some((matcher) => {
    const normalizedMatcher = (matcher ?? '').toLowerCase().trim();
    return normalizedMatcher.length > 0 && normalizedStage.includes(normalizedMatcher);
  });
}

/** Remaining concurrent capacity for the given occupant id list. */
export function freeSlots(room: Room, occupantIds: string[]): number {
  return Math.max(0, room.slots - occupantIds.length);
}

export interface AssignResult {
  ok: boolean;
  reason?: string;
  assignments: Record<string, string>;
}

/**
 * Assign a project to a room for a stage. Pure: never mutates inputs.
 * Fails if the room is unknown/locked, the stage is unsupported, or no free slot.
 */
export function assignProjectToRoom(
  rooms: Room[],
  assignments: Record<string, string>,
  projectId: string,
  roomId: string,
  stageName: string,
): AssignResult {
  const room = rooms.find((r) => r.id === roomId);
  if (!room) {
    return { ok: false, reason: `unknown room: ${roomId}`, assignments: { ...assignments } };
  }
  if (!room.unlocked) {
    return { ok: false, reason: `room locked: ${roomId}`, assignments: { ...assignments } };
  }
  if (!canHost(room, stageName)) {
    return { ok: false, reason: `unsupported stage: ${stageName}`, assignments: { ...assignments } };
  }
  const occupantIds = Object.entries(assignments)
    .filter(([pid, rid]) => rid === roomId && pid !== projectId)
    .map(([pid]) => pid);
  if (freeSlots(room, occupantIds) <= 0) {
    return { ok: false, reason: `no free slot in room: ${roomId}`, assignments: { ...assignments } };
  }
  return { ok: true, assignments: { ...assignments, [projectId]: roomId } };
}

/** Return a new assignments record without the given project entry. Pure. */
export function releaseProject(
  assignments: Record<string, string>,
  projectId: string,
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const [pid, rid] of Object.entries(assignments)) {
    if (pid !== projectId) next[pid] = rid;
  }
  return next;
}
