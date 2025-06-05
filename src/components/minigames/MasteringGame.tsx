
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

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
      setFeedback('🎯 Perfect Master! +' + points);
    } else if (accuracy >= 60) {
      setFeedback('👍 Good work! +' + points);
    } else {
      setFeedback('🔧 Needs adjustment +' + points);
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

  return (
    <Card className="w-full max-w-4xl bg-gray-900 border-gray-600 p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🎚️ Mastering Challenge</h2>
        <p className="text-gray-300">Master the track to match the target sound!</p>
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
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-white font-semibold">🔊 Volume</label>
              <span className="text-gray-400">{parameters.volume[0]}%</span>
            </div>
            <Slider
              value={parameters.volume}
              onValueChange={(value) => setParameters(prev => ({ ...prev, volume: value }))}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-green-400 mt-1">Target: {target.volume}%</div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-white font-semibold">🗜️ Compression</label>
              <span className="text-gray-400">{parameters.compression[0]}%</span>
            </div>
            <Slider
              value={parameters.compression}
              onValueChange={(value) => setParameters(prev => ({ ...prev, compression: value }))}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-green-400 mt-1">Target: {target.compression}%</div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-white font-semibold">🎛️ EQ</label>
              <span className="text-gray-400">{parameters.eq[0]}%</span>
            </div>
            <Slider
              value={parameters.eq}
              onValueChange={(value) => setParameters(prev => ({ ...prev, eq: value }))}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-green-400 mt-1">Target: {target.eq}%</div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-white font-semibold">📻 Stereo Width</label>
              <span className="text-gray-400">{parameters.stereoWidth[0]}%</span>
            </div>
            <Slider
              value={parameters.stereoWidth}
              onValueChange={(value) => setParameters(prev => ({ ...prev, stereoWidth: value }))}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-green-400 mt-1">Target: {target.stereoWidth}%</div>
          </div>
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
        <Button onClick={checkTarget} className="px-8 py-3 bg-green-600 hover:bg-green-700">
          ✨ Check Master
        </Button>
        <Button onClick={handleComplete} className="px-6 py-3 bg-blue-600 hover:bg-blue-700">
          Finish Early
        </Button>
        <Button onClick={onClose} variant="outline" className="px-6 py-3">
          Cancel
        </Button>
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
                  : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    </Card>
  );
};
