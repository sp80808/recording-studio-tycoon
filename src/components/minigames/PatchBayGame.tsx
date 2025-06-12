import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { gameAudio } from '@/utils/audioSystem';
import { toast } from '@/hooks/use-toast';
import { InfoIcon, Volume2, VolumeX } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PatchPoint {
  id: string;
  name: string;
  type: 'input' | 'output';
  equipment: string;
  icon: string;
  color: string;
  position: { x: number; y: number };
}

interface PatchCable {
  id: string;
  from: string;
  to: string;
  color: string;
}

interface Connection {
  id: string;
  source: string;
  destination: string;
  type: 'audio' | 'midi';
}

interface PatchBayGameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
  difficulty?: number;
}

interface TutorialSection {
  title: string;
  icon: string;
  content: string[];
  diagram: string;
}

interface DifficultyTip {
  title: string;
  content: string[];
}

interface InteractiveExample {
  title: string;
  description: string;
  connections: Connection[];
  difficulty: number;
}

const PATCH_POINTS: PatchPoint[] = [
  // Inputs
  { id: 'mic1', name: 'Mic 1', type: 'input', equipment: 'Microphone', icon: '🎤', color: 'red', position: { x: 0, y: 0 } },
  { id: 'mic2', name: 'Mic 2', type: 'input', equipment: 'Microphone', icon: '🎤', color: 'red', position: { x: 0, y: 0 } },
  { id: 'guitar1', name: 'Guitar 1', type: 'input', equipment: 'Guitar', icon: '🎸', color: 'blue', position: { x: 0, y: 0 } },
  { id: 'synth1', name: 'Synth 1', type: 'input', equipment: 'Synthesizer', icon: '🎹', color: 'purple', position: { x: 0, y: 0 } },
  // Outputs
  { id: 'preamp1', name: 'Preamp 1', type: 'output', equipment: 'Preamp', icon: '🔊', color: 'green', position: { x: 0, y: 0 } },
  { id: 'preamp2', name: 'Preamp 2', type: 'output', equipment: 'Preamp', icon: '🔊', color: 'green', position: { x: 0, y: 0 } },
  { id: 'comp1', name: 'Comp 1', type: 'output', equipment: 'Compressor', icon: '🗜️', color: 'yellow', position: { x: 0, y: 0 } },
  { id: 'eq1', name: 'EQ 1', type: 'output', equipment: 'Equalizer', icon: '🎛️', color: 'orange', position: { x: 0, y: 0 } },
];

const TARGET_PATCHES = [
  {
    name: 'Basic Recording',
    description: 'Set up a simple microphone recording chain',
    patches: [
      { from: 'mic1', to: 'preamp1' },
      { from: 'preamp1', to: 'comp1' }
    ],
    difficulty: 1
  },
  {
    name: 'Guitar Processing',
    description: 'Create a guitar processing chain',
    patches: [
      { from: 'guitar1', to: 'preamp2' },
      { from: 'preamp2', to: 'eq1' },
      { from: 'eq1', to: 'comp1' }
    ],
    difficulty: 2
  },
  {
    name: 'Complex Mix',
    description: 'Set up a complex mixing chain',
    patches: [
      { from: 'mic1', to: 'preamp1' },
      { from: 'mic2', to: 'preamp2' },
      { from: 'synth1', to: 'eq1' },
      { from: 'preamp1', to: 'comp1' },
      { from: 'preamp2', to: 'comp1' }
    ],
    difficulty: 3
  },
  {
    name: 'Advanced Routing',
    description: 'Create an advanced parallel processing setup',
    patches: [
      { from: 'guitar1', to: 'preamp1' },
      { from: 'guitar1', to: 'preamp2' },
      { from: 'preamp1', to: 'eq1' },
      { from: 'preamp2', to: 'comp1' },
      { from: 'eq1', to: 'comp1' }
    ],
    difficulty: 4
  }
];

