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

// Renamed to baseTutorialSteps and removed the first generic welcome step
const baseTutorialSteps: TutorialStep[] = [
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

const getTutorialStepsForEra = (eraId: string): TutorialStep[] => {
  let eraSpecificIntro: TutorialStep;
  
  console.log('Tutorial: Getting steps for era ID:', eraId);
  
  switch (eraId) {
    case 'classic_rock':
      eraSpecificIntro = {
        title: "🎸 Welcome to the Rock Revolution! (1960s-1970s)",
        content: `The world of music is buzzing with analog warmth! You're entering an era where:
• 4-track tape machines are cutting-edge technology
• Vinyl records are the primary format
• Radio promotion is king
• Record labels hold significant power
• Artists are pushing creative boundaries

Your journey begins with basic analog equipment. Master the art of tape recording, learn to work within track limitations, and build your reputation in the golden age of rock!`,
      };
      break;
    case 'golden_age':
      eraSpecificIntro = {
        title: "💿 The Digital Revolution Begins! (1980s-1990s)",
        content: `Welcome to the era of digital innovation! You're entering a time where:
• MIDI and digital recording are transforming music
• CDs are replacing vinyl as the dominant format
• MTV is revolutionizing music promotion
• Independent labels are gaining traction
• New genres like synth-pop and hip-hop are emerging

Embrace new technologies while maintaining the warmth of analog gear. Learn to work with early digital tools, create music videos, and navigate the changing industry landscape!`,
      };
      break;
    case 'digital_age':
      eraSpecificIntro = {
        title: "💻 The Internet Changes Everything! (2000s-2010s)",
        content: `The digital age is in full swing! You're entering an era where:
• DAWs and computer recording are standard
• MP3s and digital distribution are the norm
• Social media is becoming vital for promotion
• Home studios are on the rise
• File sharing is disrupting traditional sales

Adapt to the new digital landscape, master computer-based production, and learn to leverage online platforms to reach your audience!`,
      };
      break;
    case 'modern':
      eraSpecificIntro = {
        title: "📱 The Streaming Era Arrives! (2020s+)",
        content: `Welcome to the modern music industry! You're entering an era where:
• Streaming platforms dominate music consumption
• AI tools assist in production and mixing
• Social media is essential for artist discovery
• Short-form video content drives trends
• Global collaboration is easier than ever

Master the art of streaming optimization, leverage AI tools effectively, and build a strong online presence to succeed in today's fast-paced music world!`,
      };
      break;
    // Legacy era IDs for backward compatibility
    case 'analog60s':
      eraSpecificIntro = {
        title: "🎵 Welcome to the Analog Age! (1960s-1970s)",
        content: `The world of music is buzzing with analog warmth! You're entering an era where:
• 4-track tape machines are cutting-edge technology
• Vinyl records are the primary format
• Radio promotion is king
• Record labels hold significant power
• Artists are pushing creative boundaries

Your journey begins with basic analog equipment. Master the art of tape recording, learn to work within track limitations, and build your reputation in the golden age of rock!`,
      };
      break;
    case 'digital80s':
      eraSpecificIntro = {
        title: "💾 The Digital Dawn Arrives! (1980s-1990s)",
        content: `Welcome to the era of digital innovation! You're entering a time where:
• MIDI and digital recording are transforming music
• CDs are replacing vinyl as the dominant format
• MTV is revolutionizing music promotion
• Independent labels are gaining traction
• New genres like synth-pop and hip-hop are emerging

Embrace new technologies while maintaining the warmth of analog gear. Learn to work with early digital tools, create music videos, and navigate the changing industry landscape!`,
      };
      break;
    case 'internet2000s':
      eraSpecificIntro = {
        title: "🌐 The Internet Revolution! (2000s-2010s)",
        content: `The digital age is in full swing! You're entering an era where:
• DAWs and computer recording are standard
• MP3s and digital distribution are the norm
• Social media is becoming vital for promotion
• Home studios are on the rise
• File sharing is disrupting traditional sales

Adapt to the new digital landscape, master computer-based production, and learn to leverage online platforms to reach your audience!`,
      };
      break;
    case 'streaming2020s':
      eraSpecificIntro = {
        title: "🎧 The Streaming Age Begins! (2020s+)",
        content: `Welcome to the modern music industry! You're entering an era where:
• Streaming platforms dominate music consumption
• AI tools assist in production and mixing
• Social media is essential for artist discovery
• Short-form video content drives trends
• Global collaboration is easier than ever

Master the art of streaming optimization, leverage AI tools effectively, and build a strong online presence to succeed in today's fast-paced music world!`,
      };
      break;
    default: // Fallback to a generic welcome if eraId is unknown
      eraSpecificIntro = {
        title: "🎵 Welcome to Recording Studio Tycoon!",
        content: "Build your music empire from a small home studio to a professional recording complex. Complete projects, upgrade equipment, and become the ultimate music mogul!",
      };
      console.warn('Tutorial: Unknown era ID:', eraId, 'Using default welcome message.');
  }
  return [eraSpecificIntro, ...baseTutorialSteps];
};


interface TutorialModalProps {
  isOpen: boolean;
  onComplete: () => void;
  eraId: string; // Added eraId prop
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onComplete, eraId }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { updateSettings } = useSettings();
  const [tutorialSteps, setTutorialSteps] = useState<TutorialStep[]>(getTutorialStepsForEra(eraId));

  useEffect(() => {
    if (isOpen) {
      gameAudio.initialize();
      // Update tutorial steps if eraId changes while modal is open (or for initial setup)
      setTutorialSteps(getTutorialStepsForEra(eraId));
      setCurrentStep(0); // Reset to first step if era changes
    }
  }, [isOpen, eraId]);

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
  
  // Ensure step is not undefined if tutorialSteps is empty or currentStep is out of bounds
  if (!step) {
    // This case should ideally not be reached if tutorialSteps are always populated
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl bg-gray-900 border-purple-500 p-8 m-4 relative">
          <div className="text-center text-white">Error: Tutorial step not found.</div>
          <Button onClick={handleComplete}>Close</Button>
        </Card>
      </div>
    );
  }

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