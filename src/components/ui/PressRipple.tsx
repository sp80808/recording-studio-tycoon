import React, { useCallback } from 'react';

/**
 * PressRipple — pointer-position ripple for chip buttons (k6e.2).
 * Wrap any button content; the host keeps its own layout (inline-flex).
 * Decorative only (aria-hidden), disabled under reduced-motion via CSS.
 */
export const PressRipple: React.FC<{
  children: React.ReactNode;
  size?: number;
}> = ({ children, size = 240 }) => {
  const spawn = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>) => {
      const host = e.currentTarget;
      const rect = host.getBoundingClientRect();
      const ink = document.createElement('span');
      ink.className = 'press-ripple-ink';
      ink.setAttribute('aria-hidden', 'true');
      const d = Math.max(rect.width, rect.height, size * 0.4);
      ink.style.width = `${d}px`;
      ink.style.height = `${d}px`;
      ink.style.left = `${e.clientX - rect.left}px`;
      ink.style.top = `${e.clientY - rect.top}px`;
      ink.addEventListener('animationend', () => ink.remove());
      host.appendChild(ink);
    },
    [size]
  );

  return (
    <span
      className="press-ripple-host"
      style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 'inherit' }}
      onPointerDown={spawn}
    >
      {children}
    </span>
  );
};
