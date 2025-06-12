import React, { useState } from 'react'; // Added useState import
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea'; // Added for import/export
import { useSettings } from '@/contexts/SettingsContext';
import { useSaveSystem } from '@/contexts/SaveSystemContext'; // Added for save/load string
import { useGameState } from '@/hooks/useGameState'; // Added to access gameState for export
import { gameAudio } from '@/utils/audioSystem';
import { useTranslation } from 'react-i18next';
import { toast } from "sonner"; // For notifications

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetGame?: () => void;
  context?: 'splash' | 'ingame'; // New prop
  // Adding a way to reload the game state after import
  onLoadGameStateFromString?: (gameState: any) => void; 
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onResetGame,
  context = 'ingame', // Default to 'ingame'
  onLoadGameStateFromString
}) => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { exportGameStateToString, loadGameFromString } = useSaveSystem();
  // gameState is only needed for export, so conditionally get it.
  // For import from splash, gameState won't be available/relevant yet.
  const { gameState } = context === 'ingame' ? useGameState() : { gameState: null };
  const { t, i18n } = useTranslation();

  const [exportedSaveString, setExportedSaveString] = useState<string | null>(null);
  const [importSaveString, setImportSaveString] = useState<string>('');


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

  const handleLanguageChange = (lang: string) => {
    updateSettings({ language: lang });
    gameAudio.playClick();
  };

  const handleExportGameData = () => {
    if (context === 'ingame' && gameState) {
      const exportedString = exportGameStateToString(gameState);
      if (exportedString) {
        setExportedSaveString(exportedString);
        toast.success("Game data exported to text string!");
      } else {
        toast.error("Failed to export game data.");
      }
    }
  };

  const handleImportGameData = () => {
    if (!importSaveString.trim()) {
      toast.error("Please paste a save string to import.");
      return;
    }
    const loadedState = loadGameFromString(importSaveString);
    if (loadedState) {
      if (onLoadGameStateFromString) {
        onLoadGameStateFromString(loadedState);
        toast.success("Game data imported successfully! Reloading game...");
        onClose(); // Close modal after successful import
      } else {
        // This case should ideally be handled by ensuring onLoadGameStateFromString is passed
        // when import is possible.
        toast.error("Import successful, but no reload function provided.");
      }
    } else {
      toast.error("Failed to import game data. The save string might be invalid or corrupted.");
    }
  };

  const handleCopyToClipboard = () => {
    if (exportedSaveString) {
      navigator.clipboard.writeText(exportedSaveString)
        .then(() => toast.success("Save string copied to clipboard!"))
        .catch(() => toast.error("Failed to copy to clipboard."));
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

          {/* Language Settings - Placed before Theme Settings for better grouping */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-gray-600 pb-2">
              🌐 {t('language_settings_title', 'Language Settings')}
            </h3>
            <div className="space-y-2">
              <label className="text-white font-medium">{t('select_language_label', 'Select Language')}</label>
              <Select
                value={settings.language}
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder={t('select_language_placeholder', 'Select a language')} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="en" className="text-white hover:bg-gray-700">
                    {t('language_english', 'English')}
                  </SelectItem>
                  <SelectItem value="pl" className="text-white hover:bg-gray-700">
                    {t('language_polish', 'Polski')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-gray-600 pb-2">
              🎨 Theme Settings
            </h3>
            
            {/* Theme Selector */}
            <div className="space-y-2">
              <label className="text-white font-medium">Game Theme</label>
              <Select
                value={settings.theme}
                onValueChange={(value: 'default' | 'sunrise-studio' | 'neon-nights' | 'retro-arcade') => updateSettings({ theme: value })}
              >
                <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="default" className="text-white hover:bg-gray-700">
                    Default
                  </SelectItem>
                  <SelectItem value="sunrise-studio" className="text-white hover:bg-gray-700">
                    Sunrise Studio
                  </SelectItem>
                  <SelectItem value="neon-nights" className="text-white hover:bg-gray-700">
                    Neon Nights
                  </SelectItem>
                  <SelectItem value="retro-arcade" className="text-white hover:bg-gray-700">
                    Retro Arcade
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Data Management Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-gray-600 pb-2">
              💾 Data Management
            </h3>

            {/* Import Game Data */}
            <div className="space-y-2">
              <label htmlFor="import-save-string" className="text-white font-medium">Import Game from Text</label>
              <p className="text-gray-400 text-sm">Paste your exported game data string below.</p>
              <Textarea
                id="import-save-string"
                value={importSaveString}
                onChange={(e) => setImportSaveString(e.target.value)}
                placeholder="Paste your save string here..."
                className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
              />
              <Button onClick={handleImportGameData} className="w-full mt-2 bg-green-600 hover:bg-green-700">
                Import Data
              </Button>
            </div>

            {/* Export Game Data (Only in-game) */}
            {context === 'ingame' && gameState && (
              <div className="space-y-2">
                <label htmlFor="export-save-string" className="text-white font-medium">Export Game to Text</label>
                <p className="text-gray-400 text-sm">Copy this string to save your game progress externally.</p>
                <Button onClick={handleExportGameData} className="w-full mb-2 bg-orange-600 hover:bg-orange-700">
                  Generate Export String
                </Button>
                {exportedSaveString && (
                  <>
                    <Textarea
                      id="export-save-string"
                      value={exportedSaveString}
                      readOnly
                      className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
                    />
                    <Button onClick={handleCopyToClipboard} className="w-full mt-2 bg-sky-600 hover:bg-sky-700">
                      Copy to Clipboard
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>


          {/* Action Buttons */}
          <div className="space-y-4 pt-6 border-t border-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleResetSettings}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white border border-gray-500"
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
            
            {/* Conditionally hide Reset Game Progress if context is splash, or if onResetGame is not provided */}
            {/* The existing onResetGame check already handles part of this, but context makes it more explicit */}
            {/* For now, the main change is adding the context prop. UI changes based on context will come next. */}
            {/* The Reset Game Progress button should only show if context is 'ingame' and onResetGame is passed */}
            {!(context === 'splash') && onResetGame && (
              <Button
                onClick={handleResetGame}
                variant="destructive"
                className="w-full bg-red-600 hover:bg-red-700 text-white mt-4 md:mt-0" // Ensure consistent spacing if it becomes the only button in its row
              >
                Reset Game Progress
              </Button>
            )}
            {/* If context is splash, and onResetGame is not available, the above block is hidden.
                If context is ingame, it depends on onResetGame.
                This logic needs refinement to ensure correct layout when Reset Game is hidden.
                The original code had Reset Settings and Reset Game in a grid.
                If Reset Game is hidden, Reset Settings should span full width or be handled differently.
            */}
            {/* Let's adjust the grid logic for the buttons */}
            {/* The following is a simplified structure for now, focusing on the context prop addition.
                Detailed conditional rendering of buttons will be part of text save/load implementation.
            */}
            {/* The original code for Reset Game Progress button is:
            {onResetGame && (
              <Button onClick={handleResetGame} variant="destructive" className="w-full bg-red-600 hover:bg-red-700 text-white">
                Reset Game Progress
              </Button>
            )}
            This will be refined later. For now, I'm ensuring the context prop is added.
            The previous SEARCH/REPLACE block for the Reset Settings button was:
            <Button onClick={handleResetSettings} className="w-full bg-gray-700 hover:bg-gray-600 text-white border border-gray-500"> Reset Settings </Button>
            
            The grid structure for buttons:
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              Button for Reset Settings
              Conditional Button for Reset Game
            </div>
            If context is 'splash', Reset Game should not appear.
            The `onResetGame` prop is typically passed from `Index.tsx` (in-game context) and not from `SplashScreen.tsx`.
            So, the `onResetGame && (...)` check effectively hides "Reset Game Progress" when called from splash.
            No change needed to the Reset Game Progress button's conditional rendering based on `onResetGame` for now.
            The `context` prop will be used later for adding Export/Import text save features.
            */}

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
