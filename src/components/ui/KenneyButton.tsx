import React, { ButtonHTMLAttributes } from 'react';
import { gameAudio } from '@/utils/audioSystem';

export type KenneyButtonVariant = 'blue' | 'green' | 'red' | 'yellow' | 'grey';
export type KenneyButtonSize = 'sm' | 'md' | 'lg';

export interface KenneyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: KenneyButtonVariant;
  size?: KenneyButtonSize;
  playSfx?: boolean;
}

const KENNEY_VARIANT_DIRS: Record<KenneyButtonVariant, string> = {
  blue: 'Blue',
  green: 'Green',
  red: 'Red',
  yellow: 'Yellow',
  grey: 'Grey',
};

/** Light sprites (yellow/grey) need dark type; saturated sprites keep white type with a drop shadow. */
const LIGHT_VARIANTS: ReadonlySet<KenneyButtonVariant> = new Set(['yellow', 'grey']);

const KENNEY_BUTTON_SPRITE = 'button_rectangle_depth_flat.png';

const SIZE_STYLES: Record<KenneyButtonSize, { px: string; py: string; fontSize: string }> = {
  sm: { px: 'px-3', py: 'py-1', fontSize: 'text-xs' },
  md: { px: 'px-5', py: 'py-2', fontSize: 'text-sm' },
  lg: { px: 'px-7', py: 'py-3', fontSize: 'text-base font-extrabold' },
};

/**
 * Tactile arcade button using Kenney 9-slice sprites.
 * Includes interactive hover brightness, press-down active state, and SFX feedback.
 */
export const KenneyButton = React.forwardRef<HTMLButtonElement, KenneyButtonProps>(
  ({ variant = 'yellow', size = 'md', playSfx = true, className = '', style, type = 'button', onClick, disabled, ...rest }, ref) => {
    const spriteUrl = `/assets/kenney-ui/PNG/${KENNEY_VARIANT_DIRS[variant]}/Default/${KENNEY_BUTTON_SPRITE}`;
    const sizeStyle = SIZE_STYLES[size];

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
        className={`inline-flex items-center justify-center font-bold ${LIGHT_VARIANTS.has(variant) ? 'text-stone-900' : 'text-white'} tracking-wide transition-all select-none
          cursor-pointer hover:brightness-110 active:translate-y-[2px] active:brightness-95
          disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none disabled:brightness-90
          ${sizeStyle.px} ${sizeStyle.py} ${sizeStyle.fontSize} ${className}`}
        style={{
          borderWidth: 10,
          borderStyle: 'solid',
          borderImageSource: `url("${spriteUrl}")`,
          borderImageSlice: 10,
          borderImageRepeat: 'stretch',
          backgroundColor: 'transparent',
          textShadow: LIGHT_VARIANTS.has(variant) ? '0 1px 0 rgba(255, 255, 255, 0.4)' : '0 2px 2px rgba(0, 0, 0, 0.65)',
          ...style,
        }}
        {...rest}
      />
    );
  }
);

KenneyButton.displayName = 'KenneyButton';
