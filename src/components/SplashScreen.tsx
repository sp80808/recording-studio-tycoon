import React, { useState, useEffect } from 'react';
import { KenneyButton } from './minigames/MinigameChrome';
import { Button } from '@/components/ui/button';
import { EraSelectionModal, Era } from '@/components/EraSelectionModal'; // AVAILABLE_ERAS removed as it's not used directly here
import { SettingsModal } from '@/components/modals/SettingsModal'; // Added SettingsModal import
import { useSettings } from '@/contexts/SettingsContext'; // Added useSettings import
import { gameAudio } from '@/utils/audioSystem'; // Added gameAudio import
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useFullscreen } from '@/hooks/useFullscreen';
import { BriefcaseBusiness, Headphones, Maximize, Minimize, Play, Settings, Disc3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
      <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#070a14] p-4 text-white">
        <div aria-hidden="true" className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_20%_15%,rgba(99,102,241,.3),transparent_25%),radial-gradient(circle_at_80%_75%,rgba(245,158,11,.16),transparent_30%),linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:auto,auto,22px_22px,22px_22px]" />
        <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-[min(95vw,760px)] w-[min(95vw,760px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-300/10 shadow-[0_0_150px_45px_rgba(79,70,229,.16)]" />
        {/* Fullscreen button for the entire page */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className="absolute right-4 top-4 z-50 text-slate-300 hover:bg-white/10 hover:text-white"
          aria-label={isFullscreen ? t('exit_fullscreen_aria_label') : t('enter_fullscreen_aria_label')}
        >
          {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
        </Button>

        <section className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center py-12 text-center">
          <div aria-hidden="true" className="splash-record mb-5 grid h-20 w-20 place-items-center rounded-full border-4 border-slate-700 bg-slate-950 shadow-[0_0_60px_#8b5cf633]">
            <Disc3 size={50} className="text-amber-200" />
          </div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[.4em] text-indigo-200">Every session tells a story</p>
          <h1 className="text-4xl font-black leading-[.95] tracking-tight sm:text-6xl">
            <span className="block text-xl font-medium tracking-[.24em] text-slate-200 sm:text-3xl">RECORDING</span>
            <span className="mt-2 block bg-gradient-to-b from-amber-100 via-amber-300 to-orange-400 bg-clip-text text-transparent">STUDIO TYCOON</span>
          </h1>
          <p className="mt-4 text-base font-medium text-indigo-100 sm:text-lg">Build your musical empire.</p>
          <div className="my-6 flex items-center gap-3 text-xs text-slate-400" aria-label="Record, mix, master, release">
            <Headphones size={16} className="text-sky-300" />Record<span aria-hidden="true">·</span>Mix<span aria-hidden="true">·</span>Master<span aria-hidden="true">·</span><span className="text-amber-200">Release</span>
          </div>
          <div className="flex w-full max-w-xs flex-col gap-3">
            {hasSaveGame && <KenneyButton variant="green" onClick={handleLoadGame} className="splash-command flex min-h-14 items-center justify-center gap-2 text-base"><Play size={18} className="fill-current" />Continue shift</KenneyButton>}
            <KenneyButton variant={hasSaveGame ? 'blue' : 'green'} onClick={handleStartNewGame} className="splash-command flex min-h-14 items-center justify-center gap-2 text-base"><BriefcaseBusiness size={18} />Open a new studio</KenneyButton>
            <Button onClick={() => { if (settings.sfxEnabled) gameAudio.playClick(); setShowSettingsModal(true); }} variant="ghost" className="h-11 text-slate-400 hover:bg-white/5 hover:text-white"><Settings size={17} className="mr-2" />Settings</Button>
          </div>
          <p key={currentTip} className="mt-7 min-h-10 max-w-sm text-xs leading-relaxed text-slate-400 motion-safe:animate-in motion-safe:fade-in">{t(gameTipKeys[currentTip])}</p>
        </section>
      </main>

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
