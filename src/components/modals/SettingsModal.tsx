import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/contexts/SettingsContext';
import { gameAudio } from '@/utils/audioSystem';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetGame?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onResetGame 
}) => {
  const { settings, updateSettings, resetSettings } = useSettings();

  if (!isOpen) return null;

  const handleVolumeChange = (type: 'master' | 'sfx' | 'music', value: number) => {
    const volumeSettings = {
      master: { masterVolume: value },
      sfx: { sfxVolume: value },
      music: { musicVolume: value }
    };
    
    updateSettings(volumeSettings[type]);
    
    // Play test sound for immediate feedback
    if (type === 'sfx') {
      gameAudio.playClick();
    }
  };

  const handleToggleChange = (type: 'sfx' | 'music', enabled: boolean) => {
    const toggleSettings = {
      sfx: { sfxEnabled: enabled },
      music: { musicEnabled: enabled }
    };
    
    updateSettings(toggleSettings[type]);
    
    if (enabled && type === 'sfx') {
      gameAudio.playSuccess();
    }
  };

  const handleResetSettings = () => {
    resetSettings();
    gameAudio.playClick();
  };

  const handleResetGame = () => {
    if (onResetGame && confirm('Are you sure you want to reset all game progress? This cannot be undone.')) {
      onResetGame();
      gameAudio.playClick();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl bg-gray-900 border-gray-600 p-6 m-4 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">⚙️ Game Settings</h2>
          <p className="text-gray-300">Customize your game experience</p>
        </div>

        <div className="space-y-8">
          {/* Audio Settings */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-gray-600 pb-2">
              🔊 Audio Settings
            </h3>
            
            {/* Master Volume */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-white font-medium">Master Volume</label>
                <span className="text-gray-400">{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <Slider
                value={[settings.masterVolume]}
                onValueChange={(value) => handleVolumeChange('master', value[0])}
                max={1}
                step={0.1}
                className="w-full [&_.bg-primary]:bg-green-500 [&_.border-primary]:border-green-500 [&_.bg-secondary]:bg-gray-700"
              />
            </div>

            {/* Sound Effects */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-white font-medium">Sound Effects</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{Math.round(settings.sfxVolume * 100)}%</span>
                  <Switch
                    checked={settings.sfxEnabled}
                    onCheckedChange={(checked) => handleToggleChange('sfx', checked)}
                  />
                </div>
              </div>
              <Slider
                value={[settings.sfxVolume]}
                onValueChange={(value) => handleVolumeChange('sfx', value[0])}
                max={1}
                step={0.1}
                className="w-full [&_.bg-primary]:bg-green-500 [&_.border-primary]:border-green-500 [&_.bg-secondary]:bg-gray-700"
                disabled={!settings.sfxEnabled}
              />
            </div>

            {/* Background Music */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-white font-medium">Background Music</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{Math.round(settings.musicVolume * 100)}%</span>
                  <Switch
                    checked={settings.musicEnabled}
                    onCheckedChange={(checked) => handleToggleChange('music', checked)}
                  />
                </div>
              </div>
              <Slider
                value={[settings.musicVolume]}
                onValueChange={(value) => handleVolumeChange('music', value[0])}
                max={1}
                step={0.1}
                className="w-full [&_.bg-primary]:bg-green-500 [&_.border-primary]:border-green-500 [&_.bg-secondary]:bg-gray-700"
                disabled={!settings.musicEnabled}
              />
            </div>
          </div>

          {/* Game Settings */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-gray-600 pb-2">
              🎮 Game Settings
            </h3>
            
            {/* Difficulty */}
            <div className="space-y-2">
              <label className="text-white font-medium">Difficulty Level</label>
              <Select
                value={settings.difficulty}
                onValueChange={(value: 'easy' | 'medium' | 'hard') => updateSettings({ difficulty: value })}
              >
                <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="easy" className="text-white hover:bg-gray-700">
                    Easy - Relaxed gameplay
                  </SelectItem>
                  <SelectItem value="medium" className="text-white hover:bg-gray-700">
                    Medium - Balanced challenge
                  </SelectItem>
                  <SelectItem value="hard" className="text-white hover:bg-gray-700">
                    Hard - Expert mode
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auto Save */}
            <div className="flex justify-between items-center">
              <div>
                <label className="text-white font-medium">Auto Save</label>
                <p className="text-gray-400 text-sm">Automatically save progress</p>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={(checked) => updateSettings({ autoSave: checked })}
              />
            </div>

            {/* Tutorial Status */}
            <div className="flex justify-between items-center">
              <div>
                <label className="text-white font-medium">Tutorial Completed</label>
                <p className="text-gray-400 text-sm">Show tutorial on next restart</p>
              </div>
              <Switch
                checked={settings.tutorialCompleted}
                onCheckedChange={(checked) => updateSettings({ tutorialCompleted: checked })}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 pt-6 border-t border-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleResetSettings}
                variant="outline"
                className="w-full border-gray-600 text-gray-200 hover:bg-gray-800 hover:text-white"
              >
                Reset Settings
              </Button>
              
              {onResetGame && (
                <Button
                  onClick={handleResetGame}
                  variant="destructive"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  Reset Game Progress
                </Button>
              )}
            </div>
            
            <Button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Save & Close
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
