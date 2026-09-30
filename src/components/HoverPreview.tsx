import React, { useRef, useState } from 'react';
import './chip-fidelity.css';

/**
 * HoverPreview — delayed hover/focus preview chip (k6e.2).
 * 250 ms delay, pointer-safe (card is pointer-events-none), keyboard
 * accessible via focus-within, screen-reader mirror included. Replaces
 * native title= tooltips with on-brand chips.
 */
export const HoverPreview: React.FC<{
  preview: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
}> = ({ preview, children, side = 'top' }) => {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), 250);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  };

  return (
    <span
      className="relative inline-block max-w-full"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <span className="sr-only">{preview}</span>
      {open && (
        <span
          aria-hidden="true"
          className={`hover-preview-card pointer-events-none absolute z-40 w-56 rounded-lg border border-amber-300/30 bg-stone-900/95 p-2.5 text-left text-xs text-stone-200 shadow-xl ${
            side === 'top' ? 'bottom-full mb-2 left-0' : 'top-full mt-2 left-0'
          }`}
        >
          {preview}
        </span>
      )}
    </span>
  );
};
