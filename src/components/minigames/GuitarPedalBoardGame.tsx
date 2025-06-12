import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { gameAudio } from '@/utils/audioSystem';
import { toast } from '@/hooks/use-toast';
import { InfoIcon, Volume2, VolumeX } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Pedal {
  id: string;
  name: string;
  type: 'distortion' | 'delay' | 'reverb' | 'chorus' | 'wah' | 'compressor' | 'modulation' | 'time';
  icon: string;
  settings: {
    [key: string]: number;
  };
  position: number;
}

interface PedalBoardGameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
  difficulty?: number;
}

interface DifficultyTip {
  title: string;
  content: string[];
}

interface TutorialSection {
  title: string;
  icon: string;
  content: string[];
  diagram: string;
}

interface InteractiveExample {
  title: string;
  description: string;
  chain: Pedal[];
  difficulty: number;
}

const PEDAL_TYPES: Pedal[] = [
  {
    id: 'distortion1',
    name: 'Heavy Distortion',
    type: 'distortion',
    icon: '🎸',
    settings: { gain: 75, tone: 60, level: 70 },
    position: 0
  },
  {
    id: 'delay1',
    name: 'Space Echo',
    type: 'delay',
    icon: '⏱️',
    settings: { time: 300, feedback: 40, mix: 30 },
    position: 1
  },
  {
    id: 'reverb1',
    name: 'Hall Reverb',
    type: 'reverb',
    icon: '🌊',
    settings: { decay: 60, tone: 50, mix: 40 },
    position: 2
  },
  {
    id: 'chorus1',
    name: 'Vintage Chorus',
    type: 'chorus',
    icon: '🌀',
    settings: { rate: 45, depth: 55, mix: 35 },
    position: 3
  },
  {
    id: 'wah1',
    name: 'Auto Wah',
    type: 'wah',
    icon: '🎛️',
    settings: { sensitivity: 65, range: 45, mix: 50 },
    position: 4
  },
  {
    id: 'compressor1',
    name: 'Studio Comp',
    type: 'compressor',
    icon: '🎚️', // Added icon for compressor
    settings: { threshold: 40, ratio: 60, attack: 30 },
    position: 5
  }
];

