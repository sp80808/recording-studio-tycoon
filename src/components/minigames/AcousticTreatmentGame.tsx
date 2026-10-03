import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { gameAudio } from '@/utils/audioSystem';
import { KenneyButton, MinigameChrome } from './MinigameChrome';
import { tc } from '@/i18n/content';

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
  }, []);

  const endGame = useCallback(() => {
    if (gameCompleted) return;
    
    setGameCompleted(true);
    const finalScore = calculateFinalScore();
    setScore(finalScore);
    
    gameAudio.playCompleteProject();
    setTimeout(() => onComplete(finalScore), 1000);
  }, [gameCompleted, roomGrid, spentBudget, budget, timeLeft]);

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
        setFeedback(tc('mg.AcousticTreatmentGame.fb_no_budget', '💰 Not enough budget!'));
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
        setFeedback(tc('mg.AcousticTreatmentGame.fb_excellent', '🎯 Excellent acoustics!'));
      } else if (newScore > 60) {
        setFeedback(tc('mg.AcousticTreatmentGame.fb_good', '👍 Good improvement!'));
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
      vocal: tc('mg.AcousticTreatmentGame.hint_vocal', 'Vocal recording: Use reflection filters near microphone, absorbers on walls'),
      drum: tc('mg.AcousticTreatmentGame.hint_drum', 'Drum recording: Place diffusers for natural sound, bass traps in corners'),
      guitar: tc('mg.AcousticTreatmentGame.hint_guitar', 'Guitar recording: Mix of absorbers and diffusers for controlled ambience'),
      'full-band': tc('mg.AcousticTreatmentGame.hint_full_band', 'Full band: Balance absorption and diffusion, control bass buildup')
    };
    return hints[recordingType];
  };

  const isCorner = (pos: RoomPosition) => 
    (pos.x === 0 || pos.x === 7) && (pos.y === 0 || pos.y === 5);
  
  const isWall = (pos: RoomPosition) => 
    pos.x === 0 || pos.x === 7 || pos.y === 0 || pos.y === 5;

  if (!gameStarted) {
    return (
      <Card className="w-full max-w-6xl mx-auto bg-stone-800 text-white border-stone-700">
        <MinigameChrome title={tc('mg.AcousticTreatmentGame.title', '🏠 Acoustic Treatment Puzzle')} score={score} accent="green">
        <div className="p-6 text-center space-y-4">
          <p className="text-stone-300">
            {tc('mg.AcousticTreatmentGame.intro', 'Optimize your studio acoustics for {{type}} recording! Use your budget wisely to create the perfect acoustic environment.', { type: recordingType })}
          </p>
          <div className="text-sm text-[var(--rst-live)] bg-white/[0.04] border border-[var(--rst-line)] p-3 rounded">
            {tc('mg.AcousticTreatmentGame.hint_prefix', '💡 Hint: {{hint}}', { hint: getRecordingTypeHint() })}
          </div>
          <div className="text-lg text-yellow-400">
            {tc('mg.AcousticTreatmentGame.budget_start', 'Budget: ${{budget}}', { budget })}
          </div>
          <KenneyButton variant="green" onClick={startGame}>
            {tc('mg.AcousticTreatmentGame.start', 'Start Treatment')}
          </KenneyButton>
        </div>
        </MinigameChrome>
      </Card>
    );
  }

  if (gameCompleted) {
    return (
      <Card className="w-full max-w-6xl mx-auto bg-stone-800 text-white border-stone-700">
        <MinigameChrome title={tc('mg.AcousticTreatmentGame.title', '🏠 Acoustic Treatment Puzzle')} score={score} accent="green">
        <div className="p-6 text-center space-y-4">
          <h2 className={`text-2xl font-bold text-yellow-400 ${score >= 80 ? 'mg-perfect-pop' : ''}`}>{tc('mg.AcousticTreatmentGame.complete_title', 'Room Treatment Complete!')}</h2>
          <div className="space-y-2">
            <div className="text-lg text-white">{tc('mg.AcousticTreatmentGame.final_score', 'Final Score: {{score}}', { score })}</div>
            <div className="text-sm text-stone-400">
              {tc('mg.AcousticTreatmentGame.result_line', 'Acoustic Quality: {{quality}}% | Budget Used: ${{spent}}/${{budget}}', { quality: acousticScore, spent: spentBudget, budget })}
            </div>
            {score >= 80 && (
              <div className="text-green-400 font-bold text-xl mg-perfect-pop">{tc('mg.AcousticTreatmentGame.result_pro', '🎉 Professional Studio!')}</div>
            )}
            {score >= 60 && score < 80 && (
              <div className="text-[var(--rst-live)] font-bold">{tc('mg.AcousticTreatmentGame.result_well', '👍 Well-Treated Room!')}</div>
            )}
          </div>
          <KenneyButton variant="green" onClick={onClose}>
            {tc('mg.AcousticTreatmentGame.collect', 'Collect Rewards')}
          </KenneyButton>
        </div>
        </MinigameChrome>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto bg-stone-800 text-white border-stone-700">
      <MinigameChrome title={tc('mg.AcousticTreatmentGame.title', '🏠 Acoustic Treatment Puzzle')} score={acousticScore} timeLeft={timeLeft} accent="green">
      <div className="p-6">
      <div className="text-center mb-6">
        <p className="text-stone-300">{tc('mg.AcousticTreatmentGame.recording_type', 'Recording Type: {{type}}', { type: recordingType.charAt(0).toUpperCase() + recordingType.slice(1) })}</p>

        <div className="mt-4 text-lg text-yellow-400 font-bold">
          {tc('mg.AcousticTreatmentGame.budget_left', 'Budget: ${{left}} / ${{budget}}', { left: budget - spentBudget, budget })}
        </div>

        {feedback && (
          <div key={feedback} className={`mt-2 text-center text-lg font-bold ${feedback.startsWith('🎯') ? 'text-green-400 mg-perfect-pop' : feedback.startsWith('💰') ? 'text-red-400 mg-miss-shake' : 'text-yellow-300'}`}>
            {feedback}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Treatment Selection */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">{tc('mg.AcousticTreatmentGame.treatments_heading', '🎛️ Acoustic Treatments')}</h3>
          <div className="space-y-3">
            {treatments.map(treatment => (
              <Button
                key={treatment.id}
                onClick={() => setSelectedTreatment(treatment)}
                className={`w-full p-4 h-auto flex justify-between items-center ${
                  selectedTreatment?.id === treatment.id 
                    ? treatment.color 
                    : 'bg-stone-700 hover:bg-stone-600'
                }`}
                disabled={spentBudget + treatment.cost > budget}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{treatment.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold">{tc(`mg.AcousticTreatmentGame.treatment_${treatment.id}`, treatment.name)}</div>
                    <div className="text-xs opacity-75">
                      {tc('mg.AcousticTreatmentGame.treatment_stats', '${{cost}} | {{eff}}% effective', { cost: treatment.cost, eff: treatment.effectiveness })}
                    </div>
                  </div>
                </div>
                {spentBudget + treatment.cost > budget && (
                  <span className="text-red-400 text-xs">💰</span>
                )}
              </Button>
            ))}
          </div>

          <div className="mt-4 p-3 bg-white/[0.04] border border-[var(--rst-line)] rounded border border-[var(--rst-live)]/50">
            <div className="text-sm text-[var(--rst-live)]">
              <div className="font-semibold mb-2">{tc('mg.AcousticTreatmentGame.tips_heading', 'Treatment Tips:')}</div>
              <ul className="text-xs space-y-1">
                <li>{tc('mg.AcousticTreatmentGame.tip_bass', '🔺 Bass traps work best in corners')}</li>
                <li>{tc('mg.AcousticTreatmentGame.tip_absorb', '🧽 Absorbers reduce reflections')}</li>
                <li>{tc('mg.AcousticTreatmentGame.tip_diffuse', '📐 Diffusers scatter sound naturally')}</li>
                <li>{tc('mg.AcousticTreatmentGame.tip_filter', '🛡️ Reflection filters for close micing')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Room Grid */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-bold text-white mb-4">{tc('mg.AcousticTreatmentGame.room_heading', '🏠 Studio Room (8x6)')}</h3>
          <div 
            className="grid grid-cols-8 gap-1 bg-stone-800 p-4 rounded-lg border-2 border-stone-600"
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
                  aspect-square cursor-pointer border border-stone-700 rounded transition-all duration-200
                  ${position.treatment 
                    ? position.treatment.color 
                    : isCorner(position) 
                      ? 'bg-stone-600 hover:bg-stone-500' 
                      : isWall(position) 
                        ? 'bg-stone-700 hover:bg-stone-600' 
                        : 'bg-stone-800 hover:bg-stone-700'
                  }
                  ${selectedTreatment && !position.treatment ? 'hover:ring-2 hover:ring-yellow-400' : ''}
                `}
                title={
                  position.treatment 
                    ? tc('mg.AcousticTreatmentGame.tt_remove', '{{name}} - Click to remove', { name: tc(`mg.AcousticTreatmentGame.treatment_${position.treatment.id}`, position.treatment.name) })
                    : selectedTreatment 
                      ? tc('mg.AcousticTreatmentGame.tt_place', 'Place {{name}} here', { name: tc(`mg.AcousticTreatmentGame.treatment_${selectedTreatment.id}`, selectedTreatment.name) })
                      : tc('mg.AcousticTreatmentGame.tt_empty', 'Empty space')
                }
              >
                {position.treatment && (
                  <div className="w-full h-full flex items-center justify-center text-xs">
                    {position.treatment.icon}
                  </div>
                )}
                {!position.treatment && isCorner(position) && (
                  <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
                    ⛞
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-2 text-xs text-stone-400 text-center">
            {tc('mg.AcousticTreatmentGame.grid_help', 'Click to place selected treatment | Click existing treatment to remove')}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-6">
        <KenneyButton variant="green" onClick={endGame}>
          {tc('mg.AcousticTreatmentGame.test', '🎵 Test Acoustics')}
        </KenneyButton>
        <KenneyButton variant="grey" onClick={onClose}>
          {tc('mg.AcousticTreatmentGame.cancel', 'Cancel')}
        </KenneyButton>
      </div>
      </div>
      </MinigameChrome>
    </Card>
  );
};
