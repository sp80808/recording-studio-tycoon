import React, { useMemo } from 'react';
import { canAffordSubplotOption, type PendingSubplotEvent } from '@/narrative/branchingStorylineEngine';
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

/** Emergent subplot beat: a two-part story with honest costs — unaffordable options are disabled, not hidden. */
export const StoryEventModal: React.FC<StoryEventModalProps> = ({ event, gameState, open, onChoose, onDeferred, onDone }) => {
  const content = useMemo<DecisionContent | null>(() => {
    if (!event) return null;
    const { subplot, stage, active } = event;
    return {
      key: `${subplot.id}:${active.currentStage}`,
      kicker: subplot.kicker ?? 'STUDIO STORY',
      badge: `Part ${stage.stageNumber} of 2`,
      title: stage.title,
      context: stage.context,
      prompt: 'What do you do?',
      options: stage.options.map((o) => ({
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
    // money changes affordability; day changes nothing visible.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, gameState.money]);

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
