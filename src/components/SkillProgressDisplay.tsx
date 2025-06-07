
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
  // Safety check to prevent runtime errors
  if (!skills || typeof skills !== 'object') {
    console.warn('SkillProgressDisplay: skills prop is not a valid object:', skills);
    return (
      <div className={`skill-progress-display ${className}`}>
        <h3 className="text-lg font-bold text-white mb-4">Studio Skills</h3>
        <p className="text-gray-400">No skills data available</p>
      </div>
    );
  }

  const skillsArray = Object.values(skills);
  
  if (skillsArray.length === 0) {
    return (
      <div className={`skill-progress-display ${className}`}>
        <h3 className="text-lg font-bold text-white mb-4">Studio Skills</h3>
        <p className="text-gray-400">No skills learned yet</p>
      </div>
    );
  }

  return (
    <div className={`skill-progress-display space-y-3 ${className}`}>
      <h3 className="text-lg font-bold text-white mb-4">Studio Skills</h3>
      {skillsArray.map(skill => (
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
