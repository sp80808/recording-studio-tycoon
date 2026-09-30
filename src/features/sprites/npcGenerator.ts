import type { ModularNpcDefinition, NpcEra, StudioRole } from './spriteTypes';
import { identityFromSeed, resolveNpcAppearance } from './npcAppearance';

export interface GenerateNpcOptions {
  role?: StudioRole;
  era?: NpcEra;
  name?: string;
  /** Defaults to the latest appearance version; pass a saved version to reproduce an old look. */
  appearanceVersion?: number;
}

/**
 * Convenience wrapper: seed (+ optional role/era) -> deterministic visual definition.
 * The logic lives in npcAppearance.ts / npcAppearanceData.ts; this stays as the stable entry point.
 */
export function generateModularNpc(seed: number, options: GenerateNpcOptions = {}): ModularNpcDefinition {
  return resolveNpcAppearance(identityFromSeed(seed, options), options.name);
}
