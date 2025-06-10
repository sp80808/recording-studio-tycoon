import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { gameAudio } from '@/utils/audioSystem';

interface AcousticTreatment {
  id: string;
  name: string;
  type: 'absorber' | 'diffuser' | 'bass-trap' | 'reflection-filter';
  icon: string;
  cost: number;
  effectiveness: number;
  color: string;
}

interface RoomPosition {
  x: number;
  y: number;
  treatment?: AcousticTreatment;
}

interface AcousticTreatmentGameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
  recordingType?: 'vocal' | 'drum' | 'guitar' | 'full-band';
}

export const AcousticTreatmentGame: React.FC<AcousticTreatmentGameProps> = ({
  onComplete,
  onClose,
  recordingType = 'vocal'
}) => {
  const [budget, setBudget] = useState(1000);
  const [spentBudget, setSpentBudget] = useState(0);
  const [roomGrid, setRoomGrid] = useState<RoomPosition[]>([]);
  const [selectedTreatment, setSelectedTreatment] = useState<AcousticTreatment | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [acousticScore, setAcousticScore] = useState(0);
  const [feedback, setFeedback] = useState('');

  const treatments: AcousticTreatment[] = [
    {
      id: 'absorber',
      name: 'Acoustic Foam',
      type: 'absorber',
      icon: '🧽',
      cost: 50,
      effectiveness: 70,
      color: 'bg-blue-500'
    },
    {
      id: 'diffuser',
      name: 'Diffuser Panel',
      type: 'diffuser',
      icon: '📐',
      cost: 120,
      effectiveness: 85,
      color: 'bg-purple-500'
    },
    {
      id: 'bass-trap',
      name: 'Bass Trap',
      type: 'bass-trap',
      icon: '🔺',
      cost: 200,
      effectiveness: 95,
      color: 'bg-red-500'
    },
    {
      id: 'reflection-filter',
      name: 'Reflection Filter',
      type: 'reflection-filter',
      icon: '🛡️',
      cost: 80,
      effectiveness: 75,
      color: 'bg-green-500'
    }
  ];

  // Initialize 8x6 room grid
  const initializeRoom = useCallback(() => {
    const grid: RoomPosition[] = [];
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 6; y++) {
        grid.push({ x, y });
      }
    }
    setRoomGrid(grid);
  }, []);

  useEffect(() => {
    initializeRoom();
  }, [initializeRoom]);

  const endGame = useCallback(() => {
    if (gameCompleted) return;
    
    setGameCompleted(true);
    const finalScore = calculateFinalScore();
    setScore(finalScore);
    
    gameAudio.playCompleteProject();
    setTimeout(() => onComplete(finalScore), 1000);
  }, [gameCompleted, roomGrid, spentBudget, budget, timeLeft, onComplete]);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameCompleted(false);
    setSpentBudget(0);
    setScore(0);
    setAcousticScore(0);
    setTimeLeft(60);
    setFeedback('');
    setRoomGrid(grid => grid.map(pos => ({ ...pos, treatment: undefined })));

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
  }, [endGame]);

  const calculateAcousticScore = () => {
    const placedTreatments = roomGrid.filter(pos => pos.treatment);
    
    if (placedTreatments.length === 0) return 0;

    let totalEffectiveness = 0;
    let coverage = 0;
    let positioning = 0;

    // Calculate coverage and effectiveness
    placedTreatments.forEach(pos => {
      if (pos.treatment) {
        totalEffectiveness += pos.treatment.effectiveness;
        coverage += 10; // Each treatment covers 10% of room
      }
    });

    // Positioning bonuses based on recording type
    const corners = roomGrid.filter(pos => 
      (pos.x === 0 || pos.x === 7) && (pos.y === 0 || pos.y === 5)
    );
    const walls = roomGrid.filter(pos => 
      pos.x === 0 || pos.x === 7 || pos.y === 0 || pos.y === 5
    );

    // Bass traps in corners get bonus
    const bassTrapsInCorners = corners.filter(pos => 
      pos.treatment?.type === 'bass-trap'
    ).length;
    positioning += bassTrapsInCorners * 15;

    // Different recording types need different treatment
    if (recordingType === 'vocal') {
      // Vocal recording benefits from reflection filters and absorbers
      const vocalTreatments = placedTreatments.filter(pos => 
        pos.treatment?.type === 'reflection-filter' || pos.treatment?.type === 'absorber'
      ).length;
      positioning += vocalTreatments * 10;
    } else if (recordingType === 'drum') {
      // Drum recording needs diffusers and bass control
      const drumTreatments = placedTreatments.filter(pos => 
        pos.treatment?.type === 'diffuser' || pos.treatment?.type === 'bass-trap'
      ).length;
      positioning += drumTreatments * 12;
    }

    const avgEffectiveness = totalEffectiveness / placedTreatments.length;
    const coverageScore = Math.min(100, coverage);
    const positioningScore = Math.min(50, positioning);

    return Math.round((avgEffectiveness + coverageScore + positioningScore) / 3);
  };

  const calculateFinalScore = () => {
    const acousticQuality = calculateAcousticScore();
    const budgetEfficiency = Math.round(((budget - spentBudget) / budget) * 100);
    const timeBonus = Math.max(0, timeLeft * 2);

    return Math.round(acousticQuality * 0.6 + budgetEfficiency * 0.3 + timeBonus * 0.1);
  };

  const placeTreatment = (position: RoomPosition) => {
    if (!selectedTreatment || spentBudget + selectedTreatment.cost > budget) {
      if (spentBudget + (selectedTreatment?.cost || 0) > budget) {
        setFeedback('💰 Not enough budget!');
        setTimeout(() => setFeedback(''), 2000);
      }
      return;
    }

    setRoomGrid(prev => prev.map(pos => 
      pos.x === position.x && pos.y === position.y
        ? { ...pos, treatment: selectedTreatment }
        : pos
    ));

    setSpentBudget(prev => prev + selectedTreatment.cost);
    gameAudio.playClick();

    // Update acoustic score
    setTimeout(() => {
      const newScore = calculateAcousticScore();
      setAcousticScore(newScore);
      
      if (newScore > 80) {
        setFeedback('🎯 Excellent acoustics!');
      } else if (newScore > 60) {
        setFeedback('👍 Good improvement!');
      }
      setTimeout(() => setFeedback(''), 2000);
    }, 100);
  };

  const removeTreatment = (position: RoomPosition) => {
    if (!position.treatment) return;

    setSpentBudget(prev => prev - position.treatment!.cost);
    setRoomGrid(prev => prev.map(pos => 
      pos.x === position.x && pos.y === position.y
        ? { ...pos, treatment: undefined }
        : pos
    ));

    gameAudio.playError();
    
    setTimeout(() => {
      setAcousticScore(calculateAcousticScore());
    }, 100);
  };

  const getRecordingTypeHint = () => {
    const hints: { [key: string]: string } = {
      vocal: 'Vocal recording: Use reflection filters near microphone, absorbers on walls',
      drum: 'Drum recording: Place diffusers for natural sound, bass traps in corners',
      guitar: 'Guitar recording: Mix of absorbers and diffusers for controlled ambience',
      'full-band': 'Full band: Balance absorption and diffusion, control bass buildup'
    };
    return hints[recordingType];
  };

  const isCorner = (pos: RoomPosition) => 
    (pos.x === 0 || pos.x === 7) && (pos.y === 0 || pos.y === 5);
  
  const isWall = (pos: RoomPosition) => 
    pos.x === 0 || pos.x === 7 || pos.y === 0 || pos.y === 5;

  if (!gameStarted) {
    return (
      <Card className="w-full max-w-6xl bg-gray-900 border-gray-600 p-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">🏠 Acoustic Treatment Puzzle</h2>
          <p className="text-gray-300">
            Optimize your studio acoustics for {recordingType} recording!
            Use your budget wisely to create the perfect acoustic environment.
          </p>
          <div className="text-sm text-blue-400 bg-blue-900/30 p-3 rounded">
            💡 Hint: {getRecordingTypeHint()}
          </div>
          <div className="text-lg text-yellow-400">
            Budget: ${budget}
          </div>
          <Button 
            onClick={startGame} 
            className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3"
          >
            Start Treatment
          </Button>
        </div>
      </Card>
    );
  }

  if (gameCompleted) {
    return (
      <Card className="w-full max-w-6xl bg-gray-900 border-gray-600 p-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-yellow-400">Room Treatment Complete!</h2>
          <div className="space-y-2">
            <div className="text-lg text-white">Final Score: {score}</div>
            <div className="text-sm text-gray-400">
              Acoustic Quality: {acousticScore}% | Budget Used: ${spentBudget}/${budget}
            </div>
            {score >= 80 && (
              <div className="text-green-400 font-bold text-xl">🎉 Professional Studio!</div>
            )}
            {score >= 60 && score < 80 && (
              <div className="text-blue-400 font-bold">👍 Well-Treated Room!</div>
            )}
          </div>
          <Button 
            onClick={onClose} 
            className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3"
          >
            Collect Rewards
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl bg-gray-900 border-gray-600 p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🏠 Acoustic Treatment Puzzle</h2>
        <p className="text-gray-300">Recording Type: {recordingType.charAt(0).toUpperCase() + recordingType.slice(1)}</p>
        
        <div className="flex justify-between items-center mt-4">
          <div className="text-yellow-400 font-bold">
            Budget: ${budget - spentBudget} / ${budget}
          </div>
          <div className="text-green-400 font-bold">
            Acoustic Score: {acousticScore}%
          </div>
          <div className={`text-2xl font-bold ${timeLeft <= 15 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
            ⏱️ {timeLeft}s
          </div>
        </div>

        {feedback && (
          <div className="mt-2 text-center text-lg font-bold animate-pulse">
            {feedback}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Treatment Selection */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">🎛️ Acoustic Treatments</h3>
          <div className="space-y-3">
            {treatments.map(treatment => (
              <Button
                key={treatment.id}
                onClick={() => setSelectedTreatment(treatment)}
                className={`w-full p-4 h-auto flex justify-between items-center ${
                  selectedTreatment?.id === treatment.id 
                    ? treatment.color 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                disabled={spentBudget + treatment.cost > budget}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{treatment.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold">{treatment.name}</div>
                    <div className="text-xs opacity-75">
                      ${treatment.cost} | {treatment.effectiveness}% effective
                    </div>
                  </div>
                </div>
                {spentBudget + treatment.cost > budget && (
                  <span className="text-red-400 text-xs">💰</span>
                )}
              </Button>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-900/30 rounded border border-blue-600/50">
            <div className="text-sm text-blue-300">
              <div className="font-semibold mb-2">Treatment Tips:</div>
              <ul className="text-xs space-y-1">
                <li>🔺 Bass traps work best in corners</li>
                <li>🧽 Absorbers reduce reflections</li>
                <li>📐 Diffusers scatter sound naturally</li>
                <li>🛡️ Reflection filters for close micing</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Room Grid */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-bold text-white mb-4">🏠 Studio Room (8x6)</h3>
          <div 
            className="grid grid-cols-8 gap-1 bg-gray-800 p-4 rounded-lg border-2 border-gray-600"
            style={{ aspectRatio: '8/6' }}
          >
            {roomGrid.map((position, index) => (
              <div
                key={index}
                onClick={() => 
                  position.treatment 
                    ? removeTreatment(position)
                    : placeTreatment(position)
                }
                className={`
                  aspect-square cursor-pointer border border-gray-700 rounded transition-all duration-200
                  ${position.treatment 
                    ? position.treatment.color 
                    : isCorner(position) 
                      ? 'bg-gray-600 hover:bg-gray-500' 
                      : isWall(position) 
                        ? 'bg-gray-700 hover:bg-gray-600' 
                        : 'bg-gray-800 hover:bg-gray-700'
                  }
                  ${selectedTreatment && !position.treatment ? 'hover:ring-2 hover:ring-yellow-400' : ''}
                `}
                title={
                  position.treatment 
                    ? `${position.treatment.name} - Click to remove`
                    : selectedTreatment 
                      ? `Place ${selectedTreatment.name} here`
                      : 'Empty space'
                }
              >
                {position.treatment && (
                  <div className="w-full h-full flex items-center justify-center text-xs">
                    {position.treatment.icon}
                  </div>
                )}
                {!position.treatment && isCorner(position) && (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                    ⛞
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-2 text-xs text-gray-400 text-center">
            Click to place selected treatment | Click existing treatment to remove
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-6">
        <Button
          onClick={endGame}
          className="bg-green-600 hover:bg-green-700 px-6 py-3"
        >
          🎵 Test Acoustics
        </Button>
        <Button
          onClick={onClose}
          variant="outline"
          className="px-6 py-3"
        >
          Cancel
        </Button>
      </div>
    </Card>
  );
};
