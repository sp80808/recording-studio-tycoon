import React from 'react';
import { StudioSkill } from '@/types/game';
import { XPProgressBar } from './XPProgressBar';

interface SkillProgressDisplayProps {
  skills: Record<string, StudioSkill>;
  className?: string;
}

export const SkillProgressDisplay: React.FC<SkillProgressDisplayProps> = ({
  skills,
  className = ""
}) => {
  return (
    <div className={`skill-progress-display space-y-3 ${className}`}>
      <h3 className="text-lg font-bold text-white mb-4">Studio Skills</h3>
      {Object.values(skills).map(skill => (
        <div key={skill.name} className="bg-gray-800/50 p-3 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">{skill.name}</span>
            <span className="text-sm text-gray-300">Level {skill.level}</span>
          </div>
          <XPProgressBar
            currentXP={skill.xp}
            xpToNext={skill.xpToNext}
            level={skill.level}
            showNumbers={false}
            className="mb-2"
          />
          <div className="text-xs text-gray-400">
            Bonus: +{skill.level * 5}% efficiency for {skill.name} projects
          </div>
        </div>
      ))}
    </div>
  );
}; 