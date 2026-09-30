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
  danger: { accent: 'bg-[var(--rst-danger)]', confirmBtn: 'rst-btn rst-btn-danger', kicker: 'Careful' },
  warning: { accent: 'bg-[var(--rst-warn)]', confirmBtn: 'rst-btn rst-btn-primary', kicker: 'Heads up' },
  default: { accent: 'bg-[var(--rst-brass-400)]', confirmBtn: 'rst-btn rst-btn-primary', kicker: 'Confirm' },
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
        className="absolute inset-0 bg-black/65 backdrop-blur-[3px] animate-rst-fade"
        onClick={() => { playClick(); onCancel(); }}
      />

      {/* Dialog panel */}
      <div className="rst-modal rst-modal-pop relative mx-4 w-full max-w-sm rst-enter">
        <div className="rst-modal-header flex items-start gap-3">
          <span aria-hidden="true" className={`mt-1 h-8 w-1 shrink-0 rounded-full ${v.accent}`} />
          <div>
            <p className="rst-kicker">{v.kicker}</p>
            <h2 id="game-confirm-title" className="rst-title mt-0.5 text-xl">{title}</h2>
          </div>
        </div>

        <div className="rst-modal-body">
          <p id="game-confirm-desc" className="rst-body text-sm">{message}</p>
        </div>

        <div className="rst-modal-footer">
          <button onClick={() => { playClick(); onCancel(); }} className="rst-btn flex-1">
            {cancelLabel}
          </button>
          <button onClick={() => { playClick(); onConfirm(); }} className={`${v.confirmBtn} flex-1`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
