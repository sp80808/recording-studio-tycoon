import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Maximize, Minimize, Play, Plus, Settings, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Era } from './EraSelectionModal';
import type { ProducerBackgroundId } from '@/types/character';
import { CareerStartScreen } from './CareerStartScreen';
import { SettingsModal } from './modals/SettingsModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSettings } from '@/contexts/SettingsContext';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useFullscreen } from '@/hooks/useFullscreen';
import { gameAudio } from '@/utils/audioSystem';
import { inspectSaveGame, SaveInspectionResult } from '@/utils/savePreview';
import { INDUSTRY_TIPS } from '@/data/flavour';
import './splash.css';

interface SplashScreenProps {
  onStartGame: (era: Era, originId: ProducerBackgroundId) => void;
  onLoadGame: () => boolean | void | Promise<boolean | void>;
  hasSaveGame?: boolean;
}

const TIP_KEYS = [
  'splash_tip_skills', 'splash_tip_genres', 'splash_tip_staff',
  'splash_tip_reputation', 'splash_tip_equipment_genres',
  'splash_tip_market_trends', 'splash_tip_quality', 'splash_tip_era_challenges'
];

export function SplashScreen({ onStartGame, onLoadGame, hasSaveGame }: SplashScreenProps) {
  const [showEraSelection, setShowEraSelection] = useState(false);
  const [isEnteringStudio, setIsEnteringStudio] = useState(false);
  const transitionTimer = useRef<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [saveInfo, setSaveInfo] = useState<SaveInspectionResult>(() => inspectSaveGame());
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(() =>
    saveInfo.isCorrupt ? (saveInfo.error ?? null) : null
  );
  const [tip, setTip] = useState(0);
  const { settings, updateSettings } = useSettings();
  const music = useBackgroundMusic();
  const { isFullscreen, toggleFullscreen } = useFullscreen('root');

  useEffect(() => {
    return () => {
      if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    };
  }, []);

  useEffect(() => {
    if (saveInfo.isCorrupt && !errorMessage) {
      setErrorMessage(saveInfo.error ?? t('splash_save_corrupt'));
    }
  }, [saveInfo, errorMessage, t]);

  useEffect(() => {
    const timer = window.setInterval(() => setTip(index => (index + 1) % (INDUSTRY_TIPS.length * 2)), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const wakeAudio = () => {
    void gameAudio.userGestureSignal().catch(() => {});
    if (settings.sfxEnabled) void gameAudio.playClick();
    if (settings.musicEnabled && !music.isPlaying) music.playTrack(1);
  };

  const toggleMusic = () => {
    const enabled = !settings.musicEnabled;
    updateSettings({ musicEnabled: enabled });
    if (enabled) {
      void gameAudio.userGestureSignal().catch(() => {});
      music.playTrack(1);
    } else music.pauseMusic();
  };

  const handleContinue = async () => {
    wakeAudio();
    if (saveInfo.isCorrupt || !saveInfo.hasSave || !saveInfo.preview) {
      setErrorMessage(t('splash_cannot_continue'));
      return;
    }
    try {
      const res = await onLoadGame();
      if (res === false) {
        setErrorMessage(t('splash_load_failed'));
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('splash_load_error'));
    }
  };

  const handleNewGameClick = () => {
    wakeAudio();
    if (saveInfo.hasSave && !saveInfo.isCorrupt && saveInfo.preview) {
      setShowOverwriteConfirm(true);
    } else {
      setShowEraSelection(true);
    }
  };

  const handleConfirmOverwrite = () => {
    setShowOverwriteConfirm(false);
    setShowEraSelection(true);
  };

  const hasValidSave = saveInfo.hasSave && !saveInfo.isCorrupt && saveInfo.preview !== null;
  const musicLabel = settings.musicEnabled ? t('splash_mute_music') : t('splash_play_music');
  const fullscreenLabel = isFullscreen ? t('exit_fullscreen') : t('enter_fullscreen');

  const handleBeginStudio = (era: Era, originId: ProducerBackgroundId) => {
    setIsEnteringStudio(true);
    transitionTimer.current = window.setTimeout(() => {
      setShowEraSelection(false);
      setIsEnteringStudio(false);
      onStartGame(era, originId);
    }, 900);
  };

  if (isEnteringStudio) {
    return (
      <main className="studio-boot-gate" role="status" aria-live="polite" aria-busy="true">
        <span className="studio-boot-gate-mark">RST</span>
        <p className="studio-boot-gate-title">Opening the studio…</p>
        <p className="studio-boot-gate-copy">Setting the room, routing the signal, and finding the good pencil.</p>
        <div className="studio-boot-skeleton" aria-hidden="true"><span /><span /><span /></div>
        <div className="studio-boot-progress" aria-hidden="true"><i /></div>
      </main>
    );
  }

  if (showEraSelection) {
    return (
      <CareerStartScreen
        onBegin={handleBeginStudio}
        onBack={() => setShowEraSelection(false)}
      />
    );
  }

  return <>
    <main className="splash-page">
      <div className="splash-ambience" aria-hidden="true"><span /><span /><span /></div>
      <header className="splash-header">
        <span className="splash-wordmark"><span className="splash-live-dot" /> RST <span className="splash-header-muted">/ {t('splash_career_mode')}</span></span>
        <div className="splash-header-controls">
          <button onClick={toggleMusic} aria-label={musicLabel} title={musicLabel}>
            {settings.musicEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          <button onClick={() => setShowSettings(true)} aria-label={t('settings')} title={t('settings')}><Settings size={19} /></button>
          <button onClick={toggleFullscreen} aria-label={fullscreenLabel} title={fullscreenLabel}>
            {isFullscreen ? <Minimize size={19} /> : <Maximize size={19} />}
          </button>
        </div>
      </header>

      <section className="splash-hero" aria-label={t('game_title')}>
        <img className="splash-still" src="/assets/splash-studio.jpg" alt="" aria-hidden="true" decoding="async" />
        <div className="splash-title-group">
          <h1><span>RECORDING</span><strong>STUDIO TYCOON</strong></h1>
          <p className="splash-tagline">{t('splash_tagline')}</p>
        </div>

        {errorMessage && (
          <div role="alert" className="mt-4 flex w-full max-w-md items-center justify-between gap-3 rounded-lg border border-rose-500/50 bg-rose-950/80 px-4 py-2.5 text-xs text-rose-200 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-rose-400" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-300 hover:text-white underline text-[11px]"
            >
              {t('dismiss')}
            </button>
          </div>
        )}

        <div className="splash-actions">
          {hasValidSave && (
            <button className="splash-action splash-action-primary" onClick={handleContinue}>
              <span className="splash-action-icon"><Play size={20} fill="currentColor" /></span>
              <span>
                <strong>{t('splash_continue_studio')}</strong>
                <small>
                  {t('splash_save_preview', {
                    day: saveInfo.preview!.day,
                    level: saveInfo.preview!.level,
                    money: saveInfo.preview!.money.toLocaleString(),
                    era: saveInfo.preview!.era,
                  })}
                </small>
              </span>
              <span className="splash-action-arrow" aria-hidden="true">→</span>
            </button>
          )}
          <button
            className={`splash-action ${hasValidSave ? 'splash-action-secondary' : 'splash-action-primary'}`}
            onClick={handleNewGameClick}
          >
            <span className="splash-action-icon"><Plus size={21} /></span>
            <span><strong>{t('splash_new_studio')}</strong><small>{t('splash_choose_era')}</small></span><span className="splash-action-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </section>

      <footer className="splash-footer">
        <span className="splash-footer-label">{t('splash_producer_note', { n: String(Math.floor(tip / 2) + 1).padStart(2, '0') })}</span>
        <p key={tip}>{tip % 2 === 0 ? t(TIP_KEYS[(tip / 2) % TIP_KEYS.length]) : INDUSTRY_TIPS[(tip - 1) / 2]}</p>
      </footer>
    </main>

    <AlertDialog open={showOverwriteConfirm} onOpenChange={setShowOverwriteConfirm}>
      <AlertDialogContent className="border border-amber-400/30 bg-stone-900 text-stone-100 sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-amber-200">{t('splash_overwrite_title')}</AlertDialogTitle>
          <AlertDialogDescription className="text-stone-300">
            {saveInfo.preview ? (
              <span>
                {t('splash_overwrite_body', {
                  day: saveInfo.preview.day,
                  era: saveInfo.preview.era,
                  level: saveInfo.preview.level,
                  money: saveInfo.preview.money.toLocaleString(),
                })}
              </span>
            ) : (
              <span>{t('splash_overwrite_generic')}</span>
            )}
            <span className="mt-2 block text-rose-300/90 text-xs">
              {t('splash_overwrite_warning')}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2 sm:gap-2">
          <AlertDialogCancel className="border-stone-700 bg-white/[0.07] text-stone-200 hover:bg-white/[0.13]">
            {t('splash_keep_career')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmOverwrite}
            className="border border-amber-400/50 bg-amber-400/[0.14] font-bold text-amber-100 hover:bg-amber-400/[0.24]"
          >
            {t('splash_overwrite_confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {showSettings && <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} context="splash" />}
  </>;
}
