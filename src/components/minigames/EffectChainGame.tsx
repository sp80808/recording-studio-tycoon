import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { gameAudio } from '@/utils/audioSystem';
import { KenneyButton, MinigameChrome } from './MinigameChrome';

interface Effect {
  id: string;
  name: string;
  type: 'eq' | 'compression' | 'reverb' | 'delay' | 'distortion' | 'filter';
  icon: string;
  color: string;
  parameters: { [key: string]: number };
}

interface EffectChainGameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
  genre?: string;
}

export const EffectChainGame: React.FC<EffectChainGameProps> = ({ 
  onComplete, 
  onClose, 
  genre = 'rock' 
}) => {
  const [availableEffects, setAvailableEffects] = useState<Effect[]>([]);
  const [effectChain, setEffectChain] = useState<Effect[]>([]);
  const [targetChain, setTargetChain] = useState<Effect[]>([]);
  const [timeLeft, setTimeLeft] = useState(45);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');

  // Initialize available effects based on genre
  const initializeEffects = useCallback(() => {
    const baseEffects: Effect[] = [
      {
        id: 'eq1',
        name: 'EQ',
        type: 'eq',
        icon: '🎛️',
        color: 'bg-blue-500',
        parameters: { gain: 0, frequency: 1000 }
      },
      {
        id: 'comp1',
        name: 'Compressor',
        type: 'compression',
        icon: '📈',
        color: 'bg-red-500',
        parameters: { ratio: 4, threshold: -12 }
      },
      {
        id: 'rev1',
        name: 'Reverb',
        type: 'reverb',
        icon: '🌊',
        color: 'bg-purple-500',
        parameters: { roomSize: 50, wetness: 30 }
      },
      {
        id: 'delay1',
        name: 'Delay',
        type: 'delay',
        icon: '🔄',
        color: 'bg-green-500',
        parameters: { time: 250, feedback: 40 }
      },
      {
        id: 'dist1',
        name: 'Distortion',
        type: 'distortion',
        icon: '⚡',
        color: 'bg-orange-500',
        parameters: { drive: 50, tone: 70 }
      },
      {
        id: 'filter1',
        name: 'Filter',
        type: 'filter',
        icon: '🎚️',
        color: 'bg-yellow-500',
        parameters: { cutoff: 5000, resonance: 25 }
      }
    ];

    // Genre-specific optimal chains
    const optimalChains: { [key: string]: Effect[] } = {
      rock: [
        baseEffects.find(e => e.type === 'eq')!,
        baseEffects.find(e => e.type === 'compression')!,
        baseEffects.find(e => e.type === 'distortion')!,
        baseEffects.find(e => e.type === 'reverb')!
      ],
      pop: [
        baseEffects.find(e => e.type === 'eq')!,
        baseEffects.find(e => e.type === 'compression')!,
        baseEffects.find(e => e.type === 'delay')!,
        baseEffects.find(e => e.type === 'reverb')!
      ],
      electronic: [
        baseEffects.find(e => e.type === 'filter')!,
        baseEffects.find(e => e.type === 'compression')!,
        baseEffects.find(e => e.type === 'delay')!,
        baseEffects.find(e => e.type === 'distortion')!
      ],
      'hip-hop': [
        baseEffects.find(e => e.type === 'eq')!,
        baseEffects.find(e => e.type === 'compression')!,
        baseEffects.find(e => e.type === 'filter')!
      ]
    };

    setAvailableEffects(baseEffects);
    setTargetChain(optimalChains[genre.toLowerCase()] || optimalChains.rock);
  }, [genre]);

  useEffect(() => {
    initializeEffects();
  }, [initializeEffects]);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameCompleted(false);
    setEffectChain([]);
    setScore(0);
    setTimeLeft(45);
    setFeedback('');

    gameAudio.initialize();

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const endGame = useCallback(() => {
    if (gameCompleted) return;
    
    setGameCompleted(true);
    const finalScore = calculateScore();
    setScore(finalScore);
    
    gameAudio.playCompleteProject();
    setTimeout(() => onComplete(finalScore), 1000);
  }, [gameCompleted, effectChain, targetChain]);

  const calculateScore = () => {
    let points = 0;
    
    // Points for correct effects (regardless of order)
    const chainTypes = effectChain.map(e => e.type);
    const targetTypes = targetChain.map(e => e.type);
    
    targetTypes.forEach(targetType => {
      if (chainTypes.includes(targetType)) {
        points += 25;
      }
    });

    // Bonus points for correct order
    let orderBonus = 0;
    for (let i = 0; i < Math.min(effectChain.length, targetChain.length); i++) {
      if (effectChain[i].type === targetChain[i].type) {
        orderBonus += 15;
      }
    }

    // Penalty for wrong effects
    const wrongEffects = chainTypes.filter(type => !targetTypes.includes(type));
    const penalty = wrongEffects.length * 10;

    // Time bonus
    const timeBonus = Math.max(0, timeLeft * 2);

    return Math.max(0, points + orderBonus - penalty + timeBonus);
  };

  const addEffectToChain = (effect: Effect) => {
    if (effectChain.length >= 6) {
      setFeedback('⚠️ Effect chain too long!');
      setTimeout(() => setFeedback(''), 2000);
      return;
    }

    // Don't allow duplicate effect types
    if (effectChain.some(e => e.type === effect.type)) {
      setFeedback('⚠️ Effect type already in chain!');
      setTimeout(() => setFeedback(''), 2000);
      return;
    }

    setEffectChain(prev => [...prev, effect]);
    gameAudio.playClick();
    
    // Check if this is a good choice
    if (targetChain.some(e => e.type === effect.type)) {
      setFeedback('✅ Good choice!');
      setTimeout(() => setFeedback(''), 1500);
    }
  };

  const removeEffectFromChain = (index: number) => {
    setEffectChain(prev => prev.filter((_, i) => i !== index));
    gameAudio.playError();
  };

  const moveEffect = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= effectChain.length) return;
    
    const newChain = [...effectChain];
    const [movedEffect] = newChain.splice(fromIndex, 1);
    newChain.splice(toIndex, 0, movedEffect);
    setEffectChain(newChain);
    gameAudio.playClick();
  };

  const getGenreHint = () => {
    const hints: { [key: string]: string } = {
      rock: 'Rock needs: EQ → Compression → Distortion → Reverb',
      pop: 'Pop needs: EQ → Compression → Delay → Reverb',
      electronic: 'Electronic needs: Filter → Compression → Delay → Distortion',
      'hip-hop': 'Hip-Hop needs: EQ → Compression → Filter'
    };
    return hints[genre.toLowerCase()] || hints.rock;
  };

  if (!gameStarted) {
    return (
      <Card className="w-full max-w-4xl mx-auto bg-stone-800 text-white border-stone-700">
        <MinigameChrome title="🔗 Effect Chain Builder" score={score} accent="blue">
        <div className="p-6 text-center space-y-4">
          <p className="text-stone-300">
            Build the perfect effect chain for {genre} music!
            Order matters - effects process in sequence.
          </p>
          <div className="text-sm text-blue-400 bg-blue-900/30 p-3 rounded">
            💡 Hint: {getGenreHint()}
          </div>
          <KenneyButton variant="yellow" onClick={startGame}>
            Start Building
          </KenneyButton>
        </div>
        </MinigameChrome>
      </Card>
    );
  }

  if (gameCompleted) {
    return (
      <Card className="w-full max-w-4xl mx-auto bg-stone-800 text-white border-stone-700">
        <MinigameChrome title="🔗 Effect Chain Builder" score={score} accent="blue">
        <div className="p-6 text-center space-y-4">
          <h2 className={`text-2xl font-bold text-yellow-400 ${score >= 80 ? 'mg-perfect-pop' : ''}`}>Effect Chain Complete!</h2>
          <div className="space-y-2">
            <div className="text-lg text-white">Score: {score}</div>
            <div className="text-sm text-stone-400">
              Effects Used: {effectChain.length} | Target: {targetChain.length}
            </div>
            {score >= 80 && (
              <div className="text-green-400 font-bold text-xl mg-perfect-pop">🎉 Professional Chain!</div>
            )}
            {score >= 60 && score < 80 && (
              <div className="text-blue-400 font-bold">👍 Good Mix!</div>
            )}
          </div>
          <KenneyButton variant="green" onClick={onClose}>
            Collect Rewards
          </KenneyButton>
        </div>
        </MinigameChrome>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto bg-stone-800 text-white border-stone-700">
      <MinigameChrome title="🔗 Effect Chain Builder" score={score} timeLeft={timeLeft} accent="blue">
      <div className="p-6">
      <div className="text-center mb-6">
        <p className="text-stone-300">Genre: {genre.charAt(0).toUpperCase() + genre.slice(1)}</p>

        {feedback && (
          <div key={feedback} className={`mt-2 text-center text-lg font-bold ${feedback.startsWith('✅') ? 'text-green-400 mg-perfect-pop' : 'text-yellow-300 mg-miss-shake'}`}>
            {feedback}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Effects */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">🎛️ Available Effects</h3>
          <div className="grid grid-cols-2 gap-3">
            {availableEffects.map(effect => (
              <Button
                key={effect.id}
                onClick={() => addEffectToChain(effect)}
                className={`${effect.color} hover:opacity-80 p-4 h-auto flex flex-col items-center gap-2`}
                disabled={effectChain.some(e => e.type === effect.type)}
              >
                <span className="text-2xl">{effect.icon}</span>
                <span className="text-sm font-semibold">{effect.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Effect Chain */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">🔗 Your Effect Chain</h3>
          <div className="space-y-3 min-h-[300px]">
            {effectChain.length === 0 ? (
              <div className="text-stone-500 text-center p-8 border-2 border-dashed border-stone-600 rounded">
                Drag effects here to build your chain
              </div>
            ) : (
              effectChain.map((effect, index) => (
                <div
                  key={`${effect.id}-${index}`}
                  className={`${effect.color} p-3 rounded-lg flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{effect.icon}</span>
                    <div>
                      <div className="font-semibold">{effect.name}</div>
                      <div className="text-xs opacity-75">Position {index + 1}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => moveEffect(index, index - 1)}
                      disabled={index === 0}
                      className="bg-white/20 hover:bg-white/30 text-white p-1"
                    >
                      ↑
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => moveEffect(index, index + 1)}
                      disabled={index === effectChain.length - 1}
                      className="bg-white/20 hover:bg-white/30 text-white p-1"
                    >
                      ↓
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => removeEffectFromChain(index)}
                      className="bg-red-500/70 hover:bg-red-500 text-white p-1"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Target Chain Hint */}
          <div className="mt-4 p-3 bg-blue-900/30 rounded border border-blue-600/50">
            <div className="text-sm text-blue-300">
              <div className="font-semibold mb-1">💡 Optimal {genre} Chain:</div>
              <div className="flex gap-2 flex-wrap">
                {targetChain.map((effect, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-blue-400 border-blue-400"
                  >
                    {index + 1}. {effect.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-6">
        <KenneyButton variant="green" onClick={endGame} disabled={effectChain.length === 0}>
          🎵 Test Chain
        </KenneyButton>
        <KenneyButton variant="grey" onClick={onClose}>
          Cancel
        </KenneyButton>
      </div>
      </div>
      </MinigameChrome>
    </Card>
  );
};
