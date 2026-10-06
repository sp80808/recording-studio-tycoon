// People for the extra rooms (#248): the producer and crew on the profile's staff spots and the booked
// artist at the room's mic. Reuses the Studio A sprite kit (resolveFloorNpcDefinition / createFloorNpcVisual)
// and returns handles shaped like WebGLCanvas's refs, so the one shared ticker animates them unchanged.
import { Container, Rectangle, Text, type Renderer } from 'pixi.js';
import { createFloorNpcVisual, hashSeed, resolveFloorNpcDefinition } from '@/features/sprites/floorNpcs';
import type { FloorNpcFigure, FloorNpcHandle, StagedStaffHandle } from '@/features/sprites/floorNpcs';
import type { LoadedAtlas } from '@/features/sprites/pipeline/pixiAtlasLoader';
import type { ModularNpcDefinition } from '@/features/sprites/spriteTypes';
import { iso } from './isoMath';
import type { RoomLayoutProfile } from './roomLayouts';

export interface RoomFigureInput {
  profile: RoomLayoutProfile;
  parent: Container;
  /** Same depth offset the scene used for its props, so figures sort against them. */
  depthBase: number;
  renderer?: Renderer | null;
  atlas?: LoadedAtlas | null;
  eraId?: string;
  accent: number;
  decorSeed?: string | number;
  staffOnFloor: number;
  hasActiveProject: boolean;
  floorFigures?: FloorNpcFigure[];
  producerNpc?: ModularNpcDefinition | null;
  producerAppearance?: FloorNpcFigure['identity'];
  artistName?: string;
  onSelect?: (id: 'producer' | 'liveRoom') => void;
}

export interface RoomFigures {
  staff: StagedStaffHandle[];
  artist: FloorNpcHandle & { tag: Text; shown: string; baseX: number };
  artistStand: { x: number; y: number };
  doorFloor: { x: number; y: number };
}

/** How many staff stand in a room: the compact-floor count, bounded by the room's reserved spots. */
export const roomStaffCount = (profile: RoomLayoutProfile, staffOnFloor: number): number =>
  Math.max(1, Math.min(profile.staffSpots.length, staffOnFloor));

export const buildRoomFigures = (input: RoomFigureInput): RoomFigures => {
  const { profile, parent, depthBase } = input;
  const seedBase = hashSeed(`${input.decorSeed ?? 'studio'}:${profile.type}`);
  const staff: StagedStaffHandle[] = [];
  const count = roomStaffCount(profile, input.staffOnFloor);
  for (let i = 0; i < count; i++) {
    const spot = iso(profile.staffSpots[i].x, profile.staffSpots[i].y);
    const provided = input.floorFigures?.[i];
    const figure: FloorNpcFigure = provided ?? {
      identity: i === 0 ? input.producerAppearance : undefined,
      seed: seedBase + i * 97,
      role: i === 0 ? 'producer' : 'engineer',
      animState: input.hasActiveProject ? (i === 0 ? 'mixing' : 'working') : 'idle',
    };
    const npc = i === 0 && input.producerNpc ? input.producerNpc : resolveFloorNpcDefinition(figure, input.eraId, seedBase + i * 97);
    const visual = createFloorNpcVisual(npc, { renderer: input.renderer, atlas: input.atlas, accent: input.accent });
    visual.display.position.set(spot.x, spot.y);
    visual.display.zIndex = depthBase + spot.y;
    const activityCue = new Text({ text: '', style: { fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold', fill: 0xffffff, stroke: { color: 0x151b22, width: 3 } } });
    activityCue.anchor.set(0.5, 1);
    activityCue.position.set(0, -70);
    activityCue.eventMode = 'none';
    visual.display.addChild(activityCue);
    staff.push({
      fig: visual.display,
      baseX: spot.x,
      baseY: spot.y,
      // Rooms are tight: staff keep to their own spot rather than walking through props.
      stations: { home: spot, work: spot, rest: spot },
      activityCue,
      animState: figure.animState ?? (input.hasActiveProject ? 'working' : 'idle'),
      destroy: visual.destroy,
    });
    if (i === 0) {
      const d = visual.display;
      d.eventMode = 'static';
      d.cursor = 'pointer';
      d.hitArea = new Rectangle(-24, -70, 48, 78);
      d.on('pointertap', () => input.onSelect?.('producer'));
    }
    parent.addChild(visual.display);
  }

  const stand = iso(profile.artistSpot.x, profile.artistSpot.y);
  const door = iso(profile.doorSpot.x, profile.doorSpot.y);
  const artistNpc = resolveFloorNpcDefinition(
    { seed: seedBase + 777, role: 'artist', name: input.artistName, animState: 'recording' },
    input.eraId,
    seedBase + 777,
  );
  const visual = createFloorNpcVisual(artistNpc, { renderer: input.renderer, atlas: input.atlas, accent: 0xc2414b });
  visual.display.position.set(stand.x, stand.y);
  const tag = new Text({ text: '', style: { fontFamily: 'ui-sans-serif, system-ui, sans-serif', fontSize: 11, fontWeight: '700', fill: 0xffe3a3, stroke: { color: 0x0b0906, width: 3 } } });
  tag.anchor.set(0.5, 1);
  tag.position.set(0, -66);
  tag.eventMode = 'none';
  visual.display.addChild(tag);
  visual.display.eventMode = 'static';
  visual.display.cursor = 'pointer';
  visual.display.hitArea = new Rectangle(-28, -72, 56, 80);
  visual.display.on('pointertap', () => input.onSelect?.('liveRoom'));
  visual.display.visible = false;
  visual.display.zIndex = depthBase + stand.y;
  parent.addChild(visual.display);
  const artist = { fig: visual.display, baseY: stand.y, baseX: stand.x, animState: 'recording' as const, tag, shown: '', destroy: visual.destroy };
  return { staff, artist, artistStand: stand, doorFloor: door };
};
