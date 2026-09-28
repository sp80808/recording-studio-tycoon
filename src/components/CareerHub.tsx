import { useState } from 'react';
import { ArrowRight, ChevronDown, Sparkles, Target, Zap } from 'lucide-react';
import { GameState } from '@/types/game';
import { checkDailyChallenge } from '@/utils/dailyChallenges';
import { ProgressionSystem } from '@/services/ProgressionSystem';
import { calculateEquipmentUpkeep } from '@/hooks/useGameActions';
import { gameAudio } from '@/utils/audioSystem';

interface CareerHubProps {
  gameState: GameState;
  onTalents: () => void;
  onWork: () => void;
  onBookings: () => void;
  onRest: () => void;
  onStaff: () => void;
}

export function CareerHub({ gameState, onTalents, onWork, onBookings, onRest, onStaff }: CareerHubProps) {
  const [expanded, setExpanded] = useState(false);
  const player = gameState.playerData;
  const challenge = checkDailyChallenge(gameState);
  const claimed = gameState.dailyTracking?.day === gameState.currentDay && gameState.dailyTracking?.challengeDoneId === challenge.def.id;
  const next = ProgressionSystem.getNextUnlockRequirements(gameState);
  const project = gameState.activeProject;
  const tired = player.dailyWorkCapacity <= 0;
  const expenses = calculateEquipmentUpkeep(gameState.ownedEquipment) + gameState.hiredStaff.reduce((sum, staff) => sum + staff.salary, 0);
  const title = player.level >= 12 ? 'Industry legend' : player.level >= 8 ? 'Studio visionary' : player.level >= 5 ? 'Hitmaker' : player.level >= 3 ? 'Rising producer' : 'Independent producer';
  return (
    <section aria-label="Producer career" className="shrink-0 border-b border-slate-700/70 bg-slate-950/90 px-3 py-3 text-slate-100">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={onTalents} className="group flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300">
          <span key={player.level} className="grid h-11 w-11 shrink-0 place-content-center rounded-xl border border-amber-300/40 bg-amber-300/10 text-lg font-black text-amber-200 motion-safe:animate-in motion-safe:zoom-in">{player.level}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-amber-100">{title}</span>
            <span className="mt-1 block h-1.5 max-w-48 overflow-hidden rounded-full bg-slate-700" role="progressbar" aria-label="Producer XP" aria-valuemin={0} aria-valuemax={player.xpToNextLevel} aria-valuenow={player.xp}>
              <span className="block h-full rounded-full bg-amber-300 motion-safe:transition-all motion-safe:duration-500" style={{ width: `${Math.min(100, player.xp / Math.max(1, player.xpToNextLevel) * 100)}%` }} />
            </span>
            <span className="mt-1 block text-[10px] tabular-nums text-slate-400">{player.xp}/{player.xpToNextLevel} XP · {player.perkPoints > 0 ? `${player.perkPoints} talent points to spend` : 'View producer talents'}</span>
          </span>
          {player.perkPoints > 0 && <Sparkles size={18} className="shrink-0 text-amber-300" aria-hidden="true" />}
        </button>
        <div className="min-w-0 flex-1 text-xs">
          <p className="flex items-center gap-1.5 font-semibold text-sky-200"><Zap size={14} aria-hidden="true" />{player.dailyWorkCapacity} sessions left today</p>
          <p className="mt-1 truncate text-slate-400">{tired ? `Rest restores sessions · $${expenses} daily costs` : project ? project.title : 'Your next record starts with a booking.'}</p>
        </div>
        <button onClick={tired ? onRest : project ? onWork : onBookings} className="flex min-h-11 items-center gap-2 rounded-lg border border-sky-300/30 bg-sky-500/15 px-4 text-xs font-bold text-sky-100 transition-colors hover:bg-sky-500/30 active:bg-sky-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-200">
          {tired ? 'Rest & advance day' : project ? 'Continue session' : 'Find a gig'}<ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>
      <div className="mt-2 overflow-hidden rounded-lg border-2 border-slate-700/80 bg-slate-900/80 text-xs shadow-inner transition-all">
        <button
          type="button"
          onClick={() => {
            void gameAudio.playClick().catch(() => {});
            setExpanded(prev => !prev);
          }}
          className="flex w-full min-h-9 cursor-pointer items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-800/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
          aria-expanded={expanded}
        >
          <Target size={14} className={claimed ? 'text-emerald-300' : 'text-amber-300'} aria-hidden="true" />
          <span className="font-semibold text-slate-100">Daily goal · {challenge.def.description}</span>
          
          <div className="mx-2 hidden h-1.5 w-16 overflow-hidden rounded-full bg-slate-800 sm:block" role="progressbar" aria-valuenow={challenge.progress} aria-valuemax={challenge.def.target}>
            <div 
              className={`h-full rounded-full transition-all duration-300 ${claimed ? 'bg-emerald-400' : 'bg-amber-400'}`} 
              style={{ width: `${Math.min(100, (challenge.progress / Math.max(1, challenge.def.target)) * 100)}%` }}
            />
          </div>

          <span className={`ml-auto tabular-nums font-medium ${claimed ? 'text-emerald-300' : 'text-amber-200'}`}>
            {claimed ? 'Reward earned ✓' : `${challenge.progress}/${challenge.def.target} · +$${challenge.def.reward.money}`}
          </span>
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180 text-amber-300' : ''}`}
            aria-hidden="true"
          />
        </button>

        {expanded && (
          <div className="grid gap-3 border-t-2 border-slate-800/80 bg-slate-950/50 p-3 sm:grid-cols-2 animate-in fade-in duration-150">
            <div>
              <p className="font-semibold text-amber-200">{challenge.def.title}</p>
              <p className="mt-1 text-slate-300">${challenge.def.reward.money} · +{challenge.def.reward.reputation} reputation · +{challenge.def.reward.xp} XP</p>
              <p className="mt-1 text-slate-400">Rewards arrive automatically as you play. A new goal arrives each day.</p>
            </div>
            <div>
              <p className="font-semibold text-sky-200">{next ? 'Next studio expansion' : 'Studio fully expanded'}</p>
              {next && <p className="mt-1 text-slate-300">Level {next.currentLevel}/{next.levelNeeded} · Crew {next.currentStaff}/{next.staffNeeded} · Releases {next.currentProjects}/{next.projectsNeeded}</p>}
              {next && <button onClick={onStaff} className="mt-1 min-h-9 font-semibold text-sky-200 underline underline-offset-4 hover:text-sky-100">Build your crew →</button>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
