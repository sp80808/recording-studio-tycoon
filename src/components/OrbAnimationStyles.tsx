
import { useEffect } from 'react';

export const useOrbAnimationStyles = () => {
  useEffect(() => {
    const styleId = 'enhanced-orb-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .orb {
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          transition: all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          pointer-events: none;
          z-index: 1000;
          animation: orbFloat 0.3s ease-out;
        }
        
        .orb.creativity {
          background: linear-gradient(45deg, #3b82f6, #60a5fa);
          color: white;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .orb.technical {
          background: linear-gradient(45deg, #10b981, #34d399);
          color: white;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        @keyframes orbFloat {
          0% {
            transform: scale(0.5) translateY(20px);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) translateY(-10px);
            opacity: 1;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }

        /* Toast notification enhancements */
        .toast-notification {
          animation: slideInFromRight 0.3s ease-out;
        }

        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        /* Button hover effects */
        .game-button {
          transition: all 0.2s ease;
        }

        .game-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .game-button:active {
          transform: translateY(0);
        }

        /* Progress bar animation */
        .progress-bar {
          transition: width 0.5s ease-in-out;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);
};
