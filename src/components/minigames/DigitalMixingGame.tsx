import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BaseMinigame } from './BaseMinigame';
import { useSound } from '@/hooks/useSound';

interface AutomationPoint {
  time: number;
  value: number;
  parameter: string;
}

interface Channel {
  id: string;
  name: string;
  fader: number;
  pan: number;
  eq: {
    low: number;
    mid: number;
    high: number;
  };
  effects: {
    reverb: number;
    delay: number;
    compression: number;
  };
  isMuted: boolean;
  isSolo: boolean;
  vuLevel: number;
  bus: string;
  automation: AutomationPoint[];
  isAutomationEnabled: boolean;
}

interface Bus {
  id: string;
  name: string;
  channels: string[];
  fader: number;
  effects: {
    reverb: number;
    delay: number;
    compression: number;
  };
  vuLevel: number;
}

interface DigitalMixingGameProps {
  difficulty: number;
  onComplete: (score: number) => void;
  onFail: () => void;
  onClose: () => void;
}

const CHANNELS: Channel[] = [
  { id: 'kick', name: 'Kick', fader: 0, pan: 0, eq: { low: 0, mid: 0, high: 0 }, effects: { reverb: 0, delay: 0, compression: 0 }, isMuted: false, isSolo: false, vuLevel: 0, bus: 'main', automation: [], isAutomationEnabled: false },
  { id: 'snare', name: 'Snare', fader: 0, pan: 0, eq: { low: 0, mid: 0, high: 0 }, effects: { reverb: 0, delay: 0, compression: 0 }, isMuted: false, isSolo: false, vuLevel: 0, bus: 'main', automation: [], isAutomationEnabled: false },
  { id: 'hihat', name: 'Hi-Hat', fader: 0, pan: 0, eq: { low: 0, mid: 0, high: 0 }, effects: { reverb: 0, delay: 0, compression: 0 }, isMuted: false, isSolo: false, vuLevel: 0, bus: 'main', automation: [], isAutomationEnabled: false },
  { id: 'bass', name: 'Bass', fader: 0, pan: 0, eq: { low: 0, mid: 0, high: 0 }, effects: { reverb: 0, delay: 0, compression: 0 }, isMuted: false, isSolo: false, vuLevel: 0, bus: 'main', automation: [], isAutomationEnabled: false },
  { id: 'lead', name: 'Lead', fader: 0, pan: 0, eq: { low: 0, mid: 0, high: 0 }, effects: { reverb: 0, delay: 0, compression: 0 }, isMuted: false, isSolo: false, vuLevel: 0, bus: 'main', automation: [], isAutomationEnabled: false },
  { id: 'pad', name: 'Pad', fader: 0, pan: 0, eq: { low: 0, mid: 0, high: 0 }, effects: { reverb: 0, delay: 0, compression: 0 }, isMuted: false, isSolo: false, vuLevel: 0, bus: 'main', automation: [], isAutomationEnabled: false },
];

const BUSES: Bus[] = [
  { id: 'main', name: 'Main', channels: [], fader: 0, effects: { reverb: 0, delay: 0, compression: 0 }, vuLevel: 0 },
  { id: 'drums', name: 'Drums', channels: [], fader: 0, effects: { reverb: 0, delay: 0, compression: 0 }, vuLevel: 0 },
  { id: 'synths', name: 'Synths', channels: [], fader: 0, effects: { reverb: 0, delay: 0, compression: 0 }, vuLevel: 0 },
];

