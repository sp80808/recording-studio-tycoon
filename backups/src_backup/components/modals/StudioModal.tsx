import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GameState } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useSound } from '@/hooks/useSound';

interface StudioModalProps {
  gameState: GameState;
  isOpen: boolean;
  onClose: () => void;
  purchaseEquipment: (equipmentId: string) => void;
}

export const StudioModal: React.FC<StudioModalProps> = ({
  gameState,
  isOpen,
  onClose,
  purchaseEquipment
}) => {
  const { currentTheme } = useTheme();
  const { playSound, stopSound } = useSound();
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'night'>('day');
  const [weather, setWeather] = useState<'clear' | 'rainy' | 'cloudy'>('clear');
  const [ambientSound, setAmbientSound] = useState<'equipment' | 'rain' | 'none'>('equipment');

  // Simulate day/night cycle
  useEffect(() => {
    const hour = new Date().getHours();
    setTimeOfDay(hour >= 6 && hour < 18 ? 'day' : 'night');
  }, []);

  // Simulate weather changes
  useEffect(() => {
    const weatherInterval = setInterval(() => {
      const weathers: Array<'clear' | 'rainy' | 'cloudy'> = ['clear', 'rainy', 'cloudy'];
      setWeather(weathers[Math.floor(Math.random() * weathers.length)]);
    }, 300000); // Change weather every 5 minutes

    return () => clearInterval(weatherInterval);
  }, []);

  // Handle ambient sounds
  useEffect(() => {
    if (isOpen) {
      if (weather === 'rainy') {
        playSound('rain', { loop: true, volume: 0.3 });
        setAmbientSound('rain');
      } else {
        playSound('equipment', { loop: true, volume: 0.2 });
        setAmbientSound('equipment');
      }
    }
    return () => {
      stopSound('rain');
      stopSound('equipment');
    };
  }, [isOpen, weather]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-600 text-white max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-white">Your Studio</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 p-4">
          {/* Studio Visual Representation */}
          <div className="col-span-2 bg-gray-800 rounded-lg p-6 h-64 relative overflow-hidden">
            {/* Day/Night Cycle Overlay */}
            <motion.div
              className={`absolute inset-0 transition-colors duration-1000 ${
                timeOfDay === 'day' ? 'bg-blue-500/10' : 'bg-blue-900/30'
              }`}
              animate={{
                opacity: timeOfDay === 'day' ? 0.1 : 0.3
              }}
            />

            {/* Weather Effects */}
            <AnimatePresence>
              {weather === 'rainy' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-blue-500/20"
                >
                  <div className="rain-container" />
                </motion.div>
              )}
              {weather === 'cloudy' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.2 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gray-500/20"
                />
              )}
            </AnimatePresence>

            <div className="text-center mb-4 text-gray-300">Studio Layout</div>
            <div className="grid grid-cols-4 gap-2 h-full relative z-10">
              {/* Recording Booth */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-blue-900/50 rounded border-2 border-blue-400 p-2 text-center"
              >
                <div className="text-xs text-blue-300 mb-1">Recording</div>
                {gameState.ownedEquipment.filter(e => e.category === 'microphone').map(eq => (
                  <motion.div
                    key={eq.id}
                    className="text-lg"
                    whileHover={{ scale: 1.2 }}
                    animate={{
                      y: [0, -2, 0],
                      transition: { duration: 2, repeat: Infinity }
                    }}
                  >
                    {eq.icon}
                  </motion.div>
                ))}
              </motion.div>
              
              {/* Control Room */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-green-900/50 rounded border-2 border-green-400 p-2 text-center"
              >
                <div className="text-xs text-green-300 mb-1">Control</div>
                {gameState.ownedEquipment.filter(e => e.category === 'monitor').map(eq => (
                  <motion.div
                    key={eq.id}
                    className="text-lg"
                    whileHover={{ scale: 1.2 }}
                    animate={{
                      opacity: [0.7, 1, 0.7],
                      transition: { duration: 2, repeat: Infinity }
                    }}
                  >
                    {eq.icon}
                  </motion.div>
                ))}
              </motion.div>
              
              {/* Equipment Rack */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-yellow-900/50 rounded border-2 border-yellow-400 p-2 text-center"
              >
                <div className="text-xs text-yellow-300 mb-1">Rack</div>
                {gameState.ownedEquipment.filter(e => e.category === 'processor' || e.category === 'interface').map(eq => (
                  <motion.div
                    key={eq.id}
                    className="text-lg"
                    whileHover={{ scale: 1.2 }}
                    animate={{
                      rotate: [0, 5, 0, -5, 0],
                      transition: { duration: 3, repeat: Infinity }
                    }}
                  >
                    {eq.icon}
                  </motion.div>
                ))}
              </motion.div>
              
              {/* Live Room */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-purple-900/50 rounded border-2 border-purple-400 p-2 text-center"
              >
                <div className="text-xs text-purple-300 mb-1">Live Room</div>
                {gameState.ownedEquipment.filter(e => e.category === 'instrument').map(eq => (
                  <motion.div
                    key={eq.id}
                    className="text-lg"
                    whileHover={{ scale: 1.2 }}
                    animate={{
                      y: [0, 2, 0],
                      transition: { duration: 2, repeat: Infinity }
                    }}
                  >
                    {eq.icon}
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
          
          {/* Equipment List */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-bold mb-3 text-white">Owned Equipment</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {gameState.ownedEquipment.map(equipment => (
                <motion.div
                  key={equipment.id}
                  className="bg-gray-700 p-2 rounded text-sm"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{equipment.icon}</span>
                    <span className="text-white">{equipment.name}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
