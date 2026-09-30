import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GameState } from '@/types/game';
import { getEraProgress } from '@/utils/eraProgression';
import { MotionButton, MotionReveal, MotionPanel } from '@/components/motion/primitives';
import { useMotionCapabilities } from '@/lib/motion/capabilities';
import { Sparkles, Calendar, Award, Clock, ArrowRight } from 'lucide-react';

interface EraProgressProps {
  gameState: GameState;
  triggerEraTransition: () => void;
}

export const EraProgress: React.FC<EraProgressProps> = ({ gameState, triggerEraTransition }) => {
  const { currentEra, nextEra, progressPercent, canTransition } = getEraProgress(gameState);
  const capabilities = useMotionCapabilities();

  return (
    <Card className="bg-stone-900/95 border-stone-700 p-4 mb-4 text-stone-100 shadow-lg">
      <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>🎵</span>
          <span>Era Progression</span>
        </h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30">
          Year {gameState.currentYear}
        </span>
      </div>

      <div className="space-y-3">
        {/* Current Era Info */}
        <div className="bg-stone-950/50 p-2.5 rounded-lg border border-stone-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Current Epoch</span>
            <span className="text-xs">{currentEra.icon}</span>
          </div>
          <div className="text-sm font-black text-amber-300">{currentEra.name}</div>
          <div className="text-xs text-stone-400 mt-0.5 line-clamp-2">{currentEra.description}</div>
        </div>

        {/* Progress Bar towards Next Era */}
        <div>
          <div className="flex justify-between text-xs text-stone-400 mb-1 font-mono">
            <span>Epoch Timeline</span>
            <span className="text-purple-300 font-bold">{Math.round(progressPercent)}%</span>
          </div>
          <Progress
            value={progressPercent}
            className="h-2 bg-stone-800"
            aria-label="Era progression progress"
          />
        </div>

        {/* Next Era Requirements */}
        {nextEra && (
          <div className="pt-2 border-t border-stone-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <span>{nextEra.icon}</span>
                <span>Next: {nextEra.name}</span>
              </span>
              <span className="text-[10px] font-mono text-stone-400">{nextEra.startYear}+</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 text-xs">
              {nextEra.unlockRequirements.minReputation && (
                <div className="flex justify-between items-center bg-stone-950/30 px-2 py-1 rounded">
                  <span className="text-stone-400 flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-400" /> Reputation
                  </span>
                  <span
                    className={
                      gameState.reputation >= nextEra.unlockRequirements.minReputation
                        ? 'text-emerald-400 font-mono font-bold'
                        : 'text-amber-400 font-mono'
                    }
                  >
                    {gameState.reputation}/{nextEra.unlockRequirements.minReputation}
                  </span>
                </div>
              )}
              {nextEra.unlockRequirements.minLevel && (
                <div className="flex justify-between items-center bg-stone-950/30 px-2 py-1 rounded">
                  <span className="text-stone-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" /> Producer Level
                  </span>
                  <span
                    className={
                      gameState.playerData.level >= nextEra.unlockRequirements.minLevel
                        ? 'text-emerald-400 font-mono font-bold'
                        : 'text-amber-400 font-mono'
                    }
                  >
                    {gameState.playerData.level}/{nextEra.unlockRequirements.minLevel}
                  </span>
                </div>
              )}
              {nextEra.unlockRequirements.minDays && (
                <div className="flex justify-between items-center bg-stone-950/30 px-2 py-1 rounded">
                  <span className="text-stone-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-stone-400" /> Studio Days
                  </span>
                  <span
                    className={
                      gameState.currentDay >= nextEra.unlockRequirements.minDays
                        ? 'text-emerald-400 font-mono font-bold'
                        : 'text-amber-400 font-mono'
                    }
                  >
                    {gameState.currentDay}/{nextEra.unlockRequirements.minDays}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transition Action Button */}
        {canTransition && (
          <MotionReveal direction="up" distance={8} delay={0.1}>
            <MotionButton
              onClick={triggerEraTransition}
              className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold text-xs rounded-lg shadow-lg flex items-center justify-center gap-2"
            >
              <span>Advance to {nextEra?.name}</span>
              <ArrowRight className="w-4 h-4" />
            </MotionButton>
          </MotionReveal>
        )}

        {!nextEra && (
          <div className="text-center text-stone-400 text-xs py-2">
            🏆 You have reached the pinnacle era!
          </div>
        )}
      </div>
    </Card>
  );
};

export default EraProgress;
