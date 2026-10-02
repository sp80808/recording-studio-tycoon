
import { money } from '@/utils/displayMoney';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StaffMember, GameState } from '@/types/game';
import { availableTrainingCourses } from '@/data/training';
import { courseTeacherBlocker } from '@/rpg/staffCareer';
import { createInitialKnowHow, describeKnowHowGate, meetsKnowHowGate } from '@/rpg/studioKnowHow';

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

  const knowHow = gameState.studioKnowHow ?? createInitialKnowHow();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-stone-900 border-stone-600 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Training for {staff.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {availableTrainingCourses.map(course => (
            <Card key={course.id} className="p-4 bg-stone-800 border-stone-600">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-lg font-bold text-white">{course.name}</h4>
                  <p className="text-stone-300 text-sm mt-1">{course.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-red-400 font-bold">{money(course.cost)}</div>
                  <div className="text-sm text-stone-400">{course.duration} days</div>
                  {course.knowHow && (
                    <div className="text-xs text-cyan-300">{course.knowHow.cost} Know-How</div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="text-sm font-semibold text-yellow-400">Benefits:</div>
                {course.effects.statBoosts && (
                  <div className="text-xs text-stone-300">
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
              
              {course.careerXp && course.careerDiscipline && (
                <div className="text-xs text-sky-300 mb-2">Career: +{course.careerXp} {course.careerDiscipline} experience</div>
              )}
              {courseTeacherBlocker(course, gameState.hiredStaff, staff.id) && (
                <div className="text-xs text-amber-300 mb-2">{courseTeacherBlocker(course, gameState.hiredStaff, staff.id)}</div>
              )}
              <Button 
                onClick={() => {
                  sendStaffToTraining(staff.id, course.id);
                  onClose();
                }}
                disabled={!!courseTeacherBlocker(course, gameState.hiredStaff, staff.id) || gameState.money < course.cost || staff.status !== 'Idle' || (!!course.knowHow && !meetsKnowHowGate(knowHow, course.knowHow))}
                className="w-full bg-emerald-400/[0.14] ring-1 ring-inset ring-emerald-400/45 hover:bg-emerald-400/[0.24] disabled:bg-stone-600"
              >
                {course.knowHow && !meetsKnowHowGate(knowHow, course.knowHow) ? describeKnowHowGate(knowHow, course.knowHow) :
                 gameState.money < course.cost ? 'Insufficient Funds' : 
                 staff.status !== 'Idle' ? 'Staff Unavailable' : 'Send to Training'}
              </Button>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
