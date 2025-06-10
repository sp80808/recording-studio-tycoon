import React, { useState, useEffect } from 'react';
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
import { ComplexWaveformVisualizer } from './ComplexWaveformVisualizer';
import { WaveformLayer, WaveformType } from '@/types/miniGame';
import { v4 as uuidv4 } from 'uuid';

export interface TargetSound {
  id: string;
  name: string;
  description: string;
  complexity: number;
  layers: WaveformLayer[];
}

export const TARGET_SOUNDS: TargetSound[] = [
  {
    id: 'warm-pad',
    name: 'Warm Pad',
    description: 'A rich, warm pad sound with multiple sine waves',
    complexity: 2,
    layers: [
      {
        id: 'base',
        type: 'sine',
        frequency: 1,
        amplitude: 0.8,
        phase: 0,
        enabled: true,
      },
      {
        id: 'harmony',
        type: 'sine',
        frequency: 2,
        amplitude: 0.4,
        phase: Math.PI / 4,
        enabled: true,
      },
    ],
  },
  {
    id: 'bass-growl',
    name: 'Bass Growl',
    description: 'A deep, growling bass sound using square waves',
    complexity: 3,
    layers: [
      {
        id: 'fundamental',
        type: 'square',
        frequency: 0.5,
        amplitude: 1,
        phase: 0,
        enabled: true,
      },
      {
        id: 'growl',
        type: 'square',
        frequency: 1.5,
        amplitude: 0.6,
        phase: Math.PI / 2,
        enabled: true,
      },
      {
        id: 'texture',
        type: 'triangle',
        frequency: 2,
        amplitude: 0.3,
        phase: Math.PI,
        enabled: true,
      },
    ],
  },
  {
    id: 'pluck-sound',
    name: 'Pluck Sound',
    description: 'A bright, plucky sound with quick decay',
    complexity: 2,
    layers: [
      {
        id: 'attack',
        type: 'triangle',
        frequency: 2,
        amplitude: 1,
        phase: 0,
        enabled: true,
      },
      {
        id: 'body',
        type: 'sine',
        frequency: 1,
        amplitude: 0.7,
        phase: Math.PI / 2,
        enabled: true,
      },
    ],
  },
];

export const WaveformSculpting: React.FC = () => {
  const [selectedSound, setSelectedSound] = useState<TargetSound>(TARGET_SOUNDS[0]);
  const [layers, setLayers] = useState<WaveformLayer[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [accuracy, setAccuracy] = useState(0);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  const startGame = () => {
    setLayers([]);
    setScore(0);
    setTimeLeft(180);
    setAccuracy(0);
    setSelectedLayer(null);
    setIsPlaying(true);
  };

  const endGame = () => {
    setIsPlaying(false);
    // TODO: Implement game end logic with rewards
  };

  const addLayer = (type: WaveformType) => {
    const newLayer: WaveformLayer = {
      id: uuidv4(),
      type,
      frequency: 1,
      amplitude: 0.5,
      phase: 0,
      enabled: true,
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayer(newLayer.id);
  };

  const removeLayer = (id: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== id));
    if (selectedLayer === id) {
      setSelectedLayer(null);
    }
  };

  const updateLayer = (id: string, updates: Partial<WaveformLayer>) => {
    setLayers(prev =>
      prev.map(layer =>
        layer.id === id ? { ...layer, ...updates } : layer
      )
    );
  };

  const handleAccuracyUpdate = (newAccuracy: number) => {
    setAccuracy(newAccuracy);
    if (newAccuracy >= 90) {
      setScore(prev => prev + 10);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Waveform Sculpting</h2>
        <div className="space-x-2">
          <span>Time: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
          <span>Score: {score}</span>
          <span>Accuracy: {Math.round(accuracy)}%</span>
        </div>
      </div>

      <div className="flex space-x-4">
        <div className="w-1/3">
          <Select value={selectedSound.id} onValueChange={(value) => 
            setSelectedSound(TARGET_SOUNDS.find(s => s.id === value)!)
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select a sound" />
            </SelectTrigger>
            <SelectContent>
              {TARGET_SOUNDS.map(sound => (
                <SelectItem key={sound.id} value={sound.id}>
                  {sound.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-2 text-sm text-gray-600">{selectedSound.description}</p>
        </div>
        <div className="w-2/3">
          <ComplexWaveformVisualizer
            layers={layers}
            targetLayers={selectedSound.layers}
            width={600}
            height={200}
            showTarget={true}
            onMatch={handleAccuracyUpdate}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={() => addLayer('sine')}>Add Sine</Button>
            <Button onClick={() => addLayer('square')}>Add Square</Button>
            <Button onClick={() => addLayer('triangle')}>Add Triangle</Button>
          </div>

          {layers.map(layer => (
            <div
              key={layer.id}
              className={`p-2 border rounded ${
                selectedLayer === layer.id ? 'border-blue-500' : 'border-gray-200'
              }`}
              onClick={() => setSelectedLayer(layer.id)}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{layer.type}</span>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={layer.enabled}
                    onCheckedChange={(checked) => 
                      updateLayer(layer.id, { enabled: checked })
                    }
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLayer(layer.id);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>

              {selectedLayer === layer.id && (
                <div className="mt-2 space-y-2">
                  <div>
                    <label className="block text-sm">Frequency</label>
                    <Slider
                      value={[layer.frequency]}
                      min={0.1}
                      max={5}
                      step={0.1}
                      onValueChange={([value]) => 
                        updateLayer(layer.id, { frequency: value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Amplitude</label>
                    <Slider
                      value={[layer.amplitude]}
                      min={0}
                      max={1}
                      step={0.1}
                      onValueChange={([value]) => 
                        updateLayer(layer.id, { amplitude: value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Phase</label>
                    <Slider
                      value={[layer.phase]}
                      min={0}
                      max={Math.PI * 2}
                      step={0.1}
                      onValueChange={([value]) => 
                        updateLayer(layer.id, { phase: value })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Target Sound Layers</h3>
          {selectedSound.layers.map(layer => (
            <div key={layer.id} className="p-2 border border-gray-200 rounded">
              <div className="flex justify-between items-center">
                <span className="font-medium">{layer.type}</span>
                <div className="text-sm text-gray-600">
                  f: {layer.frequency.toFixed(1)} a: {layer.amplitude.toFixed(1)} p: {layer.phase.toFixed(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
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