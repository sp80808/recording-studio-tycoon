import React, { useMemo } from 'react';
import type { StorylineBranchOption, StorylineNode } from '@/narrative/branchingStorylineEngine';
import { getRivalAccent, initialsOf } from '@/narrative/rivalCast';
import { StoryDecisionModal, type DecisionContent } from './StoryDecisionModal';

interface StorylineBranchModalProps {
  isOpen: boolean;
  node: StorylineNode | null;
  onChoose: (option: StorylineBranchOption) => void;
  onClose: () => void;
}

/** Campaign crossroads — the Act I/II branch choice, presented through the shared story decision popup. */
export const StorylineBranchModal: React.FC<StorylineBranchModalProps> = ({ isOpen, node, onChoose, onClose }) => {
  const dilemma = node?.branchDilemma ?? null;

  const content = useMemo<DecisionContent | null>(() => {
    if (!node || !dilemma) return null;
    return {
      key: `branch:${node.id}`,
      kicker: dilemma.kicker,
      badge: `Act ${node.act} · Crossroads`,
      title: node.title,
      context: dilemma.context,
      prompt: 'Choose your studio trajectory',
      speaker: {
        name: node.rivalName,
        initials: initialsOf(node.rivalName),
        accent: getRivalAccent(node.rivalStudioId),
        line: node.rivalDialogue,
      },
      options: dilemma.options.map((option) => ({
        id: option.id,
        label: option.label,
        flavorText: option.flavorText,
        tag: option.playstyleTag,
        moneyDelta: option.consequences.moneyDelta,
        repDelta: option.consequences.repDelta,
        affordable: true,
        outcome: option.consequences.narrativeOutcome,
      })),
    };
  }, [node, dilemma]);

  return (
    <StoryDecisionModal
      content={content}
      open={isOpen}
      commitLabel="Lock in this path"
      continueLabel="Advance the campaign"
      onCommit={(optionId) => {
        const option = dilemma?.options.find((o) => o.id === optionId);
        if (option) onChoose(option);
      }}
      onDeferred={onClose}
      onDone={onClose}
    />
  );
};
