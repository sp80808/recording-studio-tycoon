import { StatIcon } from '@/components/icons/GameIcons';
import { money } from '@/utils/displayMoney';
import React, { useEffect, useState } from 'react';
import { EMPTY_STATES } from '@/data/flavour';
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
import {
  CalendarDays,
  Guitar,
  Mic2,
  Phone,
  PhoneCall,
  PhoneOff,
  ShoppingCart,
  SlidersHorizontal,
  Tv,
  X,
  Check,
  DoorOpen,
  Megaphone,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { getOriginEffects, gigRefreshCostFor } from '@/narrative/originPerks';
import { getEraDecor } from '@/components/studio/studioDecorConfig';
import { gameAudio } from '@/utils/audioSystem';
import {
  MotionPanel,
  MotionButton,
  MotionNumber,
} from '@/components/motion/primitives';
import { findPendingChoreForHotspot } from '@/simulation/choreEngine';
import { ChoreHotspotButton } from '@/components/chores/ChoreHotspotButton';

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
  onCompleteChore?: (hotspot: StudioHotspotId) => boolean;
  onBookings?: () => void;
}

const INSPECTOR_META = {
  phone: { label: 'Booking Line', icon: Phone },
  clock: { label: 'Studio Calendar', icon: CalendarDays },
  tv: { label: 'Charts TV', icon: Tv },
  shelf: { label: 'Gear Locker', icon: Guitar },
  console: { label: 'Mixing Console', icon: SlidersHorizontal },
  liveRoom: { label: 'Live Room', icon: Mic2 },
  door: { label: 'Go Out', icon: DoorOpen },
  promotion: { label: 'Phone & Ring Light', icon: Megaphone },
  cases: { label: 'Flight Cases', icon: Guitar },
  producer: { label: 'Producer', icon: User },
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
    className="studio-inspector-layer absolute z-30"
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} aria-hidden="true" />
    <MotionPanel
      direction="scale"
      role="dialog"
      aria-label={INSPECTOR_META[hotspot].label}
      data-rst-surface="contextual"
      data-rst-world-target={hotspot}
      className="studio-inspector rst-modal absolute overflow-y-auto"
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black/40 sticky top-0 z-10">
        <InspectorTitle hotspot={hotspot} />
        <MotionButton
          onClick={() => {
            void gameAudio.playTactileClick();
            onClose();
          }}
          aria-label="Close inspector"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-stone-400 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </MotionButton>
      </div>
      <div className="p-3 space-y-3 text-sm text-stone-100">{children}</div>
    </MotionPanel>
  </div>
);

const StatRow: React.FC<{ label: string; value: React.ReactNode; valueClass?: string }> = ({
  label, value, valueClass = 'text-white',
}) => (
  <div className="flex items-center justify-between text-xs">
    <span className="text-stone-400">{label}</span>
    <span className={`font-semibold ${valueClass}`}>{value}</span>
  </div>
);

