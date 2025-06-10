
import React from 'react';
import { GameState } from '@/types/game';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Wrench, Star } from 'lucide-react';

interface LeftPanelProps {
  gameState: GameState;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ gameState }) => {
  const studioEfficiency = Math.min(100, (gameState.studioLevel * 20) + (gameState.ownedEquipment.length * 5));
  const staffMorale = gameState.hiredStaff.length > 0 
    ? Math.round(gameState.hiredStaff.reduce((sum, staff) => sum + staff.energy, 0) / gameState.hiredStaff.length)
    : 100;

  return (
    <div className="w-80 bg-gradient-to-b from-gray-900/95 to-gray-800/95 backdrop-blur-sm border-r border-gray-700/50 p-4 space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <Building2 className="w-6 h-6 text-blue-400" />
          Studio Overview
        </h2>
        <div className="h-1 w-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
      </div>
      
      {/* Studio Stats */}
      <Card className="p-4 bg-gradient-to-br from-gray-800/60 to-gray-700/60 border-gray-600/50 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          Studio Performance
        </h3>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-300">Efficiency</span>
              <span className="text-sm font-medium text-blue-400">{studioEfficiency}%</span>
            </div>
            <Progress value={studioEfficiency} className="h-2 bg-gray-700" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-300">Staff Morale</span>
              <span className="text-sm font-medium text-green-400">{staffMorale}%</span>
            </div>
            <Progress value={staffMorale} className="h-2 bg-gray-700" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-300">Reputation</span>
              <span className="text-sm font-medium text-purple-400">{gameState.reputation}</span>
            </div>
            <Progress value={(gameState.reputation / 1000) * 100} className="h-2 bg-gray-700" />
          </div>
        </div>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 bg-gradient-to-br from-blue-900/40 to-blue-800/40 border-blue-600/30">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-300">Staff</span>
          </div>
          <div className="text-xl font-bold text-white">{gameState.hiredStaff.length}</div>
          <div className="text-xs text-gray-400">Active members</div>
        </Card>
        
        <Card className="p-3 bg-gradient-to-br from-green-900/40 to-green-800/40 border-green-600/30">
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-300">Equipment</span>
          </div>
          <div className="text-xl font-bold text-white">{gameState.ownedEquipment.length}</div>
          <div className="text-xs text-gray-400">Pieces owned</div>
        </Card>
        
        <Card className="p-3 bg-gradient-to-br from-purple-900/40 to-purple-800/40 border-purple-600/30">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-purple-300">Level</span>
          </div>
          <div className="text-xl font-bold text-white">{gameState.studioLevel}</div>
          <div className="text-xs text-gray-400">Studio tier</div>
        </Card>
        
        <Card className="p-3 bg-gradient-to-br from-yellow-900/40 to-yellow-800/40 border-yellow-600/30">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-yellow-300">Bands</span>
          </div>
          <div className="text-xl font-bold text-white">{gameState.playerBands.length}</div>
          <div className="text-xs text-gray-400">Under contract</div>
        </Card>
      </div>

      {/* Studio Skills */}
      <Card className="p-4 bg-gradient-to-br from-gray-800/60 to-gray-700/60 border-gray-600/50">
        <h3 className="text-sm font-semibold text-white mb-3">Studio Specializations</h3>
        <div className="space-y-2">
          {Object.entries(gameState.studioSkills).map(([skill, level]) => (
            <div key={skill} className="flex items-center justify-between">
              <span className="text-xs text-gray-300 capitalize">{skill}</span>
              <Badge 
                variant="outline" 
                className="text-xs border-blue-400/50 text-blue-300"
              >
                Lv.{level}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Active Projects Indicator */}
      {gameState.activeProject && (
        <Card className="p-3 bg-gradient-to-r from-orange-900/50 to-red-900/50 border-orange-600/50 animate-pulse">
          <div className="text-center">
            <div className="text-sm font-medium text-orange-300">🎵 Recording in Progress</div>
            <div className="text-xs text-gray-400 mt-1">{gameState.activeProject.title}</div>
          </div>
        </Card>
      )}
    </div>
  );
};
