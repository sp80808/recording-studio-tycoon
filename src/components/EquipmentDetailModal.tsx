import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EraAvailableEquipment } from '@/data/eraEquipment';
import { GameState } from '@/types/game';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Volume2, Zap, Clock, Target, TrendingUp, Info } from 'lucide-react';

interface EquipmentDetailModalProps {
  equipment: EraAvailableEquipment | null;
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (equipmentId: string) => void;
  gameState: GameState;
  adjustedPrice: number;
  canAfford: boolean;
}

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onPurchase,
  gameState,
  adjustedPrice,
  canAfford
}) => {
  if (!equipment) return null;

  // Generate frequency response data based on equipment type
  const generateFrequencyResponse = (equipment: EraAvailableEquipment) => {
    const baseFreqs = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    
    switch (equipment.category) {
      case 'microphone':
        return baseFreqs.map(freq => ({
          frequency: freq,
          response: freq < 100 ? -3 + Math.random() * 2 : 
                   freq < 1000 ? Math.random() * 4 - 2 :
                   freq < 8000 ? 2 + Math.random() * 3 :
                   -1 + Math.random() * 2
        }));
      case 'monitor':
        return baseFreqs.map(freq => ({
          frequency: freq,
          response: freq < 50 ? -6 + Math.random() * 2 :
                   freq < 20000 ? Math.random() * 2 - 1 :
                   -3 + Math.random() * 2
        }));
      case 'outboard':
        return baseFreqs.map(freq => ({
          frequency: freq,
          response: Math.random() * 6 - 3
        }));
      default:
        return baseFreqs.map(freq => ({
          frequency: freq,
          response: Math.random() * 4 - 2
        }));
    }
  };

  // Generate harmonic distortion data
  const generateHarmonics = (equipment: EraAvailableEquipment) => {
    const harmonics = ['1st', '2nd', '3rd', '4th', '5th'];
    return harmonics.map((harmonic, index) => ({
      harmonic,
      level: equipment.isVintage ? 
        (0.1 + Math.random() * 0.4) * Math.pow(0.5, index) :
        (0.05 + Math.random() * 0.15) * Math.pow(0.3, index)
    }));
  };

  // Generate dynamic range visualization
  const generateDynamicRange = (equipment: EraAvailableEquipment) => {
    const levels = Array.from({ length: 20 }, (_, i) => {
      const time = i / 2;
      return {
        time,
        input: -20 + Math.sin(time * 2) * 15,
        output: equipment.category === 'outboard' ? 
          -20 + Math.sin(time * 2) * 10 : // Compression effect
          -20 + Math.sin(time * 2) * 15   // Clean
      };
    });
    return levels;
  };

  const frequencyData = generateFrequencyResponse(equipment);
  const harmonicsData = generateHarmonics(equipment);
  const dynamicData = generateDynamicRange(equipment);

  const getEquipmentSpecs = (equipment: EraAvailableEquipment) => {
    const specs = [];
    
    if (equipment.category === 'microphone') {
      specs.push(
        { label: 'Type', value: equipment.isVintage ? 'Tube/Ribbon' : 'Condenser' },
        { label: 'Frequency Range', value: '20Hz - 20kHz' },
        { label: 'Sensitivity', value: '-37 dBV/Pa' },
        { label: 'Max SPL', value: equipment.isVintage ? '125 dB' : '140 dB' }
      );
    } else if (equipment.category === 'monitor') {
      specs.push(
        { label: 'Driver Size', value: '8"' },
        { label: 'Power', value: '100W' },
        { label: 'Frequency Range', value: '45Hz - 20kHz' },
        { label: 'Max SPL', value: '110 dB' }
      );
    } else if (equipment.category === 'outboard') {
      specs.push(
        { label: 'Type', value: equipment.isVintage ? 'Analog' : 'Digital' },
        { label: 'THD+N', value: equipment.isVintage ? '0.05%' : '0.001%' },
        { label: 'Dynamic Range', value: equipment.isVintage ? '96 dB' : '120 dB' },
        { label: 'Frequency Response', value: '20Hz - 20kHz ±0.5dB' }
      );
    } else if (equipment.category === 'instrument') {
      specs.push(
        { label: 'Type', value: 'Electric' },
        { label: 'Pickup', value: equipment.isVintage ? 'Single Coil' : 'Humbucker' },
        { label: 'Output', value: 'High' },
        { label: 'Weight', value: '3.2 kg' }
      );
    }
    
    return specs;
  };

  const specs = getEquipmentSpecs(equipment);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-600">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-white">
            <span className="text-2xl">{equipment.icon}</span>
            <div>
              <h2 className="text-xl font-bold">{equipment.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="capitalize">
                  {equipment.category}
                </Badge>
                {equipment.isVintage && (
                  <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600">
                    VINTAGE
                  </Badge>
                )}
                {equipment.availableFrom && (
                  <Badge variant="outline" className="text-xs">
                    {equipment.availableFrom}
                  </Badge>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Description & Specs */}
          <div className="space-y-4">
            <Card className="p-4 bg-gray-800/50 border-gray-600">
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Description
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {equipment.eraDescription || equipment.description}
              </p>
            </Card>

            <Card className="p-4 bg-gray-800/50 border-gray-600">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Technical Specifications
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {specs.map((spec, index) => (
                  <div key={index} className="flex justify-between py-1">
                    <span className="text-gray-400">{spec.label}:</span>
                    <span className="text-white font-medium">{spec.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Game Stats */}
            <Card className="p-4 bg-gray-800/50 border-gray-600">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Game Bonuses
              </h3>
              <div className="space-y-2 text-sm">
                {equipment.bonuses.qualityBonus && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Quality Bonus:</span>
                    <span className="text-green-400">+{equipment.bonuses.qualityBonus}</span>
                  </div>
                )}
                {equipment.bonuses.technicalBonus && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Technical Bonus:</span>
                    <span className="text-blue-400">+{equipment.bonuses.technicalBonus}</span>
                  </div>
                )}
                {equipment.bonuses.creativityBonus && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Creativity Bonus:</span>
                    <span className={equipment.bonuses.creativityBonus > 0 ? 'text-purple-400' : 'text-red-400'}>
                      {equipment.bonuses.creativityBonus > 0 ? '+' : ''}{equipment.bonuses.creativityBonus}
                    </span>
                  </div>
                )}
                {equipment.bonuses.speedBonus && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Speed Bonus:</span>
                    <span className="text-yellow-400">+{equipment.bonuses.speedBonus}</span>
                  </div>
                )}
                {equipment.bonuses.genreBonus && Object.keys(equipment.bonuses.genreBonus).length > 0 && (
                  <div>
                    <div className="text-gray-400 mb-1">Genre Bonuses:</div>
                    {Object.entries(equipment.bonuses.genreBonus).map(([genre, bonus]) => (
                      <div key={genre} className="flex justify-between ml-2">
                        <span className="text-gray-500 capitalize">{genre}:</span>
                        <span className="text-green-400">+{bonus}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Graphs & Visualizations */}
          <div className="space-y-4">
            {/* Frequency Response */}
            <Card className="p-4 bg-gray-800/50 border-gray-600">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Frequency Response
              </h3>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={frequencyData}>
                  <XAxis 
                    dataKey="frequency" 
                    scale="log" 
                    domain={[20, 20000]}
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                  />
                  <YAxis 
                    domain={[-6, 6]} 
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    label={{ value: 'dB', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="response" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-500 mt-1">Flat response = accurate reproduction</p>
            </Card>

            {/* Dynamic Range Visualization */}
            <Card className="p-4 bg-gray-800/50 border-gray-600">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Dynamic Response
              </h3>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={dynamicData}>
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                  />
                  <YAxis 
                    domain={[-40, 0]} 
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    label={{ value: 'dB', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
                  />
                  <Area
                    type="monotone"
                    dataKey="input"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="output"
                    stackId="2"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>🔴 Input</span>
                <span>🟢 Output</span>
              </div>
            </Card>

            {/* Harmonic Distortion */}
            <Card className="p-4 bg-gray-800/50 border-gray-600">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Harmonic Distortion
              </h3>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={harmonicsData}>
                  <XAxis 
                    dataKey="harmonic" 
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                  />
                  <YAxis 
                    domain={[0, 1]} 
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    label={{ value: '%', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9ca3af' } }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="level" 
                    stroke={equipment.isVintage ? "#f59e0b" : "#06b6d4"} 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-500 mt-1">
                {equipment.isVintage ? 'Vintage warmth & character' : 'Clean & transparent'}
              </p>
            </Card>
          </div>
        </div>

        {/* Purchase Section */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-600">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className={`font-bold text-lg ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                ${adjustedPrice.toLocaleString()}
              </div>
              {equipment.historicalPrice && equipment.isVintage && (
                <div className="text-xs text-yellow-400">
                  Originally ${equipment.historicalPrice.toLocaleString()}
                </div>
              )}
            </div>
            {equipment.skillRequirement && (
              <div className="text-xs text-blue-400">
                Requires {equipment.skillRequirement.skill} Level {equipment.skillRequirement.level}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={() => {
                onPurchase(equipment.id);
                onClose();
              }}
              disabled={!canAfford}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              Buy Equipment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
