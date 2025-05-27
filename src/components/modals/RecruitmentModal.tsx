
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GameState } from '@/types/game';

interface RecruitmentModalProps {
  gameState: GameState;
  showRecruitmentModal: boolean;
  setShowRecruitmentModal: (show: boolean) => void;
  hireStaff: (candidateIndex: number) => boolean;
}

export const RecruitmentModal: React.FC<RecruitmentModalProps> = ({
  gameState,
  showRecruitmentModal,
  setShowRecruitmentModal,
  hireStaff
}) => {
  return (
    <Dialog open={showRecruitmentModal} onOpenChange={setShowRecruitmentModal}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-gray-800/80 hover:bg-gray-700/80 text-white border-gray-600">
          Recruit Staff 🎯
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-600 text-white max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-white">Recruitment Center</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {gameState.availableCandidates.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No candidates available. Check back in a few days!
            </div>
          ) : (
            gameState.availableCandidates.map((candidate, index) => (
              <Card key={index} className="p-4 bg-gray-800 border-gray-600">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-white">{candidate.name}</h4>
                    <p className="text-gray-300">{candidate.role}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-red-400 font-bold">${candidate.salary * 2} signing fee</div>
                    <div className="text-sm text-gray-400">${candidate.salary}/week salary</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-blue-400 font-bold">{candidate.primaryStats.creativity}</div>
                    <div className="text-xs text-gray-400">Creativity</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-bold">{candidate.primaryStats.technical}</div>
                    <div className="text-xs text-gray-400">Technical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-yellow-400 font-bold">{candidate.primaryStats.speed}</div>
                    <div className="text-xs text-gray-400">Speed</div>
                  </div>
                </div>
                
                {candidate.genreAffinity && (
                  <div className="mb-3 text-sm">
                    <span className="text-purple-400">Genre Affinity: </span>
                    <span className="text-white">{candidate.genreAffinity.genre} (+{candidate.genreAffinity.bonus}%)</span>
                  </div>
                )}
                
                <Button 
                  onClick={() => hireStaff(index)}
                  disabled={gameState.money < candidate.salary * 2}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                >
                  {gameState.money < candidate.salary * 2 ? 'Insufficient Funds' : 'Hire'}
                </Button>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
