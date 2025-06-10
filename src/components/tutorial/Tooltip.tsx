import React from 'react';
import { motion } from 'framer-motion';

interface TooltipProps {
  content: string;
  position: { x: number; y: number };
  arrow?: 'top' | 'right' | 'bottom' | 'left';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, position, arrow }) => {
  return (
    <motion.div
      className="tutorial-tooltip"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        pointerEvents: 'none',
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="tutorial-tooltip-content">
        {content}
      </div>
      {arrow && (
        <div className={`tutorial-tooltip-arrow tutorial-tooltip-arrow-${arrow}`} />
      )}
    </motion.div>
  );
}; 