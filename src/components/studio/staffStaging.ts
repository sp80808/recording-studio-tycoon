import type { NpcAnimationState } from '@/features/sprites/npcAnimation';

export interface FloorPoint { x: number; y: number }
export interface StaffStations { home: FloorPoint; work: FloorPoint; rest: FloorPoint }

/** Authored presentation destinations, selected exclusively from the live staff status. */
export function staffDestination(state: NpcAnimationState, stations: StaffStations): FloorPoint {
  if (state === 'working' || state === 'mixing' || state === 'recording' || state === 'headbob') return stations.work;
  if (state === 'break') return stations.rest;
  return stations.home;
}

/** Constant speed, bounded delta; long hidden-tab frames never teleport a walking figure. */
export function stepStaffPosition(current: FloorPoint, target: FloorPoint, dtMs: number, reducedMotion: boolean): FloorPoint {
  if (reducedMotion) return { ...target };
  const dx = target.x - current.x;
  const dy = target.y - current.y;
  const distance = Math.hypot(dx, dy);
  const step = 42 * Math.max(0, Math.min(dtMs, 100)) / 1000;
  if (distance <= step || distance === 0) return { ...target };
  return { x: current.x + dx / distance * step, y: current.y + dy / distance * step };
}

export function staffActivityCue(state: NpcAnimationState): { text: string; color: number } {
  switch (state) {
    case 'mixing': return { text: '♪', color: 0x7bd389 };
    case 'recording': return { text: '●', color: 0xff8b76 };
    case 'working': case 'headbob': return { text: '♪', color: 0x7bd389 };
    case 'waiting': return { text: '…', color: 0xe8c878 };
    case 'break': return { text: 'z', color: 0x91bde8 };
    case 'celebrate': return { text: '✓', color: 0x7bd389 };
    default: return { text: '', color: 0xffffff };
  }
}

/** Keep visible workers ahead of off-duty staff when the compact floor reaches capacity. */
export function pickFloorStaff<T extends { status: string }>(staff: readonly T[], capacity = 4): T[] {
  const priority = (status: string) => status === 'Working' ? 0 : status === 'Training' || status === 'Researching' ? 1 : status === 'Idle' ? 2 : 3;
  const present = staff.filter((member) => member.status !== 'On Tour');
  if (present.length <= capacity) return present;
  return present
    .sort((a, b) => priority(a.status) - priority(b.status))
    .slice(0, capacity);
}
