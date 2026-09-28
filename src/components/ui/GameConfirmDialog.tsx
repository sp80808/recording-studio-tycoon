import React from 'react';
import { gameAudio } from '@/utils/audioSystem';
import { useSettings } from '@/contexts/SettingsContext';

interface GameConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_STYLES = {
  danger: {
    accent: 'from-red-600 to-red-800 border-red-400/50',
    confirmBtn: 'bg-red-600 hover:bg-red-500 active:translate-y-[2px] active:bg-red-700',
    icon: '⚠️',
  },
  warning: {
    accent: 'from-amber-600 to-amber-800 border-amber-400/50',
    confirmBtn: 'bg-amber-600 hover:bg-amber-500 active:translate-y-[2px] active:bg-amber-700',
    icon: '⚡',
  },
  default: {
    accent: 'from-blue-600 to-blue-800 border-blue-400/50',
    confirmBtn: 'bg-blue-600 hover:bg-blue-500 active:translate-y-[2px] active:bg-blue-700',
    icon: '❓',
  },
};

/**
 * In-game confirmation dialog — replaces window.confirm() to maintain
 * game immersion. Uses game typography, depth buttons, SFX, and an
 * animated entrance instead of a browser-native dialog.
 */
export const GameConfirmDialog: React.FC<GameConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}) => {
  const { settings } = useSettings();
  const v = VARIANT_STYLES[variant];

  if (!isOpen) return null;

  const playClick = () => {
    if (settings.sfxEnabled) gameAudio.playUISound('buttonClick');
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="game-confirm-title"
      aria-describedby="game-confirm-desc"
    >
      {/* Gradient scrim — not the web-default flat black overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80 backdrop-blur-[2px]"
        onClick={() => { playClick(); onCancel(); }}
      />

      {/* Dialog panel */}
      <div className="relative animate-inspector-pop w-full max-w-sm mx-4 rounded-lg border-2 border-white/10 bg-gray-900/95 shadow-2xl overflow-hidden">
        {/* Header strip */}
        <div className={`flex items-center gap-2 px-4 py-3 border-b bg-gradient-to-r ${v.accent}`}>
          <span className="text-lg">{v.icon}</span>
          <h2 id="game-confirm-title" className="font-display font-bold text-white text-base tracking-wide">
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p id="game-confirm-desc" className="text-sm text-gray-200 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Button row — chunky game buttons with depth/press */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={() => { playClick(); onCancel(); }}
            className="flex-1 rounded-md border-2 border-gray-600 bg-gray-700 px-4 py-2.5 text-sm font-bold text-gray-200 transition-all hover:bg-gray-600 hover:border-gray-500 active:translate-y-[2px] active:bg-gray-800"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => { playClick(); onConfirm(); }}
            className={`flex-1 rounded-md border-2 border-white/20 px-4 py-2.5 text-sm font-bold text-white transition-all shadow-lg ${v.confirmBtn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
