import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  CheckCircle2,
  Circle,
  Wrench,
  Sparkles,
  Coffee,
  Zap,
  Users,
  Award,
  X,
  Bot
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameState, StaffMember } from '@/types/game';
import {
  StudioChoreId,
  StudioChore,
  createInitialChoreState,
  executeStudioChore,
  assignChoreToStaff,
  autoAssignAvailableChores
} from '@/simulation/choreEngine';
import { gameAudio, playSound } from '@/utils/audioSystem';
import { toast } from '@/hooks/use-toast';
import { GamepadGlyph } from '@/components/ui/GamepadGlyph';
import {
  MotionPanel,
  MotionButton,
  MotionReveal,
  MotionNumber
} from '@/components/motion/primitives';
import { ChoreHotspotButton } from '@/components/chores/ChoreHotspotButton';
import './studio-duties.css';

interface StudioDutiesClipboardProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  maintenance: <Wrench size={14} className="text-amber-400" />,
  acoustics: <Sparkles size={14} className="text-purple-400" />,
  hospitality: <Coffee size={14} className="text-emerald-400" />
};

export const StudioDutiesClipboard: React.FC<StudioDutiesClipboardProps> = ({
  gameState,
  setGameState,
  isOpen,
  onClose
}) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const choreState = gameState.choreState || createInitialChoreState();
  const chores = Object.values(choreState.chores) as StudioChore[];
  const streak = choreState.streakDays || 0;
  const daysUntilCrate = 3 - (streak % 3);

  const handlePerformDuty = (choreId: StudioChoreId) => {
    const availableEnergy = gameState.playerData.dailyWorkCapacity;
    const chore = choreState.chores[choreId];
    if (!chore) return;

    if (availableEnergy < chore.energyCost) {
      toast({
        title: '⚡ Not Enough Energy',
        description: `This duty requires ${chore.energyCost} energy.`,
        variant: 'destructive'
      });
      playSound('error.wav', 0.5);
      return;
    }

    const result = executeStudioChore(choreState, choreId, availableEnergy);
    if (!result) return;

    // Play tactile mechanical audio
    if ((gameAudio as any).playGearSwitch) {
      (gameAudio as any).playGearSwitch();
    } else {
      playSound('ui-click', 0.5);
    }

    // Check if this completes all chores today
    const willCompleteAll = Object.values(result.nextChoreState.chores).every(c => c.completed);
    if (willCompleteAll) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      toast({
        title: '🏆 All Daily Duties Complete!',
        description: 'Your studio is in peak pristine condition.',
        className: 'bg-emerald-950/90 border border-emerald-500 text-white'
      });
    } else {
      toast({
        title: `🔧 Completed: ${chore.title}`,
        description: `+${result.xpAwarded} XP • Buff active for next session!`,
        className: 'bg-stone-900 border border-stone-700 text-white'
      });
    }

    setGameState(prev => ({
      ...prev,
      choreState: result.nextChoreState,
      playerData: {
        ...prev.playerData,
        xp: prev.playerData.xp + result.xpAwarded,
        dailyWorkCapacity: Math.max(0, prev.playerData.dailyWorkCapacity - result.energyBurned)
      }
    }));
  };

  const handleAssignStaff = (choreId: StudioChoreId, staffId: string | null) => {
    playSound('ui-click', 0.4);
    setGameState(prev => {
      const currentChoreState = prev.choreState || createInitialChoreState();
      return {
        ...prev,
        choreState: assignChoreToStaff(currentChoreState, choreId, staffId)
      };
    });
  };

  const handleAutoAssignAll = () => {
    playSound('ui-click', 0.5);
    setGameState(prev => {
      const currentChoreState = prev.choreState || createInitialChoreState();
      const updated = autoAssignAvailableChores(currentChoreState, prev.hiredStaff as any);
      return {
        ...prev,
        choreState: updated
      };
    });
    toast({
      title: '🤖 Duties Auto-Assigned',
      description: 'Chores assigned to best suited staff based on speed and ability!',
      className: 'bg-stone-900 border border-amber-500 text-white'
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <MotionPanel
          direction="scale"
          className="studio-clipboard-panel w-full max-w-xl p-6 text-stone-100 relative"
        >
          {/* Weathered Metal Spring Clip */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-44 h-7 studio-clipboard-clip flex items-center justify-center shadow-lg">
            <div className="w-12 h-2 rounded bg-stone-700/60 border border-stone-500/40" />
          </div>

          {/* Close button */}
          <MotionButton
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800/80 transition-colors"
            title="Close Clipboard"
          >
            <X size={18} />
          </MotionButton>

          {/* Header */}
          <div className="flex items-center justify-between mt-2 mb-4 border-b border-amber-900/40 pb-3">
            <div className="flex items-center gap-2.5">
              <ClipboardList className="text-amber-400" size={24} />
              <div>
                <h2 className="text-lg font-bold text-amber-200 tracking-wide">
                  Daily Studio Duties & Upkeep
                </h2>
                <p className="text-xs text-stone-400">
                  Maintain gear to earn session buffs & streak crates.
                </p>
              </div>
            </div>

            {/* Streak & Crate Counter */}
            <div className="flex items-center gap-2 bg-stone-900/80 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs">
              <Award className="text-amber-400" size={16} />
              <div>
                <span className="font-semibold text-amber-300">
                  Streak: <MotionNumber value={streak} /> {streak === 1 ? 'Day' : 'Days'}
                </span>
                <span className="text-stone-400 block text-[10px]">
                  {daysUntilCrate} {daysUntilCrate === 1 ? 'day' : 'days'} to Flight Case
                </span>
              </div>
            </div>
          </div>

          {/* Auto-Assign Toolbar */}
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="text-stone-400">
              Energy Available: <strong className="text-amber-300"><MotionNumber value={gameState.playerData.dailyWorkCapacity} suffix="⚡" /></strong>
            </span>
            <MotionButton
              magnetic
              onClick={handleAutoAssignAll}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-950/80 hover:bg-stone-900 border border-amber-500/40 text-stone-200 rounded text-xs transition-colors"
            >
              <Bot size={13} />
              Auto-Assign Staff
            </MotionButton>
          </div>

          {/* Chores List */}
          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {chores.map((chore, index) => {
              const assignedStaff = gameState.hiredStaff.find(s => s.id === chore.assignedStaffId);
              const isDone = chore.completed;

              return (
                <MotionReveal
                  key={chore.id}
                  direction="up"
                  staggerIndex={index}
                  distance={10}
                >
                  <div
                    onClick={() => setFocusedIndex(index)}
                    className={`studio-clipboard-paper p-3 rounded-lg border transition-all ${
                      isDone
                        ? 'chore-card-done'
                        : focusedIndex === index
                        ? 'chore-card-active'
                        : 'border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <button
                          onClick={() => !isDone && handlePerformDuty(chore.id)}
                          disabled={isDone}
                          className="mt-0.5 text-stone-400 hover:text-emerald-400 disabled:opacity-80 transition-colors"
                        >
                          {isDone ? (
                            <CheckCircle2 size={18} className="text-emerald-400" />
                          ) : (
                            <Circle size={18} />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium text-sm ${isDone ? 'line-through text-stone-500' : 'text-stone-200'}`}>
                              {chore.title}
                            </span>
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-stone-800 text-stone-300 border border-stone-700">
                              {CATEGORY_ICONS[chore.category]}
                              {chore.category}
                            </span>
                          </div>
                          <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">
                            {chore.description}
                          </p>

                          {/* Staff Assignment & Speed Ability Display */}
                          <div className="flex items-center gap-2 mt-2 text-xs">
                            <span className="text-stone-500 text-[11px] flex items-center gap-1">
                              <Users size={12} /> Assigned:
                            </span>
                            <select
                              value={chore.assignedStaffId || ''}
                              onChange={(e) => handleAssignStaff(chore.id, e.target.value || null)}
                              disabled={isDone}
                              className="bg-stone-900 border border-stone-700 text-stone-300 text-[11px] rounded px-2 py-0.5 disabled:opacity-50"
                            >
                              <option value="">Manual (Self)</option>
                              {gameState.hiredStaff.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.role} • Spd {s.primaryStats?.speed || 50})
                                </option>
                              ))}
                            </select>

                            {assignedStaff && (
                              <span className="text-[10px] text-amber-300">
                                ⚡ Spd {(1 + ((assignedStaff.primaryStats?.speed || 50) - 50) / 100).toFixed(1)}x
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Duty Action Button */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-[11px] text-amber-400 flex items-center gap-0.5">
                          <Zap size={11} /> {chore.energyCost > 0 ? `${chore.energyCost}⚡` : 'Free'}
                        </span>
                        {!isDone ? (
                          <ChoreHotspotButton
                            kind={chore.category}
                            label="Do Duty"
                            meta={chore.energyCost > 0 ? `${chore.energyCost}⚡` : 'Free'}
                            onClick={() => handlePerformDuty(chore.id)}
                            title={`Perform ${chore.title}`}
                          />
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-medium">
                            Active Buff
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </MotionReveal>
              );
            })}
          </div>

          {/* Footer Navigation */}
          <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
            <span className="flex items-center gap-1.5">
              <GamepadGlyph button="dpadUp" size="sm" /> Navigate
              <span className="mx-1.5">•</span>
              <GamepadGlyph button="south" size="sm" /> Execute
            </span>
            <MotionButton
              onClick={onClose}
              className="px-3 py-1 bg-white/[0.07] ring-1 ring-inset ring-white/15 hover:bg-white/[0.13] text-stone-300 rounded transition-colors"
            >
              Close
            </MotionButton>
          </div>
        </MotionPanel>
      </div>
    </AnimatePresence>
  );
};

export default StudioDutiesClipboard;