const TARGET_CHAINS = [
  {
    name: 'Rock Lead',
    description: 'Create a powerful lead tone with distortion and delay',
    chain: ['distortion1', 'delay1', 'reverb1'],
    difficulty: 2
  },
  {
    name: 'Ambient Wash',
    description: 'Build an atmospheric soundscape with reverb and chorus',
    chain: ['reverb1', 'chorus1', 'delay1'],
    difficulty: 3
  },
  {
    name: 'Funk Rhythm',
    description: 'Craft a tight, punchy rhythm tone',
    chain: ['compressor1', 'wah1', 'chorus1'],
    difficulty: 2
  },
  {
    title: "🎸 Basic Clean Tone",
    description: "A simple chain for a clean guitar sound",
    chain: [
      { id: 'comp1', name: 'Studio Comp', type: 'compressor', icon: '🎚️', settings: { threshold: 40, ratio: 60, attack: 30 }, position: 1 },
      { id: 'chorus1', name: 'Chorus', type: 'chorus', icon: '🌊', settings: { rate: 50, depth: 40, mix: 30 }, position: 2 },
      { id: 'reverb1', name: 'Room Verb', type: 'reverb', icon: '⏱️', settings: { decay: 40, mix: 30, tone: 50 }, position: 3 }
    ],
    difficulty: 1
  },
  {
    title: "🔥 Classic Rock Tone",
    description: "A classic rock sound with overdrive and delay",
    chain: [
      { id: 'comp1', name: 'Studio Comp', type: 'compressor', icon: '🎚️', settings: { threshold: 30, ratio: 70, attack: 20 }, position: 1 },
      { id: 'overdrive1', name: 'Tube Drive', type: 'distortion', icon: '🔥', settings: { gain: 60, tone: 50, level: 40 }, position: 2 },
      { id: 'delay1', name: 'Analog Delay', type: 'delay', icon: '⏱️', settings: { time: 40, feedback: 30, mix: 20 }, position: 3 }
    ],
    diagram: "🎸 → 🎚️ → 🎛️ → 🎵"
  },
  {
    title: "🎛️ Pedal Types",
    icon: "📦",
    content: [
      "Dynamics: 🎚️ Compressor, Noise Gate - Control signal levels",
      "Distortion: 🔥 Overdrive, Fuzz - Add harmonic content",
      "Modulation: 🌊 Chorus, Phaser - Create movement in the sound",
      "Time: ⏱️ Delay, Reverb - Add space and depth",
      "Filter: 🎛️ Wah, EQ - Shape the frequency response"
    ],
    diagram: "🎸 → 🎚️ → 🔥 → 🌊 → ⏱️"
  },
  {
    title: "🔌 Signal Flow Tips",
    icon: "⚡",
    content: [
      "Keep cable runs as short as possible",
      "Use buffer pedals for long chains",
      "Consider parallel routing for complex sounds",
      "Match input/output levels between pedals"
    ],
    diagram: "🎸 → 🔌 → 🎛️ → 🔌 → 🎵"
  },
  {
    title: "🎵 Common Chain Examples",
    icon: "📝",
    content: [
      "Clean: 🎸 → 🎚️ → 🌊 → ⏱️",
      "Rock: 🎸 → 🔥 → ⏱️ → ⏱️",
      "Ambient: 🎸 → ⏱️ → ⏱️ → 🌊",
      "Lead: 🎸 → 🎚️ → 🔥 → ⏱️"
    ],
    diagram: "🎸 → 🎚️ → 🔥 → 🌊 → ⏱️"
  }
];

const TUTORIAL_TIPS: TutorialSection[] = [
  {
    title: "🎛️ Pedal Types",
    icon: "📦",
    content: [
      "Dynamics: 🎚️ Compressor, Noise Gate - Control signal levels",
      "Distortion: 🔥 Overdrive, Fuzz - Add harmonic content",
      "Modulation: 🌊 Chorus, Phaser - Create movement in the sound",
      "Time: ⏱️ Delay, Reverb - Add space and depth",
      "Filter: 🎛️ Wah, EQ - Shape the frequency response"
    ],
    diagram: "🎸 → 🎚️ → 🔥 → 🌊 → ⏱️"
  },
  {
    title: "🔌 Signal Flow Tips",
    icon: "⚡",
    content: [
      "Keep cable runs as short as possible",
      "Use buffer pedals for long chains",
      "Consider parallel routing for complex sounds",
      "Match input/output levels between pedals"
    ],
    diagram: "🎸 → 🔌 → 🎛️ → 🔌 → 🎵"
  },
  {
    title: "🎵 Common Chain Examples",
    icon: "📝",
    content: [
      "Clean: 🎸 → 🎚️ → 🌊 → ⏱️",
      "Rock: 🎸 → 🔥 → ⏱️ → ⏱️",
      "Ambient: 🎸 → ⏱️ → ⏱️ → 🌊",
      "Lead: 🎸 → 🎚️ → 🔥 → ⏱️"
    ],
    diagram: "🎸 → 🎚️ → 🔥 → 🌊 → ⏱️"
  }
];

const DIFFICULTY_TIPS: Record<number, DifficultyTip> = {
  1: {
    title: "🎯 Beginner Tips",
    content: [
      "Start with basic pedals like overdrive and delay",
      "Focus on getting the correct pedal order",
      "Don't worry about complex routing yet",
      "Take your time to understand each pedal's effect"
    ]
  },
  2: {
    title: "🎯 Intermediate Tips",
    content: [
      "Experiment with modulation effects",
      "Try different pedal combinations",
      "Pay attention to signal levels",
      "Consider using parallel routing"
    ]
  },
  3: {
    title: "🎯 Advanced Tips",
    content: [
      "Create complex parallel chains",
      "Use multiple modulation effects",
      "Experiment with effect order",
      "Fine-tune pedal settings"
    ]
  },
  4: {
    title: "🎯 Expert Tips",
    content: [
      "Create custom effect chains",
      "Use advanced routing techniques",
      "Optimize signal flow",
      "Create unique sound combinations"
    ]
  }
};

