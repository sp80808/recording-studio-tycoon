import React, { useMemo } from 'react';
import { canAffordSubplotOption, type PendingSubplotEvent } from '@/narrative/branchingStorylineEngine';
import { resolveSubplotStagePresentation } from '@/narrative/subplotPresentation';
import type { GameState } from '@/types/game';
import { StoryDecisionModal, type DecisionContent } from './StoryDecisionModal';

interface StoryEventModalProps {
  event: PendingSubplotEvent | null;
  gameState: GameState;
  open: boolean;
  onChoose: (optionId: string) => void;
  onDeferred: () => void;
  onDone: () => void;
}

/** Emergent subplot beat: a two- or three-part story with honest costs — unaffordable options are disabled, not hidden. */
export const StoryEventModal: React.FC<StoryEventModalProps> = ({ event, gameState, open, onChoose, onDeferred, onDone }) => {
  const content = useMemo<DecisionContent | null>(() => {
    if (!event) return null;
    const { subplot, stage, active } = event;
    const presented = resolveSubplotStagePresentation(stage, gameState);
    return {
      key: `${subplot.id}:${active.currentStage}`,
      kicker: subplot.kicker ?? 'STUDIO STORY',
      badge: `Part ${stage.stageNumber} of ${subplot.stages.length}`,
      title: presented.title,
      context: presented.context,
      prompt: 'What do you do?',
      options: presented.options.map((o) => ({
        id: o.id,
        label: o.label,
        flavorText: o.flavorText,
        moneyDelta: o.consequences.moneyDelta,
        repDelta: o.consequences.repDelta,
        xpDelta: o.consequences.xpDelta,
        affordable: canAffordSubplotOption(gameState, o),
        outcome: o.consequences.narrativeOutcome,
      })),
    };
    // money changes affordability; flags change presentation; day changes nothing visible.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, gameState.money, gameState.storylineState?.storyFlags]);

  return (
    <StoryDecisionModal
      content={content}
      open={open}
      commitLabel="Commit to this choice"
      onCommit={onChoose}
      onDeferred={onDeferred}
      onDone={onDone}
    />
  );
};