const MiniBar: React.FC<{ value: number; className?: string }> = ({ value, className = 'bg-amber-400' }) => (
  <div className="h-1.5 w-full rounded bg-white/10 overflow-hidden">
    <div className={`h-full ${className}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

/** Shared chore interaction surface — same language as floor ChoreHotspotButton. */
const HotspotChorePanel: React.FC<{
  hotspot: StudioHotspotId;
  gameState: GameState;
  onCompleteChore?: (hotspot: StudioHotspotId) => boolean;
  onClose: () => void;
}> = ({ hotspot, gameState, onCompleteChore, onClose }) => {
  if (hotspot !== 'console' && hotspot !== 'liveRoom' && hotspot !== 'shelf') return null;
  const chore = findPendingChoreForHotspot(gameState.choreState, hotspot);
  if (!chore || !onCompleteChore) return null;
  const shortLabel =
    chore.id === 'tune_acoustics'
      ? 'Tune Acoustics'
      : chore.id === 'brew_espresso'
        ? 'Brew Espresso'
        : chore.title;
  return (
    <div className="rounded border border-[var(--rst-brass-line)] bg-[rgba(24,20,16,0.72)] p-2.5 space-y-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--rst-brass-300)]">
        Floor duty
      </div>
      <p className="text-xs text-stone-400 leading-snug">{chore.description}</p>
      <div className="flex items-center justify-between gap-2">
        <ChoreHotspotButton
          kind={chore.category}
          label={shortLabel}
          meta={chore.energyCost > 0 ? `${chore.energyCost}` : 'Free'}
          attention
          onClick={() => {
            if (onCompleteChore(hotspot)) onClose();
          }}
        />
        <span className="text-[10px] text-stone-500 flex items-center gap-0.5 shrink-0">
          <Zap size={10} aria-hidden="true" />
          {gameState.playerData.dailyWorkCapacity} left
        </span>
      </div>
    </div>
  );
};

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
  onCompleteChore,
  onBookings,
}) => {
  const [actingGigId, setActingGigId] = useState<string | null>(null);
  const [actingStaffId, setActingStaffId] = useState<string | null>(null);

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

  const [offerIndex, setOfferIndex] = useState(0);
  const project = gameState.activeProject;

  const openDashboard = (tab: Parameters<StudioInspectorProps['onOpenDashboardTab']>[0]) => {
    void gameAudio.playTactileClick();
    onClose();
    onOpenDashboardTab(tab);
  };

  if (hotspot === 'door') {
    return (
      <Shell hotspot={hotspot} onClose={onClose}>
        <p className="text-xs text-stone-400">Step outside. Where are you heading?</p>
        <MotionButton autoFocus className="rst-btn rst-btn-ghost w-full min-h-11" onClick={() => openDashboard('studio')}>
          <ActionIcon icon={ShoppingCart} /> Buy equipment
        </MotionButton>
        <MotionButton className="rst-btn rst-btn-ghost w-full min-h-11" onClick={() => openDashboard('bands')}>
          <ActionIcon icon={Guitar} /> Meet artists & book shows
        </MotionButton>
        <MotionButton className="rst-btn rst-btn-ghost w-full min-h-11" onClick={() => openDashboard('staff')}>
          <ActionIcon icon={Users} /> Scout studio crew
        </MotionButton>
      </Shell>
    );
  }

  if (hotspot === 'promotion') {
    if (getEraDecor(gameState.currentEra, gameState.currentYear).prop !== 'led-strip') return null;
    const cooldown = gigRefreshCooldownRemaining(gameState);
    const cost = gigRefreshCostFor(GIG_REFRESH_COST, getOriginEffects(gameState));
    return (
      <Shell hotspot={hotspot} onClose={onClose}>
        <p className="text-xs text-stone-400">Create studio marketing content to bring in a fresh enquiry, contact artists, or plan a promoted show.</p>
        <MotionButton
          className="rst-btn rst-btn-primary w-full min-h-11"
          disabled={!onRefreshProjects || cooldown > 0 || gameState.money < cost}
          onClick={() => { if (onRefreshProjects?.()) { onClose(); onBookings?.(); } }}
        >
          <ActionIcon icon={Megaphone} /> Create marketing content — ${cost}
        </MotionButton>
        <p className="text-[11px] text-stone-400" role="status">
          {cooldown > 0 ? `Outreach ready in ${cooldown} day${cooldown === 1 ? '' : 's'}.` : gameState.money < cost ? `You need ${money(cost)} for outreach.` : 'One new booking lead. Shares the gig-outreach cooldown.'}
        </p>
        <MotionButton autoFocus className="rst-btn rst-btn-ghost w-full min-h-11" onClick={() => openDashboard('charts')}>
          <ActionIcon icon={PhoneCall} /> Contact artists
        </MotionButton>
        <MotionButton className="rst-btn rst-btn-ghost w-full min-h-11" onClick={() => openDashboard('bands')}>
          <ActionIcon icon={Guitar} /> Plan shows & promotions
        </MotionButton>
      </Shell>
    );
  }

  const handleTakeGig = (gig: Project) => {
    if (project || actingGigId) return;
    setActingGigId(gig.id);
    void gameAudio.playTactileClick();

    window.setTimeout(() => {
      onStartProject(gig);
      onClose();
    }, 180);
  };

  const handleToggleStaff = (memberId: string, assigned: boolean) => {
    if (actingStaffId) return;
    setActingStaffId(memberId);
    void gameAudio.playGearSwitch(0.3);

    window.setTimeout(() => {
      if (assigned) {
        onUnassignStaff(memberId);
      } else {
        onAssignStaff(memberId);
      }
      setActingStaffId(null);
    }, 180);
  };

  /* ------------------------------- phone -------------------------------- */
  if (hotspot === 'phone') {
    const cooldown = gigRefreshCooldownRemaining(gameState);
    const ready = cooldown === 0;
    const gigs = gameState.availableProjects.slice(0, 4);
    return (
      <Shell hotspot={hotspot} onClose={onClose}>
        {gigs.length === 0 && <div className="text-xs text-stone-400">No offers on the desk. Chase fresh gigs below.</div>}
        {gigs.length > 1 && <div className="flex items-center justify-between gap-2"><button type="button" className="rst-btn" onClick={() => setOfferIndex(index => (index + gigs.length - 1) % gigs.length)} aria-label="Previous enquiry">←</button><span className="rst-kicker">Enquiry {Math.min(offerIndex, gigs.length - 1) + 1} / {gigs.length}</span><button type="button" className="rst-btn" onClick={() => setOfferIndex(index => (index + 1) % gigs.length)} aria-label="Next enquiry">→</button></div>}
        {gigs.slice(Math.min(offerIndex, Math.max(0, gigs.length - 1)), Math.min(offerIndex, Math.max(0, gigs.length - 1)) + 1).map((gig) => (
          <div key={gig.id} className="rounded border border-white/10 bg-white/5 p-2 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-white text-xs">{gig.title}</span>
              <span className="text-[10px] px-1 py-0.5 rounded bg-red-600/80 text-white whitespace-nowrap">{gig.clientType}</span>
            </div>
            <StatRow label="Genre" value={gig.genre} />
            <StatRow label="Payout" value={money(gig.payoutBase)} valueClass="text-green-400" />
            <StatRow label="Rep" value={`+${gig.repGainBase}`} valueClass="text-amber-300" />
            <MotionButton
              className="w-full h-7 mt-1 bg-emerald-400/[0.14] ring-1 ring-inset ring-emerald-400/45 hover:bg-emerald-400/[0.24] text-emerald-100 text-xs font-bold"
              disabled={!!project || !!actingGigId}
              data-rst-action-id="phone:accept"
              data-rst-world-target="phone"
              onClick={() => handleTakeGig(gig)}
            >
              {actingGigId === gig.id ? (
                <span className="flex items-center justify-center gap-1"><Check size={12} /> Starting…</span>
              ) : project ? (
                'Console busy…'
              ) : (
                'Take Gig'
              )}
            </MotionButton>
          </div>
        ))}
        <div className="pt-1 border-t border-white/10">
          <MotionButton
            className={`w-full h-7 text-xs border-white/20 ${ready ? 'text-amber-200 hover:bg-amber-500/10' : 'text-stone-500'}`}
            onClick={() => {
              void gameAudio.playTactileClick();
              onRefreshProjects?.();
            }}
          >
            <ActionIcon icon={ready ? PhoneCall : PhoneOff} />
            {ready
              ? `Chase New Gigs — ${money(GIG_REFRESH_COST)}`
              : `No leads — ${cooldown}/${GIG_REFRESH_COOLDOWN_DAYS} days`}
          </MotionButton>
        </div>
      </Shell>
    );
  }

  /* -------------------------------- clock ------------------------------- */
  if (hotspot === 'producer') {
    const player = gameState.playerData;
    const energy = player.dailyWorkCapacity ?? 0;
    const task = project ? project.title : null;
    const mood =
      energy <= 0 ? "Running on fumes. A rest day would do you good."
      : project ? 'Headphones on, eyes on the meters.'
      : 'Between sessions. The phone is where the next job comes from.';
    return (
      <Shell hotspot={hotspot} onClose={onClose}>
        <div className="flex items-baseline justify-between">
          <span className="text-base font-black text-amber-100">{player.name || 'The Producer'}</span>
          <span className="text-xs font-bold text-amber-300">Level {player.level}</span>
        </div>
        <div>
          <StatRow label="XP" value={`${Math.floor(player.xp)} / ${player.xpToNextLevel}`} />
          <div className="mt-1"><MiniBar value={player.xpToNextLevel > 0 ? (player.xp / player.xpToNextLevel) * 100 : 0} className="bg-amber-400" /></div>
        </div>
        <StatRow label="Energy today" value={<><MotionNumber value={energy} suffix="⚡" /></>} valueClass={energy <= 0 ? 'text-red-400' : 'text-amber-300'} />
        <StatRow label="Reputation" value={player.reputation} />
        <StatRow label="Right now" value={task ?? 'Free'} valueClass={task ? 'text-emerald-300' : 'text-stone-300'} />
        <div className="text-[11px] italic text-stone-400">{mood}</div>
        <div className="grid grid-cols-2 gap-2">
          <MotionButton
            className="h-8 bg-amber-400/[0.14] ring-1 ring-inset ring-amber-400/45 hover:bg-amber-400/[0.24] text-amber-100 text-xs font-bold"
            onClick={() => {
              void gameAudio.playTactileClick();
              onClose();
              if (project) onConsoleFocus?.();
              else onBookings?.();
            }}
          >
            {project ? 'Open session' : 'Book a gig'}
          </MotionButton>
          <MotionButton
            className="h-8 bg-purple-400/[0.14] ring-1 ring-inset ring-purple-400/45 hover:bg-purple-400/[0.24] text-purple-100 text-xs font-bold"
            onClick={() => {
              void gameAudio.playTactileClick();
              onClose();
              onOpenDashboardTab('skills');
            }}
          >
            Skills
          </MotionButton>
        </div>
      </Shell>
    );
  }

  if (hotspot === 'clock') {
    const salaries = gameState.hiredStaff.reduce((sum, s) => sum + s.salary, 0);
    const upkeep = calculateEquipmentUpkeep(gameState.ownedEquipment, getOriginEffects(gameState));
    const nextReq = ProgressionSystem.getNextUnlockRequirements(gameState);
    const status = ProgressionSystem.getProgressionStatus(gameState);
    return (
      <Shell hotspot={hotspot} onClose={onClose}>
        <StatRow label="Day" value={<MotionNumber value={gameState.currentDay} />} />
        <StatRow label="Year" value={gameState.currentYear} />
        <StatRow label="Daily salaries" value={`-${money(salaries)}`} valueClass="text-red-400" />
        <StatRow label="Equipment upkeep" value={`-${money(upkeep)}`} valueClass="text-red-400" />
        <StatRow label="Net burn" value={`-${money(salaries + upkeep)}/day`} valueClass="text-orange-300" />
        <div className="pt-1 border-t border-white/10">
          <StatRow
            label="Studio tier"
            value={status.currentMilestone ? `L${status.currentMilestone.level}` : 'L1'}
          />
          <div className="mt-1"><MiniBar value={(status.progressToNext ?? 0) * 100} className="bg-amber-400" /></div>
          {nextReq && (
            <div className="mt-1 text-[10px] text-stone-400">
              Next: L{nextReq.levelNeeded} · {nextReq.currentStaff}/{nextReq.staffNeeded} staff · {nextReq.currentProjects}/{nextReq.projectsNeeded} projects
            </div>
          )}
        </div>
        <MotionButton
          className="w-full h-8 bg-purple-400/[0.14] ring-1 ring-inset ring-purple-400/45 hover:bg-purple-400/[0.24] text-purple-100 text-xs font-bold"
          onClick={() => {
            void gameAudio.playTactileClick();
            onAdvanceDay();
            onClose();
          }}
        >
          <ActionIcon icon={CalendarDays} />
          Advance to Day {gameState.currentDay + 1}
        </MotionButton>
        {(() => {
          const challenge = checkDailyChallenge(gameState);
          return (
            <div className="pt-2 border-t border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-200">
                  <StatIcon name="goal" /> {challenge.def.title}
                </span>
                {challenge.done && <span className="text-xs text-green-400"><StatIcon name="check" /> Done</span>}
              </div>
              <div className="text-[10px] text-stone-400">{challenge.def.description}</div>
              <MiniBar value={(challenge.progress / challenge.def.target) * 100} className="bg-amber-400" />
              <div className="text-[10px] text-stone-400">
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
        <StatRow label="Reputation" value={<MotionNumber value={gameState.reputation} />} valueClass="text-amber-300" />
        <StatRow label="Influence" value={<MotionNumber value={gameState.influence} />} valueClass="text-purple-300" />
        {topEntries.length === 0 && (
          <div className="text-xs text-stone-400">{EMPTY_STATES.chart.title} {EMPTY_STATES.chart.hint}</div>
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
        <MotionButton
          className="w-full h-7 text-xs border-white/20 text-stone-200 hover:bg-white/10"
          onClick={() => {
            void gameAudio.playTactileClick();
            onOpenDashboardTab('charts');
            onClose();
          }}
        >
          <ActionIcon icon={Tv} />
          Open Full Charts
        </MotionButton>
      </Shell>
    );
  }

  /* -------------------------------- shelf ------------------------------- */
  if (hotspot === 'shelf') {
    const gear = gameState.ownedEquipment;
    return (
      <Shell hotspot={hotspot} onClose={onClose}>
        <HotspotChorePanel
          hotspot={hotspot}
          gameState={gameState}
          onCompleteChore={onCompleteChore}
          onClose={onClose}
        />
        <StatRow label="Owned gear" value={<MotionNumber value={gear.length} />} />
        <StatRow label="Daily upkeep" value={`-${money(calculateEquipmentUpkeep(gear, getOriginEffects(gameState)))}`} valueClass="text-red-400" />
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
          {gear.length === 0 && <div className="text-xs text-stone-400">Bare shelves — buy gear from the Equipment Shop.</div>}
        </div>
        <MotionButton
          className="w-full h-7 text-xs border-white/20 text-stone-200 hover:bg-white/10"
          onClick={() => {
            void gameAudio.playTactileClick();
            onOpenDashboardTab('studio');
            onClose();
          }}
        >
          <ActionIcon icon={ShoppingCart} />
          Equipment Shop
        </MotionButton>
      </Shell>
    );
  }

  /* ------------------------------- console ------------------------------ */
  if (hotspot === 'console') {
    if (!project) {
      return (
        <Shell hotspot={hotspot} onClose={onClose}>
          <HotspotChorePanel
            hotspot={hotspot}
            gameState={gameState}
            onCompleteChore={onCompleteChore}
            onClose={onClose}
          />
          <div className="text-xs text-stone-400">
            The console is dark. Take a gig from the phone to start tracking.
          </div>
          <MotionButton
            className="w-full h-7 text-xs bg-amber-400/[0.14] ring-1 ring-inset ring-amber-400/45 hover:bg-amber-400/[0.24] text-amber-100 font-bold"
            onClick={() => onConsoleFocus?.()}
          >
            <ActionIcon icon={SlidersHorizontal} />
            Jump to Work Panel
          </MotionButton>
        </Shell>
      );
    }
    const done = project.stages.filter((s) => s.completed).length;
    const current = project.stages[project.currentStageIndex];
    const frac = current ? Math.min(1, current.workUnitsCompleted / Math.max(1, current.workUnitsBase)) : 0;
    const progress = project.stages.length ? ((done + frac) / project.stages.length) * 100 : 0;
    return (
      <Shell hotspot={hotspot} onClose={onClose}>
        <HotspotChorePanel
          hotspot={hotspot}
          gameState={gameState}
          onCompleteChore={onCompleteChore}
          onClose={onClose}
        />
        <div className="text-xs font-semibold text-white truncate">{project.title}</div>
        <StatRow label="Stage" value={`${project.currentStageIndex + 1}/${project.stages.length} · ${current?.stageName ?? ''}`} />
        <div><MiniBar value={progress} className="bg-emerald-400" /></div>
        <StatRow label="Progress" value={`${Math.round(progress)}%`} />
        <StatRow label="C / T points" value={`${Math.round(project.accumulatedCPoints)} / ${Math.round(project.accumulatedTPoints)}`} />
        {!!project.comboCount && project.comboCount > 1 && (
          <StatRow label="Combo" value={`x${project.comboCount}`} valueClass="text-amber-300" />
        )}
        <MotionButton
          className="w-full h-7 text-xs bg-amber-400/[0.14] ring-1 ring-inset ring-amber-400/45 hover:bg-amber-400/[0.24] text-amber-100 font-bold"
          onClick={() => {
            void gameAudio.playTactileClick();
            onConsoleFocus?.();
            onClose();
          }}
        >
          <ActionIcon icon={SlidersHorizontal} />
          Go to Work Panel
        </MotionButton>
      </Shell>
    );
  }

  /* ------------------------------ liveRoom ------------------------------ */
  // Secondary surface if opened programmatically; floor click prefers chore → session.
  const crew = gameState.hiredStaff;
  return (
    <Shell hotspot={hotspot} onClose={onClose}>
      <HotspotChorePanel
        hotspot={hotspot}
        gameState={gameState}
        onCompleteChore={onCompleteChore}
        onClose={onClose}
      />
      {!project && (
        <div className="text-xs text-stone-400">
          {EMPTY_STATES.sessionRoom.title} {EMPTY_STATES.sessionRoom.hint}
        </div>
      )}
      {project && (
        <>
          <div className="text-xs font-semibold text-white truncate">{project.title}</div>
          <StatRow label="Client" value={project.clientName ?? '—'} />
        </>
      )}
      <MotionButton
        className="w-full h-7 text-xs bg-amber-400/[0.14] ring-1 ring-inset ring-amber-400/45 hover:bg-amber-400/[0.24] text-amber-100 font-bold"
        onClick={() => {
          void gameAudio.playTactileClick();
          onConsoleFocus?.();
          onClose();
        }}
      >
        <ActionIcon icon={SlidersHorizontal} />
        {project ? 'Go to Work Panel' : 'Jump to Work Panel'}
      </MotionButton>
      <MotionButton
        className="w-full h-7 text-xs border-white/20 text-stone-200 hover:bg-white/10"
        onClick={() => openDashboard('staff')}
      >
        <ActionIcon icon={Users} />
        Open Crew
      </MotionButton>
      {crew.length === 0 && (
        <div className="text-xs text-stone-400">
          {EMPTY_STATES.crew.title} {EMPTY_STATES.crew.hint}
        </div>
      )}
      {crew.map((member) => {
        const assignedHere = !!project && member.assignedProjectId === project.id;
        const isActing = actingStaffId === member.id;
        return (
          <div key={member.id} className="rounded border border-white/10 bg-white/5 p-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white truncate">{member.name}</span>
              <span className="text-[10px] text-stone-400">{member.role}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-pink-300"><StatIcon name="mood" /> {Math.round(member.mood)}</span>
              <span className="text-yellow-300"><StatIcon name="energy" /> {Math.round(member.energy)}</span>
              <span className="ml-auto text-stone-400">{member.status}</span>
            </div>
            {project && (
              <MotionButton
                className={`w-full h-6 text-[10px] font-bold ${
                  assignedHere ? 'bg-white/[0.07] ring-1 ring-inset ring-white/15 hover:bg-white/[0.13]' : 'bg-emerald-400/[0.14] hover:bg-emerald-400/[0.24]'
                } text-white`}
                disabled={isActing}
                onClick={() => handleToggleStaff(member.id, assignedHere)}
              >
                {isActing ? (
                  <span className="flex items-center justify-center gap-1"><Check size={10} /> Updating…</span>
                ) : assignedHere ? (
                  'Unassign from session'
                ) : (
                  'Assign to session'
                )}
              </MotionButton>
            )}
          </div>
        );
      })}
    </Shell>
  );
};

export default StudioInspector;
