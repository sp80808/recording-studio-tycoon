import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EraSelectionModal, Era, AVAILABLE_ERAS } from '@/components/EraSelectionModal';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';

interface SplashScreenProps {
  onStartGame: (era: Era) => void;
  onLoadGame: () => void;
  hasSaveGame: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onStartGame, 
  onLoadGame, 
  hasSaveGame 
}) => {
  const [showEraSelection, setShowEraSelection] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);
  const backgroundMusic = useBackgroundMusic();

  const gameTips = [
    "💡 Higher skill levels unlock better equipment and more lucrative projects!",
    "🎵 Each music genre has different market demands - diversify your expertise!",
    "👥 Hiring skilled staff can dramatically improve your studio's efficiency!",
    "💰 Reputation affects the quality of clients who approach your studio!",
    "🎸 Some equipment works better with specific genres - choose wisely!",
    "📈 Market trends change over time - adapt your strategy accordingly!",
    "⭐ Completing projects with high quality builds your reputation faster!",
    "🏆 Each era presents unique challenges and opportunities!"
  ];

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % gameTips.length);
    }, 3000);

    return () => clearInterval(tipInterval);
  }, [gameTips.length]);

  const handleStartNewGame = () => {
    // Ensure music starts playing on user interaction
    if (!backgroundMusic.isPlaying) {
      backgroundMusic.playTrack(1);
    }
    setShowEraSelection(true);
  };

  const handleLoadGame = () => {
    // Ensure music starts playing on user interaction
    if (!backgroundMusic.isPlaying) {
      backgroundMusic.playTrack(1);
    }
    onLoadGame();
  };

  const handleEraSelection = (era: Era) => {
    setShowEraSelection(false);
    onStartGame(era);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="bg-gray-900/95 border-gray-600 p-8 max-w-2xl w-full text-center backdrop-blur-sm">
          {/* Game Title */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-4">
              🎵 Recording Studio Tycoon 🎵
            </h1>
            <p className="text-xl text-gray-300 mb-2">
              Build Your Musical Empire
            </p>
            <p className="text-gray-400 text-sm">
              From analog beginnings to digital dominance
            </p>
          </div>

          {/* Animated Feature Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:bg-gray-700/50 transition-colors">
              <div className="text-2xl mb-2">🎤</div>
              <div className="text-sm text-gray-300">Record</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:bg-gray-700/50 transition-colors">
              <div className="text-2xl mb-2">🎛️</div>
              <div className="text-sm text-gray-300">Mix</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:bg-gray-700/50 transition-colors">
              <div className="text-2xl mb-2">💿</div>
              <div className="text-sm text-gray-300">Master</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:bg-gray-700/50 transition-colors">
              <div className="text-2xl mb-2">📈</div>
              <div className="text-sm text-gray-300">Profit</div>
            </div>
          </div>

          {/* Game Tip Carousel */}
          <Card className="bg-gray-800/30 border-gray-600 p-4 mb-8">
            <div className="text-yellow-400 text-sm font-medium mb-2">Pro Tip:</div>
            <div className="text-gray-300 text-sm h-12 flex items-center justify-center">
              {gameTips[currentTip]}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={handleStartNewGame}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg font-semibold"
            >
              🎯 Start New Game
            </Button>

            {hasSaveGame && (
              <Button
                onClick={handleLoadGame}
                variant="outline"
                className="w-full bg-gray-700/30 border-gray-600 text-gray-300 hover:bg-gray-600/50 py-3"
              >
                📁 Continue Game
              </Button>
            )}

            <div className="text-xs text-gray-500 mt-6">
              <p>Choose your era and build the studio of your dreams!</p>
              <p className="mt-1">Each era offers unique challenges, equipment, and music trends.</p>
            </div>
          </div>

          {/* Version/Credits */}
          <div className="mt-8 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              Recording Studio Tycoon v1.0 | Built with ❤️ for music lovers
            </p>
          </div>
        </Card>
      </div>

      {/* Era Selection Modal */}
      <EraSelectionModal
        isOpen={showEraSelection}
        onSelectEra={handleEraSelection}
        onClose={() => setShowEraSelection(false)}
      />
    </>
  );
};
