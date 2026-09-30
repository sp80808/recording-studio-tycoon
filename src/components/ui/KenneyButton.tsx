import React, { ButtonHTMLAttributes } from 'react';
import { gameAudio } from '@/utils/audioSystem';

/**
 * Variant names are kept for API compatibility with the original Kenney-sprite
 * button. They now map onto the shared studio button styles (studio-theme.css):
 * the sprite's 9-slice had no centre fill, so it rendered as a hollow bright
 * outline that clashed with the warm palette.
 */
export type KenneyButtonVariant = 'blue' | 'green' | 'red' | 'yellow' | 'grey';
export type KenneyButtonSize = 'sm' | 'md' | 'lg';

export interface KenneyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: KenneyButtonVariant;
  size?: KenneyButtonSize;
  playSfx?: boolean;
}

const VARIANT_CLASS: Record<KenneyButtonVariant, string> = {
  yellow: 'rst-btn rst-btn-primary',
  green: 'rst-btn rst-btn-success',
  red: 'rst-btn rst-btn-danger',
  grey: 'rst-btn',
  blue: 'rst-btn',
};

const SIZE_CLASS: Record<KenneyButtonSize, string> = {
  sm: '!min-h-8 !px-3 !py-1 !text-xs',
  md: '',
  lg: '!min-h-12 !px-7 !text-base',
};

/**
 * Tactile depth button with press-down feedback and SFX.
 */
export const KenneyButton = React.forwardRef<HTMLButtonElement, KenneyButtonProps>(
  ({ variant = 'yellow', size = 'md', playSfx = true, className = '', type = 'button', onClick, disabled, ...rest }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (playSfx) {
        void gameAudio.playClick().catch(() => {});
      }
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        onClick={handleClick}
        className={`${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`}
        {...rest}
      />
    );
  }
);
KenneyButton.displayName = 'KenneyButton';
