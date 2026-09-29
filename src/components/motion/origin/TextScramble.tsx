import React, { useState, useEffect, useRef } from 'react';
import { useMotionCapabilities } from '@/lib/motion/capabilities';

export interface TextScrambleProps {
  text: string;
  /** Speed of scramble resolution in milliseconds per step (default: 30ms) */
  speed?: number;
  /** Character set used for random digital/meter noise */
  characterSet?: string;
  className?: string;
  onComplete?: () => void;
}

const DEFAULT_CHARS = '0123456789ABCDEF$#%&*+=~';

/**
 * OriginKit-derived retro console/LED text decode transition:
 * Procedurally scrambles through hardware glyphs before locking onto target characters.
 * Renderer: DOM text node update (Zero WebGL/Canvas allocation).
 */
export const TextScramble: React.FC<TextScrambleProps> = ({
  text,
  speed = 30,
  characterSet = DEFAULT_CHARS,
  className = '',
  onComplete,
}) => {
  const [displayText, setDisplayText] = useState(text);
  const { reducedMotion, isTabVisible } = useMotionCapabilities();
  const stepRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // If reduced motion is active or tab is hidden, resolve immediately
    if (reducedMotion || !isTabVisible) {
      setDisplayText(text);
      onComplete?.();
      return;
    }

    stepRef.current = 0;
    const totalSteps = text.length * 3;

    const tick = () => {
      stepRef.current += 1;
      const progress = stepRef.current / totalSteps;
      const resolvedCharsCount = Math.floor(progress * text.length);

      let scrambled = '';
      for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') {
          scrambled += ' ';
        } else if (i < resolvedCharsCount) {
          scrambled += text[i];
        } else {
          scrambled += characterSet[Math.floor(Math.random() * characterSet.length)];
        }
      }

      setDisplayText(scrambled);

      if (stepRef.current >= totalSteps) {
        setDisplayText(text);
        onComplete?.();
      } else {
        timerRef.current = window.setTimeout(tick, speed);
      }
    };

    tick();

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [text, speed, characterSet, reducedMotion, isTabVisible, onComplete]);

  return <span className={`font-mono tracking-wider ${className}`}>{displayText}</span>;
};