const INTERACTIVE_EXAMPLES: InteractiveExample[] = [
  {
    title: "🎸 Basic Clean Tone",
    description: "A simple chain for a clean guitar sound",
    chain: [
      { id: 'comp1', name: 'Studio Comp', type: 'compressor', icon: '🎚️', settings: { threshold: 40, ratio: 60, attack: 30 }, position: 1 },
      { id: 'chorus1', name: 'Chorus', type: 'chorus', icon: '🌊', settings: { rate: 50, depth: 40, mix: 30 }, position: 2 },
      { id: 'reverb1', name: 'Room Verb', type: 'reverb', icon: '⏱️', settings: { decay: 40, mix: 30, tone: 50 }, position: 3 }
    ],
    difficulty: 1
  },
  {
    title: "🔥 Classic Rock Tone",
    description: "A classic rock sound with overdrive and delay",
    chain: [
      { id: 'comp1', name: 'Studio Comp', type: 'compressor', icon: '🎚️', settings: { threshold: 30, ratio: 70, attack: 20 }, position: 1 },
      { id: 'overdrive1', name: 'Tube Drive', type: 'distortion', icon: '🔥', settings: { gain: 60, tone: 50, level: 40 }, position: 2 },
      { id: 'delay1', name: 'Analog Delay', type: 'delay', icon: '⏱️', settings: { time: 40, feedback: 30, mix: 20 }, position: 3 }
    ],
    difficulty: 2
  },
  {
    title: "🌊 Ambient Soundscape",
    description: "Create atmospheric ambient sounds",
    chain: [
      { id: 'reverb1', name: 'Room Verb', type: 'reverb', icon: '⏱️', settings: { decay: 70, mix: 60, tone: 40 }, position: 1 },
      { id: 'delay1', name: 'Analog Delay', type: 'delay', icon: '⏱️', settings: { time: 60, feedback: 50, mix: 40 }, position: 2 },
      { id: 'chorus1', name: 'Chorus', type: 'chorus', icon: '🌊', settings: { rate: 30, depth: 60, mix: 40 }, position: 3 }
    ],
    difficulty: 3
  },
  {
    title: "🎛️ Complex Lead Tone",
    description: "A sophisticated lead sound with multiple effects",
    chain: [
      { id: 'comp1', name: 'Studio Comp', type: 'compressor', icon: '🎚️', settings: { threshold: 20, ratio: 80, attack: 10 }, position: 1 },
      { id: 'overdrive1', name: 'Tube Drive', type: 'distortion', icon: '🔥', settings: { gain: 70, tone: 60, level: 50 }, position: 2 },
      { id: 'phaser1', name: 'Phase 90', type: 'modulation', icon: '🌊', settings: { rate: 40, depth: 50, mix: 30 }, position: 3 },
      { id: 'delay1', name: 'Analog Delay', type: 'delay', icon: '⏱️', settings: { time: 50, feedback: 40, mix: 30 }, position: 4 }
    ],
    difficulty: 4
  }
];

const DraggablePedal = ({ pedal }: { pedal: Pedal }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: pedal.id,
    data: pedal
  });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-gray-800 p-4 rounded-lg cursor-move hover:bg-gray-700 transition-colors"
    >
      <div className="text-2xl mb-2">{pedal.icon}</div>
      <div className="text-sm font-medium text-white">{pedal.name}</div>
      <div className="text-xs text-gray-400">{pedal.type}</div>
    </div>
  );
};

