import { useEffect, useState } from 'react';
import { AlertTriangle, Maximize, Minimize, Play, Plus, Settings, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EraSelectionModal, Era } from './EraSelectionModal';
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
import './splash.css';

interface SplashScreenProps {
  onStartGame: (era: Era) => void;
  onLoadGame: () => boolean | void;
  hasSaveGame?: boolean;
}

const TIP_KEYS = [
  'splash_tip_skills', 'splash_tip_genres', 'splash_tip_staff',
  'splash_tip_reputation', 'splash_tip_equipment_genres',
  'splash_tip_market_trends', 'splash_tip_quality', 'splash_tip_era_challenges'
];

export function SplashScreen({ onStartGame, onLoadGame, hasSaveGame }: SplashScreenProps) {
  const [showEraSelection, setShowEraSelection] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [saveInfo, setSaveInfo] = useState<SaveInspectionResult>(() => inspectSaveGame());
  const [errorMessage, setErrorMessage] = useState<string | null>(() =>
    saveInfo.isCorrupt ? (saveInfo.error ?? 'Save file is corrupted or unreadable.') : null
  );
  const [tip, setTip] = useState(0);
  const { settings, updateSetting } = useSettings();
  const music = useBackgroundMusic();
  const { isFullscreen, toggleFullscreen } = useFullscreen('root');
  const { t } = useTranslation();

  useEffect(() => {
    const timer = window.setInterval(() => setTip(index => (index + 1) % TIP_KEYS.length), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const wakeAudio = () => {
    void gameAudio.userGestureSignal().catch(() => {});
    if (settings.sfxEnabled) void gameAudio.playClick();
    if (settings.musicEnabled && !music.isPlaying) music.playTrack(1);
  };

  const toggleMusic = () => {
    const enabled = !settings.musicEnabled;
    updateSetting('musicEnabled', enabled);
    if (enabled) {
      void gameAudio.userGestureSignal().catch(() => {});
      music.playTrack(1);
    } else music.stop();
  };

  const handleContinue = () => {
    wakeAudio();
    if (saveInfo.isCorrupt || !saveInfo.hasSave || !saveInfo.preview) {
      setErrorMessage('Cannot continue: Save data is missing or corrupted.');
      return;
    }
    try {
      const res = onLoadGame();
      if (res === false) {
        setErrorMessage('Failed to load save file.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error loading save file.');
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

  return <>
    <main className="splash-page">
      <div className="splash-ambience" aria-hidden="true"><span /><span /><span /></div>
      <header className="splash-header">
        <span className="splash-wordmark"><span className="splash-live-dot" /> RST <span className="splash-header-muted">/ CAREER MODE</span></span>
        <div className="splash-header-controls">
          <button onClick={toggleMusic} aria-label={settings.musicEnabled ? 'Mute music' : 'Play music'} title={settings.musicEnabled ? 'Mute music' : 'Play music'}>
            {settings.musicEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          <button onClick={() => setShowSettings(true)} aria-label="Settings" title="Settings"><Settings size={19} /></button>
          <button onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
            {isFullscreen ? <Minimize size={19} /> : <Maximize size={19} />}
          </button>
        </div>
      </header>

      <section className="splash-hero" aria-label="Recording Studio Tycoon">
        <div className="splash-title-group">
          <h1><span>RECORDING</span><strong>STUDIO TYCOON</strong></h1>
          <p className="splash-tagline">{t('splash_tagline', 'From analog beginnings to digital dominance')}</p>
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
              Dismiss
            </button>
          </div>
        )}

        <div className="splash-actions">
          {hasValidSave && (
            <button className="splash-action splash-action-primary" onClick={handleContinue}>
              <span className="splash-action-icon"><Play size={20} fill="currentColor" /></span>
              <span>
                <strong>Continue studio</strong>
                <small>Day {saveInfo.preview!.day} · Lv {saveInfo.preview!.level} · ${saveInfo.preview!.money.toLocaleString()} · {saveInfo.preview!.era}</small>
              </span>
              <span className="splash-action-arrow" aria-hidden="true">→</span>
            </button>
          )}
          <button
            className={`splash-action ${hasValidSave ? 'splash-action-secondary' : 'splash-action-primary'}`}
            onClick={handleNewGameClick}
          >
            <span className="splash-action-icon"><Plus size={21} /></span>
            <span><strong>New studio</strong><small>Choose your era</small></span><span className="splash-action-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </section>

      <footer className="splash-footer">
        <span className="splash-footer-label">PRODUCER NOTE {String(tip + 1).padStart(2, '0')}</span>
        <p key={tip}>{t(TIP_KEYS[tip])}</p>
      </footer>
    </main>

    <AlertDialog open={showOverwriteConfirm} onOpenChange={setShowOverwriteConfirm}>
      <AlertDialogContent className="border border-amber-400/30 bg-slate-900 text-slate-100 sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-amber-200">Overwrite Existing Career?</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-300">
            {saveInfo.preview ? (
              <span>
                You currently have an active studio saved at <strong className="text-amber-100">Day {saveInfo.preview.day}</strong> ({saveInfo.preview.era}, Level {saveInfo.preview.level}, ${saveInfo.preview.money.toLocaleString()}).
              </span>
            ) : (
              <span>You have an existing career saved on this device.</span>
            )}
            <span className="mt-2 block text-rose-300/90 text-xs">
              Starting a new studio will overwrite your current career progress. This cannot be undone.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2 sm:gap-2">
          <AlertDialogCancel className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700">
            Keep Existing Career
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmOverwrite}
            className="border border-amber-400/50 bg-amber-500 font-bold text-slate-950 hover:bg-amber-400"
          >
            Overwrite & Start New
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <EraSelectionModal isOpen={showEraSelection} onSelectEra={era => { setShowEraSelection(false); onStartGame(era); }} onClose={() => setShowEraSelection(false)} />
    {showSettings && <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} context="splash" />}
  </>;
}
