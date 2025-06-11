import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface MinigameTutorialPopupProps {
  minigameId: string;
  title: string;
  instructions: { icon: string; text: string }[];
  onClose: () => void;
}

export const MinigameTutorialPopup: React.FC<MinigameTutorialPopupProps> = ({
  minigameId,
  title,
  instructions,
  onClose,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4"
      onClick={onClose} // Close on backdrop click
    >
      <Card 
        className="w-full max-w-lg bg-gray-800 border-purple-500 shadow-2xl text-white relative"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the card
      >
        <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-3 right-3 text-gray-400 hover:text-white"
            onClick={onClose}
            aria-label="Close tutorial"
        >
            <X size={20} />
        </Button>
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-purple-400 flex items-center">
            <span role="img" aria-label="controller icon" className="mr-2 text-3xl">🎮</span> 
            {title}
          </CardTitle>
          <CardDescription className="text-gray-300">
            Here's a quick guide before you start!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {instructions.map((item, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-700/50 rounded-md">
              <span className="text-2xl pt-0.5">{item.icon}</span>
              <p className="text-gray-200 text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
          <Button 
            onClick={onClose} 
            className="w-full bg-purple-600 hover:bg-purple-700 mt-6"
          >
            Got it, let's play!
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Example usage (for testing, can be removed)
// const ExamplePopup = () => {
//   const [isOpen, setIsOpen] = useState(true);
//   if (!isOpen) return null;
//   return (
//     <MinigameTutorialPopup
//       minigameId="testGame"
//       title="Awesome Minigame"
//       instructions={[
//         { icon: '🕹️', text: 'Use the joystick to move your character around.' },
//         { icon: '💥', text: 'Press the A button to shoot at the targets.' },
//         { icon: '🏆', text: 'Score 1000 points to win the game and get rewards!' },
//       ]}
//       onClose={() => setIsOpen(false)}
//     />
//   );
// };