export const DigitalMixingGame: React.FC<DigitalMixingGameProps> = ({
  difficulty,
  onComplete,
  onFail,
  onClose,
}) => {
  const [channels, setChannels] = useState<Channel[]>(CHANNELS);
  const [buses, setBuses] = useState<Bus[]>(BUSES);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutomationRecording, setIsAutomationRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const { playSound } = useSound();

  // Generate target mix based on difficulty
  const targetMix = useMemo(() => {
    const target: { [key: string]: {
      fader: number;
      pan: number;
      eq: { low: number; mid: number; high: number };
      effects: { reverb: number; delay: number; compression: number };
      bus: string;
    } } = {};
    CHANNELS.forEach(channel => {
      target[channel.id] = {
        fader: Math.random() * 0.8 + 0.1,
        pan: (Math.random() - 0.5) * 2,
        eq: {
          low: (Math.random() - 0.5) * 24,
          mid: (Math.random() - 0.5) * 24,
          high: (Math.random() - 0.5) * 24,
        },
        effects: {
          reverb: Math.random() * 0.5,
          delay: Math.random() * 0.5,
          compression: Math.random() * 0.5,
        },
        bus: ['main', 'drums', 'synths'][Math.floor(Math.random() * 3)],
      };
    });
    return target;
  }, [difficulty]);

  // Update VU meters
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setChannels(prevChannels => 
        prevChannels.map(channel => ({
          ...channel,
          vuLevel: channel.isMuted ? 0 : Math.random() * channel.fader,
        }))
      );

      setBuses(prevBuses =>
        prevBuses.map(bus => ({
          ...bus,
          vuLevel: bus.channels.reduce((sum, channelId) => {
            const channel = channels.find(c => c.id === channelId);
            return sum + (channel?.vuLevel || 0);
          }, 0) / Math.max(bus.channels.length, 1),
        }))
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, channels]);

  // Timer
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying]);

  // Automation playback
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + 0.1;
        if (newTime >= 180) {
          clearInterval(interval);
          return 180;
        }
        return newTime;
      });

      setChannels(prevChannels =>
        prevChannels.map(channel => {
          if (!channel.isAutomationEnabled) return channel;

          const automationPoints = channel.automation.filter(
            point => point.time <= currentTime
          );

          if (automationPoints.length === 0) return channel;

          const lastPoint = automationPoints[automationPoints.length - 1];
          const nextPoint = channel.automation.find(
            point => point.time > currentTime
          );

          if (!nextPoint) {
            return {
              ...channel,
              [lastPoint.parameter]: lastPoint.value,
            };
          }

          const progress = (currentTime - lastPoint.time) / (nextPoint.time - lastPoint.time);
          const interpolatedValue = lastPoint.value + (nextPoint.value - lastPoint.value) * progress;

          return {
            ...channel,
            [lastPoint.parameter]: interpolatedValue,
          };
        })
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, currentTime]);

  const handleStart = () => {
    setIsPlaying(true);
    playSound('start');
  };

  const handleChannelSelect = (channelId: string) => {
    setSelectedChannel(channelId);
    setSelectedBus(null);
    playSound('select');
  };

  const handleBusSelect = (busId: string) => {
    setSelectedBus(busId);
    setSelectedChannel(null);
    playSound('select');
  };

  const handleFaderAdjust = (channelId: string, value: number) => {
    if (isAutomationRecording) {
      const channel = channels.find(c => c.id === channelId);
      if (channel?.isAutomationEnabled) {
        setChannels(prevChannels =>
          prevChannels.map(c =>
            c.id === channelId
              ? {
                  ...c,
                  automation: [
                    ...c.automation,
                    { time: currentTime, value, parameter: 'fader' },
                  ],
                }
              : c
          )
        );
      }
    }

    setChannels(prevChannels =>
      prevChannels.map(c =>
        c.id === channelId ? { ...c, fader: value } : c
      )
    );
    playSound('fader');
  };

  const handlePanAdjust = (channelId: string, value: number) => {
    if (isAutomationRecording) {
      const channel = channels.find(c => c.id === channelId);
      if (channel?.isAutomationEnabled) {
        setChannels(prevChannels =>
          prevChannels.map(c =>
            c.id === channelId
              ? {
                  ...c,
                  automation: [
                    ...c.automation,
                    { time: currentTime, value, parameter: 'pan' },
                  ],
                }
              : c
          )
        );
      }
    }

    setChannels(prevChannels =>
      prevChannels.map(c =>
        c.id === channelId ? { ...c, pan: value } : c
      )
    );
    playSound('pan');
  };

  const handleEQAdjust = (channelId: string, band: string, value: number) => {
    if (isAutomationRecording) {
      const channel = channels.find(c => c.id === channelId);
      if (channel?.isAutomationEnabled) {
        setChannels(prevChannels =>
          prevChannels.map(c =>
            c.id === channelId
              ? {
                  ...c,
                  automation: [
                    ...c.automation,
                    { time: currentTime, value, parameter: `eq.${band}` },
                  ],
                }
              : c
          )
        );
      }
    }

    setChannels(prevChannels =>
      prevChannels.map(c =>
        c.id === channelId
          ? { ...c, eq: { ...c.eq, [band]: value } }
          : c
      )
    );
    playSound('eq');
  };

  const handleEffectsAdjust = (channelId: string, effect: string, value: number) => {
    if (isAutomationRecording) {
      const channel = channels.find(c => c.id === channelId);
      if (channel?.isAutomationEnabled) {
        setChannels(prevChannels =>
          prevChannels.map(c =>
            c.id === channelId
              ? {
                  ...c,
                  automation: [
                    ...c.automation,
                    { time: currentTime, value, parameter: `effects.${effect}` },
                  ],
                }
              : c
          )
        );
      }
    }

    setChannels(prevChannels =>
      prevChannels.map(c =>
        c.id === channelId
          ? { ...c, effects: { ...c.effects, [effect]: value } }
          : c
      )
    );
    playSound('effect');
  };

  const handleMuteToggle = (channelId: string) => {
    setChannels(prevChannels =>
      prevChannels.map(c =>
        c.id === channelId ? { ...c, isMuted: !c.isMuted } : c
      )
    );
    playSound('mute');
  };

  const handleSoloToggle = (channelId: string) => {
    setChannels(prevChannels =>
      prevChannels.map(c =>
        c.id === channelId ? { ...c, isSolo: !c.isSolo } : c
      )
    );
    playSound('solo');
  };

  const handleBusRouting = (channelId: string, busId: string) => {
    setChannels(prevChannels =>
      prevChannels.map(c =>
        c.id === channelId ? { ...c, bus: busId } : c
      )
    );

    setBuses(prevBuses =>
      prevBuses.map(bus => ({
        ...bus,
        channels: bus.id === busId
          ? [...bus.channels, channelId]
          : bus.channels.filter(id => id !== channelId),
      }))
    );
    playSound('route');
  };

  const handleAutomationToggle = (channelId: string) => {
    setChannels(prevChannels =>
      prevChannels.map(c =>
        c.id === channelId
          ? { ...c, isAutomationEnabled: !c.isAutomationEnabled }
          : c
      )
    );
    playSound('automation');
  };

  const handleAutomationRecord = () => {
    setIsAutomationRecording(!isAutomationRecording);
    playSound('record');
  };

  const handleBusFaderAdjust = (busId: string, value: number) => {
    setBuses(prevBuses =>
      prevBuses.map(bus =>
        bus.id === busId ? { ...bus, fader: value } : bus
      )
    );
    playSound('fader');
  };

  const handleBusEffectsAdjust = (busId: string, effect: string, value: number) => {
    setBuses(prevBuses =>
      prevBuses.map(bus =>
        bus.id === busId
          ? { ...bus, effects: { ...bus.effects, [effect]: value } }
          : bus
      )
    );
    playSound('effect');
  };

  const calculateScore = () => {
    let totalScore = 0;
    let maxScore = 0;

    channels.forEach(channel => {
      const target = targetMix[channel.id];
      if (!target) return;

      // Volume balance
      const volumeDiff = Math.abs(channel.fader - target.fader);
      totalScore += 1 - volumeDiff;
      maxScore += 1;

      // Panning
      const panDiff = Math.abs(channel.pan - target.pan);
      totalScore += 1 - panDiff;
      maxScore += 1;

      // EQ
      Object.keys(channel.eq).forEach(band => {
        const eqDiff = Math.abs(channel.eq[band as keyof typeof channel.eq] - target.eq[band as keyof typeof target.eq]);
        totalScore += 1 - eqDiff / 24;
        maxScore += 1;
      });

      // Effects
      Object.keys(channel.effects).forEach(effect => {
        const effectDiff = Math.abs(
          channel.effects[effect as keyof typeof channel.effects] -
          target.effects[effect as keyof typeof target.effects]
        );
        totalScore += 1 - effectDiff;
        maxScore += 1;
      });

      // Bus routing
      if (channel.bus === target.bus) {
        totalScore += 1;
        maxScore += 1;
      }
    });

    return Math.round((totalScore / maxScore) * 100);
  };

  const handleComplete = () => {
    setIsPlaying(false);
    const finalScore = calculateScore();
    setScore(finalScore);
    onComplete(finalScore);
  };

  return (
    <BaseMinigame
      type="digital_mixing"
      difficulty={difficulty}
      onComplete={handleComplete}
      onFail={onFail}
      onClose={onClose}
    >
      {!isPlaying ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStart}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg"
        >
          Start Mixing
        </motion.button>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold">
              Time Remaining: {timeRemaining}s
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAutomationRecord}
                className={`px-3 py-1 rounded ${
                  isAutomationRecording
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                {isAutomationRecording ? 'Stop Recording' : 'Record Automation'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Channels</h3>
              {channels.map(channel => (
                <div
                  key={channel.id}
                  className={`p-4 rounded-lg border ${
                    selectedChannel === channel.id
                      ? 'border-primary'
                      : 'border-border'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{channel.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMuteToggle(channel.id)}
                        className={`w-8 h-8 rounded ${
                          channel.isMuted
                            ? 'bg-destructive text-destructive-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        M
                      </button>
                      <button
                        onClick={() => handleSoloToggle(channel.id)}
                        className={`w-8 h-8 rounded ${
                          channel.isSolo
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        S
                      </button>
                      <button
                        onClick={() => handleAutomationToggle(channel.id)}
                        className={`w-8 h-8 rounded ${
                          channel.isAutomationEnabled
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        A
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
                        onChange={e => handleFaderAdjust(channel.id, parseFloat(e.target.value))}
                        disabled={channel.isMuted}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-sm">Pan</label>
                      <input
                        type="range"
                        min="-1"
                        max="1"
                        step="0.01"
                        value={channel.pan}
                        onChange={e => handlePanAdjust(channel.id, parseFloat(e.target.value))}
                        disabled={channel.isMuted}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-sm">EQ</label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs">Low</label>
                          <input
                            type="range"
                            min="-12"
                            max="12"
                            step="0.1"
                            value={channel.eq.low}
                            onChange={e => handleEQAdjust(channel.id, 'low', parseFloat(e.target.value))}
                            disabled={channel.isMuted}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs">Mid</label>
                          <input
                            type="range"
                            min="-12"
                            max="12"
                            step="0.1"
                            value={channel.eq.mid}
                            onChange={e => handleEQAdjust(channel.id, 'mid', parseFloat(e.target.value))}
                            disabled={channel.isMuted}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs">High</label>
                          <input
                            type="range"
                            min="-12"
                            max="12"
                            step="0.1"
                            value={channel.eq.high}
                            onChange={e => handleEQAdjust(channel.id, 'high', parseFloat(e.target.value))}
                            disabled={channel.isMuted}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm">Effects</label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs">Reverb</label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={channel.effects.reverb}
                            onChange={e => handleEffectsAdjust(channel.id, 'reverb', parseFloat(e.target.value))}
                            disabled={channel.isMuted}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs">Delay</label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={channel.effects.delay}
                            onChange={e => handleEffectsAdjust(channel.id, 'delay', parseFloat(e.target.value))}
                            disabled={channel.isMuted}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs">Comp</label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={channel.effects.compression}
                            onChange={e => handleEffectsAdjust(channel.id, 'compression', parseFloat(e.target.value))}
                            disabled={channel.isMuted}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm">Bus</label>
                      <select
                        value={channel.bus}
                        onChange={e => handleBusRouting(channel.id, e.target.value)}
                        disabled={channel.isMuted}
                        className="w-full p-1 rounded"
                      >
                        {buses.map(bus => (
                          <option key={bus.id} value={bus.id}>
                            {bus.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="h-2 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-100"
                        style={{ width: `${channel.vuLevel * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Buses</h3>
              {buses.map(bus => (
                <div
                  key={bus.id}
                  className={`p-4 rounded-lg border ${
                    selectedBus === bus.id
                      ? 'border-primary'
                      : 'border-border'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{bus.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {bus.channels.length} channels
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-sm">Fader</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={bus.fader}
                        onChange={e => handleBusFaderAdjust(bus.id, parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-sm">Effects</label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs">Reverb</label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={bus.effects.reverb}
                            onChange={e => handleBusEffectsAdjust(bus.id, 'reverb', parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs">Delay</label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={bus.effects.delay}
                            onChange={e => handleBusEffectsAdjust(bus.id, 'delay', parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs">Comp</label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={bus.effects.compression}
                            onChange={e => handleBusEffectsAdjust(bus.id, 'compression', parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="h-2 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-100"
                        style={{ width: `${bus.vuLevel * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </BaseMinigame>
  );
};
