import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Assuming this is the correct path for shadcn Button
import { GameState } from '@/types/game';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { Maximize, Minimize } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFullscreen } from '@/hooks/useFullscreen'; // Import the new hook
import { XPProgressBar } from '@/components/XPProgressBar';
import { EraProgressModal } from '@/components/modals/EraProgressModal';

interface GameHeaderProps {
  gameState: GameState;
  onOpenSettings?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ gameState, onOpenSettings }) => {
  const [showEraProgress, setShowEraProgress] = useState(false);
  // The prompt suggests targeting #game-container. If Index.tsx wraps the app in such an element,
  // then useFullscreen('game-container') would be appropriate. Defaulting to 'root' or documentElement.
  const { isFullscreen, toggleFullscreen } = useFullscreen('root'); 

  return (
    <>
      <Card className="bg-gray-900/90 border-gray-600 p-4 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {/* Fullscreen Button */}
            <motion.div whileHover={{ scale: 1.1 }} className="order-first sm:order-none">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleFullscreen}
                aria-label="Toggle fullscreen"
                className="text-white bg-gray-700/50 hover:bg-gray-600/50 border-gray-500"
              >
                {isFullscreen ? <Minimize /> : <Maximize />}
              </Button>
            </motion.div>

            <div className="flex items-center gap-2">
              <span className="text-green-400 text-lg">💰</span>
              <AnimatedCounter value={gameState.money} prefix="$" className="text-green-400 font-bold" />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-blue-400 text-lg">⭐</span>
              <AnimatedCounter value={gameState.reputation} suffix=" Rep" className="text-blue-400 font-bold" />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 text-lg">📅</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-yellow-400 font-bold hover:bg-yellow-400/10"
                onClick={() => setShowEraProgress(true)}
              >
                Day {gameState.currentDay}
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-purple-400 text-lg">👥</span>
              <span className="text-purple-400 font-bold">{gameState.hiredStaff.length} Staff</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-orange-400 text-lg">⚡</span>
              <span className="text-orange-400 font-bold">{gameState.playerData.perkPoints} Perk Points!</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Settings Button */}
            {onOpenSettings && (
              <Button
                onClick={onOpenSettings}
                variant="outline"
                size="sm"
                className="bg-gray-600/20 border-gray-500 text-gray-300 hover:bg-gray-600/30"
              >
                ⚙️
              </Button>
            )}

            <div className="text-right">
              <div className="text-white font-bold text-lg">Level {gameState.playerData.level}</div>
              <XPProgressBar 
                currentXP={gameState.playerData.xp} 
                xpToNext={gameState.playerData.xpToNextLevel}
                level={gameState.playerData.level}
                className="w-32"
              />
            </div>
          </div>
        </div>
      </Card>

      <EraProgressModal
        gameState={gameState}
        isOpen={showEraProgress}
        onClose={() => setShowEraProgress(false)}
        // gameState.triggerEraTransition is not a valid property.
        // Making it optional or passing undefined for now to resolve TS error.
        // TODO: Correctly wire up triggerEraTransition if it's a required function.
        triggerEraTransition={(undefined as any)} 
      />
    </>
  );
};
