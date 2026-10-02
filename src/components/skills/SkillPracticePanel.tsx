import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState } from '@/types/game';
import { KenneyButton } from '@/components/ui/KenneyButton';
import { MinigameManager, MinigameType } from '@/components/minigames/MinigameManager';
import { toast } from '@/hooks/use-toast';
import { gameAudio } from '@/utils/audioSystem';
import { useMotionCapabilities } from '@/lib/motion/capabilities';
import { motionSpring } from '@/lib/motion/tokens';
import {
  SKILL_PRACTICE_CATALOG,
  PRACTICE_ENERGY_COST,
  STUDY_NOTES_SKILL_XP,
  applySkillPractice,
  applyStudyNotes,
  canAffordPractice,
  getPracticeDef,
  type PlayerSkillName,
} from '@/rpg/skillPractice';

interface SkillPracticePanelProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  className?: string;
}

export const SkillPracticePanel: React.FC<SkillPracticePanelProps> = ({
  gameState,
  setGameState,
  className = '',
}) => {
  const { reducedMotion } = useMotionCapabilities();
  const [practiceSkill, setPracticeSkill] = useState<PlayerSkillName | null>(null);
  const [flashSkill, setFlashSkill] = useState<PlayerSkillName | null>(null);

  const energy = gameState.playerData.dailyWorkCapacity ?? 0;
  const canPractice = canAffordPractice(gameState);

  const rows = useMemo(
    () =>
      SKILL_PRACTICE_CATALOG.map((def) => ({
        def,
        skill: gameState.playerData.skills[def.skill],
      })),
    [gameState.playerData.skills]
  );

  const activeGameType: MinigameType | null = practiceSkill
    ? getPracticeDef(practiceSkill).minigame
    : null;

  const startPractice = (skill: PlayerSkillName) => {
    if (!canAffordPractice(gameState)) {
      toast({
        title: 'Out of session energy',
        description: 'Advance the day to recharge before another practice take.',
        className: 'bg-stone-800 border-stone-600 text-white',
      });
      return;
    }
    void gameAudio.playTactileClick();
    setPracticeSkill(skill);
  };

  const handlePracticeReward = (
    _c: number,
    _t: number,
    _xp: number,
    _type?: MinigameType,
    rawScore?: number
  ) => {
    const skillName = practiceSkill;
    if (!skillName) return;
    const score = rawScore ?? 0;
    setPracticeSkill(null);

    const applied = applySkillPractice(gameState, skillName, score);
    if (!applied) {
      toast({
        title: 'Practice cancelled',
        description: 'Not enough energy to bank that take.',
        className: 'bg-stone-800 border-stone-600 text-white',
      });
      return;
    }

    setGameState(applied.next);
    setFlashSkill(skillName);
    window.setTimeout(() => setFlashSkill(null), reducedMotion ? 0 : 900);
    const { reward } = applied;
    toast({
      title: reward.levelUps > 0 ? `⬆ ${getPracticeDef(skillName).label} leveled up!` : `Practice · Grade ${reward.grade}`,
      description: `+${reward.skillXp} craft XP${reward.producerXp > 0 ? ` · +${reward.producerXp} producer XP` : ''} · −${reward.energySpent}⚡`,
      className: 'bg-stone-800 border-stone-600 text-white',
    });
    if (reward.levelUps > 0) void gameAudio.playUISound('levelUp');
  };

  const studyNotes = (skill: PlayerSkillName) => {
    const applied = applyStudyNotes(gameState, skill);
    if (!applied) {
      toast({
        title: 'Out of session energy',
        description: 'Study notes still need a quiet hour — advance the day first.',
        className: 'bg-stone-800 border-stone-600 text-white',
      });
      return;
    }
    void gameAudio.playGearSwitch();
    setGameState(applied.next);
    toast({
      title: 'Study notes',
      description: `+${applied.skillXp} ${getPracticeDef(skill).label} XP (fallback · no minigame)`,
      className: 'bg-stone-800 border-stone-600 text-white',
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[var(--rst-line)] pb-2">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Craft practice</h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Improve skills by running short studio drills — score decides the XP.
          </p>
        </div>
        <div
          className="text-[11px] font-mono tabular-nums px-2 py-1 rounded-[2px] border border-amber-500/40 bg-amber-950/40 text-amber-200"
          title="Session energy shared with project takes"
        >
          ⚡ {energy} energy · {PRACTICE_ENERGY_COST}/practice
        </div>
      </div>

      <ul className="space-y-2" aria-label="Player craft skills">
        {rows.map(({ def, skill }) => {
          const pct = skill.xpToNextLevel > 0 ? Math.min(100, (skill.xp / skill.xpToNextLevel) * 100) : 0;
          const lit = flashSkill === def.skill;
          return (
            <li key={def.skill}>
              <motion.div
                layout={!reducedMotion}
                animate={
                  lit && !reducedMotion
                    ? { boxShadow: ['0 0 0 rgba(230,184,102,0)', '0 0 18px rgba(230,184,102,0.35)', '0 0 0 rgba(230,184,102,0)'] }
                    : undefined
                }
                transition={motionSpring.press}
                className="rounded-[3px] border border-stone-700/90 bg-stone-950/70 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="min-w-0 flex items-start gap-2.5">
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border border-stone-600 bg-stone-900 text-sm"
                      aria-hidden="true"
                    >
                      {def.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-sm font-bold text-white truncate">{def.label}</h3>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300/90">
                          Lv {skill.level}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 leading-snug">{def.blurb}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1.5 flex-1 min-w-[6rem] max-w-[12rem] overflow-hidden rounded-full bg-stone-800">
                          <motion.div
                            className="h-full rounded-full bg-amber-500/90"
                            initial={false}
                            animate={{ width: `${pct}%` }}
                            transition={reducedMotion ? { duration: 0 } : motionSpring.press}
                          />
                        </div>
                        <span className="text-[10px] tabular-nums text-stone-500">
                          {skill.xp}/{skill.xpToNextLevel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <KenneyButton
                      size="sm"
                      variant="yellow"
                      disabled={!canPractice}
                      onClick={() => startPractice(def.skill)}
                      aria-label={`Practice ${def.label}`}
                      className="min-w-[5.5rem]"
                    >
                      Practice
                    </KenneyButton>
                    <button
                      type="button"
                      onClick={() => studyNotes(def.skill)}
                      disabled={!canPractice}
                      title={`Accessibility fallback: +${STUDY_NOTES_SKILL_XP} XP, no minigame`}
                      className="text-[10px] uppercase tracking-wider text-stone-500 hover:text-stone-300 disabled:opacity-40 px-1.5 py-1 border border-transparent hover:border-stone-700 rounded-[2px]"
                    >
                      Notes
                    </button>
                  </div>
                </div>
              </motion.div>
            </li>
          );
        })}
      </ul>

      <AnimatePresence>
        {activeGameType && practiceSkill && (
          <MinigameManager
            isOpen
            gameType={activeGameType}
            rewardMode="practice"
            onClose={() => setPracticeSkill(null)}
            onReward={handlePracticeReward}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SkillPracticePanel;
