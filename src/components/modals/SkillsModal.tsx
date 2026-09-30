
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StudioSkill } from '@/types/game';

interface SkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  studioSkills: Record<string, StudioSkill>;
}

export const SkillsModal: React.FC<SkillsModalProps> = ({
  isOpen,
  onClose,
  studioSkills
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-stone-900 border-stone-600 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            📊 Studio Skills
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {Object.values(studioSkills).map((skill) => (
            <div key={skill.name} className="flex items-center justify-between p-4 bg-stone-800 rounded-lg border border-stone-600">
              <div className="flex items-center gap-3">
                <div>
                  <h4 className="font-bold text-white">{skill.name}</h4>
                  <div className="text-amber-300 font-medium">
                    Level {skill.level}
                  </div>
                  <div className="text-sm text-stone-400">
                    XP: {skill.xp} / {skill.xpToNext}
                  </div>
                </div>
              </div>
              <div className="w-32 bg-stone-700 rounded-full h-2">
                <div 
                  className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(skill.xp / skill.xpToNext) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
