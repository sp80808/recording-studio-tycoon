/**
 * Living-studio floor NPCs — presentation only.
 *
 * Loads the shared `npc-parts` layer atlas once, bakes each figure into a single
 * Sprite via `bakeLayeredNpc`, and applies `npcAnimation` motion on the ticker.
 * Nothing here is gameplay-authoritative; missing art falls back to procedural blobs.
 */
import { Container, Graphics, type Renderer, type Text } from 'pixi.js';
import type { StaffStations } from '@/components/studio/staffStaging';
import { visualEraId } from '@/utils/eraProgression';
import { createSeededRandom } from '@/simulation/seededRandom';
import { bakeLayeredNpc, createLayeredNpc } from './pixiNpc';
import { identityFromSeed, parseNpcVisualIdentity, resolveNpcAppearance, type NpcVisualIdentity } from './npcAppearance';
import { domMotionFor, type NpcAnimationState } from './npcAnimation';
import { loadAtlas, type LoadedAtlas } from './pipeline/pixiAtlasLoader';
import type { ModularNpcDefinition, NpcEra, StudioRole } from './spriteTypes';

export const NPC_PARTS_ATLAS_URL = '/assets/atlases/layer/npc-parts.json';

/** Screen-pixel height of a baked NPC on the iso floor (source art is 32×48). */
export const FLOOR_NPC_SCALE = 1.35;

export interface FloorNpcFigure {
  /** Saved / resolved identity; when absent a deterministic seed fill-in is used. */
  identity?: NpcVisualIdentity | null;
  /** Stable seed fallback when identity is missing (staff id hash, index, etc.). */
  seed?: number;
  role?: StudioRole;
  name?: string;
  /** Presentation-only motion; never blocks gameplay. */
  animState?: NpcAnimationState;
}

export interface FloorNpcMotion {
  bobAmp: number;
  bobHz: number;
  scaleAmp: number;
  swayAmp: number;
}

export interface FloorNpcHandle {
  fig: Container;
  baseY: number;
  animState: NpcAnimationState;
  /** Release baked textures (call before the parent scene is destroyed). */
  destroy: () => void;
}

export interface StagedStaffHandle extends FloorNpcHandle {
  baseX: number;
  stations: StaffStations;
  activityCue: Text;
}

let atlasPromise: Promise<LoadedAtlas | null> | undefined;

/** One shared atlas load for the living studio; failed downloads leave procedural figures. */
export const loadNpcPartsAtlas = (): Promise<LoadedAtlas | null> => {
  atlasPromise ??= loadAtlas(NPC_PARTS_ATLAS_URL).then((loaded) => {
    if (!loaded) {
      atlasPromise = undefined;
      console.warn('NPC parts atlas unavailable; using procedural floor figures.');
    }
    return loaded;
  });
  return atlasPromise;
};

/** Map progression / save era ids onto the sprite-factory era vocabulary. */
export const gameEraToNpcEra = (eraId?: string, currentYear?: number): NpcEra => {
  if (currentYear !== undefined) {
    if (currentYear < 1975) return '1960s';
    if (currentYear < 1985) return '1970s';
    if (currentYear < 1995) return '1980s';
    if (currentYear < 2005) return '1990s';
    if (currentYear < 2015) return '2000s';
    return 'modern';
  }
  switch (visualEraId(eraId ?? 'analog60s')) {
    case 'digital80s':
      return '1980s';
    case 'internet2000s':
      return '2000s';
    case 'streaming2020s':
      return 'modern';
    case 'analog60s':
    default:
      return '1960s';
  }
};

/** Staff / game roles → studio sprite roles. */
export const staffRoleToStudioRole = (role?: string): StudioRole => {
  switch ((role ?? '').toLowerCase()) {
    case 'producer':
      return 'producer';
    case 'songwriter':
    case 'artist':
      return 'artist';
    case 'manager':
      return 'manager';
    case 'tech':
      return 'tech';
    case 'engineer':
    default:
      return 'engineer';
  }
};

