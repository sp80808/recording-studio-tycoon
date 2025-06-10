
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { GameState, StaffMember, Minigame } from '@/types/game';
import { getStaffStatusColor, getEnergyColor } from '@/utils/staffUtils';

interface StaffModalProps {
  gameState: GameState;
  showStaffModal: boolean;
  setShowStaffModal: (show: boolean) => void;
  assignStaffToProject: (staffId: string) => void;
  unassignStaffFromProject: (staffId: string) => void;
  toggleStaffRest: (staffId: string) => void;
  openTrainingModal?: (staff: StaffMember) => void;
  startMinigame?: (staffId: string, minigame: Minigame) => void;
}

export const StaffModal: React.FC<StaffModalProps> = ({
  gameState,
  showStaffModal,
  setShowStaffModal,
  assignStaffToProject,
  unassignStaffFromProject,
  toggleStaffRest,
  openTrainingModal,
  startMinigame
}) => {
  return (
    <Dialog open={showStaffModal} onOpenChange={setShowStaffModal}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-gray-800/80 hover:bg-gray-700/80 text-white border-gray-600">
          My Staff 👥
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-600 text-white max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-white">Staff Management</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {gameState.hiredStaff.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No staff hired yet. Visit the recruitment center to hire your first team members!
            </div>
          ) : (
            gameState.hiredStaff.map(staff => (
              <Card key={staff.id} className="p-4 bg-gray-800 border-gray-600">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-white">{staff.name}</h4>
                    <p className="text-gray-300">{staff.role} - Level {staff.levelInRole}</p>
                    {staff.status === 'Training' && staff.trainingEndDay && (
                      <p className="text-yellow-400 text-sm">
                        Training until Day {staff.trainingEndDay}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getStaffStatusColor(staff.status)}`}>{staff.status}</div>
                    <div className="text-sm text-gray-400">${staff.salary}/week</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-blue-400 font-bold">{staff.primaryStats.creativity}</div>
                    <div className="text-xs text-gray-400">Creativity</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-bold">{staff.primaryStats.technical}</div>
                    <div className="text-xs text-gray-400">Technical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-yellow-400 font-bold">{staff.primaryStats.speed}</div>
                    <div className="text-xs text-gray-400">Speed</div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">Energy</span>
                    <span className={getEnergyColor(staff.energy)}>{staff.energy}/100</span>
                  </div>
                  <Progress value={staff.energy} className="h-2" />
                </div>
                
                {staff.genreAffinity && (
                  <div className="mb-3 text-sm">
                    <span className="text-purple-400">Genre Affinity: </span>
                    <span className="text-white">{staff.genreAffinity.genre} (+{staff.genreAffinity.bonus}%)</span>
                  </div>
                )}
                
                <div className="flex gap-2 flex-wrap">
                  {staff.status === 'Idle' && gameState.activeProject && (
                    <Button 
                      size="sm" 
                      onClick={() => assignStaffToProject(staff.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Assign to Project
                    </Button>
                  )}
                  
                  {staff.status === 'Working' && (
                    <Button 
                      size="sm" 
                      onClick={() => unassignStaffFromProject(staff.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Unassign
                    </Button>
                  )}
                  
                  {staff.status !== 'Working' && staff.status !== 'Training' && (
                    <Button 
                      size="sm" 
                      onClick={() => toggleStaffRest(staff.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {staff.status === 'Resting' ? 'Stop Resting' : 'Rest'}
                    </Button>
                  )}

                  {staff.status === 'Idle' && openTrainingModal && (
                    <Button 
                      size="sm" 
                      onClick={() => openTrainingModal(staff)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Send to Training
                    </Button>
                  )}
                  {staff.status === 'Idle' && startMinigame && (
                    <Button 
                      size="sm" 
                      onClick={() => console.log('Open minigame selection')}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      Practice
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
