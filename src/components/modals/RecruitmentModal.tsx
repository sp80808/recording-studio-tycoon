
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GameState } from '@/types/game';
import { Users } from 'lucide-react';

interface RecruitmentModalProps {
  gameState: GameState;
  showRecruitmentModal: boolean;
  setShowRecruitmentModal: (show: boolean) => void;
  hireStaff: (candidateIndex: number) => boolean;
  refreshCandidates: () => void;
}

export const RecruitmentModal: React.FC<RecruitmentModalProps> = ({
  gameState,
  showRecruitmentModal,
  setShowRecruitmentModal,
  hireStaff,
  refreshCandidates
}) => {
  return (
    <Dialog open={showRecruitmentModal} onOpenChange={setShowRecruitmentModal}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-gray-800/80 hover:bg-gray-700/80 text-white border-gray-600">
          <Users className="w-4 h-4 mr-2" />
          Recruitment Center
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-600 text-white max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Recruitment Center
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {gameState.availableCandidates.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <div>No candidates available right now.</div>
              <div className="text-sm mt-2">Check back in a few days or refresh the list!</div>
            </div>
          ) : (
            gameState.availableCandidates.map((candidate, index) => {
              const signingFee = candidate.salary * 3; // 3x daily salary as signing fee
              
              return (
                <Card key={index} className="p-4 bg-gray-800 border-gray-600 hover:bg-gray-750 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-lg font-bold text-white">{candidate.name}</h4>
                      <p className="text-purple-400 font-medium">{candidate.role}</p>
                      <p className="text-xs text-gray-400">Level {candidate.levelInRole} • {candidate.xpInRole} XP</p>
                    </div>
                    <div className="text-right">
                      <div className="text-red-400 font-bold">${signingFee} signing fee</div>
                      <div className="text-sm text-gray-400">${candidate.salary}/day salary</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center p-2 bg-gray-700 rounded">
                      <div className="text-blue-400 font-bold text-lg">{candidate.primaryStats.creativity}</div>
                      <div className="text-xs text-gray-400">Creativity</div>
                    </div>
                    <div className="text-center p-2 bg-gray-700 rounded">
                      <div className="text-green-400 font-bold text-lg">{candidate.primaryStats.technical}</div>
                      <div className="text-xs text-gray-400">Technical</div>
                    </div>
                    <div className="text-center p-2 bg-gray-700 rounded">
                      <div className="text-yellow-400 font-bold text-lg">{candidate.primaryStats.speed}</div>
                      <div className="text-xs text-gray-400">Speed</div>
                    </div>
                  </div>
                  
                  {candidate.genreAffinity && (
                    <div className="mb-3 p-2 bg-purple-900/30 rounded border border-purple-700">
                      <span className="text-purple-400 font-medium">Genre Specialist: </span>
                      <span className="text-white">{candidate.genreAffinity.genre}</span>
                      <span className="text-green-400 ml-2">+{candidate.genreAffinity.bonus}% bonus</span>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => hireStaff(index)}
                      disabled={gameState.money < signingFee}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                    >
                      {gameState.money < signingFee ? 'Insufficient Funds' : `Hire for $${signingFee}`}
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
        
        <div className="border-t border-gray-700 pt-4">
          <Button 
            onClick={refreshCandidates}
            disabled={gameState.money < 50}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
          >
            Find New Candidates ($50)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
