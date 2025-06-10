import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GameState } from '@/types/game';
import { Card } from '@/components/ui/card';

interface RecruitmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  hireStaff: (staffId: string) => void; // Function to handle hiring
}

export const RecruitmentModal: React.FC<RecruitmentModalProps> = ({
  isOpen,
  onClose,
  gameState,
  hireStaff,
}) => {
  // Filter out candidates who have already been hired (if any)
  const availableCandidates = gameState.availableCandidates.filter(
    candidate => !gameState.hiredStaff.some(staff => staff.id === candidate.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800/90 text-white border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-white">Recruit Staff</DialogTitle>
          <DialogDescription className="text-gray-300">
            Review available candidates and hire new staff for your studio.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-80 overflow-y-auto">
          {availableCandidates.length === 0 ? (
            <p className="text-gray-400">No candidates available right now. Check back later!</p>
          ) : (
            availableCandidates.map(candidate => (
              <Card key={candidate.id} className="p-4 bg-gray-900/80 border-gray-700 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">{candidate.name} ({candidate.role})</h4>
                  <p className="text-sm text-gray-300">Salary: ${candidate.salary}/week</p>
                  {/* Display basic stats */}
                  <div className="text-xs text-gray-400 mt-1">
                    💡 Creativity: {candidate.primaryStats.creativity}, 🔧 Technical: {candidate.primaryStats.technical}, ⚡ Speed: {candidate.primaryStats.speed}
                    {candidate.primaryStats.songwriting && `, 📝 Songwriting: ${candidate.primaryStats.songwriting}`}
                    {candidate.primaryStats.arrangement && `, 🎼 Arrangement: ${candidate.primaryStats.arrangement}`}
                    {candidate.primaryStats.ear && `, 👂 Ear: ${candidate.primaryStats.ear}`}
                    {candidate.primaryStats.soundDesign && `, 🎧 Sound Design: ${candidate.primaryStats.soundDesign}`}
                    {candidate.primaryStats.techKnowledge && `, 💻 Tech Knowledge: ${candidate.primaryStats.techKnowledge}`}
                    {candidate.primaryStats.mixing && `, 🎚️ Mixing: ${candidate.primaryStats.mixing}`}
                    {candidate.primaryStats.mastering && `, ✨ Mastering: ${candidate.primaryStats.mastering}`}
                  </div>
                   {candidate.genreAffinity && (
                     <div className="text-xs text-green-400">🎤 Genre Affinity: {candidate.genreAffinity.genre} (+{candidate.genreAffinity.bonus})</div>
                   )}
                </div>
                <Button size="sm" onClick={() => hireStaff(candidate.id)} className="bg-green-600 hover:bg-green-700">Hire</Button>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
