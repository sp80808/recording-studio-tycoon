/**
 * Resolve subplot stage presentation from prior story flags.
 *
 * Stage definitions stay authored once; this layer swaps context / option copy so a later beat
 * can acknowledge what the player already chose without inventing a new dialogue engine.
 */
import type { GameState } from '@/types/game';
import type { SubplotStage, SubplotStageOption } from './branchingStorylineEngine';

export type PresentedSubplotOption = SubplotStageOption & {
  consequences: SubplotStageOption['consequences'];
};

export type PresentedSubplotStage = {
  title: string;
  context: string;
  options: PresentedSubplotOption[];
};

const firstMatchingFlag = (
  flags: Record<string, boolean | number | string> | undefined,
  keys: readonly string[],
): string | undefined => keys.find((k) => Boolean(flags?.[k]));

export const resolveSubplotStagePresentation = (
  stage: SubplotStage,
  state: GameState,
): PresentedSubplotStage => {
  const flags = state.storylineState?.storyFlags;
  const contextFlag = stage.contextByFlag
    ? firstMatchingFlag(flags, Object.keys(stage.contextByFlag))
    : undefined;
  const context =
    contextFlag && stage.contextByFlag?.[contextFlag]
      ? stage.contextByFlag[contextFlag]
      : stage.context;

  const options = stage.options.map((option) => {
    const variantKey = option.whenFlag
      ? firstMatchingFlag(flags, Object.keys(option.whenFlag))
      : undefined;
    const variant = variantKey ? option.whenFlag?.[variantKey] : undefined;
    if (!variant) return option;
    return {
      ...option,
      label: variant.label ?? option.label,
      flavorText: variant.flavorText ?? option.flavorText,
      consequences: {
        ...option.consequences,
        narrativeOutcome: variant.narrativeOutcome ?? option.consequences.narrativeOutcome,
      },
    };
  });

  return { title: stage.title, context, options };
};
