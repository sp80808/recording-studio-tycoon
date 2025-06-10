
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StaffMember, GameState } from '@/types/game';
import { availableTrainingCourses } from '@/data/training';

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
  gameState: GameState;
  sendStaffToTraining: (staffId: string, courseId: string) => void;
}

export const TrainingModal: React.FC<TrainingModalProps> = ({
  isOpen,
  onClose,
  staff,
  gameState,
  sendStaffToTraining
}) => {
  // Don't render the modal if staff is null
  if (!staff) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-600 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Training for {staff.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {availableTrainingCourses.map(course => (
            <Card key={course.id} className="p-4 bg-gray-800 border-gray-600">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-lg font-bold text-white">{course.name}</h4>
                  <p className="text-gray-300 text-sm mt-1">{course.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-red-400 font-bold">${course.cost}</div>
                  <div className="text-sm text-gray-400">{course.duration} days</div>
                </div>
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="text-sm font-semibold text-yellow-400">Benefits:</div>
                {course.effects.statBoosts && (
                  <div className="text-xs text-gray-300">
                    Stats: {Object.entries(course.effects.statBoosts).map(([stat, boost]) => 
                      `+${boost} ${stat}`
                    ).join(', ')}
                  </div>
                )}
                {course.effects.skillXP && (
                  <div className="text-xs text-green-400">
                    +{course.effects.skillXP.amount} {course.effects.skillXP.skill} XP
                  </div>
                )}
                {course.effects.specialEffects && (
                  <div className="text-xs text-purple-400">
                    Special: {course.effects.specialEffects.join(', ')}
                  </div>
                )}
              </div>
              
              <Button 
                onClick={() => {
                  sendStaffToTraining(staff.id, course.id);
                  onClose();
                }}
                disabled={gameState.money < course.cost || staff.status !== 'Idle'}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
              >
                {gameState.money < course.cost ? 'Insufficient Funds' : 
                 staff.status !== 'Idle' ? 'Staff Unavailable' : 'Send to Training'}
              </Button>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
