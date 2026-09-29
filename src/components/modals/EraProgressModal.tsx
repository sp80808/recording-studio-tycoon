import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { GameState } from '@/types/game';
import { getEraProgress } from '@/utils/eraProgression';
import { getNextEvent as getNextHistoricalEvent } from '@/utils/historicalEvents';
import { MotionButton, MotionReveal, MotionPanel, TextScramble } from '@/components/motion/primitives';
import { useMotionCapabilities } from '@/lib/motion/capabilities';
import { useGamepad } from '@/hooks/useGamepad';
import { GamepadGlyph } from '@/components/ui/GamepadGlyph';
import { Sparkles, Calendar, Award, CheckCircle2, Disc3 } from 'lucide-react';

interface EraProgressModalProps {
  gameState: GameState;
  isOpen: boolean;
  onClose: () => void;
  triggerEraTransition: () => void;
}

export const EraProgressModal: React.FC<EraProgressModalProps> = ({ 
  gameState, 
  isOpen, 
  onClose, 
  triggerEraTransition 
}) => {
  const { currentEra, nextEra, progressPercent, canTransition } = getEraProgress(gameState);
  const nextHistoricalEvent = getNextHistoricalEvent(gameState);
  const capabilities = useMotionCapabilities();
  const gamepad = useGamepad();

  // Controller B / East button close
  useEffect(() => {
    if (!isOpen || !gamepad.isConnected) return;
    if (gamepad.justPressed.east) {
      onClose();
    }
  }, [isOpen, gamepad.isConnected, gamepad.justPressed.east, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-b from-[#182030] to-[#0f1422] border-slate-700 text-white shadow-2xl overflow-hidden p-6">
        <DialogHeader className="border-b border-slate-800 pb-3">
          <DialogTitle className="flex items-center gap-3 text-lg font-bold text-slate-100">
            <span className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30">
              <Disc3 className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
            </span>
            <div className="flex items-center gap-2">
              <span>Era Progression Timeline</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Day {gameState.currentDay}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* Current Era Info */}
          <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentEra.icon}</span>
                <h3 className="text-xl font-black text-amber-300 tracking-wide">
                  <TextScramble text={currentEra.name} speed={capabilities.reducedMotion ? 0 : 20} />
                </h3>
              </div>
              <Badge className="bg-purple-900/80 text-purple-200 border border-purple-500/30 font-mono text-xs">
                Year: {gameState.currentYear}
              </Badge>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{currentEra.description}</p>
            
            {/* Era Features */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Epoch Innovations:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentEra.features.map((feature, index) => (
                  <MotionReveal
                    key={feature}
                    staggerIndex={index}
                    staggerDelay={capabilities.reducedMotion ? 0 : 0.04}
                    direction="up"
                    distance={capabilities.reducedMotion ? 0 : 8}
                    className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/40 px-2.5 py-1.5 rounded border border-slate-800/80"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{feature}</span>
                  </MotionReveal>
                ))}
              </div>
            </div>

            {/* Available Genres */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Dominant Genres:</h4>
              <div className="flex flex-wrap gap-1.5">
                {currentEra.availableGenres.map((genre) => (
                  <span
                    key={genre}
                    className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-purple-950/50 text-purple-300 border border-purple-500/30"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Progress to Next Era */}
          {nextEra && (
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span>{nextEra.icon}</span>
                  <span>Next Era Horizon: {nextEra.name}</span>
                </span>
                <span className="text-xs font-mono font-bold text-purple-400">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <Progress
                value={progressPercent}
                className="h-2 bg-slate-950"
                aria-label="Progress to next era"
              />

              {/* Requirements Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                {nextEra.unlockRequirements.minReputation && (
                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                      <Award className="w-3 h-3 text-amber-400" /> Reputation
                    </div>
                    <div className={gameState.reputation >= nextEra.unlockRequirements.minReputation ? 'text-emerald-400 font-bold font-mono' : 'text-amber-400 font-mono'}>
                      {gameState.reputation} / {nextEra.unlockRequirements.minReputation}
                    </div>
                  </div>
                )}
                {nextEra.unlockRequirements.minLevel && (
                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                      <Sparkles className="w-3 h-3 text-blue-400" /> Producer Level
                    </div>
                    <div className={gameState.playerData.level >= nextEra.unlockRequirements.minLevel ? 'text-emerald-400 font-bold font-mono' : 'text-amber-400 font-mono'}>
                      {gameState.playerData.level} / {nextEra.unlockRequirements.minLevel}
                    </div>
                  </div>
                )}
                {nextEra.unlockRequirements.minDays && (
                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" /> Studio Days
                    </div>
                    <div className={gameState.currentDay >= nextEra.unlockRequirements.minDays ? 'text-emerald-400 font-bold font-mono' : 'text-amber-400 font-mono'}>
                      {gameState.currentDay} / {nextEra.unlockRequirements.minDays}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upcoming Historical Event */}
          {nextHistoricalEvent && (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-3 text-xs">
              <h4 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                <span>📰</span>
                <span>Upcoming Historical Event: {nextHistoricalEvent.title}</span>
              </h4>
              <div className="text-slate-400">
                Expected in {nextHistoricalEvent.triggerDay - gameState.currentDay} days ({nextHistoricalEvent.year})
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 border-t border-slate-800">
            {canTransition ? (
              <MotionButton 
                onClick={() => {
                  triggerEraTransition();
                  onClose();
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2"
              >
                <span>🚀 Advance to {nextEra?.name}</span>
                {gamepad.isConnected && <GamepadGlyph button="south" size="xs" />}
              </MotionButton>
            ) : (
              <Button 
                disabled
                className="flex-1 bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed text-xs font-mono"
              >
                {nextEra ? 'Requirements Pending' : 'Latest Era Reached'}
              </Button>
            )}
            
            <MotionButton 
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 flex items-center gap-1.5"
            >
              <span>Close</span>
              {gamepad.isConnected && <GamepadGlyph button="east" size="xs" />}
            </MotionButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EraProgressModal;