const TUTORIAL_TIPS: TutorialSection[] = [
  {
    title: "🎛️ Patch Bay Basics",
    icon: "🔌",
    content: [
      "Patch bays connect different pieces of studio equipment",
      "Inputs (sources) connect to Outputs (destinations)",
      "Common inputs: 🎤 Microphones, 🎸 Instruments, 📱 Playback devices",
      "Common outputs: 🔊 Preamps, 🎚️ Effects, 💾 Recording devices"
    ],
    diagram: "🎤 → 🔌 → 🔊 → 🎚️ → 💾"
  },
  {
    title: "⚡ Signal Flow Rules",
    icon: "🔋",
    content: [
      "Always connect inputs to outputs, never inputs to inputs",
      "Keep signal paths as short as possible",
      "Use balanced connections when possible",
      "Consider signal levels between devices"
    ],
    diagram: "🎤 → 🔌 → 🔊 → 🔌 → 🎚️"
  },
  {
    title: "🎵 Common Studio Setups",
    icon: "📋",
    content: [
      "Recording: 🎤 → 🔊 → 💾",
      "Monitoring: 💾 → 🎧 → 🔊",
      "Effects: 🎸 → 🎚️ → 🔊",
      "Parallel: 🎤 → 🔄 → 🔊"
    ],
    diagram: "🎤 → 🔊 → 🎚️ → 💾"
  },
  {
    title: "🔧 Equipment Types",
    icon: "📦",
    content: [
      "Inputs: 🎤 Mics, 🎸 Instruments, 📱 Line Sources",
      "Processing: 🔊 Preamps, 🎚️ Compressors, 🎛️ EQs",
      "Effects: 🌊 Reverb, ⏱️ Delay, 🌈 Modulation",
      "Outputs: 💾 Interfaces, 📼 Recorders, 🔊 Monitors"
    ],
    diagram: "🎤 → 🔊 → 🎚️ → 🎛️ → 💾"
  }
];

const INTERACTIVE_EXAMPLES: InteractiveExample[] = [
  {
    title: "🎙️ Basic Vocal Recording",
    description: "A simple setup for recording vocals",
    connections: [
      { id: '1', source: 'mic1', destination: 'preamp1', type: 'audio' },
      { id: '2', source: 'preamp1', destination: 'comp1', type: 'audio' },
      { id: '3', source: 'comp1', destination: 'interface1', type: 'audio' }
    ],
    difficulty: 1
  },
  {
    title: "🎸 Guitar Amp Setup",
    description: "Recording a guitar through an amp",
    connections: [
      { id: '1', source: 'guitar1', destination: 'amp1', type: 'audio' },
      { id: '2', source: 'amp1', destination: 'mic2', type: 'audio' },
      { id: '3', source: 'mic2', destination: 'preamp2', type: 'audio' },
      { id: '4', source: 'preamp2', destination: 'interface2', type: 'audio' }
    ],
    difficulty: 2
  },
  {
    title: "🎹 MIDI Keyboard Setup",
    description: "Connecting a MIDI keyboard to a synthesizer",
    connections: [
      { id: '1', source: 'keyboard1', destination: 'synth1', type: 'midi' },
      { id: '2', source: 'synth1', destination: 'interface3', type: 'audio' },
      { id: '3', source: 'keyboard1', destination: 'interface4', type: 'midi' }
    ],
    difficulty: 2
  },
  {
    title: "🎚️ Complex Mixing Setup",
    description: "A sophisticated setup for mixing multiple sources",
    connections: [
      { id: '1', source: 'interface1', destination: 'comp1', type: 'audio' },
      { id: '2', source: 'comp1', destination: 'eq1', type: 'audio' },
      { id: '3', source: 'eq1', destination: 'reverb1', type: 'audio' },
      { id: '4', source: 'reverb1', destination: 'mixer1', type: 'audio' },
      { id: '5', source: 'interface2', destination: 'comp2', type: 'audio' },
      { id: '6', source: 'comp2', destination: 'mixer2', type: 'audio' },
      { id: '7', source: 'mixer1', destination: 'master1', type: 'audio' },
      { id: '8', source: 'mixer2', destination: 'master1', type: 'audio' }
    ],
    difficulty: 4
  }
];

