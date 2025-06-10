import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { EQBand, TargetEQ, EQMatchResult } from '@/types/miniGame';
import { v4 as uuidv4 } from 'uuid';
import { EQVisualizer } from './EQVisualizer';
import { useTutorial } from '@/contexts/TutorialContext';
import { eqMatchingTutorial } from '@/data/tutorials/eqMatchingTutorial';

const TARGET_EQS: TargetEQ[] = [
  {
    id: 'vocal-presence',
    name: 'Vocal Presence',
    description: 'Enhance vocal clarity and presence in the mix',
    complexity: 2,
    audioSample: '/audio/samples/vocal-dry.mp3',
    bands: [
      {
        id: 'presence',
        frequency: 3000,
        gain: 3,
        q: 1.5,
        type: 'peak',
        enabled: true,
      },
      {
        id: 'body',
        frequency: 200,
        gain: 2,
        q: 1,
        type: 'peak',
        enabled: true,
      },
    ],
  },
  {
    id: 'kick-punch',
    name: 'Kick Punch',
    description: 'Add punch and clarity to the kick drum',
    complexity: 3,
    audioSample: '/audio/samples/kick-dry.mp3',
    bands: [
      {
        id: 'punch',
        frequency: 60,
        gain: 4,
        q: 2,
        type: 'peak',
        enabled: true,
      },
      {
        id: 'click',
        frequency: 4000,
        gain: 2,
        q: 1.5,
        type: 'peak',
        enabled: true,
      },
      {
        id: 'mud',
        frequency: 250,
        gain: -3,
        q: 1,
        type: 'peak',
        enabled: true,
      },
    ],
  },
  {
    id: 'guitar-shine',
    name: 'Guitar Shine',
    description: 'Add sparkle and cut through the mix',
    complexity: 3,
    audioSample: '/audio/samples/guitar-dry.mp3',
    bands: [
      {
        id: 'sparkle',
        frequency: 8000,
        gain: 3,
        q: 1,
        type: 'highShelf',
        enabled: true,
      },
      {
        id: 'mids',
        frequency: 2000,
        gain: 2,
        q: 1.5,
        type: 'peak',
        enabled: true,
      },
      {
        id: 'mud',
        frequency: 300,
        gain: -2,
        q: 1,
        type: 'peak',
        enabled: true,
      },
    ],
  },
];

