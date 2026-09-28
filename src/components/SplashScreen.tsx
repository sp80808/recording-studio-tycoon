import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { EraSelectionModal, Era } from '@/components/EraSelectionModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { useSettings } from '@/contexts/SettingsContext';
import { gameAudio } from '@/utils/audioSystem';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useFullscreen } from '@/hooks/useFullscreen';
import { 
  Play, 
  Sparkles, 
  Settings, 
  Maximize, 
  Minimize, 
  Volume2, 
  VolumeX, 
  Mic2, 
  Sliders, 
  Disc, 
  TrendingUp,
  Radio
} from 'lucide-react';
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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);
  const [isScratching, setIsScratching] = useState(false);
  const backgroundMusic = useBackgroundMusic();
  const { isFullscreen, toggleFullscreen } = useFullscreen('root');
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettings();

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
    }, 4000);

    return () => clearInterval(tipInterval);
  }, [gameTipKeys.length]);

  const handleStartNewGame = async () => {
    await gameAudio.userGestureSignal();
    if (settings.sfxEnabled) {
      gameAudio.playSound('button_click', 'sfx');
    }
    if (!backgroundMusic.isPlaying && settings.musicEnabled) {
      backgroundMusic.playTrack(1);
    }
    setShowEraSelection(true);
  };

  const handleLoadGame = async () => {
    await gameAudio.userGestureSignal();
    if (settings.sfxEnabled) {
      gameAudio.playSound('button_click', 'sfx');
    }
    if (!backgroundMusic.isPlaying && settings.musicEnabled) {
      backgroundMusic.playTrack(1);
    }
    onLoadGame();
  };

  const handleEraSelection = (era: Era) => {
    setShowEraSelection(false);
    onStartGame(era);
  };

  const handleTurntableTap = () => {
    setIsScratching(true);
    if (settings.sfxEnabled) {
      gameAudio.playSound('slider', 'sfx', 0.6);
    }
    setTimeout(() => setIsScratching(false), 700);
  };

  const toggleSound = () => {
    const nextState = !settings.musicEnabled;
    updateSetting('musicEnabled', nextState);
    if (nextState) {
      backgroundMusic.playTrack(1);
    } else {
      backgroundMusic.stop();
    }
  };

  return (
    <>
      <main className="relative flex min-h-[100dvh] w-full flex-col items-center justify-between overflow-x-hidden overflow-y-auto bg-[#060813] p-4 text-white sm:p-6 lg:p-8">
        
        {/* ======================================================== */}
        {/* AMBIENT BACKGROUND & CONCENTRIC SONIC RINGS              */}
        {/* ======================================================== */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Subtle Studio Acoustic Grid */}
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.25),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(245,158,11,0.18),transparent_40%),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:auto,auto,28px_28px,28px_28px]" />

          {/* Deep Ambient Glows */}
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-amber-500/10 via-indigo-600/15 to-purple-600/15 blur-3xl" />

          {/* Concentric Sonic Rings (responsive, radiating from hero) */}
          <div className="absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2 h-[260px] w-[260px] rounded-full border border-amber-400/20 shadow-[0_0_50px_rgba(245,158,11,0.1)]" />
          <div className="absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full border border-indigo-400/15 shadow-[0_0_80px_rgba(99,102,241,0.08)] animate-[spin_80s_linear_infinite_reverse]" style={{ borderStyle: 'dashed' }} />
          <div className="absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2 h-[620px] w-[620px] rounded-full border border-indigo-300/10 opacity-60" />
          <div className="absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2 h-[850px] w-[850px] rounded-full border border-indigo-500/5 opacity-40" />
        </div>

        {/* ======================================================== */}
        {/* TOP STATUS BAR: ON-AIR INDICATOR & SYSTEM CONTROLS      */}
        {/* ======================================================== */}
        <header className="relative z-20 flex w-full max-w-4xl items-center justify-between py-2">
          {/* Studio On-Air Badge */}
          <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-black/40 px-3 py-1 backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <span className="font-mono text-[10px] sm:text-xs font-black tracking-widest text-red-300 uppercase">
              STUDIO ON-AIR
            </span>
          </div>

          {/* Quick Audio & Fullscreen Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSound}
              className="h-9 w-9 rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white backdrop-blur-sm"
              title={settings.musicEnabled ? "Mute Music" : "Play Music"}
              aria-label="Toggle Sound"
            >
              {settings.musicEnabled ? <Volume2 size={17} className="text-amber-300" /> : <VolumeX size={17} className="text-slate-500" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-9 w-9 rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white backdrop-blur-sm"
              title={isFullscreen ? t('exit_fullscreen_aria_label') : t('enter_fullscreen_aria_label')}
              aria-label={isFullscreen ? t('exit_fullscreen_aria_label') : t('enter_fullscreen_aria_label')}
            >
              {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
            </Button>
          </div>
        </header>

        {/* ======================================================== */}
        {/* CENTER HERO: DYNAMIC INTERACTIVE VINYL & EQUALIZERS      */}
        {/* ======================================================== */}
        <section className="relative z-10 my-auto flex w-full max-w-xl flex-col items-center text-center py-4">
          
          {/* Turntable Deck with flanking VU Equalizers */}
          <div className="relative mb-6 flex items-center justify-center gap-4 sm:gap-8">
            
            {/* Left VU Meter Tower */}
            <div 
              aria-hidden="true" 
              className="hidden sm:flex flex-col gap-1.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 shadow-inner"
            >
              <span className="text-[8px] font-mono text-slate-500 font-bold mb-0.5">CH-L</span>
              {[
                'bg-rose-500 animate-pulse',
                'bg-amber-400 animate-pulse',
                'bg-amber-400',
                'bg-emerald-400',
                'bg-emerald-400',
                'bg-emerald-500',
                'bg-emerald-500',
              ].map((colorClass, idx) => (
                <div 
                  key={idx}
                  className={`w-4 h-1.5 rounded-xs ${colorClass}`}
                  style={{ opacity: idx === 0 ? 0.4 : 0.85 }}
                />
              ))}
            </div>

            {/* Interactive Spinning Vinyl Deck */}
            <div 
              role="button"
              tabIndex={0}
              onClick={handleTurntableTap}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTurntableTap(); }}
              className="group relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-full"
              title="Click to scratch the record!"
            >
              {/* Outer Turntable Platter & Strobe Dots */}
              <div className="relative h-44 w-44 sm:h-52 sm:w-52 rounded-full border-4 border-slate-700 bg-gradient-to-b from-slate-900 to-black p-2.5 shadow-[0_15px_45px_rgba(0,0,0,0.9),0_0_50px_rgba(245,158,11,0.25)] transition-transform duration-300 group-hover:scale-105">
                
                {/* 12" Vinyl Disc */}
                <div 
                  className={`relative h-full w-full rounded-full bg-slate-950 shadow-inner overflow-hidden ${
                    isScratching 
                      ? 'animate-[spin_0.8s_ease-out]' 
                      : 'animate-[spin_4s_linear_infinite]'
                  }`}
                  style={{
                    backgroundImage: `radial-gradient(circle, #090d16 0%, #1e293b 22%, #020617 24%, #1e293b 45%, #020617 47%, #1e293b 68%, #020617 70%, #1e293b 88%, #334155 90%, #020617 100%)`
                  }}
                >
                  {/* Glossy Vinyl Sheen / Reflection Wedge */}
                  <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.18)_45deg,transparent_90deg,transparent_180deg,rgba(255,255,255,0.18)_225deg,transparent_270deg)] pointer-events-none" />

                  {/* Golden Center Label */}
                  <div className="absolute inset-0 m-auto flex h-16 w-16 sm:h-20 sm:w-20 flex-col items-center justify-center rounded-full border-2 border-amber-300 bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-1 text-center shadow-inner">
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-950 leading-none">
                      RST
                    </span>
                    <span className="text-[6px] sm:text-[7px] font-bold text-slate-900 tracking-tight">
                      33⅓ RPM
                    </span>
                    {/* Spindle hole */}
                    <div className="my-0.5 h-3 w-3 rounded-full border border-amber-100 bg-slate-950 shadow-inner" />
                    <span className="text-[5px] sm:text-[6px] font-semibold tracking-wider text-slate-950 uppercase">
                      MASTER STEREO
                    </span>
                  </div>
                </div>

                {/* Stylized Tonearm with Cartridge */}
                <div 
                  aria-hidden="true" 
                  className="pointer-events-none absolute -right-3 -top-3 sm:-right-4 sm:-top-4 transition-transform duration-500 group-hover:rotate-6"
                >
                  <div className="relative">
                    {/* Pivot base */}
                    <div className="h-7 w-7 rounded-full border-2 border-slate-600 bg-slate-800 shadow-md" />
                    {/* Arm bar */}
                    <div className="absolute top-3 left-3 h-20 w-1.5 origin-top rotate-[28deg] rounded-full bg-gradient-to-b from-slate-400 to-slate-600 shadow">
                      {/* Stylus Head / Cartridge */}
                      <div className="absolute bottom-0 -left-1.5 h-4 w-4 rotate-12 rounded-sm border border-amber-400/80 bg-amber-500 shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right VU Meter Tower */}
            <div 
              aria-hidden="true" 
              className="hidden sm:flex flex-col gap-1.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 shadow-inner"
            >
              <span className="text-[8px] font-mono text-slate-500 font-bold mb-0.5">CH-R</span>
              {[
                'bg-rose-500 animate-pulse',
                'bg-amber-400',
                'bg-amber-400 animate-pulse',
                'bg-emerald-400',
                'bg-emerald-400',
                'bg-emerald-500',
                'bg-emerald-500',
              ].map((colorClass, idx) => (
                <div 
                  key={idx}
                  className={`w-4 h-1.5 rounded-xs ${colorClass}`}
                  style={{ opacity: idx === 0 ? 0.3 : 0.85 }}
                />
              ))}
            </div>
          </div>

          {/* Subtitle / Tagline */}
          <div className="mb-2 flex items-center justify-center gap-2 text-indigo-300">
            <Radio size={14} className="text-amber-400 animate-pulse" />
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.35em] text-indigo-200">
              {t('splash_subtitle', 'Build Your Musical Empire')}
            </p>
          </div>

          {/* Main Hero Game Title */}
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl drop-shadow-2xl">
            <span className="block text-lg sm:text-2xl font-semibold tracking-[0.2em] text-slate-200">
              RECORDING
            </span>
            <span className="mt-1 block bg-gradient-to-r from-amber-100 via-amber-300 to-orange-400 bg-clip-text text-transparent font-extrabold tracking-tight">
              STUDIO TYCOON
            </span>
          </h1>

          <p className="mt-2 text-xs sm:text-sm font-medium text-slate-300 max-w-sm">
            {t('splash_tagline', 'From analog beginnings to digital dominance')}
          </p>

          {/* Studio Workflow Pills */}
          <div 
            className="my-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[11px] text-slate-400"
            aria-label="Workflow: Record, Mix, Master, Profit"
          >
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-sky-300 font-semibold shadow-sm">
              <Mic2 size={12} /> {t('splash_feature_record', 'Record')}
            </span>
            <span className="text-slate-600">→</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-indigo-300 font-semibold shadow-sm">
              <Sliders size={12} /> {t('splash_feature_mix', 'Mix')}
            </span>
            <span className="text-slate-600">→</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-amber-300 font-semibold shadow-sm">
              <Disc size={12} /> {t('splash_feature_master', 'Master')}
            </span>
            <span className="text-slate-600">→</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-emerald-300 font-semibold shadow-sm">
              <TrendingUp size={12} /> {t('splash_feature_profit', 'Profit')}
            </span>
          </div>

          {/* ======================================================== */}
          {/* HARDWARE CONSOLE BUTTONS                                 */}
          {/* ======================================================== */}
          <div className="flex w-full max-w-xs sm:max-w-sm flex-col gap-3">
            
            {/* Primary: Start New Game */}
            <button
              type="button"
              onClick={handleStartNewGame}
              className="group relative flex w-full min-h-[54px] sm:min-h-[58px] items-center justify-between overflow-hidden rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-5 py-3 text-left font-bold text-slate-950 shadow-[0_8px_25px_rgba(245,158,11,0.35)] transition-all duration-200 hover:brightness-110 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-black/20 text-slate-950 shadow-inner">
                  <Sparkles size={20} className="transition-transform duration-300 group-hover:rotate-12" />
                </div>
                <div>
                  <span className="block text-base font-black tracking-wide leading-none">
                    {t('splash_btn_new_game', 'Start New Game')}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-900/80">
                    Choose era & build your studio
                  </span>
                </div>
              </div>
              <span className="h-2 w-2 rounded-full bg-amber-200 shadow-[0_0_8px_#fef08a]" />
              {/* Glossy Sheen Sweep */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full pointer-events-none" />
            </button>

            {/* Continue Game (If Save Exists) */}
            {hasSaveGame && (
              <button
                type="button"
                onClick={handleLoadGame}
                className="group relative flex w-full min-h-[52px] items-center justify-between overflow-hidden rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-5 py-3 text-left font-bold text-white shadow-[0_6px_20px_rgba(16,185,129,0.3)] transition-all duration-200 hover:brightness-110 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-black/30 text-emerald-200 shadow-inner">
                    <Play size={17} className="fill-current" />
                  </div>
                  <div>
                    <span className="block text-sm sm:text-base font-black tracking-wide leading-none">
                      {t('splash_btn_continue_game', 'Continue Game')}
                    </span>
                    <span className="text-[10px] font-medium text-emerald-100/80">
                      Resume saved studio session
                    </span>
                  </div>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_8px_#86efac]" />
              </button>
            )}

            {/* Secondary Controls Bar */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                onClick={() => {
                  if (settings.sfxEnabled) gameAudio.playClick();
                  setShowSettingsModal(true);
                }}
                variant="outline"
                className="flex-1 h-11 rounded-lg border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-500 hover:bg-slate-800 hover:text-white transition-all text-xs font-semibold"
              >
                <Settings size={16} className="mr-2 text-slate-400" />
                {t('splash_btn_settings', 'Settings')}
              </Button>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* BOTTOM RACKMOUNT LCD DISPLAY: ROTATING STUDIO TIPS       */}
        {/* ======================================================== */}
        <footer className="relative z-10 w-full max-w-lg pb-2 pt-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-md">
            {/* Rack Screws & Status Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 text-[10px] font-mono text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-bold text-amber-300/90 uppercase tracking-wider">
                  {t('splash_pro_tip', 'Pro Tip')} [{currentTip + 1}/{gameTipKeys.length}]
                </span>
              </div>
              <span className="text-[9px] tracking-widest text-slate-600">RST-DSP // 48kHz</span>
            </div>

            {/* Rotating Tip Content */}
            <div className="min-h-[42px] flex items-center justify-center px-1 pt-2">
              <p 
                key={currentTip} 
                className="text-xs sm:text-[13px] leading-relaxed text-slate-300 text-center animate-in fade-in duration-300"
              >
                {t(gameTipKeys[currentTip])}
              </p>
            </div>
          </div>

          {/* Credits footer */}
          <p className="mt-2 text-center text-[10px] text-slate-500 font-mono">
            {t('splash_credits', 'Recording Studio Tycoon | Built with ❤️ for music lovers')}
          </p>
        </footer>
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
          context="splash"
        />
      )}
    </>
  );
};
