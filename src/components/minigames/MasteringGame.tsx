import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { gameAudio } from '@/utils/audioSystem';
import { toast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon, Volume2, VolumeX } from 'lucide-react';

interface MasteringGameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
  difficulty?: number;
}

interface MasteringParameters {
  volume: number[];
  compression: number[];
  eq: number[];
  stereoWidth: number[];
  limiter: number[];
  saturation: number[];
  reverb: number[];
}

interface MasteringTarget {
  name: string;
  description: string;
  parameters: MasteringParameters;
  genre: string;
  difficulty: number;
}

export const MasteringGame: React.FC<MasteringGameProps> = ({ 
  onComplete, 
  onClose,
  difficulty = 1 
}) => {
  const [currentTarget, setCurrentTarget] = useState(0);
  const [parameters, setParameters] = useState<MasteringParameters>({
    volume: [50],
    compression: [30],
    eq: [50],
    stereoWidth: [40],
    limiter: [20],
    saturation: [25],
    reverb: [15]
  });
  
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [feedback, setFeedback] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);

  const targets: MasteringTarget[] = [
    {
      name: "Rock Master",
      description: "Powerful, punchy sound with controlled dynamics",
      genre: "Rock",
      difficulty: 2,
      parameters: {
        volume: [75],
        compression: [60],
        eq: [40],
        stereoWidth: [70],
        limiter: [65],
        saturation: [45],
        reverb: [25]
      }
    },
    {
      name: "Pop Polish",
      description: "Clean, bright, and radio-ready sound",
      genre: "Pop",
      difficulty: 3,
      parameters: {
        volume: [65],
        compression: [45],
        eq: [60],
        stereoWidth: [50],
        limiter: [55],
        saturation: [35],
        reverb: [20]
      }
    },
    {
      name: "Electronic Punch",
      description: "Loud, dynamic, and impactful electronic sound",
      genre: "Electronic",
      difficulty: 4,
      parameters: {
        volume: [80],
        compression: [70],
        eq: [30],
        stereoWidth: [80],
        limiter: [75],
        saturation: [60],
        reverb: [30]
      }
    },
    {
      name: "Acoustic Natural",
      description: "Warm, natural sound with subtle enhancement",
      genre: "Acoustic",
      difficulty: 1,
      parameters: {
        volume: [55],
        compression: [25],
        eq: [70],
        stereoWidth: [30],
        limiter: [40],
        saturation: [20],
        reverb: [35]
      }
    }
  ];

  // Filter targets based on difficulty
  const availableTargets = targets.filter(target => target.difficulty <= difficulty);

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

  const calculateAccuracy = useCallback(() => {
    const target = availableTargets[currentTarget];
    const params = Object.keys(target.parameters) as (keyof MasteringParameters)[];
    
    let totalDiff = 0;
    params.forEach(param => {
      const diff = Math.abs(parameters[param][0] - target.parameters[param][0]);
      totalDiff += diff;
    });
    
    const accuracy = Math.max(0, 100 - (totalDiff / params.length));
    return Math.round(accuracy);
  }, [currentTarget, parameters, availableTargets]);

  const handleParameterChange = useCallback((param: keyof MasteringParameters, value: number[]) => {
    setParameters(prev => ({ ...prev, [param]: value }));
    
    // Play subtle sound effect for parameter changes
    gameAudio.playUISound('parameter-change');
  }, []);

  const checkTarget = useCallback(() => {
    const accuracy = calculateAccuracy();
    const points = Math.round(accuracy * 2);
    
    setScore(prev => prev + points);
    
    if (accuracy >= 80) {
      setFeedback('🎯 Perfect Master! +' + points);
      gameAudio.playSuccess();
    } else if (accuracy >= 60) {
      setFeedback('👍 Good work! +' + points);
      gameAudio.playUISound('success');
    } else {
      setFeedback('🔧 Needs adjustment +' + points);
      gameAudio.playUISound('error');
    }

    setTimeout(() => {
      setFeedback('');
      if (currentTarget < availableTargets.length - 1) {
        setCurrentTarget(prev => prev + 1);
        // Reset parameters for next challenge
        setParameters({
          volume: [50],
          compression: [30],
          eq: [50],
          stereoWidth: [40],
          limiter: [20],
          saturation: [25],
          reverb: [15]
        });
      } else {
        handleComplete();
      }
    }, 2000);
  }, [currentTarget, calculateAccuracy, availableTargets]);

  const handleComplete = useCallback(() => {
    const finalScore = Math.round(score * (1 + (difficulty * 0.2))); // Bonus points for higher difficulty
    onComplete(finalScore);
  }, [score, difficulty, onComplete]);

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
          <h2 className="text-2xl font-bold text-white">🎚️ Mastering Challenge</h2>
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
                <p>Click for mastering tips</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {showTutorial && (
          <div className="bg-gray-800 p-4 rounded-lg mb-4 text-left">
            <h3 className="text-lg font-semibold text-white mb-2">Mastering Tips:</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>Match the target values as closely as possible</li>
              <li>Higher accuracy means better rewards</li>
              <li>Use the preview button to hear your changes</li>
              <li>Complete all targets before time runs out</li>
            </ul>
          </div>
        )}

        <p className="text-gray-300">{target.description}</p>
        <div className="flex justify-between items-center mt-4">
          <div className="text-yellow-400 font-bold">Score: {score}</div>
          <div className="text-blue-400 font-bold">Target: {target.name}</div>
          <div className="text-red-400 font-bold">Time: {timeLeft}s</div>
        </div>
      </div>

      {feedback && (
        <div className="text-center text-xl font-bold text-green-400 mb-4 animate-pulse">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-6">
          {Object.entries(parameters).slice(0, 4).map(([param, value]) => (
            <div key={param}>
              <div className="flex justify-between items-center mb-2">
                <label className="text-white font-semibold">
                  {param === 'volume' && '🔊 Volume'}
                  {param === 'compression' && '🗜️ Compression'}
                  {param === 'eq' && '🎛️ EQ'}
                  {param === 'stereoWidth' && '📻 Stereo Width'}
                </label>
                <span className="text-gray-400">{value[0]}%</span>
              </div>
              <Slider
                value={value}
                onValueChange={(newValue) => handleParameterChange(param as keyof MasteringParameters, newValue)}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-green-400 mt-1">
                Target: {target.parameters[param as keyof MasteringParameters][0]}%
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {Object.entries(parameters).slice(4).map(([param, value]) => (
            <div key={param}>
              <div className="flex justify-between items-center mb-2">
                <label className="text-white font-semibold">
                  {param === 'limiter' && '🔒 Limiter'}
                  {param === 'saturation' && '🎨 Saturation'}
                  {param === 'reverb' && '🌊 Reverb'}
                </label>
                <span className="text-gray-400">{value[0]}%</span>
              </div>
              <Slider
                value={value}
                onValueChange={(newValue) => handleParameterChange(param as keyof MasteringParameters, newValue)}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-green-400 mt-1">
                Target: {target.parameters[param as keyof MasteringParameters][0]}%
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="text-lg font-bold text-white mb-2">
          Accuracy: {calculateAccuracy()}%
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300"
            style={{ width: `${calculateAccuracy()}%` }}
          />
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
          onClick={checkTarget} 
          className="px-8 py-3 bg-green-600 hover:bg-green-700"
        >
          ✨ Check Master
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
    </Card>
  );
};
