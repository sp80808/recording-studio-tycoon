import { useEffect, useState } from 'react';
import { Maximize, Minimize, Play, Plus, Settings, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EraSelectionModal, Era } from './EraSelectionModal';
import { SettingsModal } from './modals/SettingsModal';
import { useSettings } from '@/contexts/SettingsContext';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useFullscreen } from '@/hooks/useFullscreen';
import { gameAudio } from '@/utils/audioSystem';
import './splash.css';

interface SplashScreenProps {
  onStartGame: (era: Era) => void;
  onLoadGame: () => void;
  hasSaveGame: boolean;
}

const TIP_KEYS = [
  'splash_tip_skills', 'splash_tip_genres', 'splash_tip_staff',
  'splash_tip_reputation', 'splash_tip_equipment_genres',
  'splash_tip_market_trends', 'splash_tip_quality', 'splash_tip_era_challenges'
];

export function SplashScreen({ onStartGame, onLoadGame, hasSaveGame }: SplashScreenProps) {
  const [showEraSelection, setShowEraSelection] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
        <div className="splash-actions">
          {hasSaveGame && <button className="splash-action splash-action-primary" onClick={() => { wakeAudio(); onLoadGame(); }}>
            <span className="splash-action-icon"><Play size={20} fill="currentColor" /></span>
            <span><strong>Continue studio</strong><small>Pick up your story</small></span><span className="splash-action-arrow" aria-hidden="true">→</span>
          </button>}
          <button className={`splash-action ${hasSaveGame ? 'splash-action-secondary' : 'splash-action-primary'}`}
            onClick={() => { wakeAudio(); setShowEraSelection(true); }}>
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
    <EraSelectionModal isOpen={showEraSelection} onSelectEra={era => { setShowEraSelection(false); onStartGame(era); }} onClose={() => setShowEraSelection(false)} />
    {showSettings && <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} context="splash" />}
  </>;
}