const DIFFICULTY_TIPS: Record<number, DifficultyTip> = {
  1: {
    title: "🎯 Beginner Tips",
    content: [
      "Start with basic microphone to preamp connections",
      "Focus on getting the correct signal flow",
      "Don't worry about complex routing yet",
      "Take your time to understand each connection"
    ]
  },
  2: {
    title: "🎯 Intermediate Tips",
    content: [
      "Try adding effects to your signal chain",
      "Experiment with different routing options",
      "Pay attention to signal levels",
      "Consider using parallel processing"
    ]
  },
  3: {
    title: "🎯 Advanced Tips",
    content: [
      "Create complex parallel processing chains",
      "Use multiple effects in series",
      "Experiment with different routing combinations",
      "Fine-tune signal levels between devices"
    ]
  },
  4: {
    title: "🎯 Expert Tips",
    content: [
      "Create custom routing configurations",
      "Use advanced parallel processing",
      "Optimize signal flow for minimal noise",
      "Create unique processing chains"
    ]
  }
};

const DraggablePatchPoint = ({ point }: { point: PatchPoint }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: point.id,
    data: point
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
      className={`bg-gray-800 p-4 rounded-lg cursor-move hover:bg-gray-700 transition-colors border-2 border-${point.color}-500`}
    >
      <div className="text-2xl mb-2">{point.icon}</div>
      <div className="text-sm font-medium text-white">{point.name}</div>
      <div className="text-xs text-gray-400">{point.equipment}</div>
    </div>
  );
};

