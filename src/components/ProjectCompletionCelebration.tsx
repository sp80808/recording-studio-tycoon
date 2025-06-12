import React, { useEffect, useState } from 'react';

interface ProjectCompletionCelebrationProps {
  isVisible: boolean;
  projectTitle: string;
  genre: string;
  onComplete: () => void;
}

export const ProjectCompletionCelebration: React.FC<ProjectCompletionCelebrationProps> = ({
  isVisible,
  projectTitle,
  genre,
  onComplete
}) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Generate particles
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        delay: Math.random() * 1000
      }));
      setParticles(newParticles);

      // Show text with delay
      const textTimer = setTimeout(() => setShowText(true), 300);

      // Auto-close after shorter animation (reduced from 4000ms to 2500ms)
      const closeTimer = setTimeout(() => {
        setShowText(false);
        setParticles([]);
        onComplete();
      }, 2500);

      return () => {
        clearTimeout(textTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [isVisible, onComplete]);

  const getGenreEmoji = (genre: string) => {
    const genreEmojis: Record<string, string> = {
      'Rock': '🎸',
      'Pop': '🎤',
      'Electronic': '🎛️',
      'Hip-hop': '🎵',
      'Acoustic': '🎻',
      'Jazz': '🎺',
      'Classical': '🎼',
      'Blues': '🎷',
      'Country': '🤠',
      'Folk': '🪕'
    };
    return genreEmojis[genre] || '🎵';
  };

  const getGenreColor = (genre: string) => {
    const genreColors: Record<string, string> = {
      'Rock': 'from-red-500 to-orange-500',
      'Pop': 'from-pink-500 to-purple-500',
      'Electronic': 'from-cyan-500 to-blue-500',
      'Hip-hop': 'from-yellow-500 to-orange-500',
      'Acoustic': 'from-green-500 to-emerald-500',
      'Jazz': 'from-purple-500 to-indigo-500',
      'Classical': 'from-blue-500 to-indigo-500',
      'Blues': 'from-indigo-500 to-purple-500',
      'Country': 'from-amber-500 to-orange-500',
      'Folk': 'from-green-500 to-teal-500'
    };
    return genreColors[genre] || 'from-purple-500 to-blue-500';
  };

  // Handle early dismissal on click
  const handleDismiss = () => {
    setShowText(false);
    setParticles([]);
    onComplete();
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-50 cursor-pointer"
      onClick={handleDismiss}
      title="Click to dismiss"
    >
      {/* Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 animate-celebration-particle"
          style={{
            left: particle.x,
            top: particle.y,
            animationDelay: `${particle.delay}ms`,
            background: `hsl(${Math.random() * 360}, 70%, 60%)`
          }}
        />
      ))}

      {/* Main celebration text */}
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center animate-celebration-bounce">
            <div className={`text-8xl mb-4 bg-gradient-to-r ${getGenreColor(genre)} bg-clip-text text-transparent font-bold`}>
              {getGenreEmoji(genre)}
            </div>
            <div className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
              PROJECT COMPLETE!
            </div>
            <div className="text-xl text-gray-200 drop-shadow-md">
              "{projectTitle}"
            </div>
            <div className={`text-lg font-semibold mt-2 bg-gradient-to-r ${getGenreColor(genre)} bg-clip-text text-transparent`}>
              {genre} Production
            </div>
            <div className="text-sm text-gray-400 mt-4 animate-pulse">
              Click anywhere to continue
            </div>
          </div>
        </div>
      )}

      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/20 animate-fade-in pointer-events-none" />
    </div>
  );
};
