import React from 'react';

export const EnhancedAnimationStyles: React.FC = () => {
  return (
    <style>{`
      @keyframes celebration-particle {
        0% {
          transform: translateY(0) rotate(0deg) scale(0);
          opacity: 1;
        }
        25% {
          transform: translateY(-100px) rotate(90deg) scale(1);
          opacity: 1;
        }
        50% {
          transform: translateY(-150px) rotate(180deg) scale(1.2);
          opacity: 0.8;
        }
        75% {
          transform: translateY(-120px) rotate(270deg) scale(0.8);
          opacity: 0.4;
        }
        100% {
          transform: translateY(100px) rotate(360deg) scale(0);
          opacity: 0;
        }
      }

      @keyframes celebration-bounce {
        0% {
          transform: scale(0) rotate(-180deg);
          opacity: 0;
        }
        30% {
          transform: scale(1.2) rotate(-10deg);
          opacity: 1;
        }
        50% {
          transform: scale(0.9) rotate(5deg);
          opacity: 1;
        }
        70% {
          transform: scale(1.05) rotate(-2deg);
          opacity: 1;
        }
        100% {
          transform: scale(1) rotate(0deg);
          opacity: 1;
        }
      }

      @keyframes era-transition-sweep {
        0% {
          transform: translateX(-100%);
          opacity: 0;
        }
        50% {
          transform: translateX(0);
          opacity: 1;
        }
        100% {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      @keyframes equipment-unlock-reveal {
        0% {
          transform: scale(0.5) rotateY(90deg);
          opacity: 0;
          filter: blur(10px);
        }
        30% {
          transform: scale(0.8) rotateY(45deg);
          opacity: 0.7;
          filter: blur(5px);
        }
        60% {
          transform: scale(1.1) rotateY(15deg);
          opacity: 0.9;
          filter: blur(2px);
        }
        100% {
          transform: scale(1) rotateY(0deg);
          opacity: 1;
          filter: blur(0px);
        }
      }

      @keyframes button-press {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(0.95);
        }
        100% {
          transform: scale(1);
        }
      }

      @keyframes skill-level-up {
        0% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
        }
        25% {
          transform: scale(1.05);
          box-shadow: 0 0 0 10px rgba(59, 130, 246, 0.5);
        }
        50% {
          transform: scale(1.1);
          box-shadow: 0 0 0 20px rgba(59, 130, 246, 0.3);
        }
        75% {
          transform: scale(1.05);
          box-shadow: 0 0 0 30px rgba(59, 130, 246, 0.1);
        }
        100% {
          transform: scale(1);
          box-shadow: 0 0 0 40px rgba(59, 130, 246, 0);
        }
      }

      @keyframes money-gain {
        0% {
          transform: translateY(0) scale(1);
          color: #10b981;
        }
        50% {
          transform: translateY(-10px) scale(1.2);
          color: #34d399;
          text-shadow: 0 0 10px rgba(52, 211, 153, 0.8);
        }
        100% {
          transform: translateY(0) scale(1);
          color: #10b981;
        }
      }

      @keyframes smooth-slide-in {
        0% {
          transform: translateX(-50px);
          opacity: 0;
        }
        100% {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes glow-pulse {
        0%, 100% {
          box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
        }
        50% {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
        }
      }

      .animate-celebration-particle {
        animation: celebration-particle 3s ease-out forwards;
      }

      .animate-celebration-bounce {
        animation: celebration-bounce 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
      }

      .animate-era-transition-sweep {
        animation: era-transition-sweep 2s ease-in-out forwards;
      }

      .animate-equipment-unlock-reveal {
        animation: equipment-unlock-reveal 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
      }

      .animate-button-press {
        animation: button-press 0.15s ease-out;
      }

      .animate-skill-level-up {
        animation: skill-level-up 1s ease-out;
      }

      .animate-money-gain {
        animation: money-gain 0.6s ease-out;
      }

      .animate-smooth-slide-in {
        animation: smooth-slide-in 0.5s ease-out forwards;
      }

      .animate-glow-pulse {
        animation: glow-pulse 2s ease-in-out infinite;
      }

      /* Enhanced hover effects */
      .enhanced-button {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .enhanced-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      }

      .enhanced-button:active {
        animation: button-press 0.15s ease-out;
      }

      /* Equipment card hover effects */
      .equipment-card {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .equipment-card:hover {
        transform: translateY(-5px) scale(1.02);
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
      }

      /* Project stage progress indicators */
      .stage-progress-indicator {
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .stage-progress-indicator.active {
        transform: scale(1.1);
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
      }

      /* Smooth fade transitions */
      .fade-transition {
        transition: all 0.3s ease-in-out;
      }

      .fade-enter {
        opacity: 0;
        transform: translateY(10px);
      }

      .fade-enter-active {
        opacity: 1;
        transform: translateY(0);
      }

      .fade-exit {
        opacity: 1;
        transform: translateY(0);
      }

      .fade-exit-active {
        opacity: 0;
        transform: translateY(-10px);
      }
    `}</style>
  );
};
