import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BaseMinigame } from './BaseMinigame';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';

interface Channel {
  id: number;
  name: string;
  fader: number;
  pan: number;
  eq: {
    low: number;
    mid: number;
    high: number;
  };
  isMuted: boolean;
  isSolo: boolean;
  vuLevel: number;
  effects: {
    reverb: number;
    delay: number;
    compression: number;
  };
}

interface AnalogConsoleGameProps {
  difficulty: number;
  onComplete: (score: number) => void;
  onFail: () => void;
  onClose: () => void; // Added onClose prop
}

const VUMeter: React.FC<{ level: number }> = ({ level }) => {
  const segments = 20;
  const activeSegments = Math.floor(level * segments);
  
  return (
    <div className="flex h-4 bg-black rounded overflow-hidden">
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex-1 border-r border-black",
            i < activeSegments ? "bg-green-500" : "bg-gray-800",
            i === segments - 1 && "border-r-0"
          )}
        />
      ))}
    </div>
  );
};

export const AnalogConsoleGame: React.FC<AnalogConsoleGameProps> = ({
  difficulty,
  onComplete,
  onFail,
  onClose // Destructured onClose
}) => {
  const [channels, setChannels] = useState<Channel[]>([
    { id: 1, name: 'Kick', fader: 0, pan: 0, eq: { low: 0, mid: 0, high: 0 }, isMuted: false, isSolo: false, vuLevel: 0, effects: { reverb: 0, delay: 0, compression: 0 } },
    { id: 2, name: 'Snare', fader: 0, pan: 0, eq: { low: 0, mid: 0, high: 0 }, isMuted: false, isSolo: false, vuLevel: 0, effects: { reverb: 0, delay: 0, compression: 0 } },
    { id: 3, name: 'Hi-Hat', fader: 0, pan: 0, eq: { low: 0, mid: 0, high: 0 }, isMuted: false, isSolo: false, vuLevel: 0, effects: { reverb: 0, delay: 0, compression: 0 } },
    { id: 4, name: 'Bass', fader: 0, pan: 0, eq: { low: 0, mid: 0, high: 0 }, isMuted: false, isSolo: false, vuLevel: 0, effects: { reverb: 0, delay: 0, compression: 0 } },
    { id: 5, name: 'Guitar', fader: 0, pan: 0, eq: { low: 0, mid: 0, high: 0 }, isMuted: false, isSolo: false, vuLevel: 0, effects: { reverb: 0, delay: 0, compression: 0 } },
    { id: 6, name: 'Vocals', fader: 0, pan: 0, eq: { low: 0, mid: 0, high: 0 }, isMuted: false, isSolo: false, vuLevel: 0, effects: { reverb: 0, delay: 0, compression: 0 } }
  ]);
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const { playSound } = useSound();

  // Generate target values based on difficulty
  const targetValues = React.useMemo(() => {
    return channels.map(() => ({
      fader: Math.random() * 0.8 + 0.2,
      pan: Math.random() * 2 - 1,
      eq: {
        low: Math.random() * 2 - 1,
        mid: Math.random() * 2 - 1,
        high: Math.random() * 2 - 1
      },
      effects: {
        reverb: Math.random(),
        delay: Math.random(),
        compression: Math.random()
      }
    }));
  }, [channels, difficulty]);

  // Update VU meters
  useEffect(() => {
    if (!isPlaying) return;

    const updateVU = () => {
      setChannels(prev => prev.map(channel => ({
        ...channel,
        vuLevel: channel.isMuted ? 0 : Math.random() * channel.fader
      })));
    };

    const interval = setInterval(updateVU, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Handle channel selection
  const handleChannelSelect = useCallback((channelId: number) => {
    setSelectedChannel(channelId);
    playSound('click');
  }, [playSound]);

  // Handle fader adjustment
  const handleFaderChange = useCallback((channelId: number, value: number) => {
    setChannels(prev => prev.map(channel => 
      channel.id === channelId ? { ...channel, fader: value } : channel
    ));
  }, []);

  // Handle pan adjustment
  const handlePanChange = useCallback((channelId: number, value: number) => {
    setChannels(prev => prev.map(channel => 
      channel.id === channelId ? { ...channel, pan: value } : channel
    ));
  }, []);

  // Handle EQ adjustment
  const handleEQChange = useCallback((channelId: number, band: 'low' | 'mid' | 'high', value: number) => {
    setChannels(prev => prev.map(channel => 
      channel.id === channelId ? {
        ...channel,
        eq: { ...channel.eq, [band]: value }
      } : channel
    ));
  }, []);

  // Handle effects adjustment
  const handleEffectChange = useCallback((channelId: number, effect: 'reverb' | 'delay' | 'compression', value: number) => {
    setChannels(prev => prev.map(channel => 
      channel.id === channelId ? {
        ...channel,
        effects: { ...channel.effects, [effect]: value }
      } : channel
    ));
  }, []);

  // Handle mute/solo
  const handleMuteToggle = useCallback((channelId: number) => {
    setChannels(prev => prev.map(channel => {
      if (channel.id === channelId) {
        const newMute = !channel.isMuted;
        return { ...channel, isMuted: newMute, isSolo: newMute ? false : channel.isSolo };
      }
      return channel;
    }));
    playSound('mute');
  }, [playSound]);

  const handleSoloToggle = useCallback((channelId: number) => {
    setChannels(prev => prev.map(channel => {
      if (channel.id === channelId) {
        const newSolo = !channel.isSolo;
        return { ...channel, isSolo: newSolo, isMuted: newSolo ? false : channel.isMuted };
      }
      return channel;
    }));
    playSound('solo');
  }, [playSound]);

  // Calculate score based on accuracy
  const calculateScore = useCallback(() => {
    const channelScores = channels.map((channel, index) => {
      const target = targetValues[index];
      
      // Calculate accuracy for each parameter
      const faderAccuracy = 1 - Math.abs(channel.fader - target.fader);
      const panAccuracy = 1 - Math.abs(channel.pan - target.pan);
      const eqAccuracy = (
        (1 - Math.abs(channel.eq.low - target.eq.low)) +
        (1 - Math.abs(channel.eq.mid - target.eq.mid)) +
        (1 - Math.abs(channel.eq.high - target.eq.high))
      ) / 3;

      // Calculate effects accuracy
      const effectsAccuracy = (
        (1 - Math.abs(channel.effects.reverb - target.effects.reverb)) +
        (1 - Math.abs(channel.effects.delay - target.effects.delay)) +
        (1 - Math.abs(channel.effects.compression - target.effects.compression))
      ) / 3;

      // Penalize for incorrect mute/solo states
      const statePenalty = (channel.isMuted || channel.isSolo) ? 0.2 : 0;

      return (faderAccuracy + panAccuracy + eqAccuracy + effectsAccuracy) / 4 - statePenalty;
    });

    const averageScore = channelScores.reduce((acc, score) => acc + score, 0) / channels.length;
    return Math.max(0, Math.min(100, averageScore * 100));
  }, [channels, targetValues]);

  // Timer effect
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          const finalScore = calculateScore();
          setScore(finalScore);
          onComplete(finalScore);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, calculateScore, onComplete]);

  // Start game
  const startGame = useCallback(() => {
    setIsPlaying(true);
    playSound('start');
  }, [playSound]);

  return (
    <BaseMinigame
      type="analog_console"
      difficulty={difficulty}
      onComplete={onComplete}
      onFail={onFail}
      onClose={onClose} // Passed onClose to BaseMinigame
    >
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="text-xl font-bold">
          Analog Console Challenge
        </div>
        
        <div className="text-lg">
          Time Remaining: {timeRemaining}s
        </div>

        {!isPlaying ? (
          <motion.button
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Start Mixing
          </motion.button>
        ) : (
          <div className="grid grid-cols-2 gap-4 w-full max-w-4xl">
            {channels.map(channel => (
              <motion.div
                key={channel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 rounded-lg border-2",
                  selectedChannel === channel.id ? "border-primary" : "border-border",
                  channel.isMuted && "opacity-50"
                )}
                onClick={() => handleChannelSelect(channel.id)}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="font-bold">{channel.name}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMuteToggle(channel.id);
                      }}
                      className={cn(
                        "px-2 py-1 rounded text-sm",
                        channel.isMuted ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      M
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSoloToggle(channel.id);
                      }}
                      className={cn(
                        "px-2 py-1 rounded text-sm",
                        channel.isSolo ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      S
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-sm">Fader</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={channel.fader}
                      onChange={(e) => handleFaderChange(channel.id, parseFloat(e.target.value))}
                      className="w-full"
                      disabled={channel.isMuted}
                    />
                    <VUMeter level={channel.vuLevel} />
                  </div>
                  
                  <div>
                    <label className="text-sm">Pan</label>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.01"
                      value={channel.pan}
                      onChange={(e) => handlePanChange(channel.id, parseFloat(e.target.value))}
                      className="w-full"
                      disabled={channel.isMuted}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-sm">Low</label>
                      <input
                        type="range"
                        min="-1"
                        max="1"
                        step="0.01"
                        value={channel.eq.low}
                        onChange={(e) => handleEQChange(channel.id, 'low', parseFloat(e.target.value))}
                        className="w-full"
                        disabled={channel.isMuted}
                      />
                    </div>
                    <div>
                      <label className="text-sm">Mid</label>
                      <input
                        type="range"
                        min="-1"
                        max="1"
                        step="0.01"
                        value={channel.eq.mid}
                        onChange={(e) => handleEQChange(channel.id, 'mid', parseFloat(e.target.value))}
                        className="w-full"
                        disabled={channel.isMuted}
                      />
                    </div>
                    <div>
                      <label className="text-sm">High</label>
                      <input
                        type="range"
                        min="-1"
                        max="1"
                        step="0.01"
                        value={channel.eq.high}
                        onChange={(e) => handleEQChange(channel.id, 'high', parseFloat(e.target.value))}
                        className="w-full"
                        disabled={channel.isMuted}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-sm">Reverb</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={channel.effects.reverb}
                        onChange={(e) => handleEffectChange(channel.id, 'reverb', parseFloat(e.target.value))}
                        className="w-full"
                        disabled={channel.isMuted}
                      />
                    </div>
                    <div>
                      <label className="text-sm">Delay</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={channel.effects.delay}
                        onChange={(e) => handleEffectChange(channel.id, 'delay', parseFloat(e.target.value))}
                        className="w-full"
                        disabled={channel.isMuted}
                      />
                    </div>
                    <div>
                      <label className="text-sm">Comp</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={channel.effects.compression}
                        onChange={(e) => handleEffectChange(channel.id, 'compression', parseFloat(e.target.value))}
                        className="w-full"
                        disabled={channel.isMuted}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {score > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold"
          >
            Final Score: {score}
          </motion.div>
        )}
      </div>
    </BaseMinigame>
  );
};
