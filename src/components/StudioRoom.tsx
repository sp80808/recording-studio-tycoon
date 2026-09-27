import React, { useMemo } from 'react';
import WebGLCanvas, { StudioHotspotId } from '@/components/WebGLCanvas';
import { GameState } from '@/types/game';
import { useSettings } from '@/contexts/SettingsContext';
import { gameAudio } from '@/utils/audioSystem';
import { toast } from '@/hooks/use-toast';

interface StudioRoomProps {
  gameState: GameState;
  onAdvanceDay: () => void;
  onRefreshCandidates: () => void;
  onConsoleFocus: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * The isometric studio floor — the diegetic "home screen" of the game.
 * Wraps the PixiJS room, derives live state from the game state, and
 * translates hotspot clicks into real game actions.
 */
export const StudioRoom: React.FC<StudioRoomProps> = ({
  gameState, onAdvanceDay, onRefreshCandidates, onConsoleFocus, className = '', style,
}) => {
  const { settings } = useSettings();
  const playClick = () => { if (settings.sfxEnabled) gameAudio.playUISound('buttonClick'); };

  const sceneState = useMemo(() => {
    const project = gameState.activeProject;
    let progress = 0;
    if (project) {
      const done = project.stages.filter((s) => s.completed).length;
      const current = project.stages[project.currentStageIndex];
      const currentFrac = current
        ? Math.min(1, current.workUnitsCompleted / Math.max(1, current.workUnitsBase))
        : 0;
      progress = project.stages.length > 0 ? (done + currentFrac) / project.stages.length : 0;
    }
    const workingStaff = gameState.hiredStaff.filter((s) => s.status === 'Working').length;
    const presentStaff = gameState.hiredStaff.filter((s) => s.status !== 'Resting').length;
    const activity = Math.min(
      1,
      0.08 + (project ? 0.3 + progress * 0.45 : 0) + workingStaff * 0.08
    );
    return {
      activity,
      hasActiveProject: !!project,
      staffOnFloor: Math.min(5, 1 + presentStaff),
      ownedEquipment: gameState.ownedEquipment.length,
      day: gameState.currentDay,
    };
  }, [gameState.activeProject, gameState.hiredStaff, gameState.ownedEquipment, gameState.currentDay]);

  const handleHotspot = (id: StudioHotspotId) => {
    playClick();
    switch (id) {
      case 'console':
        if (gameState.activeProject) {
          onConsoleFocus();
          toast({ title: '🎛 Console Ready', description: `Session in progress: "${gameState.activeProject.title}".` });
        } else {
          toast({
            title: '🎛 Console Idle',
            description: 'No session booked — pick a gig from the Projects list to start tracking.',
            variant: 'destructive',
          });
        }
        break;
      case 'phone':
        onRefreshCandidates();
        toast({ title: '📞 Calls Made', description: 'Your assistant chased the labels — fresh gig offers incoming.' });
        break;
      case 'clock':
        onAdvanceDay();
        break;
      case 'tv':
        toast({ title: '📺 Charts TV', description: `Standing: ${gameState.reputation} reputation. Hit the Charts tab to scout artists.` });
        break;
      case 'shelf':
        toast({ title: '🎸 Gear Locker', description: `You own ${gameState.ownedEquipment.length} pieces of gear. Upgrade in the Equipment Shop.` });
        break;
      case 'liveRoom':
        if (gameState.activeProject) {
          onConsoleFocus();
          toast({ title: '🎤 Live Room', description: 'Talent is waiting behind the glass — get to work on the console.' });
        } else {
          toast({ title: '🎤 Live Room Empty', description: 'Book a project first, then the band will hit the floor.' });
        }
        break;
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-lg border border-gray-700/70 bg-[#11151f] ${className}`} style={style}>
      <WebGLCanvas state={sceneState} onHotspotSelect={handleHotspot} />
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-2 left-3 flex items-center gap-2">
          <span className="px-2 py-1 text-[10px] font-black tracking-[0.2em] text-gray-100 bg-black/50 border border-white/10 rounded">
            🎛 STUDIO FLOOR
          </span>
          <span className="px-2 py-1 text-[10px] font-bold tracking-wider text-emerald-300/90 bg-black/50 border border-white/10 rounded">
            {gameState.currentYear}
          </span>
        </div>
        <div className="absolute top-2 right-3">
          <span className="px-2 py-1 text-[10px] font-black tracking-[0.15em] text-amber-300 bg-black/50 border border-white/10 rounded">
            ☀ DAY {gameState.currentDay}
          </span>
        </div>
        {!gameState.activeProject && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
            <span className="animate-pulse px-3 py-1.5 text-xs font-semibold text-gray-100 bg-black/60 border border-amber-400/40 rounded-full">
              📞 No session booked — click the phone or pick a gig
            </span>
          </div>
        )}
        <div className="absolute bottom-2 inset-x-0 flex justify-center">
          <div className="flex flex-wrap justify-center gap-1.5 px-2">
            {[['🎛','Work'],['📞','Gigs'],['🕐','Next Day'],['📺','Charts'],['🎸','Gear'],['🎤','Session']]
              .map(([icon, label]) => (
                <span key={label} className="px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-gray-300/90 bg-black/45 border border-white/10 rounded">
                  {icon} {label}
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioRoom;
