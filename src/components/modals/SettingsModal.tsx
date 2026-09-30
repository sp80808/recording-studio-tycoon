import type { GameState } from '@/types/game';
import React, { useState, useEffect } from 'react';
import { GameConfirmDialog } from '@/components/ui/GameConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSettings } from '@/contexts/SettingsContext';
import { useSaveSystem } from '@/contexts/SaveSystemContext';
import { useGameState } from '@/hooks/useGameState';
import { useGamepad } from '@/hooks/useGamepad';
import { GamepadGlyph, CONTROLLER_LAYOUT_OPTIONS, CONTROLLER_TYPE_NAMES } from '@/components/ui/GamepadGlyph';
import type { ControllerLayoutPreference, ControllerType } from '@/types/gamepad';
import { GRAPHICS_PRESETS } from '@/data/defaultSettings';
import { gameAudio } from '@/utils/audioSystem';
import { useTranslation } from 'react-i18next';
import { toast } from "sonner";
import { useBoxDropsStore } from '@/features/boxDrops/boxDropsStore';
import { SUPPORTED_LOCALES } from '@/i18n/supportedLocales';

export type SettingsTabId = 'audio' | 'graphics' | 'gameplay' | 'accessibility' | 'system';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetGame?: () => void;
  context?: 'splash' | 'ingame';
  onLoadGameStateFromString?: (gameState: GameState) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onResetGame,
  context = 'ingame',
  onLoadGameStateFromString
}) => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { exportGameStateToString, loadGameFromString } = useSaveSystem();
  const { gameState } = useGameState();
  const { t } = useTranslation();
  const gamepad = useGamepad();
  const triggerBoxDrop = useBoxDropsStore((s) => s.triggerDrop);
  const isDevBuild = import.meta.env.DEV;

  const [activeTab, setActiveTab] = useState<SettingsTabId>('audio');
  const [exportedSaveString, setExportedSaveString] = useState<string | null>(null);
  const [importSaveString, setImportSaveString] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Gamepad Bumper (LB / RB) Tab Cycling
  useEffect(() => {
    if (!isOpen || !gamepad.isConnected) return;
    const tabs: SettingsTabId[] = ['audio', 'graphics', 'gameplay', 'accessibility', 'system'];
    const idx = tabs.indexOf(activeTab);

    if (gamepad.justPressed.lb) {
      const nextIdx = (idx - 1 + tabs.length) % tabs.length;
      setActiveTab(tabs[nextIdx]);
      gamepad.triggerHaptic(0.1, 0.15, 30);
      gameAudio.playClick();
    } else if (gamepad.justPressed.rb) {
      const nextIdx = (idx + 1) % tabs.length;
      setActiveTab(tabs[nextIdx]);
      gamepad.triggerHaptic(0.1, 0.15, 30);
      gameAudio.playClick();
    }
  }, [isOpen, gamepad.isConnected, gamepad.justPressed.lb, gamepad.justPressed.rb, activeTab]);

  const controllerPreviewType: ControllerType =
    settings.controllerLayout === 'auto' ? 'xbox' : settings.controllerLayout;

  if (!isOpen) return null;

  const handleVolumeChange = (type: 'master' | 'sfx' | 'music', value: number) => {
    const volumeSettings = {
      master: { masterVolume: value },
      sfx: { sfxVolume: value },
      music: { musicVolume: value }
    };
    updateSettings(volumeSettings[type]);
    if (type === 'sfx') gameAudio.playClick();
  };

  const handleToggleChange = (type: 'sfx' | 'music', enabled: boolean) => {
    const toggleSettings = {
      sfx: { sfxEnabled: enabled },
      music: { musicEnabled: enabled }
    };
    updateSettings(toggleSettings[type]);
    if (enabled && type === 'sfx') gameAudio.playSuccess();
  };

  const handlePresetSelect = (preset: 'low' | 'medium' | 'high' | 'ultra') => {
    const patch = GRAPHICS_PRESETS[preset];
    updateSettings(patch);
    gameAudio.playClick();
  };

  const handleResetSettings = () => {
    resetSettings();
    gameAudio.playClick();
    toast.success(t('toast_settings_reset'));
  };

  const handleResetGame = () => {
    if (onResetGame) setShowResetConfirm(true);
  };

  const confirmResetGame = () => {
    if (onResetGame) {
      onResetGame();
      gameAudio.playClick();
      setShowResetConfirm(false);
      onClose();
    }
  };

  const handleLanguageChange = (lang: string) => {
    updateSettings({ language: lang });
    gameAudio.playClick();
    toast.success(t('toast_language_changed'));
  };

  const handleExportGameData = () => {
    if (context === 'ingame' && gameState) {
      const exportedString = exportGameStateToString(gameState);
      if (exportedString) {
        setExportedSaveString(exportedString);
        toast.success(t('toast_export_success'));
      } else {
        toast.error(t('toast_export_failed'));
      }
    }
  };

  const handleImportGameData = () => {
    if (!importSaveString.trim()) {
      toast.error(t('toast_import_empty'));
      return;
    }
    const loadedState = loadGameFromString(importSaveString);
    if (loadedState) {
      if (onLoadGameStateFromString) {
        onLoadGameStateFromString(loadedState);
        toast.success(t('toast_import_success'));
        onClose();
      } else {
        toast.error(t('toast_import_no_reload'));
      }
    } else {
      toast.error(t('toast_import_failed'));
    }
  };

  const handleCopyToClipboard = () => {
    if (exportedSaveString) {
      navigator.clipboard.writeText(exportedSaveString)
        .then(() => toast.success(t('toast_clipboard_copied')))
        .catch(() => toast.error(t('toast_clipboard_failed')));
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-3xl bg-stone-950 border-stone-700/80 shadow-2xl p-6 max-h-[90vh] flex flex-col overflow-hidden text-stone-100">
          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-stone-800">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>⚙️</span> {t('settings_title')}
              </h2>
              <p className="text-xs text-stone-400">{t('settings_subtitle')}</p>
            </div>
            {gamepad.isConnected && (
              <div className="flex items-center gap-2 text-xs text-stone-400 bg-stone-900 px-3 py-1.5 rounded-full border border-stone-800">
                <GamepadGlyph button="lb" size="xs" />
                <span className="font-semibold text-stone-300">{t('settings_tabs_hint')}</span>
                <GamepadGlyph button="rb" size="xs" />
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1.5 pt-3 pb-3 border-b border-stone-800/80 overflow-x-auto select-none">
            <button
              onClick={() => setActiveTab('audio')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'audio'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'bg-stone-900/80 text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <span>🔊</span> {t('settings_tab_audio')}
            </button>
            <button
              onClick={() => setActiveTab('graphics')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'graphics'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'bg-stone-900/80 text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <span>📺</span> {t('settings_tab_graphics')}
            </button>
            <button
              onClick={() => setActiveTab('gameplay')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'gameplay'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'bg-stone-900/80 text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <span>🎮</span> {t('settings_tab_gameplay')}
            </button>
            <button
              onClick={() => setActiveTab('accessibility')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'accessibility'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'bg-stone-900/80 text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <span>♿</span> {t('settings_tab_accessibility')}
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'system'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'bg-stone-900/80 text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <span>🌐</span> {t('settings_tab_system')}
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
            {/* 1. AUDIO TAB */}
            {activeTab === 'audio' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-2 bg-stone-900/50 p-4 rounded-lg border border-stone-800">
                  <div className="flex justify-between items-center">
                    <label className="text-white font-medium text-sm">{t('settings_master_volume')}</label>
                    <span className="text-amber-400 font-mono text-xs">{Math.round(settings.masterVolume * 100)}%</span>
                  </div>
                  <Slider
                    value={[settings.masterVolume]}
                    onValueChange={(val) => handleVolumeChange('master', val[0])}
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2 bg-stone-900/50 p-4 rounded-lg border border-stone-800">
                  <div className="flex justify-between items-center">
                    <label className="text-white font-medium text-sm">{t('settings_sfx_volume')}</label>
                    <div className="flex items-center gap-3">
                      <span className="text-amber-400 font-mono text-xs">{Math.round(settings.sfxVolume * 100)}%</span>
                      <Switch
                        checked={settings.sfxEnabled}
                        onCheckedChange={(checked) => handleToggleChange('sfx', checked)}
                      />
                    </div>
                  </div>
                  <Slider
                    value={[settings.sfxVolume]}
                    onValueChange={(val) => handleVolumeChange('sfx', val[0])}
                    max={1}
                    step={0.05}
                    disabled={!settings.sfxEnabled}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2 bg-stone-900/50 p-4 rounded-lg border border-stone-800">
                  <div className="flex justify-between items-center">
                    <label className="text-white font-medium text-sm">{t('settings_music_volume')}</label>
                    <div className="flex items-center gap-3">
                      <span className="text-amber-400 font-mono text-xs">{Math.round(settings.musicVolume * 100)}%</span>
                      <Switch
                        checked={settings.musicEnabled}
                        onCheckedChange={(checked) => handleToggleChange('music', checked)}
                      />
                    </div>
                  </div>
                  <Slider
                    value={[settings.musicVolume]}
                    onValueChange={(val) => handleVolumeChange('music', val[0])}
                    max={1}
                    step={0.05}
                    disabled={!settings.musicEnabled}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* 2. GRAPHICS & DISPLAY TAB */}
            {activeTab === 'graphics' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Preset Selector */}
                <div className="bg-stone-900/50 p-4 rounded-lg border border-stone-800 space-y-3">
                  <label className="text-white font-medium text-sm block">Graphics Quality Preset</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['low', 'medium', 'high', 'ultra'] as const).map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handlePresetSelect(preset)}
                        className={`py-2 px-3 rounded text-xs font-bold uppercase tracking-wider transition-all border ${
                          settings.graphicsPreset === preset
                            ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md shadow-amber-500/20'
                            : 'bg-stone-900 text-stone-300 border-stone-700 hover:bg-stone-800'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolution Scaling & Target FPS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-stone-900/50 p-4 rounded-lg border border-stone-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-white font-medium text-sm">Resolution Scale</label>
                      <span className="text-teal-400 font-mono text-xs">{settings.resolutionScale}x</span>
                    </div>
                    <Select
                      value={String(settings.resolutionScale)}
                      onValueChange={(val) => updateSettings({ resolutionScale: Number(val) as any })}
                    >
                      <SelectTrigger className="w-full bg-stone-900 border-stone-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-stone-900 border-stone-700 text-white">
                        <SelectItem value="0.75">0.75x (Performance / Low-end)</SelectItem>
                        <SelectItem value="1">1.0x (Standard 1080p native)</SelectItem>
                        <SelectItem value="1.25">1.25x (Crisp High-DPI)</SelectItem>
                        <SelectItem value="1.5">1.5x (Ultra 1440p+)</SelectItem>
                        <SelectItem value="2">2.0x (Retina 4K Supersample)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-stone-900/50 p-4 rounded-lg border border-stone-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-white font-medium text-sm">Target Frame Rate</label>
                      <span className="text-teal-400 font-mono text-xs">
                        {settings.targetFps === 0 ? 'V-Sync Uncapped' : `${settings.targetFps} FPS`}
                      </span>
                    </div>
                    <Select
                      value={String(settings.targetFps)}
                      onValueChange={(val) => updateSettings({ targetFps: Number(val) as any })}
                    >
                      <SelectTrigger className="w-full bg-stone-900 border-stone-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-stone-900 border-stone-700 text-white">
                        <SelectItem value="30">30 FPS (Battery Saver / Focus)</SelectItem>
                        <SelectItem value="60">60 FPS (Smooth Standard)</SelectItem>
                        <SelectItem value="120">120 FPS (High Refresh Rate)</SelectItem>
                        <SelectItem value="0">Uncapped / Monitor V-Sync</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Post-Processing Toggles */}
                <div className="space-y-3 bg-stone-900/50 p-4 rounded-lg border border-stone-800">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Visual Enhancements & Shaders</h4>

                  <div className="flex justify-between items-center py-2 border-b border-stone-800">
                    <div>
                      <label className="text-white text-sm font-medium">Retro CRT Scanlines & Curvature</label>
                      <p className="text-xs text-stone-400">Renders procedural scanlines over the isometric studio</p>
                    </div>
                    <Switch
                      checked={settings.crtScanlines}
                      onCheckedChange={(checked) => updateSettings({ crtScanlines: checked })}
                    />
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-stone-800">
                    <div>
                      <label className="text-white text-sm font-medium">{t('settings_analog_tape_warmth')}</label>
                      <p className="text-xs text-stone-400">Applies era-specific analog saturation and warm corner vignette</p>
                    </div>
                    <Switch
                      checked={settings.analogTapeWarmth}
                      onCheckedChange={(checked) => updateSettings({ analogTapeWarmth: checked })}
                    />
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <div>
                      <label className="text-white text-sm font-medium">Console Hardware Emissive Bloom</label>
                      <p className="text-xs text-stone-400">Illuminates VU meter lamps, console switches, and DAW monitors</p>
                    </div>
                    <Switch
                      checked={settings.bloomAndGlow}
                      onCheckedChange={(checked) => updateSettings({ bloomAndGlow: checked })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. GAMEPLAY & CONTROLLER TAB */}
            {activeTab === 'gameplay' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-2 bg-stone-900/50 p-4 rounded-lg border border-stone-800">
                  <label className="text-white font-medium text-sm">Difficulty Level</label>
                  <Select
                    value={settings.difficulty}
                    onValueChange={(val: 'easy' | 'medium' | 'hard') => updateSettings({ difficulty: val })}
                  >
                    <SelectTrigger className="w-full bg-stone-900 border-stone-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-stone-900 border-stone-700 text-white">
                      <SelectItem value="easy">Easy - Relaxed commercial payouts & generous deadlines</SelectItem>
                      <SelectItem value="medium">Medium - Balanced authentic studio challenge</SelectItem>
                      <SelectItem value="hard">Hard - High client expectations & strict maintenance fees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between items-center bg-stone-900/50 p-4 rounded-lg border border-stone-800">
                  <div>
                    <label className="text-white font-medium text-sm">Auto Save</label>
                    <p className="text-xs text-stone-400">Save studio state automatically after key milestones and daily ticks</p>
                  </div>
                  <Switch
                    checked={settings.autoSave}
                    onCheckedChange={(checked) => updateSettings({ autoSave: checked })}
                  />
                </div>

                {/* Controller Layout */}
                <div className="space-y-3 bg-stone-900/50 p-4 rounded-lg border border-stone-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-white font-medium text-sm">Gamepad Layout & Glyphs</label>
                      <p className="text-xs text-stone-400">Choose glyph set or auto-detect from connected controller</p>
                    </div>
                  </div>
                  <Select
                    value={settings.controllerLayout}
                    onValueChange={(value: ControllerLayoutPreference) => {
                      updateSettings({ controllerLayout: value });
                      gameAudio.playClick();
                    }}
                  >
                    <SelectTrigger className="w-full bg-stone-900 border-stone-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-stone-900 border-stone-700 text-white">
                      {CONTROLLER_LAYOUT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-stone-400 text-xs font-mono">
                      {settings.controllerLayout === 'auto'
                        ? 'Preview (Auto)'
                        : CONTROLLER_TYPE_NAMES[controllerPreviewType]}:
                    </span>
                    {(['south', 'east', 'west', 'north'] as const).map((button) => (
                      <GamepadGlyph
                        key={button}
                        button={button}
                        controllerType={controllerPreviewType}
                        size="sm"
                        decorative
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-stone-900/50 p-4 rounded-lg border border-stone-800">
                  <div>
                    <label className="text-white font-medium text-sm">Gamepad Haptics & Vibration</label>
                    <p className="text-xs text-stone-400">Tactile rumble during PocketMeter groove and Gold takes</p>
                  </div>
                  <Switch
                    checked={settings.gamepadHaptics}
                    onCheckedChange={(checked) => updateSettings({ gamepadHaptics: checked })}
                  />
                </div>
              </div>
            )}

            {/* 4. ACCESSIBILITY TAB */}
            {activeTab === 'accessibility' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex justify-between items-center bg-stone-900/50 p-4 rounded-lg border border-stone-800">
                  <div>
                    <label className="text-white font-medium text-sm">Screen Shake & Camera Kick</label>
                    <p className="text-xs text-stone-400">Milestone celebrations and studio tier-up camera shake</p>
                  </div>
                  <Switch
                    checked={settings.screenShake}
                    onCheckedChange={(checked) => updateSettings({ screenShake: checked })}
                  />
                </div>

                <div className="flex justify-between items-center bg-stone-900/50 p-4 rounded-lg border border-stone-800">
                  <div>
                    <label className="text-white font-medium text-sm">Reduced Motion</label>
                    <p className="text-xs text-stone-400">Disable fast animated spring transitions and camera zooms</p>
                  </div>
                  <Switch
                    checked={settings.reducedMotion}
                    onCheckedChange={(checked) => updateSettings({ reducedMotion: checked })}
                  />
                </div>

                <div className="space-y-2 bg-stone-900/50 p-4 rounded-lg border border-stone-800">
                  <label className="text-white font-medium text-sm">{t('settings_pocket_meter_assist')}</label>
                  <p className="text-xs text-stone-400">{t('settings_pocket_meter_assist_hint')}</p>
                  <Select
                    value={settings.pocketMeterAssistance}
                    onValueChange={(val: 'strict' | 'normal' | 'generous') => updateSettings({ pocketMeterAssistance: val })}
                  >
                    <SelectTrigger className="w-full bg-stone-900 border-stone-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-stone-900 border-stone-700 text-white">
                      <SelectItem value="strict">{t('settings_pocket_strict')}</SelectItem>
                      <SelectItem value="normal">{t('settings_pocket_normal')}</SelectItem>
                      <SelectItem value="generous">{t('settings_pocket_generous')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* 5. SYSTEM & DATA TAB */}
            {activeTab === 'system' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Language & Theme */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 bg-stone-900/50 p-4 rounded-lg border border-stone-800">
                    <label className="text-white font-medium text-sm">🌐 {t('settings_language')}</label>
                    <Select
                      value={settings.language}
                      onValueChange={handleLanguageChange}
                    >
                      <SelectTrigger className="w-full bg-stone-900 border-stone-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-stone-900 border-stone-700 text-white">
                        {SUPPORTED_LOCALES.map((locale) => (
                          <SelectItem key={locale.code} value={locale.code}>
                            {locale.nativeLabel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 bg-stone-900/50 p-4 rounded-lg border border-stone-800">
                    <label className="text-white font-medium text-sm">🎨 {t('settings_theme')}</label>
                    <Select
                      value={settings.theme}
                      onValueChange={(val: any) => updateSettings({ theme: val })}
                    >
                      <SelectTrigger className="w-full bg-stone-900 border-stone-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-stone-900 border-stone-700 text-white">
                        <SelectItem value="default">{t('settings_theme_default')}</SelectItem>
                        <SelectItem value="sunrise-studio">{t('settings_theme_sunrise')}</SelectItem>
                        <SelectItem value="neon-nights">{t('settings_theme_neon')}</SelectItem>
                        <SelectItem value="retro-arcade">{t('settings_theme_retro')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Import / Export Save */}
                <div className="space-y-3 bg-stone-900/50 p-4 rounded-lg border border-stone-800">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">💾 {t('settings_data_management')}</h4>
                  <div className="space-y-2">
                    <label htmlFor="import-save-string" className="text-xs font-medium text-stone-300">{t('settings_import_label')}</label>
                    <Textarea
                      id="import-save-string"
                      value={importSaveString}
                      onChange={(e) => setImportSaveString(e.target.value)}
                      placeholder={t('settings_import_placeholder')}
                      className="bg-stone-900 border-stone-700 text-xs font-mono min-h-[60px]"
                    />
                    <Button onClick={handleImportGameData} className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs py-1.5 h-auto">
                      {t('settings_import_button')}
                    </Button>
                  </div>

                  {context === 'ingame' && gameState && (
                    <div className="space-y-2 pt-2 border-t border-stone-800">
                      <Button onClick={handleExportGameData} className="w-full bg-amber-600 hover:bg-amber-700 text-xs py-1.5 h-auto">
                        {t('settings_export_button')}
                      </Button>
                      {exportedSaveString && (
                        <>
                          <Textarea
                            value={exportedSaveString}
                            readOnly
                            className="bg-stone-900 border-stone-700 text-xs font-mono min-h-[60px]"
                          />
                          <Button onClick={handleCopyToClipboard} className="w-full bg-amber-600 hover:bg-amber-700 text-xs py-1.5 h-auto">
                            {t('settings_copy_clipboard')}
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Developer Tools — opt-in floating chrome; defaults OFF */}
                {isDevBuild && (
                  <div className="space-y-3 bg-stone-900/50 p-4 rounded-lg border border-amber-500/30">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Developer Tools
                    </h4>
                    <p className="text-xs text-stone-400">
                      Floating DEV controls stay hidden by default so they never cover the studio dock. Enable only what you need.
                    </p>

                    <div className="flex justify-between items-center py-2 border-b border-stone-800">
                      <div>
                        <label className="text-white text-sm font-medium">Show Spawn Box Drop</label>
                        <p className="text-xs text-stone-400">Floating button over the studio HUD (off by default)</p>
                      </div>
                      <Switch
                        checked={settings.devShowBoxDropButton === true}
                        onCheckedChange={(checked) => {
                          updateSettings({ devShowBoxDropButton: checked });
                          gameAudio.playClick();
                        }}
                      />
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-stone-800">
                      <div>
                        <label className="text-white text-sm font-medium">Show Perf HUD</label>
                        <p className="text-xs text-stone-400">Performance / WebGL audit overlay (off by default)</p>
                      </div>
                      <Switch
                        checked={settings.devShowPerfHud === true}
                        onCheckedChange={(checked) => {
                          updateSettings({ devShowPerfHud: checked });
                          gameAudio.playClick();
                        }}
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={() => {
                        triggerBoxDrop('1970s', 2);
                        gameAudio.playClick();
                        toast.success(t('toast_dev_box_drop_spawned'));
                      }}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-stone-950 text-xs py-2 h-auto"
                    >
                      Spawn Box Drop Now
                    </Button>
                  </div>
                )}

                {/* Danger Zone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <Button
                    onClick={handleResetSettings}
                    variant="outline"
                    className="w-full bg-stone-900 hover:bg-stone-800 text-stone-300 border-stone-700 text-xs"
                  >
                    {t('settings_reset_defaults')}
                  </Button>
                  {onResetGame && (
                    <Button
                      onClick={handleResetGame}
                      variant="destructive"
                      className="w-full bg-red-600 hover:bg-red-700 text-white text-xs"
                    >
                      {t('settings_reset_game')}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Save & Close */}
          <div className="pt-4 border-t border-stone-800 flex justify-end">
            <Button
              onClick={onClose}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-6"
            >
              Done & Close
            </Button>
          </div>
        </Card>
      </div>

      <GameConfirmDialog
        isOpen={showResetConfirm}
        title="Reset Game Progress"
        message="Are you sure you want to reset all game progress? This cannot be undone."
        confirmLabel="Reset Everything"
        cancelLabel="Keep Playing"
        variant="danger"
        onConfirm={confirmResetGame}
        onCancel={() => setShowResetConfirm(false)}
      />
    </>
  );
};
