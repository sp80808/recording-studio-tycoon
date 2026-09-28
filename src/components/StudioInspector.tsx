import React, { useEffect } from 'react';
import { GameState, Project } from '@/types/game';
import { StudioHotspotId } from '@/components/WebGLCanvas';
import { ProgressionSystem } from '@/services/ProgressionSystem';
import {
  calculateEquipmentUpkeep,
  gigRefreshCooldownRemaining,
  GIG_REFRESH_COST,
  GIG_REFRESH_COOLDOWN_DAYS,
} from '@/hooks/useGameActions';
import { checkDailyChallenge } from '@/utils/dailyChallenges';
import { Button } from '@/components/ui/button';
import { CalendarDays, Guitar, Mic2, Phone, PhoneCall, PhoneOff, ShoppingCart, SlidersHorizontal, Tv, X } from 'lucide-react';
import { gameAudio } from '@/utils/audioSystem';

/**
 * Contextual inspector popup (bead goj.2).
 *
 * Anchored to the room object the player clicked, replacing the old
 * "every tab is always visible" dashboard feel. One inspector is open at a
 * time; Esc or the backdrop closes it. Data-dense screens (charts, financials)
 * still live in the DOM shell — inspectors only surface the essentials.
 */

export interface StudioInspectorProps {
  hotspot: StudioHotspotId;
  gameState: GameState;
  onClose: () => void;
  onAdvanceDay: () => void;
  onRefreshProjects?: () => boolean;
  onStartProject: (project: Project) => void;
  onAssignStaff: (staffId: string) => void;
  onUnassignStaff: (staffId: string) => void;
  /** Ask the DOM dashboard to reveal a tab (charts/studio/staff/...). */
  onOpenDashboardTab: (tab: 'studio' | 'skills' | 'bands' | 'charts' | 'staff') => void;
  onConsoleFocus?: () => void;
}

const ANCHORS: Record<StudioHotspotId, string> = {
  phone: 'top-10 left-3',
  clock: 'top-10 left-1/2 -translate-x-1/2',
  tv: 'top-10 right-3',
  shelf: 'top-1/2 right-3 -translate-y-1/2',
  console: 'bottom-9 left-3',
  liveRoom: 'bottom-9 right-3',
};

const INSPECTOR_META = {
  phone: { label: 'Booking Line', icon: Phone },
  clock: { label: 'Studio Calendar', icon: CalendarDays },
  tv: { label: 'Charts TV', icon: Tv },
  shelf: { label: 'Gear Locker', icon: Guitar },
  console: { label: 'Mixing Console', icon: SlidersHorizontal },
  liveRoom: { label: 'Live Room', icon: Mic2 },
} as const satisfies Record<StudioHotspotId, { label: string; icon: typeof Phone }>;

const ActionIcon: React.FC<{ icon: typeof Phone }> = ({ icon: Icon }) => (
  <Icon aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
);

const InspectorTitle: React.FC<{ hotspot: StudioHotspotId }> = ({ hotspot }) => {
  const { label, icon: Icon } = INSPECTOR_META[hotspot];
  return (
    <span className="flex items-center gap-1.5 text-xs font-black tracking-widest text-amber-200">
      <Icon aria-hidden="true" className="h-4 w-4" />
      {label}
    </span>
  );
};

