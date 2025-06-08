import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSettings } from '@/contexts/SettingsContext';
import { gameAudio } from '@/utils/audioSystem';

interface TutorialStep {
  title: string;
  content: string;
  image?: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to Recording Studio Tycoon! 🎵",
    content: "Build your music empire from a small home studio to a professional recording complex. Complete projects, upgrade equipment, and become the ultimate music mogul!",
  },
  {
    title: "Your First Project 📝",
    content: "Start by taking on simple recording projects. Each project has multiple stages: Recording, Mixing, Mastering, and more. Complete minigames to earn XP and money!",
  },
  {
    title: "Equipment & Upgrades 🎛️",
    content: "Use your earnings to buy better equipment. Higher quality gear helps you complete projects faster and earn more money. Check the equipment shop regularly!",
  },
  {
    title: "Staff Management 👥",
    content: "As you grow, hire staff members to help with projects. Each staff member has different skills and can work on specific project stages.",
  },
  {
    title: "Minigames 🎮",
    content: "Master the minigames to maximize your earnings:\n• Beat Making: Create drum patterns\n• Waveform Matching: Draw sound waves\n• Rhythm Timing: Hit beats perfectly\n• Mixing Board: Balance audio levels\n• Mastering: Perfect the final sound",
  },
  {
    title: "Progression & XP ⭐",
    content: "Gain XP to level up and unlock new features. Higher levels give access to better projects, equipment, and staff. Watch your XP bar in the top-right!",
  },
  {
    title: "Audio Settings 🔊",
    content: "This game features dynamic sound effects and background music. Adjust audio settings in the settings menu (⚙️) to customize your experience.",
  },
  {
    title: "Ready to Rock! 🚀",
    content: "You're all set! Start with basic projects, upgrade your equipment, and build your recording studio empire. Good luck, and have fun making music!",
  }
];

interface TutorialModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { updateSettings } = useSettings();

  useEffect(() => {
    if (isOpen) {
      gameAudio.initialize();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    gameAudio.playClick();
    
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    gameAudio.playClick();
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    updateSettings({ tutorialCompleted: true });
    gameAudio.playSuccess();
    onComplete();
  };

  const handleSkip = () => {
    if (confirm('Are you sure you want to skip the tutorial? You can restart it later in the settings.')) {
      handleComplete();
    }
  };

  const step = tutorialSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl bg-gray-900 border-purple-500 p-8 m-4 relative">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700">
          <div 
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
          />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
          <div className="text-gray-300 text-sm">
            Step {currentStep + 1} of {tutorialSteps.length}
          </div>
        </div>

        <div className="mb-8">
          <div className="text-gray-200 text-lg leading-relaxed whitespace-pre-line">
            {step.content}
          </div>
        </div>

        {/* Tutorial Navigation */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                onClick={handlePrevious}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                ← Previous
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSkip}
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              Skip Tutorial
            </Button>
            
            <Button
              onClick={handleNext}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {currentStep === tutorialSteps.length - 1 ? 'Start Playing!' : 'Next →'}
            </Button>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentStep 
                  ? 'bg-purple-500 scale-125' 
                  : index < currentStep 
                    ? 'bg-purple-600' 
                    : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
};
