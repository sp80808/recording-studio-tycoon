/**
 * Dev/test helper (#215): enumerate every appearance option against a stable baseline and capture what the
 * renderer is actually given, so a silent no-op option (one that draws exactly like another) is detectable.
 *
 * Pure: the caller injects `render` (e.g. `renderToStaticMarkup` of `ModularSpriteRenderer`) to also capture what
 * the preview draws. Nothing here is imported by game code.
 */
import { APPEARANCE_FIELDS, type AppearanceFieldId } from '@/features/sprites/appearanceFields';
import { buildNpcLayerStack } from '@/features/sprites/npcLayers';
import { buildProducerNpc, DEFAULT_PRODUCER_APPEARANCE, type ResolvedProducerAppearance } from '@/features/sprites/producerAppearance';
import type { ModularNpcDefinition } from '@/features/sprites/spriteTypes';

export interface AppearanceOptionProbe {
  field: AppearanceFieldId;
  value: string;
  appearance: ResolvedProducerAppearance;
  npc: ModularNpcDefinition;
  /** Serialised renderer inputs (the whole definition, name/id neutral). */
  definitionKey: string;
  /** Serialised layer stack (slot + variant + tint). */
  layerKey: string;
  /** What the preview drew for this option, when a renderer was supplied. */
  drawing?: string;
}

/**
 * Pairs of options that intentionally resolve to the same drawing. Keep this explicit and justified:
 * an unlisted duplicate fails the audit test. Format `field:valueA=valueB`.
 */
export const INTENTIONAL_SHARED_RENDER: ReadonlySet<string> = new Set<string>([]);

export const probeKey = (field: AppearanceFieldId, a: string, b: string) => `${field}:${a}=${b}`;

export const enumerateAppearanceOptions = (
  baseline: ResolvedProducerAppearance = DEFAULT_PRODUCER_APPEARANCE,
  render?: (npc: ModularNpcDefinition) => string,
  eraId = 'modern',
): AppearanceOptionProbe[] =>
  APPEARANCE_FIELDS.flatMap((field) =>
    field.options.map((option) => {
      const appearance = field.set(baseline, option.value);
      const npc = buildProducerNpc(appearance, 'Audit', eraId);
      return {
        field: field.id,
        value: option.value,
        appearance,
        npc,
        definitionKey: JSON.stringify(npc),
        layerKey: JSON.stringify(buildNpcLayerStack(npc)),
        drawing: render?.(npc),
      };
    }),
  );

/** Options inside one field that draw identically (and are not listed as intentional). */
export const findNoOpOptions = (probes: readonly AppearanceOptionProbe[], by: 'definitionKey' | 'layerKey' | 'drawing'): string[] => {
  const problems: string[] = [];
  for (const field of APPEARANCE_FIELDS) {
    const seen = new Map<string, string>();
    for (const probe of probes.filter((p) => p.field === field.id)) {
      const key = probe[by];
      if (key === undefined) continue;
      const other = seen.get(key);
      if (other !== undefined && !INTENTIONAL_SHARED_RENDER.has(probeKey(field.id, other, probe.value))) problems.push(probeKey(field.id, other, probe.value));
      else if (other === undefined) seen.set(key, probe.value);
    }
  }
  return problems;
};
