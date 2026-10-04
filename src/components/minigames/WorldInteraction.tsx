import React, { useEffect, useState } from 'react';
import type { MinigameType } from './MinigameManager';
import { computeMinigameReward } from './minigameRewards';
import { useCutsceneQueue } from '@/hooks/useCutsceneQueue';
import { toast } from '@/hooks/use-toast';
import { tc } from '@/i18n/content';

export interface WorldInteractionProps {
  isOpen: boolean;
  onClose: () => void;
  gameType: MinigameType;
  onReward: (creativityBonus: number, technicalBonus: number, xpBonus: number, minigameType?: MinigameType, rawScore?: number) => void;
  rewardMode?: 'project' | 'practice';
}

/**
 * Harness for diegetic interactions (studio-as-controller).
 * Rather than hiding the world behind a Dialog, this renders an invisible
 * overlay that captures input and orchestrates the on-floor minigame while
 * the camera zooms in.
 */
export const WorldInteraction: React.FC<WorldInteractionProps> = ({
  isOpen,
  onClose,
  gameType,
  onReward,
  rewardMode = 'project',
}) => {
  const [showGame, setShowGame] = useState(true);
  const enqueueCutscene = useCutsceneQueue((s) => s.enqueue);

  useEffect(() => {
    if (isOpen) {
      setShowGame(true);
    }
  }, [isOpen]);

  const handleGameComplete = (score: number, success?: boolean) => {
    setShowGame(false);

    const { creativityBonus, technicalBonus, xpBonus } = computeMinigameReward(gameType, score, success);

    onReward(creativityBonus, technicalBonus, xpBonus, gameType, score);

    if (rewardMode === 'practice') {
      toast({
        title: tc('mg.WorldInteraction.practice_take_in', '🎧 Practice take in'),
        description: score >= 700
          ? tc('mg.WorldInteraction.practice_strong', 'Strong run — reviewing the tape for craft XP.')
          : score >= 400
            ? tc('mg.WorldInteraction.practice_ok', 'Serviceable take. Room to tighten the next pass.')
            : tc('mg.WorldInteraction.practice_rough', 'Rough pass. Little craft XP this time.'),
        className: 'bg-stone-800 border-stone-600 text-white',
        variant: success === false ? 'destructive' : 'default',
      });
      return;
    }

    if (score >= 850 || score <= 300) {
      enqueueCutscene({
        id: `outcome-${Date.now()}`,
        type: 'outcome_vignette',
        payload: { score, gameType }
      });
    } else {
      toast({
        title: tc('mg.WorldInteraction.complete_title', '🎮 Minigame Complete!'),
        description: tc('mg.WorldInteraction.rewards', 'Rewards: +{{c}} C, +{{t}} T, +{{xp}} XP', { c: creativityBonus, t: technicalBonus, xp: xpBonus }),
        className: "bg-stone-800 border-stone-600 text-white",
        variant: success === false ? "destructive" : "default",
      });
    }
  };

  const handleClose = () => {
    setShowGame(false);
    onClose();
  };

  if (!isOpen || !showGame) return null;

  return (
    <div className="absolute inset-0 z-40 pointer-events-none flex flex-col items-center justify-end pb-8">
      {/* 
        This is an invisible overlay that holds the interactive tools.
        The Pixi canvas underneath remains fully visible and mounted.
      */}
      <div className="pointer-events-auto">
        <div className="bg-black/80 text-white p-4 rounded border border-stone-700 max-w-sm text-center backdrop-blur shadow-2xl">
          <p className="text-sm text-stone-300 mb-4">
            Diegetic migration for <strong className="text-amber-400">{gameType}</strong> is pending (see bead 1et.2+).
          </p>
          <div className="flex gap-3 justify-center">
            <button 
              className="rst-btn rst-btn-ghost"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button 
              className="rst-btn rst-btn-primary"
              onClick={() => handleGameComplete(850, true)}
            >
              Auto-win (Dev)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
