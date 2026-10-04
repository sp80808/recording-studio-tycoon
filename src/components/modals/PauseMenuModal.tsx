import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GameState } from '@/types/game';
import { currencySymbol, getCityById, toLocalAmount } from '@/rpg/cities';
import { getStudioSignage } from '@/components/WebGLCanvas';
import { useStudioClock } from '@/contexts/StudioClockContext';
import { useSaveSystem } from '@/contexts/SaveSystemContext';
import { gameAudio } from '@/utils/audioSystem';
import { useSettings } from '@/contexts/SettingsContext';
import { useGamepad } from '@/hooks/useGamepad';
import { GameConfirmDialog } from '@/components/ui/GameConfirmDialog';
import {
  Play,
  Save,
  Settings,
  HelpCircle,
  LogOut,
  Disc3,
  Coins,
  Star,
  CalendarDays,
  Sparkles,
  Music,
  CheckCircle2,
  ChevronRight,
  Keyboard,
  Gamepad2,
} from 'lucide-react';

interface PauseMenuModalProps {
  isOpen: boolean;
  gameState: GameState;
  onClose: () => void;
  onOpenSettings: () => void;
  onQuitToTitle: () => void;
}

export const PauseMenuModal: React.FC<PauseMenuModalProps> = ({
  isOpen,
  gameState,
  onClose,
  onOpenSettings,
  onQuitToTitle,
}) => {
  const { settings } = useSettings();
  const { saveGame } = useSaveSystem();
  const studioClock = useStudioClock();
  const gamepad = useGamepad();

  const [savedTime, setSavedTime] = useState<string | null>(null);
  const [showControlsGuide, setShowControlsGuide] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const player = gameState.playerData;
  const signage = getStudioSignage(
    gameState.currentEra,
    Object.keys(gameState.unlockedAchievements ?? {}).length,
    getCityById(gameState.cityId)?.name
  );
  const activeProject = gameState.activeProject;

  const menuOptions = [
    { id: 'resume', label: 'Resume Session', icon: Play, shortcut: 'Esc / Space' },
    { id: 'save', label: 'Save Studio', icon: Save, shortcut: 'Quick' },
    { id: 'settings', label: 'Studio Settings', icon: Settings, shortcut: 'Options' },
    { id: 'controls', label: showControlsGuide ? 'Hide Controls Guide' : 'Controls & Shortcuts', icon: HelpCircle, shortcut: 'Guide' },
    { id: 'quit', label: 'Quit to Main Menu', icon: LogOut, shortcut: 'Title' },
  ];

  const handleSave = () => {
    saveGame(gameState);
    if (settings.sfxEnabled) {
      void gameAudio.playSuccess();
    }
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSavedTime(timeStr);
  };

  const handleSelectOption = (index: number) => {
    const opt = menuOptions[index];
    if (!opt) return;

    if (settings.sfxEnabled) {
      void gameAudio.playClick();
    }

    switch (opt.id) {
      case 'resume':
        onClose();
        break;
      case 'save':
        handleSave();
        break;
      case 'settings':
        onOpenSettings();
        break;
      case 'controls':
        setShowControlsGuide((prev) => !prev);
        break;
      case 'quit':
        setShowQuitConfirm(true);
        break;
    }
  };

  // Controller navigation
  useEffect(() => {
    if (!isOpen || !gamepad.isConnected) return;

    if (gamepad.justPressed.dpadUp) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : menuOptions.length - 1));
      if (settings.sfxEnabled) void gameAudio.playTactileClick();
    } else if (gamepad.justPressed.dpadDown) {
      setSelectedIndex((prev) => (prev < menuOptions.length - 1 ? prev + 1 : 0));
      if (settings.sfxEnabled) void gameAudio.playTactileClick();
    } else if (gamepad.justPressed.south) {
      handleSelectOption(selectedIndex);
    } else if (gamepad.justPressed.east || gamepad.justPressed.start) {
      onClose();
    }
  }, [isOpen, gamepad.isConnected, gamepad.justPressed, selectedIndex, menuOptions.length]);

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border border-[var(--rst-brass-line)] bg-stone-950/95 text-stone-100 shadow-2xl backdrop-blur-xl">
          {/* Header tape deck banner */}
          <div className="relative border-b border-stone-800 bg-gradient-to-r from-stone-900 via-stone-900/90 to-stone-950 p-6 pb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                  <Disc3 className="w-6 h-6 animate-pulse" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-mono tracking-widest text-amber-400/90 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      SESSION PAUSED
                    </span>
                    <span className="text-xs text-stone-400 font-mono">
                      {gameState.currentEra.toUpperCase()} · {gameState.currentYear}
                    </span>
                  </div>
                  <DialogTitle className="text-xl font-bold tracking-tight text-stone-100 mt-1">
                    {signage}
                  </DialogTitle>
                </div>
              </div>
            </div>

            {/* Quick status bar */}
            <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-stone-800/80 text-xs font-mono">
              <div className="bg-stone-900/80 px-2.5 py-1.5 rounded-lg border border-stone-800 flex items-center gap-1.5">
                <Coins size={14} className="text-emerald-400" />
                <span className="text-stone-200 font-semibold">
                  {currencySymbol(gameState.cityId, gameState.currentEra)}
                  {toLocalAmount(gameState.money, gameState.cityId, gameState.currentEra)}
                </span>
              </div>
              <div className="bg-stone-900/80 px-2.5 py-1.5 rounded-lg border border-stone-800 flex items-center gap-1.5">
                <Star size={14} className="text-amber-400" fill="currentColor" />
                <span className="text-stone-200 font-semibold">{gameState.reputation} REP</span>
              </div>
              <div className="bg-stone-900/80 px-2.5 py-1.5 rounded-lg border border-stone-800 flex items-center gap-1.5">
                <Sparkles size={14} className="text-purple-400" />
                <span className="text-stone-200 font-semibold">LVL {player.level}</span>
              </div>
              <div className="bg-stone-900/80 px-2.5 py-1.5 rounded-lg border border-stone-800 flex items-center gap-1.5">
                <CalendarDays size={14} className="text-cyan-400" />
                <span className="text-stone-200 font-semibold">DAY {gameState.currentDay}</span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Active Project Card */}
            {activeProject ? (
              <div className="bg-stone-900/90 rounded-xl p-3.5 border border-stone-800/90 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Music size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-stone-400 uppercase tracking-wider">In Production</div>
                    <div className="text-sm font-semibold text-stone-200">{activeProject.title}</div>
                    <div className="text-xs text-stone-400">
                      {activeProject.clientName || 'Artist'} · {activeProject.genre}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-800 text-amber-300 border border-stone-700">
                    {Math.round(activeProject.progress || 0)}% Done
                  </span>
                </div>
              </div>
            ) : null}

            {/* Saved Notification */}
            {savedTime && (
              <div className="flex items-center gap-2 p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-mono">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Studio state successfully saved to disk ({savedTime}).</span>
              </div>
            )}

            {/* Menu Options */}
            <div className="space-y-2">
              {menuOptions.map((opt, idx) => {
                const isSelected = selectedIndex === idx;
                const isPrimary = opt.id === 'resume';
                const Icon = opt.icon;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedIndex(idx);
                      handleSelectOption(idx);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all duration-150 ${
                      isPrimary
                        ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                        : isSelected
                        ? 'bg-stone-800 border-[var(--rst-brass-line)] text-stone-100 shadow-sm'
                        : 'bg-stone-900/60 hover:bg-stone-800/60 border-stone-800/80 text-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={18}
                        className={isPrimary ? 'text-amber-400' : isSelected ? 'text-stone-200' : 'text-stone-400'}
                      />
                      <span className="font-medium tracking-wide">{opt.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/5 text-stone-400">
                        {opt.shortcut}
                      </span>
                      <ChevronRight size={14} className="text-stone-500" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Expandable Controls Guide */}
            {showControlsGuide && (
              <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 text-xs space-y-3">
                <div className="font-semibold text-stone-200 flex items-center gap-2 border-b border-stone-800 pb-2">
                  <Keyboard size={14} className="text-amber-400" />
                  <span>Studio Keyboard & Gamepad Controls</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-stone-300 font-mono text-[11px]">
                  <div className="flex justify-between py-1 border-b border-stone-800/40">
                    <span className="text-stone-400">Pause / Menu</span>
                    <span className="text-amber-300">Esc / P / Start</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-800/40">
                    <span className="text-stone-400">Lock / Calibrate Take</span>
                    <span className="text-amber-300">Space / A</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-800/40">
                    <span className="text-stone-400">Floor Hotspots</span>
                    <span className="text-amber-300">Click / D-Pad</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-800/40">
                    <span className="text-stone-400">Cycle Tabs</span>
                    <span className="text-amber-300">1 - 7 / LB, RB</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-800/40">
                    <span className="text-stone-400">Camera Pan / Zoom</span>
                    <span className="text-amber-300">Drag / Scroll</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-800/40">
                    <span className="text-stone-400">Recenter Camera</span>
                    <span className="text-amber-300">Home / RS</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <GameConfirmDialog
        isOpen={showQuitConfirm}
        title="Return to Main Menu?"
        message="Any unsaved studio progress since your last save will be kept in auto-save, but saving manually first is recommended."
        confirmLabel="Exit to Title"
        cancelLabel="Stay in Studio"
        variant="warning"
        onConfirm={() => {
          setShowQuitConfirm(false);
          onClose();
          onQuitToTitle();
        }}
        onCancel={() => setShowQuitConfirm(false)}
      />
    </>
  );
};
