import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '@/types/game';

interface ProjectCompletionModalProps {
  project: Project;
  onClose: () => void;
}

export const ProjectCompletionModal: React.FC<ProjectCompletionModalProps> = ({
  project,
  onClose
}) => {
  const qualityScore = project.qualityScore || 0;
  const efficiencyScore = project.efficiencyScore || 0;
  const finalScore = Math.floor((qualityScore + efficiencyScore) / 2);
  const payout = Math.floor(project.payoutBase * (finalScore / 100));
  const repGain = Math.floor(project.repGainBase * (finalScore / 100));

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 p-6 rounded-lg w-[600px]"
      >
        <h2 className="text-2xl font-bold text-white mb-4">Project Complete!</h2>
        
        <div className="space-y-4">
          {/* Project Info */}
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="text-xl text-white mb-2">{project.title}</h3>
            <p className="text-gray-400">{project.description}</p>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded">
              <h4 className="text-sm text-gray-400 mb-1">Quality Score</h4>
              <div className="flex items-center">
                <div className="w-full bg-gray-700 rounded-full h-2 mr-2">
                  <motion.div
                    className="bg-blue-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${qualityScore}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <span className="text-white font-medium">{qualityScore}%</span>
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded">
              <h4 className="text-sm text-gray-400 mb-1">Efficiency Score</h4>
              <div className="flex items-center">
                <div className="w-full bg-gray-700 rounded-full h-2 mr-2">
                  <motion.div
                    className="bg-green-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${efficiencyScore}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <span className="text-white font-medium">{efficiencyScore}%</span>
              </div>
            </div>
          </div>

          {/* Rewards */}
          <div className="bg-gray-800 p-4 rounded">
            <h4 className="text-sm text-gray-400 mb-2">Rewards</h4>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-2xl mr-2">💰</span>
                <span className="text-white font-medium">+${payout}</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-2">⭐</span>
                <span className="text-white font-medium">+{repGain} Reputation</span>
              </div>
            </div>
          </div>

          {/* Final Score */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded">
            <h4 className="text-sm text-white/80 mb-1">Final Score</h4>
            <div className="flex items-center justify-between">
              <span className="text-2xl text-white font-bold">{finalScore}%</span>
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-2xl ${
                      i < Math.floor(finalScore / 20) ? 'text-yellow-400' : 'text-gray-600'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 p-3 bg-blue-600 text-white rounded-lg font-medium
                     hover:bg-blue-700 transition-colors"
        >
          Continue
        </button>
      </motion.div>
    </div>
  );
}; 