/** Stable numeric seed from an opaque id string (staff id / save seed). */
export const hashSeed = (value: string | number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.abs(Math.floor(value)) % 1_000_000_007;
  const rng = createSeededRandom(`floor-npc:${value}`);
  return Math.floor(rng() * 1_000_000_007);
};

/**
 * Resolve the modular look for a floor figure. Prefer an explicit identity (creator /
 * recruitment); otherwise derive one from seed + role + era.
 */
export const resolveFloorNpcDefinition = (
  figure: FloorNpcFigure,
  eraId?: string,
  fallbackSeed = 1,
): ModularNpcDefinition => {
  const parsed = parseNpcVisualIdentity(figure.identity ?? null);
  if (parsed) return resolveNpcAppearance(parsed, figure.name);
  const role = figure.role ?? 'engineer';
  const era = gameEraToNpcEra(eraId);
  const seed = figure.seed ?? fallbackSeed;
  return resolveNpcAppearance(identityFromSeed(seed, { role, era }), figure.name);
};

/** Collapse npcAnimation states onto bob / sway amplitudes. Reduced motion freezes. */
export const motionForNpcState = (state: NpcAnimationState, reduceMotion: boolean): FloorNpcMotion => {
  if (reduceMotion) return { bobAmp: 0, bobHz: 0, scaleAmp: 0, swayAmp: 0 };
  switch (domMotionFor(state)) {
    case 'working':
      return { bobAmp: 2.4, bobHz: 4.2, scaleAmp: 0.04, swayAmp: 0.045 };
    case 'celebrate':
      return { bobAmp: 4.2, bobHz: 5.2, scaleAmp: 0.07, swayAmp: 0.09 };
    case 'headbob':
      return { bobAmp: 1.8, bobHz: 3.6, scaleAmp: 0.03, swayAmp: 0.025 };
    default:
      // idle / walk / waiting / break / leaving — gentle presence bob
      return {
        bobAmp: state === 'walk' || state === 'leaving' ? 2.8 : 1.8,
        bobHz: state === 'walk' || state === 'leaving' ? 3.4 : 2.0,
        scaleAmp: 0.02,
        swayAmp: state === 'walk' || state === 'leaving' ? 0.03 : 0.01,
      };
  }
};

/** Map staff / session context onto a presentation animation state. */
export const animStateForStaffStatus = (
  status: string | undefined,
  hasActiveProject: boolean,
): NpcAnimationState => {
  switch (status) {
    case 'Working':
      return hasActiveProject ? 'mixing' : 'working';
    case 'Training':
    case 'Researching':
      return 'working';
    case 'Resting':
      return 'break';
    case 'On Tour':
      return 'leaving';
    case 'Idle':
    default:
      return hasActiveProject ? 'waiting' : 'idle';
  }
};