const Shell: React.FC<{
  hotspot: StudioHotspotId;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ hotspot, onClose, children }) => (
  <div
    className="absolute inset-0 z-20"
    onClick={(e) => {
      // Backdrop click closes; the panel stops propagation itself.
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <div className="absolute inset-0 bg-black/25" />
    <div
      role="dialog"
      aria-label={INSPECTOR_META[hotspot].label}
      className={`absolute ${ANCHORS[hotspot]} w-72 max-w-[80vw] max-h-[78%] overflow-y-auto rounded-lg border border-amber-400/30 bg-[#0e1320]/95 backdrop-blur-md shadow-2xl shadow-black/60 animate-inspector-pop`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black/40 sticky top-0">
        <InspectorTitle hotspot={hotspot} />
        <button
          onClick={() => {
            void gameAudio.playTactileClick();
            onClose();
          }}
          aria-label="Close inspector"
          className="rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3 space-y-3 text-sm text-gray-100">{children}</div>
    </div>
  </div>
);

const StatRow: React.FC<{ label: string; value: React.ReactNode; valueClass?: string }> = ({
  label, value, valueClass = 'text-white',
}) => (
  <div className="flex items-center justify-between text-xs">
    <span className="text-gray-400">{label}</span>
    <span className={`font-semibold ${valueClass}`}>{value}</span>
  </div>
);

const MiniBar: React.FC<{ value: number; className?: string }> = ({ value, className = 'bg-amber-400' }) => (
  <div className="h-1.5 w-full rounded bg-white/10 overflow-hidden">
    <div className={`h-full ${className}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

export const StudioInspector: React.FC<StudioInspectorProps> = ({
  hotspot,
  gameState,
  onClose,
  onAdvanceDay,
  onRefreshProjects,
  onStartProject,
  onAssignStaff,
  onUnassignStaff,
  onOpenDashboardTab,
  onConsoleFocus,
}) => {
  // Esc closes the inspector, and opening plays tactile gear switch.
  useEffect(() => {
    void gameAudio.playGearSwitch(0.4);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        void gameAudio.playTactileClick();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hotspot, onClose]);

  const project = gameState.activeProject;


  /* ------------------------------- phone -------------------------------- */
  if (hotspot === 'phone') {
    const cooldown = gigRefreshCooldownRemaining(gameState);
    const ready = cooldown === 0;
    const gigs = gameState.availableProjects.slice(0, 4);
    return (
      <Shell hotspot={hotspot} onClose={onClose}>
        {gigs.length === 0 && <div className="text-xs text-gray-400">No offers on the desk. Chase fresh gigs below.</div>}
        {gigs.map((gig) => (
          <div key={gig.id} className="rounded border border-white/10 bg-white/5 p-2 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-white text-xs">{gig.title}</span>
              <span className="text-[10px] px-1 py-0.5 rounded bg-red-600/80 text-white whitespace-nowrap">{gig.clientType}</span>
            </div>
            <StatRow label="Genre" value={gig.genre} />
            <StatRow label="Payout" value={`$${gig.payoutBase}`} valueClass="text-green-400" />
            <StatRow label="Rep" value={`+${gig.repGainBase}`} valueClass="text-blue-400" />
            <Button
              size="sm"
              className="w-full h-7 mt-1 bg-green-600 hover:bg-green-700 text-white text-xs"
              disabled={!!project}
              onClick={() => { onStartProject(gig); onClose(); }}
            >
              {project ? 'Console busy…' : 'Take Gig'}
            </Button>
          </div>
        ))}
        <div className="pt-1 border-t border-white/10">
          <Button
            size="sm"
            variant="outline"
            className={`w-full h-7 text-xs border-white/20 ${ready ? 'text-amber-200 hover:bg-amber-500/10' : 'text-gray-500'}`}
            onClick={() => onRefreshProjects?.()}
          >
            <ActionIcon icon={ready ? PhoneCall : PhoneOff} />
            {ready
              ? `Chase New Gigs — $${GIG_REFRESH_COST}`
              : `No leads — ${cooldown}/${GIG_REFRESH_COOLDOWN_DAYS} days`}
          </Button>
        </div>
      </Shell>
    );
  }

  /* -------------------------------- clock ------------------------------- */
  if (hotspot === 'clock') {
    const salaries = gameState.hiredStaff.reduce((sum, s) => sum + s.salary, 0);
    const upkeep = calculateEquipmentUpkeep(gameState.ownedEquipment);
    const nextReq = ProgressionSystem.getNextUnlockRequirements(gameState);
    const status = ProgressionSystem.getProgressionStatus(gameState);
    return (
      <Shell hotspot={hotspot} onClose={onClose}>
        <StatRow label="Day" value={gameState.currentDay} />
        <StatRow label="Year" value={gameState.currentYear} />
        <StatRow label="Daily salaries" value={`-$${salaries}`} valueClass="text-red-400" />
        <StatRow label="Equipment upkeep" value={`-$${upkeep}`} valueClass="text-red-400" />
        <StatRow label="Net burn" value={`-$${salaries + upkeep}/day`} valueClass="text-orange-300" />
        <div className="pt-1 border-t border-white/10">
          <StatRow
            label="Studio tier"
            value={status.currentMilestone ? `L${status.currentMilestone.level}` : 'L1'}
          />
          <div className="mt-1"><MiniBar value={(status.progressToNext ?? 0) * 100} className="bg-blue-400" /></div>
          {nextReq && (
            <div className="mt-1 text-[10px] text-gray-400">
              Next: L{nextReq.levelNeeded} · {nextReq.currentStaff}/{nextReq.staffNeeded} staff · {nextReq.currentProjects}/{nextReq.projectsNeeded} projects
            </div>
          )}
        </div>
        <Button
          size="sm"
          className="w-full h-8 bg-purple-600 hover:bg-purple-700 text-white text-xs"
          onClick={() => { onAdvanceDay(); onClose(); }}
        >
          <ActionIcon icon={CalendarDays} />
          Advance to Day {gameState.currentDay + 1}
        </Button>
        {(() => {
          const challenge = checkDailyChallenge(gameState);
          return (
            <div className="pt-2 border-t border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-200">
                  🎯 {challenge.def.title}
                </span>
                {challenge.done && <span className="text-xs text-green-400">✓ Done</span>}
              </div>
              <div className="text-[10px] text-gray-400">{challenge.def.description}</div>
              <MiniBar value={(challenge.progress / challenge.def.target) * 100} className="bg-amber-400" />
              <div className="text-[10px] text-gray-400">
                {challenge.progress}/{challenge.def.target} · Reward: ${challenge.def.reward.money}, +{challenge.def.reward.reputation} rep, +{challenge.def.reward.xp} XP
              </div>
            </div>
          );
        })()}
      </Shell>
    );
  }

  /* --------------------------------- tv --------------------------------- */
  if (hotspot === 'tv') {
    const charts = gameState.chartsData?.charts ?? [];
    const topEntries = charts.flatMap((c) => c.entries.slice(0, 2).map((e) => ({ chart: c.name, entry: e }))).slice(0, 4);
    return (
      <Shell hotspot={hotspot} onClose={onClose}>
        <StatRow label="Reputation" value={gameState.reputation} valueClass="text-blue-400" />
        <StatRow label="Influence" value={gameState.influence} valueClass="text-purple-300" />
        {topEntries.length === 0 && (
          <div className="text-xs text-gray-400">No chart data yet — release tracks with a band to enter the charts.</div>
        )}
        {topEntries.map(({ chart, entry }) => (
          <div key={`${chart}-${entry.position}-${entry.song?.id ?? entry.song?.title ?? ''}`} className="flex items-center gap-2 text-xs">
            <span className="w-6 text-center font-black text-amber-300">#{entry.position}</span>
            <span className="flex-1 truncate text-white">{entry.song?.title ?? 'Untitled'}</span>
            <span className={`text-[10px] ${entry.positionChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {entry.positionChange >= 0 ? '▲' : '▼'}{Math.abs(entry.positionChange)}
            </span>
          </div>
        ))}
        <Button
          size="sm"
          variant="outline"
          className="w-full h-7 text-xs border-white/20 text-gray-200 hover:bg-white/10"
          onClick={() => { onOpenDashboardTab('charts'); onClose(); }}
        >
          <ActionIcon icon={Tv} />
          Open Full Charts
        </Button>
      </Shell>
    );
  }

  /* -------------------------------- shelf ------------------------------- */
  if (hotspot === 'shelf') {
    const gear = gameState.ownedEquipment;
    return (
      <Shell hotspot={hotspot} onClose={onClose}>
        <StatRow label="Owned gear" value={gear.length} />
        <StatRow label="Daily upkeep" value={`-$${calculateEquipmentUpkeep(gear)}`} valueClass="text-red-400" />
        <div className="space-y-2">
          {gear.slice(0, 6).map((item) => (
            <div key={item.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate text-white">{item.name}</span>
                <span className={`${item.condition > 60 ? 'text-green-400' : item.condition > 30 ? 'text-amber-400' : 'text-red-400'}`}>
                  {Math.round(item.condition)}%
                </span>
              </div>
              <MiniBar
                value={item.condition}
                className={item.condition > 60 ? 'bg-green-500' : item.condition > 30 ? 'bg-amber-500' : 'bg-red-500'}
              />
            </div>
          ))}
          {gear.length === 0 && <div className="text-xs text-gray-400">Bare shelves — buy gear from the Equipment Shop.</div>}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full h-7 text-xs border-white/20 text-gray-200 hover:bg-white/10"
          onClick={() => { onOpenDashboardTab('studio'); onClose(); }}
        >
          <ActionIcon icon={ShoppingCart} />
          Equipment Shop
        </Button>
      </Shell>
    );
  }


  /* ------------------------------- console ------------------------------ */
  if (hotspot === 'console') {
    if (!project) {
      return (
        <Shell hotspot={hotspot} onClose={onClose}>
          <div className="text-xs text-gray-400">
            The console is dark. Take a gig from the phone to start tracking.
          </div>
          <Button
            size="sm"
            className="w-full h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => onConsoleFocus?.()}
          >
            <ActionIcon icon={SlidersHorizontal} />
            Jump to Work Panel
          </Button>
        </Shell>
      );
    }
    const done = project.stages.filter((s) => s.completed).length;
    const current = project.stages[project.currentStageIndex];
    const frac = current ? Math.min(1, current.workUnitsCompleted / Math.max(1, current.workUnitsBase)) : 0;
    const progress = project.stages.length ? ((done + frac) / project.stages.length) * 100 : 0;
    return (
      <Shell hotspot={hotspot} onClose={onClose}>
        <div className="text-xs font-semibold text-white truncate">{project.title}</div>
        <StatRow label="Stage" value={`${project.currentStageIndex + 1}/${project.stages.length} · ${current?.stageName ?? ''}`} />
        <div><MiniBar value={progress} className="bg-emerald-400" /></div>
        <StatRow label="Progress" value={`${Math.round(progress)}%`} />
        <StatRow label="C / T points" value={`${Math.round(project.accumulatedCPoints)} / ${Math.round(project.accumulatedTPoints)}`} />
        {!!project.comboCount && project.comboCount > 1 && (
          <StatRow label="Combo" value={`⚡ x${project.comboCount}`} valueClass="text-amber-300" />
        )}
        <Button
          size="sm"
          className="w-full h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => { onConsoleFocus?.(); onClose(); }}
        >
          <ActionIcon icon={SlidersHorizontal} />
          Go to Work Panel
        </Button>
      </Shell>
    );
  }

  /* ------------------------------ liveRoom ------------------------------ */
  const crew = gameState.hiredStaff;
  return (
    <Shell hotspot={hotspot} onClose={onClose}>
      {!project && <div className="text-xs text-gray-400">No session booked — the live room is empty.</div>}
      {crew.length === 0 && (
        <div className="text-xs text-gray-400">
          No crew hired yet. Hire staff through the Staff panel while the studio is quiet.
        </div>
      )}
      {crew.map((member) => {
        const assignedHere = !!project && member.assignedProjectId === project.id;
        return (
          <div key={member.id} className="rounded border border-white/10 bg-white/5 p-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white truncate">{member.name}</span>
              <span className="text-[10px] text-gray-400">{member.role}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-pink-300">♪ {Math.round(member.mood)}</span>
              <span className="text-yellow-300">⚡ {Math.round(member.energy)}</span>
              <span className="ml-auto text-gray-400">{member.status}</span>
            </div>
            {project && (
              <Button
                size="sm"
                className={`w-full h-6 text-[10px] ${assignedHere ? 'bg-gray-700 hover:bg-gray-600' : 'bg-emerald-600 hover:bg-emerald-700'} text-white`}
                onClick={() => (assignedHere ? onUnassignStaff(member.id) : onAssignStaff(member.id))}
              >
                {assignedHere ? 'Unassign from session' : 'Assign to session'}
              </Button>
            )}
          </div>
        );
      })}
    </Shell>
  );
};

export default StudioInspector;
