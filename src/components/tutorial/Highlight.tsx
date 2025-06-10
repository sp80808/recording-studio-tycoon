import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface HighlightProps {
  elementId: string;
  type: 'pulse' | 'glow' | 'arrow';
  position?: 'top' | 'right' | 'bottom' | 'left';
}

export const Highlight: React.FC<HighlightProps> = ({ elementId, type, position }) => {
  const element = useRef<HTMLElement | null>(null);
  const [rect, setRect] = React.useState<DOMRect | null>(null);

  useEffect(() => {
    const targetElement = document.getElementById(elementId);
    if (!targetElement) return;

    element.current = targetElement;
    const updateRect = () => {
      const newRect = targetElement.getBoundingClientRect();
      setRect(newRect);
    };

    // Initial position
    updateRect();

    // Update position on scroll and resize
    window.addEventListener('scroll', updateRect);
    window.addEventListener('resize', updateRect);

    // Create ResizeObserver to watch for element size changes
    const resizeObserver = new ResizeObserver(updateRect);
    resizeObserver.observe(targetElement);

    return () => {
      window.removeEventListener('scroll', updateRect);
      window.removeEventListener('resize', updateRect);
      resizeObserver.disconnect();
    };
  }, [elementId]);

  if (!rect) return null;

  return (
    <motion.div
      className={`tutorial-highlight tutorial-highlight-${type}`}
      style={{
        position: 'fixed',
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        pointerEvents: 'none',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {type === 'arrow' && position && (
        <div className={`tutorial-arrow tutorial-arrow-${position}`} />
      )}
    </motion.div>
  );
}; 