const paintProceduralNpc = (
  npc: ModularNpcDefinition,
  accent = 0x5aa9e6,
): Graphics => {
  const body = new Graphics();
  const paint = (hex: string) => parseInt(hex.replace('#', ''), 16);
  const color = paint(npc.clothes.topPrimaryHex);
  const skin = paint(npc.body.skinHex);
  const hair = paint(npc.hair.hairHex);
  const lower = paint(npc.clothes.lowerHex);
  const width = npc.body.build === 'stocky' ? 27 : npc.body.build === 'slim' ? 18 : 22;
  body.ellipse(0, 1, 15, 7).fill({ color: 0x000000, alpha: 0.35 });
  body.roundRect(-8, -13, 7, 14, 2).fill(lower);
  body.roundRect(1, -13, 7, 14, 2).fill(lower);
  body.roundRect(-15, -34, 5, 18, 2).fill(skin);
  body.roundRect(10, -34, 5, 18, 2).fill(skin);
  body.roundRect(-width / 2, -36, width, 27, 5).fill(color);
  body.roundRect(-width / 2, -36, width, 27, 5).stroke({ width: 2, color: 0x243044, alpha: 0.55 });
  body.circle(0, -45, 11).fill(skin);
  if (npc.hair.shape !== 'bald') {
    if (npc.hair.shape === 'afro') body.circle(0, -54, 14).fill(hair);
    else if (npc.hair.shape === 'bob' || npc.hair.shape === 'dreads') body.roundRect(-13, -57, 26, 18, 3).fill(hair);
    else body.ellipse(0, -52, 11, npc.hair.shape === 'buzzcut' ? 2 : 5).fill(hair);
  }
  if (npc.clothes.outerwear !== 'none') {
    const ow = paint(npc.clothes.outerwearHex || npc.clothes.topSecondaryHex);
    body.rect(-width / 2, -34, 4, 23).fill(ow);
    body.rect(width / 2 - 4, -34, 4, 23).fill(ow);
  }
  if (npc.details.glasses !== 'none') body.rect(-8, -47, 16, 4).fill(0x18181b);
  if (npc.hair.facialHair !== 'none') {
    body.rect(-5, -39, 10, npc.hair.facialHair === 'full_beard' ? 5 : 2).fill(hair);
  }
  body.circle(-4, -44, 1).fill(0x273040);
  body.circle(4, -44, 1).fill(0x273040);
  body.circle(-11, -43, 3).fill(accent);
  body.circle(11, -43, 3).fill(accent);
  return body;
};

/**
 * Build a floor figure. Prefers a baked single-sprite NPC when the atlas + renderer
 * are available; otherwise paints a tinted procedural stand-in from the same definition.
 */
export interface FloorNpcVisual {
  display: Container;
  destroy: () => void;
  baked: boolean;
}

export const createFloorNpcVisual = (
  npc: ModularNpcDefinition,
  opts: {
    renderer?: Renderer | null;
    atlas?: LoadedAtlas | null;
    accent?: number;
    scale?: number;
  } = {},
): FloorNpcVisual => {
  const scale = opts.scale ?? FLOOR_NPC_SCALE;
  const wrap = new Container();
  wrap.eventMode = 'none';

  if (opts.renderer && opts.atlas) {
    const baked = bakeLayeredNpc(opts.renderer, opts.atlas, npc);
    if (baked.missingRequired.length === 0) {
      baked.sprite.scale.set(scale);
      wrap.addChild(baked.sprite);
      return { display: wrap, baked: true, destroy: () => baked.destroy() };
    }
    // Required layers missing — fall through after cleaning the partial bake.
    baked.destroy();
    const layered = createLayeredNpc(opts.atlas, npc);
    if (layered.missingRequired.length === 0) {
      layered.container.scale.set(scale);
      wrap.addChild(layered.container);
      return {
        display: wrap,
        baked: false,
        destroy: () => layered.container.destroy({ children: true }),
      };
    }
    layered.container.destroy({ children: true });
  }

  wrap.addChild(paintProceduralNpc(npc, opts.accent));
  return { display: wrap, baked: false, destroy: () => undefined };
};

/** Apply presentation motion for one tick. Safe under reduced motion (no-ops amplitudes). */
export const applyFloorNpcMotion = (
  handle: Pick<FloorNpcHandle, 'fig' | 'baseY' | 'animState'>,
  tSeconds: number,
  phase: number,
  reduceMotion: boolean,
): void => {
  const m = motionForNpcState(handle.animState, reduceMotion);
  handle.fig.y = handle.baseY + Math.sin(tSeconds * m.bobHz + phase) * m.bobAmp;
  handle.fig.scale.y = 1 + Math.sin(tSeconds * (m.bobHz + 1) + phase) * m.scaleAmp;
  handle.fig.rotation = Math.sin(tSeconds * (m.bobHz * 0.55) + phase) * m.swayAmp;
};