export const EQMatching: React.FC = () => {
  const [selectedEQ, setSelectedEQ] = useState<TargetEQ>(TARGET_EQS[0]);
  const [bands, setBands] = useState<EQBand[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [accuracy, setAccuracy] = useState(0);
  const [selectedBand, setSelectedBand] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodesRef = useRef<BiquadFilterNode[]>([]);
  const { startTutorial, isTutorialCompleted } = useTutorial();

  useEffect(() => {
    if (!isTutorialCompleted('eq-matching')) {
      startTutorial(eqMatchingTutorial);
    }
  }, [startTutorial, isTutorialCompleted]);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying]);

  useEffect(() => {
    // Initialize audio context
    audioContextRef.current = new AudioContext();
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.connect(audioContextRef.current.destination);

    return () => {
      // Cleanup audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const loadAudioSample = async (url: string) => {
    if (!audioContextRef.current) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

      // Create source node
      sourceNodeRef.current = audioContextRef.current.createBufferSource();
      sourceNodeRef.current.buffer = audioBuffer;
      sourceNodeRef.current.loop = true;

      // Connect nodes
      sourceNodeRef.current.connect(gainNodeRef.current!);
      gainNodeRef.current!.connect(audioContextRef.current.destination);
    } catch (error) {
      console.error('Error loading audio sample:', error);
    }
  };

  const updateFilters = () => {
    if (!audioContextRef.current || !sourceNodeRef.current) return;

    // Remove old filter nodes
    filterNodesRef.current.forEach(node => node.disconnect());
    filterNodesRef.current = [];

    // Create new filter nodes for each band
    bands.forEach(band => {
      if (!band.enabled) return;

      const filter = audioContextRef.current!.createBiquadFilter();
      filter.type = band.type === 'peak' ? 'peaking' :
                   band.type === 'notch' ? 'notch' :
                   band.type === 'lowShelf' ? 'lowshelf' : 'highshelf';
      filter.frequency.value = band.frequency;
      filter.gain.value = band.gain;
      filter.Q.value = band.q;

      filterNodesRef.current.push(filter);
    });

    // Connect filters in series
    if (filterNodesRef.current.length > 0) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current.connect(filterNodesRef.current[0]);
      filterNodesRef.current.forEach((filter, index) => {
        if (index < filterNodesRef.current.length - 1) {
          filter.connect(filterNodesRef.current[index + 1]);
        } else {
          filter.connect(gainNodeRef.current!);
        }
      });
    } else {
      sourceNodeRef.current.connect(gainNodeRef.current!);
    }
  };

  useEffect(() => {
    if (selectedEQ?.audioSample) {
      loadAudioSample(selectedEQ.audioSample);
    }
  }, [selectedEQ]);

  useEffect(() => {
    updateFilters();
  }, [bands]);

  const startGame = () => {
    setBands([]);
    setScore(0);
    setTimeLeft(180);
    setAccuracy(0);
    setSelectedBand(null);
    setIsPlaying(true);
  };

  const endGame = () => {
    setIsPlaying(false);
    // TODO: Implement game end logic with rewards
  };

  const addBand = (type: EQBand['type']) => {
    const newBand: EQBand = {
      id: uuidv4(),
      type,
      frequency: type === 'lowShelf' ? 100 : type === 'highShelf' ? 8000 : 1000,
      gain: 0,
      q: 1,
      enabled: true,
    };
    setBands(prev => [...prev, newBand]);
    setSelectedBand(newBand.id);
  };

  const removeBand = (id: string) => {
    setBands(prev => prev.filter(band => band.id !== id));
    if (selectedBand === id) {
      setSelectedBand(null);
    }
  };

  const updateBand = (id: string, updates: Partial<EQBand>) => {
    setBands(prev =>
      prev.map(band =>
        band.id === id ? { ...band, ...updates } : band
      )
    );
  };

  const calculateAccuracy = (): EQMatchResult => {
    let totalAccuracy = 0;
    let validBands = 0;
    const bandMatches: EQMatchResult['bandMatches'] = {};

    selectedEQ.bands.forEach(targetBand => {
      const matchingBand = bands.find(
        band => band.type === targetBand.type && band.enabled
      );

      if (matchingBand) {
        const frequencyAccuracy = Math.max(
          0,
          100 - Math.abs(Math.log2(matchingBand.frequency / targetBand.frequency)) * 20
        );
        const gainAccuracy = Math.max(
          0,
          100 - Math.abs(matchingBand.gain - targetBand.gain) * 10
        );
        const qAccuracy = Math.max(
          0,
          100 - Math.abs(matchingBand.q - targetBand.q) * 20
        );

        bandMatches[matchingBand.id] = {
          frequencyAccuracy,
          gainAccuracy,
          qAccuracy,
        };

        totalAccuracy += (frequencyAccuracy + gainAccuracy + qAccuracy) / 3;
        validBands++;
      }
    });

    const finalAccuracy = validBands > 0 ? totalAccuracy / validBands : 0;
    setAccuracy(finalAccuracy);

    if (finalAccuracy >= 90) {
      setScore(prev => prev + 10);
    }

    return {
      accuracy: finalAccuracy,
      bandMatches,
    };
  };

  useEffect(() => {
    calculateAccuracy();
  }, [bands]);

  const togglePlayback = () => {
    if (!audioContextRef.current || !sourceNodeRef.current) return;

    if (isPlaying) {
      sourceNodeRef.current.stop();
      const buffer = sourceNodeRef.current.buffer;
      sourceNodeRef.current = audioContextRef.current.createBufferSource();
      sourceNodeRef.current.buffer = buffer;
      sourceNodeRef.current.loop = true;
      sourceNodeRef.current.connect(filterNodesRef.current[0] || gainNodeRef.current!);
    } else {
      sourceNodeRef.current.start();
    }

    setIsPlaying(!isPlaying);
  };

  return (
    <div className="p-4 space-y-4 eq-matching-container">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">EQ Matching</h2>
        <div className="flex items-center space-x-4">
          <Button
            onClick={togglePlayback}
            variant={isPlaying ? "destructive" : "default"}
            className="playback-button"
          >
            {isPlaying ? "Stop" : "Play"}
          </Button>
          <div className="flex items-center space-x-2">
            <span>Time: {timeLeft}s</span>
            <span>Score: {score}</span>
            <span className="accuracy-display">Accuracy: {accuracy.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <div className="w-1/3">
          <Select
            value={selectedEQ?.id}
            onValueChange={(value) => {
              const eq = TARGET_EQS.find(eq => eq.id === value);
              if (eq) {
                setSelectedEQ(eq);
                setBands([]);
              }
            }}
          >
            <SelectTrigger className="target-select">
              <SelectValue placeholder="Select a target" />
            </SelectTrigger>
            <SelectContent>
              {TARGET_EQS.map(eq => (
                <SelectItem key={eq.id} value={eq.id}>
                  {eq.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedEQ && (
            <p className="mt-2 text-sm text-gray-600">{selectedEQ.description}</p>
          )}
        </div>
        <div className="w-2/3">
          <div className="mb-4">
            <Button
              onClick={() => {
                const newBand: EQBand = {
                  id: Date.now().toString(),
                  frequency: 1000,
                  gain: 0,
                  q: 1,
                  type: 'peak',
                  enabled: true,
                };
                setBands([...bands, newBand]);
              }}
              className="add-band-button"
            >
              Add Band
            </Button>
          </div>
          <div className="space-y-4">
            {bands.map(band => (
              <div key={band.id} className="p-4 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={band.enabled}
                      onCheckedChange={(checked) => {
                        const newBands = bands.map(b =>
                          b.id === band.id ? { ...b, enabled: checked } : b
                        );
                        setBands(newBands);
                      }}
                    />
                    <Select
                      value={band.type}
                      onValueChange={(value) => {
                        const newBands = bands.map(b =>
                          b.id === band.id ? { ...b, type: value as EQBand['type'] } : b
                        );
                        setBands(newBands);
                      }}
                    >
                      <SelectTrigger className="band-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="peak">Peak</SelectItem>
                        <SelectItem value="notch">Notch</SelectItem>
                        <SelectItem value="lowShelf">Low Shelf</SelectItem>
                        <SelectItem value="highShelf">High Shelf</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setBands(bands.filter(b => b.id !== band.id));
                    }}
                  >
                    Remove
                  </Button>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Frequency (Hz)
                    </label>
                    <Slider
                      value={[band.frequency]}
                      min={20}
                      max={20000}
                      step={1}
                      onValueChange={(value) => {
                        const newBands = bands.map(b =>
                          b.id === band.id ? { ...b, frequency: value[0] } : b
                        );
                        setBands(newBands);
                      }}
                      className="frequency-slider"
                    />
                    <span className="text-sm text-gray-500">{band.frequency} Hz</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Gain (dB)
                    </label>
                    <Slider
                      value={[band.gain]}
                      min={-12}
                      max={12}
                      step={0.1}
                      onValueChange={(value) => {
                        const newBands = bands.map(b =>
                          b.id === band.id ? { ...b, gain: value[0] } : b
                        );
                        setBands(newBands);
                      }}
                      className="gain-slider"
                    />
                    <span className="text-sm text-gray-500">{band.gain} dB</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Q
                    </label>
                    <Slider
                      value={[band.q]}
                      min={0.1}
                      max={10}
                      step={0.1}
                      onValueChange={(value) => {
                        const newBands = bands.map(b =>
                          b.id === band.id ? { ...b, q: value[0] } : b
                        );
                        setBands(newBands);
                      }}
                      className="q-slider"
                    />
                    <span className="text-sm text-gray-500">{band.q}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <EQVisualizer
          bands={bands}
          width={800}
          height={300}
          showTarget={true}
          targetBands={selectedEQ?.bands || []}
          className="eq-visualizer"
        />
      </div>

      <div className="flex justify-end space-x-2">
        {!isPlaying ? (
          <Button onClick={startGame}>Start Game</Button>
        ) : (
          <Button variant="destructive" onClick={endGame}>
            End Game
          </Button>
        )}
      </div>
    </div>
  );
}; 