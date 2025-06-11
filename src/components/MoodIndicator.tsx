import React from 'react';

interface MoodIndicatorProps {
  mood: number; // Assuming mood is 0-100
}

const MoodIndicator: React.FC<MoodIndicatorProps> = ({ mood }) => {
  if (mood < 75) { // Only show for high mood
    return null;
  }

  // Alternate between sparkle and note, or choose one
  const emoji = mood > 85 ? '✨' : '🎵'; 

  return (
    <span 
      className="ml-1 text-sm animate-mood-sparkle-float" 
      role="img" 
      aria-label={mood > 85 ? "sparkling with joy" : "musically happy"}
    >
      {emoji}
    </span>
  );
};

export default MoodIndicator;
