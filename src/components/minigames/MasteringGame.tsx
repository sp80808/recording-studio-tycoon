
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { gameAudio } from '@/utils/audioSystem';
import { KenneyButton, MinigameChrome } from './MinigameChrome';
import { tc } from '@/i18n/content';

interface MasteringGameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
}

export const MasteringGame: React.FC<MasteringGameProps> = ({ onComplete, onClose }) => {
  const [currentTarget, setCurrentTarget] = useState(0);
  const [parameters, setParameters] = useState({
    volume: [50],
    compression: [30],
    eq: [50],
    stereoWidth: [40]
  });
  
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [feedback, setFeedback] = useState('');

  const targets = [
    { volume: 75, compression: 60, eq: 40, stereoWidth: 70, name: "Rock Master" },
    { volume: 65, compression: 45, eq: 60, stereoWidth: 50, name: "Pop Polish" },
    { volume: 80, compression: 70, eq: 30, stereoWidth: 80, name: "Electronic Punch" },
    { volume: 55, compression: 25, eq: 70, stereoWidth: 30, name: "Acoustic Natural" }
  ];

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

  const calculateAccuracy = () => {
    const target = targets[currentTarget];
    const volumeDiff = Math.abs(parameters.volume[0] - target.volume);
    const compressionDiff = Math.abs(parameters.compression[0] - target.compression);
    const eqDiff = Math.abs(parameters.eq[0] - target.eq);
    const widthDiff = Math.abs(parameters.stereoWidth[0] - target.stereoWidth);
    
    const totalDiff = volumeDiff + compressionDiff + eqDiff + widthDiff;
    const accuracy = Math.max(0, 100 - (totalDiff / 4));
    
    return Math.round(accuracy);
  };

  const checkTarget = () => {
    const accuracy = calculateAccuracy();
    const points = Math.round(accuracy * 2);
    
    setScore(prev => prev + points);
    
    if (accuracy >= 80) {
      setFeedback(tc('mg.MasteringGame.fb_perfect', '🎯 Perfect Master! +{{points}}', { points }));
    } else if (accuracy >= 60) {
      setFeedback(tc('mg.MasteringGame.fb_good', '👍 Good work! +{{points}}', { points }));
    } else {
      setFeedback(tc('mg.MasteringGame.fb_needs', '🔧 Needs adjustment +{{points}}', { points }));
    }

    setTimeout(() => {
      setFeedback('');
      if (currentTarget < targets.length - 1) {
        setCurrentTarget(prev => prev + 1);
        // Reset parameters for next challenge
        setParameters({
          volume: [50],
          compression: [30],
          eq: [50],
          stereoWidth: [40]
        });
      } else {
        handleComplete();
      }
    }, 2000);
  };

  const handleComplete = () => {
    onComplete(score);
  };

  const target = targets[currentTarget];
  const accuracy = calculateAccuracy();
  const masteringDone = timeLeft === 0;

  return (
    <Card className="w-full max-w-4xl mx-auto bg-stone-800 text-white border-stone-700">
      <MinigameChrome title={tc('mg.MasteringGame.title', '🎚️ Mastering Challenge')} score={score} timeLeft={timeLeft} accent="yellow">
      <div className="p-6">
      <div className="text-center mb-6">
        <p className="text-stone-300">{tc('mg.MasteringGame.instructions', 'Master the track to match the target sound!')}</p>
        <div className="mt-4 text-lg font-bold text-[var(--rst-live)]">{tc('mg.MasteringGame.target_name', 'Target: {{name}}', { name: tc(`mg.MasteringGame.preset_${currentTarget}`, target.name) })}</div>
      </div>

      {feedback && (
        <div key={feedback} className={`text-center text-xl font-bold mb-4 ${accuracy >= 80 ? 'text-green-400 mg-perfect-pop' : accuracy >= 60 ? 'text-yellow-300' : 'text-red-400 mg-miss-shake'}`}>
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-white font-semibold">{tc('mg.MasteringGame.volume', '🔊 Volume')}</label>
              <span className="text-stone-400">{parameters.volume[0]}%</span>
            </div>
            <Slider
              value={parameters.volume}
              onValueChange={(value) => setParameters(prev => ({ ...prev, volume: value }))}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-green-400 mt-1">{tc('mg.MasteringGame.target_pct', 'Target: {{value}}%', { value: target.volume })}</div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-white font-semibold">{tc('mg.MasteringGame.compression', '🗜️ Compression')}</label>
              <span className="text-stone-400">{parameters.compression[0]}%</span>
            </div>
            <Slider
              value={parameters.compression}
              onValueChange={(value) => setParameters(prev => ({ ...prev, compression: value }))}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-green-400 mt-1">{tc('mg.MasteringGame.target_pct', 'Target: {{value}}%', { value: target.compression })}</div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-white font-semibold">{tc('mg.MasteringGame.eq', '🎛️ EQ')}</label>
              <span className="text-stone-400">{parameters.eq[0]}%</span>
            </div>
            <Slider
              value={parameters.eq}
              onValueChange={(value) => setParameters(prev => ({ ...prev, eq: value }))}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-green-400 mt-1">{tc('mg.MasteringGame.target_pct', 'Target: {{value}}%', { value: target.eq })}</div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-white font-semibold">{tc('mg.MasteringGame.stereo_width', '📻 Stereo Width')}</label>
              <span className="text-stone-400">{parameters.stereoWidth[0]}%</span>
            </div>
            <Slider
              value={parameters.stereoWidth}
              onValueChange={(value) => setParameters(prev => ({ ...prev, stereoWidth: value }))}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-green-400 mt-1">{tc('mg.MasteringGame.target_pct', 'Target: {{value}}%', { value: target.stereoWidth })}</div>
          </div>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="text-lg font-bold text-white mb-2">
          {tc('mg.MasteringGame.accuracy', 'Accuracy: {{n}}%', { n: accuracy })}
        </div>
        <div className="w-full bg-stone-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300 ${accuracy >= 80 ? 'mg-meter-glow' : ''}`}
            style={{ width: `${accuracy}%` }}
          />
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <KenneyButton variant="green" onClick={checkTarget}>
          {tc('mg.MasteringGame.check', '✨ Check Master')}
        </KenneyButton>
        <KenneyButton variant="yellow" onClick={handleComplete}>
          {tc('mg.MasteringGame.finish_early', 'Finish Early')}
        </KenneyButton>
        <KenneyButton variant="grey" onClick={onClose}>
          {tc('mg.MasteringGame.cancel', 'Cancel')}
        </KenneyButton>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {targets.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full ${
              index < currentTarget
                ? 'bg-green-500'
                : index === currentTarget
                  ? 'bg-blue-500 animate-pulse'
                  : 'bg-stone-600'
            }`}
          />
        ))}
      </div>
      {masteringDone && (
        <div className="mt-4 text-center text-2xl font-bold text-green-400 mg-perfect-pop">
          {tc('mg.MasteringGame.complete', 'Mastering Complete! Final Score: {{score}}', { score })}
        </div>
      )}
      </div>
      </MinigameChrome>
    </Card>
  );
};
