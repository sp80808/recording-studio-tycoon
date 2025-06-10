
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { GameState } from '@/types/game';
import { Building2, Wrench, Star, TrendingUp, Zap, Settings, Upgrade } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StudioManagementProps {
  gameState: GameState;
  setGameState: (state: GameState | ((prev: GameState) => GameState)) => void;
  buyEquipment: (equipmentId: string) => void;
  upgradeStudio: (studioId: string) => void;
}

export const StudioManagement: React.FC<StudioManagementProps> = ({
  gameState,
  setGameState,
  buyEquipment,
  upgradeStudio
}) => {
  const [selectedRoom, setSelectedRoom] = useState<string>('control');
  const [activeUpgrade, setActiveUpgrade] = useState<string | null>(null);

  const studioRooms = [
    {
      id: 'control',
      name: 'Control Room',
      icon: '🎛️',
      color: 'from-blue-900/40 to-blue-800/40',
      borderColor: 'border-blue-600/30',
      description: 'Main mixing and monitoring space',
      equipment: gameState.ownedEquipment.filter(e => e.type === 'monitor' || e.type === 'interface'),
      capacity: 8,
      acousticRating: 85
    },
    {
      id: 'recording',
      name: 'Recording Booth',
      icon: '🎤',
      color: 'from-green-900/40 to-green-800/40',
      borderColor: 'border-green-600/30',
      description: 'Isolated vocal and instrument recording',
      equipment: gameState.ownedEquipment.filter(e => e.type === 'microphone'),
      capacity: 4,
      acousticRating: 92
    },
    {
      id: 'live',
      name: 'Live Room',
      icon: '🎸',
      color: 'from-purple-900/40 to-purple-800/40',
      borderColor: 'border-purple-600/30',
      description: 'Large space for bands and orchestras',
      equipment: gameState.ownedEquipment.filter(e => e.type === 'instrument'),
      capacity: 12,
      acousticRating: 78
    },
    {
      id: 'mastering',
      name: 'Mastering Suite',
      icon: '🎼',
      color: 'from-orange-900/40 to-orange-800/40',
      borderColor: 'border-orange-600/30',
      description: 'Precision mastering and final touches',
      equipment: gameState.ownedEquipment.filter(e => e.type === 'outboard'),
      capacity: 2,
      acousticRating: 95
    }
  ];

  const availableUpgrades = [
    {
      id: 'acoustic_treatment',
      name: 'Acoustic Treatment',
      description: 'Improve room acoustics with professional treatment',
      cost: 15000,
      duration: 5,
      effects: { acousticBonus: 15, creativityBonus: 10 },
      icon: '🔊'
    },
    {
      id: 'equipment_rack',
      name: 'Equipment Rack System',
      description: 'Organized equipment storage and management',
      cost: 8000,
      duration: 3,
      effects: { equipmentSlots: 4, efficiencyBonus: 8 },
      icon: '🗄️'
    },
    {
      id: 'climate_control',
      name: 'Climate Control',
      description: 'Maintain optimal temperature and humidity',
      cost: 12000,
      duration: 4,
      effects: { equipmentLongevity: 25, comfortBonus: 15 },
      icon: '❄️'
    },
    {
      id: 'power_conditioning',
      name: 'Power Conditioning',
      description: 'Clean, stable power for all equipment',
      cost: 6000,
      duration: 2,
      effects: { qualityBonus: 12, equipmentProtection: 30 },
      icon: '⚡'
    }
  ];

  const handleUpgrade = (upgradeId: string) => {
    const upgrade = availableUpgrades.find(u => u.id === upgradeId);
    if (upgrade && gameState.money >= upgrade.cost) {
      setGameState(prev => ({
        ...prev,
        money: prev.money - upgrade.cost,
        studioLevel: prev.studioLevel + 1
      }));
      setActiveUpgrade(upgradeId);
      
      // Simulate upgrade completion
      setTimeout(() => {
        setActiveUpgrade(null);
      }, 2000);
    }
  };

  const selectedRoomData = studioRooms.find(room => room.id === selectedRoom);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Building2 className="w-8 h-8 text-purple-400" />
          Studio Management
        </h1>
        <p className="text-gray-400">Design and upgrade your professional recording facility</p>
        <div className="h-1 w-32 mx-auto bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mt-4"></div>
      </div>

      {/* Studio Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 bg-gradient-to-br from-blue-900/60 to-blue-800/60 border-blue-600/50">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-white">{gameState.studioLevel}</div>
                <div className="text-sm text-blue-300">Studio Level</div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 bg-gradient-to-br from-green-900/60 to-green-800/60 border-green-600/50">
            <div className="flex items-center gap-3">
              <Wrench className="w-8 h-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">{gameState.ownedEquipment.length}</div>
                <div className="text-sm text-green-300">Equipment</div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 bg-gradient-to-br from-purple-900/60 to-purple-800/60 border-purple-600/50">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-white">95%</div>
                <div className="text-sm text-purple-300">Efficiency</div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 bg-gradient-to-br from-orange-900/60 to-orange-800/60 border-orange-600/50">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-orange-400" />
              <div>
                <div className="text-2xl font-bold text-white">{gameState.reputation}</div>
                <div className="text-sm text-orange-300">Prestige</div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Studio Layout */}
        <div className="xl:col-span-2">
          <Card className="p-6 bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-600/50">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-400" />
              Studio Layout
            </h2>
            
            {/* Room Selection */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {studioRooms.map((room, index) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Button
                    variant={selectedRoom === room.id ? "default" : "ghost"}
                    onClick={() => setSelectedRoom(room.id)}
                    className={`w-full h-20 p-4 ${
                      selectedRoom === room.id 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                        : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300'
                    } transition-all duration-200`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">{room.icon}</div>
                      <div className="text-sm font-medium">{room.name}</div>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Selected Room Details */}
            <AnimatePresence mode="wait">
              {selectedRoomData && (
                <motion.div
                  key={selectedRoom}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`p-6 rounded-lg bg-gradient-to-br ${selectedRoomData.color} border ${selectedRoomData.borderColor}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <span className="text-2xl">{selectedRoomData.icon}</span>
                      {selectedRoomData.name}
                    </h3>
                    <Badge variant="outline" className="text-white border-white/30">
                      Level {gameState.studioLevel}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-300 mb-4">{selectedRoomData.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Acoustic Rating</div>
                      <div className="flex items-center gap-2">
                        <Progress value={selectedRoomData.acousticRating} className="flex-1 h-2" />
                        <span className="text-sm font-medium text-white">{selectedRoomData.acousticRating}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Equipment Slots</div>
                      <div className="text-lg font-bold text-white">
                        {selectedRoomData.equipment.length} / {selectedRoomData.capacity}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Equipment</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedRoomData.equipment.length > 0 ? (
                        selectedRoomData.equipment.map((eq, index) => (
                          <Badge key={index} className="bg-white/10 text-white">
                            {eq.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">No equipment installed</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>

        {/* Upgrades Panel */}
        <div>
          <Card className="p-6 bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-600/50">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Settings className="w-6 h-6 text-green-400" />
              Upgrades
            </h2>
            
            <div className="space-y-3">
              {availableUpgrades.map((upgrade, index) => (
                <motion.div
                  key={upgrade.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`p-4 transition-all duration-200 ${
                    activeUpgrade === upgrade.id 
                      ? 'bg-gradient-to-r from-green-900/60 to-green-800/60 border-green-500/50' 
                      : 'bg-gray-800/60 border-gray-600/30 hover:bg-gray-700/60'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{upgrade.icon}</span>
                        <div>
                          <h4 className="font-semibold text-white">{upgrade.name}</h4>
                          <p className="text-xs text-gray-400">{upgrade.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-sm">
                        <span className="text-green-400 font-bold">${upgrade.cost.toLocaleString()}</span>
                        <span className="text-gray-400 ml-2">• {upgrade.duration} days</span>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleUpgrade(upgrade.id)}
                        disabled={gameState.money < upgrade.cost || activeUpgrade === upgrade.id}
                        className={`${
                          activeUpgrade === upgrade.id 
                            ? 'bg-green-600 text-white' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        } transition-all duration-200`}
                      >
                        {activeUpgrade === upgrade.id ? (
                          <>
                            <Zap className="w-4 h-4 mr-1 animate-pulse" />
                            Upgrading...
                          </>
                        ) : (
                          <>
                            <Upgrade className="w-4 h-4 mr-1" />
                            Upgrade
                          </>
                        )}
                      </Button>
                    </div>

                    {activeUpgrade === upgrade.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 pt-3 border-t border-green-500/30"
                      >
                        <Progress value={66} className="h-2 bg-gray-700" />
                        <div className="text-xs text-green-400 mt-1 text-center">
                          Installation in progress...
                        </div>
                      </motion.div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
