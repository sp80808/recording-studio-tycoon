import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GameState, PlayerAttributes, PlayerData } from '@/types/game';
import { motion } from 'framer-motion';

interface CharacterCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (playerData: PlayerData) => void;
}

const CharacterCreationModal: React.FC<CharacterCreationModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [name, setName] = useState('');
  const [pointsRemaining, setPointsRemaining] = useState(20);
  const [attributes, setAttributes] = useState<PlayerAttributes>({
    focusMastery: 5,
    creativeIntuition: 5,
    technicalAptitude: 5,
    businessAcumen: 5
  });
  const [attributeChange, setAttributeChange] = useState<keyof PlayerAttributes | null>(null);

  const handleAttributeChange = (attr: keyof PlayerAttributes) => {
    setAttributeChange(attr);
    const timer = setTimeout(() => {
      setAttributeChange(null);
    }, 300); // Animation duration
    return () => clearTimeout(timer);
  };

  const incrementAttribute = (attr: keyof PlayerAttributes) => {
    if (pointsRemaining > 0 && attributes[attr] < 10) { // Added max limit 10
      setAttributes(prev => ({
        ...prev,
        [attr]: prev[attr] + 1
      }));
      setPointsRemaining(prev => prev - 1);
      handleAttributeChange(attr);
    }
  };

  const decrementAttribute = (attr: keyof PlayerAttributes) => {
    if (attributes[attr] > 5) {
      setAttributes(prev => ({
        ...prev,
        [attr]: prev[attr] - 1
      }));
      setPointsRemaining(prev => prev + 1);
      handleAttributeChange(attr);
    }
  };

  const handleCompleteCreation = () => {
    const newPlayerData: PlayerData = {
      name,
      level: 1,
      xp: 0,
      money: 0,
      reputation: 0,
      attributes,
      dailyWorkCapacity: attributes.focusMastery * 5, // Example calculation
      attributePoints: 0, // No attribute points initially after creation
      initialAttributePoints: 20, // Store initial points
      xpToNextLevel: 100, // Example initial XP to level up
      perkPoints: 0,
      characterCreated: true,
      trainingHistory: [],
      minigameHistory: [],
      trainingCooldown: 0,
    };

    onComplete(newPlayerData); // Pass the newPlayerData object
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="bg-gray-900 border-gray-600 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Create Your Character</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h3 className="font-medium text-gray-300 mb-2">
              Attribute Points Remaining: {pointsRemaining}
            </h3>
            
            {Object.entries(attributes).map(([key, value]) => (
              <div key={key} className="flex flex-col gap-1 mb-4"> {/* Changed to flex-col */}
                <div className="flex items-center justify-between">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-gray-300 capitalize cursor-help flex items-center">
                          {key.replace(/([A-Z])/g, ' $1').trim()}: {value}
                          {attributeChange === key && (
                             <motion.span
                               key={key + '-anim'} // Add a key for animation re-trigger
                               initial={{ scale: 1 }}
                               animate={{ scale: [1, 1.1, 1] }}
                               transition={{ duration: 0.3 }}
                               className="ml-1 inline-block"
                             >
                               ✨
                             </motion.span>
                           )}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-700 text-white text-sm p-2 rounded">
                        {key === 'focusMastery' && 'Affects daily work capacity and energy management.'}
                        {key === 'creativeIntuition' && 'Influences creativity-based project outcomes.'}
                        {key === 'technicalAptitude' && 'Impacts technical aspects of production.'}
                        {key === 'businessAcumen' && 'Affects financial and business-related mechanics.'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => decrementAttribute(key as keyof PlayerAttributes)}
                      disabled={value <= 5}
                      className="w-8 h-8"
                    >
                      -
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => incrementAttribute(key as keyof PlayerAttributes)}
                      disabled={pointsRemaining <= 0 || value >= 10} // Added max limit 10
                      className="w-8 h-8"
                    >
                      +
                    </Button>
                  </div>
                </div>
                {/* Attribute Bar */}
                <div className="relative w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-blue-500"
                    initial={{ width: `${(value - 5) * 20}%` }} // Base 5, max 10, so 5 levels * 20%
                    animate={{ width: `${(value - 5) * 20}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
                {/* Calculation Preview */}
                {key === 'focusMastery' && (
                  <span className="text-gray-400 text-xs">
                    Current Daily Work Capacity: {value * 5}
                  </span>
                )}
                 {key === 'creativeIntuition' && (
                  <span className="text-gray-400 text-xs">
                    Affects Project Creativity
                  </span>
                )}
                 {key === 'technicalAptitude' && (
                  <span className="text-gray-400 text-xs">
                    Affects Technical Quality
                  </span>
                )}
                 {key === 'businessAcumen' && (
                  <span className="text-gray-400 text-xs">
                    Affects Business Deals
                  </span>
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={handleCompleteCreation}
            disabled={!name || pointsRemaining > 0}
            className="w-full mt-4 bg-green-600 hover:bg-green-700"
          >
            Start Game
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CharacterCreationModal;