const PatchPointSlot = ({ id, children }: { id: string; children?: React.ReactNode }) => {
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

export const PatchBayGame: React.FC<PatchBayGameProps> = ({
  onComplete,
  onClose,
  difficulty = 1
}) => {
  const [patchPoints] = useState(PATCH_POINTS);
  const [currentPatches, setCurrentPatches] = useState<PatchCable[]>([]);
  const [currentTarget, setCurrentTarget] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);

  // Filter targets based on difficulty
  const availableTargets = TARGET_PATCHES.filter(target => target.difficulty <= difficulty);

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
      const fromId = active.id as string;
      const toId = (over.id as string).replace('slot-', '');
      
      // Check if the connection is valid (input to output or output to input)
      const fromPoint = patchPoints.find(p => p.id === fromId);
      const toPoint = patchPoints.find(p => p.id === toId);
      
      if (fromPoint && toPoint && fromPoint.type !== toPoint.type) {
        const newPatch: PatchCable = {
          id: `${fromId}-${toId}`,
          from: fromId,
          to: toId,
          color: fromPoint.color
        };
        
        setCurrentPatches(prev => [...prev, newPatch]);
        gameAudio.playUISound('patch-connect');
      } else {
        toast({
          title: "❌ Invalid Connection",
          description: "You can only connect inputs to outputs",
          variant: "destructive"
        });
        gameAudio.playUISound('error');
      }
    }
  }, [patchPoints]);

  const checkPatches = useCallback(() => {
    const target = availableTargets[currentTarget];
    const isCorrect = target.patches.every(targetPatch => 
      currentPatches.some(patch => 
        patch.from === targetPatch.from && patch.to === targetPatch.to
      )
    );
    
    if (isCorrect) {
      const points = Math.round(100 * (1 + (difficulty * 0.2)));
      setScore(prev => prev + points);
      toast({
        title: "🎛️ Perfect Patch!",
        description: `You earned ${points} points!`,
      });
      gameAudio.playSuccess();
      
      if (currentTarget < availableTargets.length - 1) {
        setCurrentTarget(prev => prev + 1);
        setCurrentPatches([]);
      } else {
        handleComplete();
      }
    } else {
      toast({
        title: "🔧 Not Quite Right",
        description: "Try adjusting your patch connections",
        variant: "destructive"
      });
      gameAudio.playUISound('error');
    }
  }, [currentTarget, currentPatches, availableTargets, difficulty]);

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
          <h2 className="text-2xl font-bold text-white">🎛️ Patch Bay</h2>
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
                <p>Click for patch bay tips</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {showTutorial && (
          <div className="bg-gray-800 p-6 rounded-lg mb-6 text-left">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-semibold text-white">🎛️ Patch Bay Tutorial</h3>
              <div className="text-2xl">{TUTORIAL_TIPS[0].icon}</div>
            </div>
            
            <div className="space-y-6">
              {TUTORIAL_TIPS.map((section, index) => (
                <div key={index} className="border-b border-gray-700 pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-medium text-blue-400">{section.title}</h4>
                    <span className="text-xl">{section.icon}</span>
                  </div>
                  <div className="bg-gray-900/50 p-3 rounded-lg mb-2 text-center text-xl font-mono">
                    {section.diagram}
                  </div>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {section.content.map((tip, tipIndex) => (
                      <li key={tipIndex} className="text-sm">{tip}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-yellow-400 text-sm font-medium">{DIFFICULTY_TIPS[difficulty].title}</p>
                <span className="text-xl">🎯</span>
              </div>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                {DIFFICULTY_TIPS[difficulty].content.map((tip, index) => (
                  <li key={index} className="text-sm">{tip}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-medium text-blue-400 mb-4">🎮 Interactive Examples</h4>
              <div className="space-y-4">
                {INTERACTIVE_EXAMPLES
                  .filter(example => example.difficulty <= difficulty)
                  .map((example, index) => (
                    <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="text-blue-300 font-medium">{example.title}</h5>
                        <span className="text-sm text-gray-400">(Difficulty {example.difficulty})</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">{example.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {example.connections.map((connection, connIndex) => (
                          <div key={connIndex} className="flex items-center">
                            <div className="bg-gray-800 p-2 rounded-lg border border-blue-500/30">
                              <div className="text-xs text-gray-300">{connection.source}</div>
                              <div className="text-blue-400 text-sm">→</div>
                              <div className="text-xs text-gray-300">{connection.destination}</div>
                              <div className="text-xs text-gray-400 mt-1">{connection.type}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={() => {
                          setCurrentPatches(example.connections.map(conn => ({
                            id: `${conn.source}-${conn.destination}`,
                            from: conn.source,
                            to: conn.destination,
                            color: patchPoints.find(p => p.id === conn.source)?.color || ''
                          })));
                          toast({
                            title: "🎛️ Example Loaded",
                            description: `Try recreating the ${example.title} connections!`,
                          });
                        }}
                        className="mt-3 w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Try This Setup
                      </Button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-500/20">
              <p className="text-blue-400 text-sm font-medium mb-2">✨ Pro Tip:</p>
              <p className="text-gray-300 text-sm">
                Remember to check signal flow direction and use the correct cable types (audio vs MIDI). 
                A well-organized patch bay makes complex routing much easier!
              </p>
            </div>
          </div>
        )}

        <p className="text-gray-300">{target.description}</p>
        <div className="flex justify-between items-center mt-4">
          <div className="text-yellow-400 font-bold">Score: {score}</div>
          <div className="text-blue-400 font-bold">Target: {target.name}</div>
          <div className="text-red-400 font-bold">Time: {timeLeft}s</div>
        </div>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {patchPoints.map(point => (
            <DraggablePatchPoint key={point.id} point={point} />
          ))}
        </div>

        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Your Patches:</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Inputs</h4>
              <div className="space-y-2">
                {patchPoints
                  .filter(p => p.type === 'input')
                  .map(point => (
                    <PatchPointSlot key={point.id} id={point.id}>
                      {currentPatches
                        .filter(p => p.from === point.id)
                        .map(patch => (
                          <div key={patch.id} className="text-2xl">
                            {patchPoints.find(p => p.id === patch.to)?.icon}
                          </div>
                        ))}
                    </PatchPointSlot>
                  ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Outputs</h4>
              <div className="space-y-2">
                {patchPoints
                  .filter(p => p.type === 'output')
                  .map(point => (
                    <PatchPointSlot key={point.id} id={point.id}>
                      {currentPatches
                        .filter(p => p.to === point.id)
                        .map(patch => (
                          <div key={patch.id} className="text-2xl">
                            {patchPoints.find(p => p.id === patch.from)?.icon}
                          </div>
                        ))}
                    </PatchPointSlot>
                  ))}
              </div>
            </div>
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
            onClick={checkPatches}
            className="px-8 py-3 bg-green-600 hover:bg-green-700"
          >
            ✨ Check Patches
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