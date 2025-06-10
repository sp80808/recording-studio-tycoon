import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface Era {
  id: string;
  name: string;
  displayName: string;
  startYear: number;
  description: string;
  funnyDescription: string;
  startingMoney: number;
  equipmentMultiplier: number;
  availableGenres: string[];
  marketTrends: string[];
  icon: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Legendary';
}

const AVAILABLE_ERAS: Era[] = [
  {
    id: 'modern',
    name: 'modern',
    displayName: 'Modern Era',
    startYear: 2024,
    description: 'Start in the current music industry with all modern equipment and streaming services.',
    funnyDescription: 'Auto-tune? Check. Social media drama? Double check. Actual musical talent? Optional!',
    startingMoney: 50000,
    equipmentMultiplier: 1.0,
    availableGenres: ['Pop', 'Hip-Hop', 'Electronic', 'Rock', 'Indie', 'R&B', 'Country', 'Jazz', 'Classical'],
    marketTrends: ['Streaming dominance', 'Social media influence', 'Bedroom pop revival'],
    icon: '📱',
    difficulty: 'Easy'
  },
  {
    id: 'digital_age',
    name: 'digital_age',
    displayName: 'Digital Revolution',
    startYear: 2000,
    description: 'Experience the dawn of digital music, file sharing chaos, and the iPod revolution.',
    funnyDescription: 'When Napster made record executives cry and everyone had 10,000 songs they never listened to.',
    startingMoney: 35000,
    equipmentMultiplier: 0.8,
    availableGenres: ['Pop', 'Hip-Hop', 'Rock', 'Electronic', 'Nu-Metal', 'Emo', 'R&B'],
    marketTrends: ['Digital piracy panic', 'CD sales declining', 'Auto-tune emergence'],
    icon: '💿',
    difficulty: 'Medium'
  },
  {
    id: 'golden_age',
    name: 'golden_age',
    displayName: 'Golden Age',
    startYear: 1980,
    description: 'The MTV era! Big hair, bigger synthesizers, and the birth of music videos.',
    funnyDescription: 'When musicians looked like they raided a glam rock costume shop and sounded amazing doing it.',
    startingMoney: 25000,
    equipmentMultiplier: 0.6,
    availableGenres: ['Rock', 'Pop', 'New Wave', 'Hip-Hop', 'Metal', 'Punk', 'R&B'],
    marketTrends: ['MTV launches', 'Synthesizer boom', 'Cassette tape dominance'],
    icon: '📺',
    difficulty: 'Hard'
  },
  {
    id: 'classic_rock',
    name: 'classic_rock',
    displayName: 'Rock Revolution',
    startYear: 1960,
    description: 'Start from the very beginning! Witness the birth of rock, soul, and studio innovation.',
    funnyDescription: 'When "experimental" meant playing your guitar really loud and studio effects were basically magic.',
    startingMoney: 15000,
    equipmentMultiplier: 0.3,
    availableGenres: ['Rock', 'Pop', 'Soul', 'Folk', 'Jazz', 'Blues'],
    marketTrends: ['Stereo recording new', 'Multi-track emerging', 'Radio AM dominance'],
    icon: '🎸',
    difficulty: 'Legendary'
  }
];

interface EraSelectionModalProps {
  isOpen: boolean;
  onSelectEra: (era: Era) => void;
  onClose: () => void;
}

export const EraSelectionModal: React.FC<EraSelectionModalProps> = ({
  isOpen,
  onSelectEra,
  onClose
}) => {
  const [selectedEra, setSelectedEra] = useState<Era | null>(null);

  if (!isOpen) return null;

  const getDifficultyColor = (difficulty: Era['difficulty']) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Hard': return 'bg-orange-500';
      case 'Legendary': return 'bg-red-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <Card className="bg-gray-900 border-gray-600 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">🎵 Recording Studio Tycoon 🎵</h1>
          <h2 className="text-xl text-gray-300 mb-4">Choose Your Musical Journey</h2>
          <p className="text-gray-400 text-sm">
            Each era offers unique challenges, equipment, and musical trends. 
            Will you conquer the modern streaming wars or master the analog classics?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {AVAILABLE_ERAS.map((era) => (
            <Card
              key={era.id}
              className={`p-4 cursor-pointer transition-all duration-200 ${
                selectedEra?.id === era.id
                  ? 'bg-blue-900/50 border-blue-500 ring-2 ring-blue-400'
                  : 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
              }`}
              onClick={() => setSelectedEra(era)}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{era.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-white">{era.displayName}</h3>
                    <Badge className={`text-xs ${getDifficultyColor(era.difficulty)} text-white`}>
                      {era.difficulty}
                    </Badge>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{era.startYear}s</p>
                  <p className="text-gray-400 text-sm mb-3">{era.description}</p>
                  <p className="text-yellow-400 text-xs italic mb-3">"{era.funnyDescription}"</p>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">💰</span>
                      <span className="text-gray-300">Starting Budget: ${era.startingMoney.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400">🎛️</span>
                      <span className="text-gray-300">Equipment Costs: {Math.round(era.equipmentMultiplier * 100)}% of modern</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {era.availableGenres.slice(0, 4).map((genre) => (
                        <Badge key={genre} variant="outline" className="text-xs text-gray-400 border-gray-600">
                          {genre}
                        </Badge>
                      ))}
                      {era.availableGenres.length > 4 && (
                        <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                          +{era.availableGenres.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {selectedEra && (
          <Card className="bg-gray-800 border-gray-600 p-4 mb-6">
            <h3 className="text-lg font-bold text-white mb-3">Era Preview: {selectedEra.displayName}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="text-yellow-400 font-semibold mb-2">Available Genres:</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedEra.availableGenres.map((genre) => (
                    <Badge key={genre} variant="outline" className="text-xs text-gray-300 border-gray-500">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-blue-400 font-semibold mb-2">Market Trends:</h4>
                <ul className="text-gray-300 space-y-1">
                  {selectedEra.marketTrends.map((trend, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-xs">📈</span>
                      {trend}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        <div className="flex justify-center gap-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={() => selectedEra && onSelectEra(selectedEra)}
            disabled={!selectedEra}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedEra ? `Start in ${selectedEra.displayName}` : 'Select an Era'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export { AVAILABLE_ERAS };
