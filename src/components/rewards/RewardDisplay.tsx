import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MinigameReward, Achievement } from '@/types/game';

interface RewardDisplayProps {
  rewards: MinigameReward[];
  achievements: Achievement[];
  onClose: () => void;
}

const RARITY_COLORS = {
  common: 'bg-gray-100 text-gray-800',
  uncommon: 'bg-green-100 text-green-800',
  rare: 'bg-blue-100 text-blue-800',
  epic: 'bg-purple-100 text-purple-800',
  legendary: 'bg-yellow-100 text-yellow-800'
};

const RARITY_ICONS = {
  common: '⭐',
  uncommon: '⭐⭐',
  rare: '⭐⭐⭐',
  epic: '⭐⭐⭐⭐',
  legendary: '⭐⭐⭐⭐⭐'
};

export const RewardDisplay: React.FC<RewardDisplayProps> = ({
  rewards,
  achievements,
  onClose
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Rewards & Achievements</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <AnimatePresence>
          {rewards.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6"
            >
              <h3 className="text-lg font-semibold mb-2">Rewards Earned</h3>
              <div className="space-y-2">
                {rewards.map((reward, index) => (
                  <motion.div
                    key={`${reward.type}-${index}`}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-lg ${RARITY_COLORS[reward.rarity]}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{reward.description}</p>
                        <p className="text-sm">
                          {RARITY_ICONS[reward.rarity]} {reward.amount}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {achievements.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold mb-2">Achievements Unlocked</h3>
              <div className="space-y-2">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: (rewards.length + index) * 0.1 }}
                    className="bg-gradient-to-r from-purple-100 to-pink-100 p-3 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{achievement.title}</p>
                        <p className="text-sm text-gray-600">
                          {achievement.description}
                        </p>
                      </div>
                      <div className="text-2xl">🏆</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Continue
          </button>
        </div>
      </motion.div>
    </div>
  );
}; 