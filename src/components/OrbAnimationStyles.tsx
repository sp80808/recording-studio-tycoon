
import React from 'react';

export const OrbAnimationStyles: React.FC = () => {
  return (
    <style jsx global>{`
      @keyframes blob-float {
        0% {
          transform: translate(0, 0) scale(0.8);
          opacity: 0;
        }
        20% {
          transform: translate(0, 0) scale(1);
          opacity: 1;
        }
        80% {
          transform: translate(var(--target-x, 0), var(--target-y, 0)) scale(1);
          opacity: 1;
        }
        100% {
          transform: translate(var(--target-x, 0), var(--target-y, 0)) scale(0.5);
          opacity: 0;
        }
      }

      .animate-blob-float {
        animation: blob-float 1.5s ease-out forwards;
      }

      .orb {
        position: absolute;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        transition: all 1.5s ease-out;
        z-index: 1000;
        pointer-events: none;
      }

      .orb.creativity {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.3);
        border: 2px solid rgba(255, 255, 255, 0.4);
      }

      .orb.technical {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.3);
        border: 2px solid rgba(255, 255, 255, 0.4);
      }
    `}</style>
  );
};
