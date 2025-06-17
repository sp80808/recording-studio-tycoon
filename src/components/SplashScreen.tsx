import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EraSelectionModal, Era } from '@/components/EraSelectionModal'; // AVAILABLE_ERAS removed as it's not used directly here
import { SettingsModal } from '@/components/modals/SettingsModal'; // Added SettingsModal import
import { useSettings } from '@/contexts/SettingsContext'; // Added useSettings import
import { gameAudio } from '@/utils/audioSystem'; // Added gameAudio import
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useFullscreen } from '@/hooks/useFullscreen';
import { Maximize, Minimize } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Get version from README
const getGameVersion = () => {
  // This will be replaced with the actual version from README during build
  return '0.3.1';
};

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
  const [showSettingsModal, setShowSettingsModal] = useState(false); // Added state for settings modal
  const [currentTip, setCurrentTip] = useState(0);
  const backgroundMusic = useBackgroundMusic();
  const { isFullscreen, toggleFullscreen } = useFullscreen('root');
  const { t } = useTranslation();
  const { settings } = useSettings(); // Destructure settings

  const gameTipKeys = [
    'splash_tip_skills',
    'splash_tip_genres',
    'splash_tip_staff',
    'splash_tip_reputation',
    'splash_tip_equipment_genres',
    'splash_tip_market_trends',
    'splash_tip_quality',
    'splash_tip_era_challenges'
  ];

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % gameTipKeys.length);
    }, 3000);

    return () => clearInterval(tipInterval);
  }, [gameTipKeys.length]); // Added dependency

  const handleStartNewGame = async () => {
    await gameAudio.userGestureSignal(); // Activate audio context
    // Ensure music starts playing on user interaction
    if (!backgroundMusic.isPlaying && settings.musicEnabled) { // Check if music is enabled in settings
      backgroundMusic.playTrack(1);
    }
    setShowEraSelection(true);
  };

  const handleLoadGame = async () => {
    await gameAudio.userGestureSignal(); // Activate audio context
    // Ensure music starts playing on user interaction
    if (!backgroundMusic.isPlaying && settings.musicEnabled) { // Check if music is enabled in settings
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative">
        {/* Fullscreen button for the entire page */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 text-gray-300 hover:text-white z-50"
          aria-label={isFullscreen ? t('exit_fullscreen_aria_label') : t('enter_fullscreen_aria_label')}
        >
          {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
        </Button>

        <Card className="bg-gray-900/95 border-gray-600 p-8 max-w-2xl w-full text-center backdrop-blur-sm relative">
          {/* Game Title */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-4">
              🎵 {t('game_title_splash', 'Recording Studio Tycoon')} 🎵
            </h1>
            <p className="text-xl text-gray-300 mb-2">
              {t('splash_subtitle', 'Build Your Musical Empire')}
            </p>
            <p className="text-gray-400 text-sm">
              {t('splash_tagline', 'From analog beginnings to digital dominance')}
            </p>
          </div>

          {/* Animated Feature Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:bg-gray-700/50 transition-colors">
              <div className="text-2xl mb-2">🎤</div>
              <div className="text-sm text-gray-300">{t('splash_feature_record', 'Record')}</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:bg-gray-700/50 transition-colors">
              <div className="text-2xl mb-2">🎛️</div>
              <div className="text-sm text-gray-300">{t('splash_feature_mix', 'Mix')}</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:bg-gray-700/50 transition-colors">
              <div className="text-2xl mb-2">💿</div>
              <div className="text-sm text-gray-300">{t('splash_feature_master', 'Master')}</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:bg-gray-700/50 transition-colors">
              <div className="text-2xl mb-2">📈</div>
              <div className="text-sm text-gray-300">{t('splash_feature_profit', 'Profit')}</div>
            </div>
          </div>

          {/* Game Tip Carousel */}
          <Card className="bg-gray-800/30 border-gray-600 p-4 mb-8">
            <div className="text-yellow-400 text-sm font-medium mb-2">{t('splash_pro_tip', 'Pro Tip:')}</div>
            <div className="text-gray-300 text-sm h-12 flex items-center justify-center">
              {t(gameTipKeys[currentTip])}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={handleStartNewGame}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg font-semibold"
            >
              🎯 {t('splash_btn_new_game', 'Start New Game')}
            </Button>

            {hasSaveGame && (
              <Button
                onClick={handleLoadGame}
                variant="outline"
                className="w-full bg-gray-700/30 border-gray-600 text-gray-300 hover:bg-gray-600/50 py-3"
              >
                📁 {t('splash_btn_continue_game', 'Continue Game')}
              </Button>
            )}

            <Button
              onClick={() => {
                if (settings.sfxEnabled) gameAudio.playClick();
                setShowSettingsModal(true);
              }}
              variant="outline"
              className="w-full bg-gray-700/30 border-gray-600 text-gray-300 hover:bg-gray-600/50 py-3"
            >
              ⚙️ {t('splash_btn_settings', 'Settings')}
            </Button>

            <div className="text-xs text-gray-500 mt-6">
              <p>{t('splash_footer_1', 'Choose your era and build the studio of your dreams!')}</p>
              <p className="mt-1">{t('splash_footer_2', 'Each era offers unique challenges, equipment, and music trends.')}</p>
            </div>
          </div>

          {/* Version/Credits */}
          <div className="mt-8 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              Recording Studio Tycoon v{getGameVersion()} (alpha) | Built with ❤️ for music lovers
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

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          context="splash" // Pass splash context
        />
      )}
    </>
  );
};