const PedalSlot = ({ id, children }: { id: string; children?: React.ReactNode }) => {
  const { setNodeRef } = useDroppable({
    id: `slot-${id}`,
  });

  return (
    <div
      ref={setNodeRef}
      className="w-32 h-32 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center bg-gray-900/50"
    >
      {children}
    </div>
  );
};

export const GuitarPedalBoardGame: React.FC<PedalBoardGameProps> = ({
  onComplete,
  onClose,
  difficulty = 1
}) => {
  const [pedals, setPedals] = useState(PEDAL_TYPES);
  const [currentChain, setCurrentChain] = useState<string[]>([]);
  const [currentTarget, setCurrentTarget] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);

  // Filter targets based on difficulty
  const availableTargets = TARGET_CHAINS.filter(target => target.difficulty != null && target.difficulty <= difficulty);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const pedalId = active.id as string;
      const slotId = (over.id as string).replace('slot-', '');
      
      setCurrentChain(prev => {
        const newChain = [...prev];
        const index = newChain.indexOf(pedalId);
        
        if (index > -1) {
          newChain.splice(index, 1);
        }
        
        newChain.push(pedalId);
        return newChain;
      });

      gameAudio.playUISound('pedal-connect');
    }
  }, []);

  const checkChain = useCallback(() => {
    const target = availableTargets[currentTarget];
    if (!target || !target.chain) { // Add null check for target and target.chain
      toast({ title: "Error", description: "Target chain not found.", variant: "destructive" });
      return;
    }
    const isCorrect = target.chain.every((pedalId, index) => currentChain[index] === pedalId);
    
    if (isCorrect) {
      const points = Math.round(100 * (1 + (difficulty * 0.2)));
      setScore(prev => prev + points);
      toast({
        title: "🎸 Perfect Chain!",
        description: `You earned ${points} points!`,
      });
      gameAudio.playSuccess();
      
      if (currentTarget < availableTargets.length - 1) {
        setCurrentTarget(prev => prev + 1);
        setCurrentChain([]);
      } else {
        handleComplete();
      }
    } else {
      toast({
        title: "🔧 Not Quite Right",
        description: "Try adjusting your pedal chain",
        variant: "destructive"
      });
      gameAudio.playUISound('error');
    }
  }, [currentTarget, currentChain, availableTargets, difficulty]);

  const handleComplete = useCallback(() => {
    onComplete(score);
  }, [score, onComplete]);

  const togglePlayback = useCallback(() => {
    setIsPlaying(prev => !prev);
    if (!isPlaying) {
      gameAudio.playUISound('play');
    } else {
      gameAudio.playUISound('stop');
    }
  }, [isPlaying]);

  const target = availableTargets[currentTarget];

  return (
    <Card className="w-full max-w-4xl bg-gray-900 border-gray-600 p-6">
      <div className="text-center mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">🎸 Guitar Pedal Board</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowTutorial(!showTutorial)}
                >
                  <InfoIcon className="h-5 w-5 text-gray-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click for pedal board tips</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {showTutorial && TUTORIAL_TIPS && TUTORIAL_TIPS.length > 0 && ( 
          <div className="bg-gray-800 p-6 rounded-lg mb-6 text-left">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-semibold text-white">🎸 Guitar Pedal Board Tutorial</h3>
              <div className="text-2xl">{TUTORIAL_TIPS[0]?.icon}</div>
            </div>
            
            <div className="space-y-6">
              {TUTORIAL_TIPS.map((section: TutorialSection, index: number) => (
                <div key={index} className="border-b border-gray-700 pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-medium text-purple-400">{section.title}</h4>
                    <span className="text-xl">{section.icon}</span>
                  </div>
                  <div className="bg-gray-900/50 p-3 rounded-lg mb-2 text-center text-xl font-mono">
                    {section.diagram}
                  </div>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {section.content.map((tip: string, tipIndex: number) => ( // Add types
                      <li key={tipIndex} className="text-sm">{tip}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {DIFFICULTY_TIPS[difficulty] && ( // Add check for DIFFICULTY_TIPS[difficulty]
              <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-yellow-400 text-sm font-medium">{DIFFICULTY_TIPS[difficulty].title}</p>
                  <span className="text-xl">🎯</span>
                </div>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  {DIFFICULTY_TIPS[difficulty].content.map((tip: string, index: number) => ( // Add types
                    <li key={index} className="text-sm">{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6">
              <h4 className="text-lg font-medium text-purple-400 mb-4">🎮 Interactive Examples</h4>
              <div className="space-y-4">
                {INTERACTIVE_EXAMPLES
                  .filter(example => example.difficulty <= difficulty)
                  .map((example, index) => (
                    <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="text-purple-300 font-medium">{example.title}</h5>
                        <span className="text-sm text-gray-400">(Difficulty {example.difficulty})</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">{example.description}</p>
                      <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {example.chain.map((pedal, pedalIndex) => (
                          <div key={pedalIndex} className="flex items-center">
                            <div className="bg-gray-800 p-2 rounded-lg border border-purple-500/30">
                              <div className="text-xl mb-1">{pedal.icon}</div>
                              <div className="text-xs text-gray-300">{pedal.name}</div>
                            </div>
                            {pedalIndex < example.chain.length - 1 && (
                              <div className="text-gray-500 mx-1">→</div>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={() => {
                          const chainIds: string[] = example.chain.map((pedal: Pedal) => pedal.id); // Explicitly type pedal
                          setCurrentChain(chainIds);
                          toast({
                            title: "🎸 Example Loaded",
                            description: `Try recreating the ${example.title} chain!`,
                          });
                        }}
                        className="mt-3 w-full bg-purple-600 hover:bg-purple-700"
                      >
                        Try This Chain
                      </Button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-4 p-4 bg-purple-900/20 rounded-lg border border-purple-500/20">
              <p className="text-purple-400 text-sm font-medium mb-2">✨ Pro Tip:</p>
              <p className="text-gray-300 text-sm">
                Experiment with different pedal combinations to create unique sounds. 
                The best pedal chain is the one that helps you achieve your desired tone!
              </p>
            </div>
          </div>
        )}

        {target && ( // Add check for target
          <>
            <p className="text-gray-300">{target.description}</p>
            <div className="flex justify-between items-center mt-4">
              <div className="text-yellow-400 font-bold">Score: {score}</div>
              <div className="text-blue-400 font-bold">Target: {target.name}</div>
              <div className="text-red-400 font-bold">Time: {timeLeft}s</div>
            </div>
          </>
        )}
      </div> {/* This closes the div with className="text-center mb-6" */}
      {/* Removed extra closing div here */}

      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-6 gap-4 mb-8">
          {pedals.map(pedal => (
            <DraggablePedal key={pedal.id} pedal={pedal} />
          ))}
        </div>

        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Your Chain:</h3>
          <div className="flex gap-4 justify-center">
            {[0, 1, 2, 3].map(slot => (
              <PedalSlot key={slot} id={slot.toString()}>
                {currentChain[slot] && (
                  <div className="text-2xl">
                    {pedals.find(p => p.id === currentChain[slot])?.icon}
                  </div>
                )}
              </PedalSlot>
            ))}
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Button
            onClick={togglePlayback}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700"
          >
            {isPlaying ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            {isPlaying ? ' Stop Preview' : ' Preview'}
          </Button>
          <Button
            onClick={checkChain}
            className="px-8 py-3 bg-green-600 hover:bg-green-700"
          >
            ✨ Check Chain
          </Button>
          <Button
            onClick={handleComplete}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700"
          >
            Finish Early
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="px-6 py-3"
          >
            Cancel
          </Button>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {availableTargets.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full ${
                index < currentTarget
                  ? 'bg-green-500'
                  : index === currentTarget
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </DndContext>
    </Card>
  );
};
