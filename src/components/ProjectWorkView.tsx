import React, { useEffect, useState } from 'react';
import { ProjectStage, MinigameTrigger, ProjectWorkHistoryEntry } from '@/types/game'; // Keep ProjectWorkHistoryEntry if it exists or update based on context
import { calculateStageProgress, checkMinigameTriggers } from '@/utils/projectWorkUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectWorkViewProps {
  stage: ProjectStage;
  onMinigameTrigger: (trigger: MinigameTrigger) => void;
}

export const ProjectWorkView: React.FC<ProjectWorkViewProps> = ({ stage, onMinigameTrigger }) => {
  const [progress, setProgress] = useState(0);
  const [activeTriggers, setActiveTriggers] = useState<MinigameTrigger[]>([]);
  const [recentWorkUnits, setRecentWorkUnits] = useState<ProjectWorkHistoryEntry[]>([]);

  useEffect(() => {
    // Update progress
    setProgress(calculateStageProgress(stage));

    // Check for minigame triggers
    const triggers = checkMinigameTriggers(stage);
    setActiveTriggers(triggers);

    // Update recent work units (last 5)
 setRecentWorkUnits(stage.history?.slice(-5) || []);
  }, [stage]);

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-300">Progress</span>
          <span className="text-sm text-gray-300">{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Recent Work Units */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Recent Work</h3>
        <div className="space-y-2">
          <AnimatePresence>
            {recentWorkUnits.map((unit) => (
              <motion.div
                key={unit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-between p-2 bg-gray-700 rounded"
              >
                <div className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    unit.type === 'creativity' ? 'bg-purple-500' : 'bg-blue-500'
                  }`} />
                  <span className="text-sm text-gray-300">
                    {unit.type === 'creativity' ? 'Creative' : 'Technical'} Work
                  </span>
                </div>
                <span className="text-sm text-gray-400">+{unit.value}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Minigame Triggers */}
      <AnimatePresence>
        {activeTriggers.map((trigger) => (
          <motion.div
            key={trigger.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mb-2"
          >
            <button
              onClick={() => onMinigameTrigger(trigger)}
              className="w-full p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg 
                         text-white font-medium hover:from-purple-700 hover:to-blue-700 
                         transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <span>Start {trigger.type.replace('_', ' ').toUpperCase()}</span>
                <span className="text-sm bg-white/20 px-2 py-1 rounded">
                  +{trigger.rewards.xp || trigger.rewards.money || trigger.rewards.reputation} XP
                </span>
              </div>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}; 