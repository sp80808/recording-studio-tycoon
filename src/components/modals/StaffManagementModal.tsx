
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GameState, StaffMember } from '@/types/game';
import { Users, Battery, Zap } from 'lucide-react';

const getStaffStatusColor = (status: string) => {
  switch (status) {
    case 'Working': return 'text-blue-400';
    case 'Resting': return 'text-yellow-400';
    case 'Training': return 'text-purple-400';
    case 'On Tour': return 'text-green-400';
    default: return 'text-gray-400';
  }
};

const getEnergyColor = (energy: number) => {
  if (energy > 75) return 'text-green-400';
  if (energy >= 40) return 'text-yellow-400';
  return 'text-red-400';
};

interface StaffManagementModalProps {
  gameState: GameState;
  showStaffModal: boolean;
  setShowStaffModal: (show: boolean) => void;
  hireStaff: (candidateIndex: number) => boolean;
  refreshCandidates: () => void;
  assignStaffToProject: (staffId: string) => void;
  unassignStaffFromProject: (staffId: string) => void;
  toggleStaffRest: (staffId: string) => void;
  openTrainingModal: (staff: StaffMember) => boolean;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  gameState,
  showStaffModal,
  setShowStaffModal,
  hireStaff,
  refreshCandidates,
  assignStaffToProject,
  unassignStaffFromProject,
  toggleStaffRest,
  openTrainingModal
}) => {
  const assignedStaff = gameState.hiredStaff?.filter(s => s.assignedProjectId === gameState.activeProject?.id) || [];
  const availableStaff = gameState.hiredStaff?.filter(s => s.assignedProjectId !== gameState.activeProject?.id) || [];

  return (
    <Dialog open={showStaffModal} onOpenChange={setShowStaffModal}>
      <DialogContent className="bg-gray-900 border-gray-600 text-white max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Staff Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 max-h-[600px] overflow-y-auto">
          {/* Project Assignment Section */}
          {gameState.activeProject && (
            <div>
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Assigned to "{gameState.activeProject.title}"
              </h3>
              <div className="grid gap-3">
                {assignedStaff.length === 0 ? (
                  <div className="text-center text-gray-400 py-4 border border-gray-700 rounded bg-gray-800/50">
                    No staff assigned to this project
                  </div>
                ) : (
                  assignedStaff.map(staff => (
                    <Card key={staff.id} className="p-4 bg-green-900/20 border-green-700">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div>
                            <h4 className="font-bold text-white">{staff.name}</h4>
                            <p className="text-sm text-green-400">{staff.role} • Level {staff.levelInRole}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Battery className={`w-4 h-4 ${getEnergyColor(staff.energy || 100)}`} />
                            <span className={`text-sm font-medium ${getEnergyColor(staff.energy || 100)}`}>
                              {staff.energy || 100}%
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => unassignStaffFromProject(staff.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Unassign
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Available Staff Section */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3">Available Staff</h3>
            <div className="grid gap-3">
              {availableStaff.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <div>No staff members hired yet.</div>
                  <div className="text-sm mt-2">Visit the Recruitment Center to hire your first team member!</div>
                </div>
              ) : (
                availableStaff.map(staff => (
                  <Card key={staff.id} className="p-4 bg-gray-800 border-gray-600 hover:bg-gray-750 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-white">{staff.name}</h4>
                        <p className="text-purple-400">{staff.role} • Level {staff.levelInRole}</p>
                        <p className={`text-sm font-medium ${getStaffStatusColor(staff.status)}`}>
                          {staff.status}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Battery className={`w-4 h-4 ${getEnergyColor(staff.energy || 100)}`} />
                          <span className={`text-sm font-bold ${getEnergyColor(staff.energy || 100)}`}>
                            {staff.energy || 100}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">${staff.salary}/day</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                      <div className="text-center">
                        <div className="text-blue-400 font-bold">{staff.primaryStats.creativity}</div>
                        <div className="text-gray-400">Creativity</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-400 font-bold">{staff.primaryStats.technical}</div>
                        <div className="text-gray-400">Technical</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-400 font-bold">{staff.primaryStats.speed}</div>
                        <div className="text-gray-400">Speed</div>
                      </div>
                    </div>

                    {staff.genreAffinity && (
                      <div className="mb-3 text-xs">
                        <span className="text-purple-400">Specialty: </span>
                        <span className="text-white">{staff.genreAffinity.genre} (+{staff.genreAffinity.bonus}%)</span>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {gameState.activeProject && staff.status === 'Idle' && (
                        <Button 
                          size="sm"
                          onClick={() => assignStaffToProject(staff.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Assign to Project
                        </Button>
                      )}
                      
                      {staff.status !== 'Working' && staff.status !== 'Training' && (
                        <Button 
                          size="sm"
                          onClick={() => toggleStaffRest(staff.id)}
                          variant="outline"
                          className="border-gray-600 hover:bg-gray-700"
                        >
                          {staff.status === 'Resting' ? 'Stop Resting' : 'Send to Rest'}
                        </Button>
                      )}
                      
                      {staff.status === 'Idle' && gameState.playerData.level >= 3 && (
                        <Button 
                          size="sm"
                          onClick={() => openTrainingModal(staff)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Training
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
