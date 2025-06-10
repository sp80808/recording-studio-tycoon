import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProjectCompletionResult, PlayerAttributes, StudioSkill } from "@/types/game";
import { ProgressionPanel } from './modals/ProgressionPanel';

interface GameModalsProps {
  showReviewModal: boolean;
  setShowReviewModal: (show: boolean) => void;
  lastReview: ProjectCompletionResult['review'] | null;
  showProgressionModal: boolean;
  setShowProgressionModal: (show: boolean) => void;
  attributes: PlayerAttributes;
  attributePoints: number;
  perkPoints: number;
  level: number;
  studioSkills: Record<string, StudioSkill>;
  onSpendAttributePoint: (attribute: keyof PlayerAttributes) => void;
  onSpendPerkPoint: (attribute: keyof PlayerAttributes) => void;
}

export const GameModals: React.FC<GameModalsProps> = ({
  showReviewModal,
  setShowReviewModal,
  lastReview,
  showProgressionModal,
  setShowProgressionModal,
  attributes,
  attributePoints,
  perkPoints,
  level,
  studioSkills,
  onSpendAttributePoint,
  onSpendPerkPoint
}) => {
  return (
    <>
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="bg-gray-900 border-gray-600 text-white mx-4 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Project Complete! 🎉</DialogTitle>
          </DialogHeader>
          {lastReview && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">{lastReview.projectTitle}</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl mb-2">💙</div>
                  <div className="font-bold text-white">{lastReview.creativityPoints}</div>
                  <div className="text-sm text-gray-400">Creativity</div>
                </div>
                <div>
                  <div className="text-2xl mb-2">💚</div>
                  <div className="font-bold text-white">{lastReview.technicalPoints}</div>
                  <div className="text-sm text-gray-400">Technical</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">⭐</div>
                <div className="text-xl font-bold text-white">Quality Score: {lastReview.qualityScore}%</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Payment:</span>
                  <span className="text-green-400 font-bold">${lastReview.payout}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Reputation:</span>
                  <span className="text-blue-400 font-bold">+{lastReview.repGain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Experience:</span>
                  <span className="text-purple-400 font-bold">+{lastReview.xpGain} XP</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showProgressionModal} onOpenChange={setShowProgressionModal}>
        <DialogContent className="bg-gray-900 border-gray-600 text-white mx-4 max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Character Development</DialogTitle>
          </DialogHeader>
          <ProgressionPanel
            attributes={attributes}
            attributePoints={attributePoints}
            perkPoints={perkPoints}
            level={level}
            studioSkills={studioSkills}
            onSpendAttributePoint={onSpendAttributePoint}
            onSpendPerkPoint={onSpendPerkPoint}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
