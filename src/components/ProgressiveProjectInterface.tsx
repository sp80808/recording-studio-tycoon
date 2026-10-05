// Progressive Project Interface - Automatically switches between single and multi-project views
import React, { useState, useEffect, useRef } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp } from 'lucide-react'; // Removed Users
import { GameState, Project, GameNotification, FocusAllocation, SessionIntervention } from '@/types/game';
import { ProgressionSystem, ProgressionStatus } from '@/services/ProgressionSystem';
import { MultiProjectDashboard } from '@/components/MultiProjectDashboard';
import { ActiveProject } from '@/components/ActiveProject';
import { toast } from '@/hooks/use-toast';

interface ProgressiveProjectInterfaceProps {
  gameState: GameState;
  setGameState: (state: GameState | ((prev: GameState) => GameState)) => void;
  // focusAllocation?: FocusAllocation; // REMOVED
  // setFocusAllocation?: (allocation: FocusAllocation) => void; // REMOVED
  performDailyWork?: (options?: import('@/hooks/useStageWork').PerformDailyWorkOptions) => { isComplete: boolean; finalProjectData?: Project } | undefined;
  onMinigameReward?: (creativityBonus: number, technicalBonus: number, xpBonus: number, minigameType?: string) => void;
  onProjectComplete?: (completedProject: Project) => void;
  onProjectSelect?: (project: Project) => void;
  autoTriggeredMinigame?: SessionIntervention | null;
  clearAutoTriggeredMinigame?: () => void;
}

/** Save seeds that already saw the multi-project unlock toast this session. */
const firedMultiProjectToast = new Set<string>();

export const ProgressiveProjectInterface: React.FC<ProgressiveProjectInterfaceProps> = ({
  gameState,
  setGameState,
  // focusAllocation, // REMOVED
  // setFocusAllocation, // REMOVED
  performDailyWork,
  onMinigameReward,
  onProjectComplete,
  onProjectSelect,
  autoTriggeredMinigame,
  clearAutoTriggeredMinigame
}) => {
  const [progressionStatus, setProgressionStatus] = useState<ProgressionStatus | null>(null);
  const [lastMilestone, setLastMilestone] = useState<number>(0); // Added this line
  // const [showProgressionInfo, setShowProgressionInfo] = useState(false); // Unused
  const [showMultiProjectInTransition, setShowMultiProjectInTransition] = useState(false); // Lifted state for renderTransitionView
  /** Advanced view: dashboard vs per-project session work (sliders live here). */
  const [showSessionWork, setShowSessionWork] = useState(false);
  /** Tracks the last unlock state so the unlock toast fires once, at the point of unlock. */
  const prevUnlockedRef = useRef(false);

  // Check progression status on game state changes
  useEffect(() => {
    const status = ProgressionSystem.getProgressionStatus(gameState);
    setProgressionStatus(status);

    // Check for milestone progression and add notification
    const currentMilestoneLevel = status.currentMilestone?.level || 0;
    if (currentMilestoneLevel > lastMilestone && lastMilestone > 0) {
      // Add milestone unlock notification
      const notification: GameNotification = {
        id: `milestone_${currentMilestoneLevel}_${Date.now()}`,
        message: status.currentMilestone?.unlockMessage || 'New milestone reached!',
        type: 'success',
        timestamp: Date.now(),
        duration: 8000,
        priority: 'high'
      };
      
      setGameState(prev => ({
        ...prev,
        notifications: [...prev.notifications, notification]
      }));
    }
    setLastMilestone(currentMilestoneLevel);
  }, [gameState.playerData.level, gameState.hiredStaff.length, lastMilestone, setGameState]);

  // Multi-project unlock is announced with a one-shot toast, not a persistent
  // banner, so the project view stays compact.
  useEffect(() => {
    const unlocked = !!progressionStatus?.isMultiProjectUnlocked;
    const key = String(gameState.saveSeed ?? 'default');
    if (unlocked && !prevUnlockedRef.current && !firedMultiProjectToast.has(key)) {
      firedMultiProjectToast.add(key);
      toast({
        title: '🎉 Multi-Project Management Unlocked!',
        description: 'Your studio can now handle multiple projects simultaneously.',
        duration: 6000,
      });
    }
    prevUnlockedRef.current = unlocked;
  }, [progressionStatus?.isMultiProjectUnlocked, gameState.saveSeed]);


  if (!progressionStatus) {
    return <div>Loading...</div>;
  }

  // Render single project view for early game
  const renderSingleProjectView = () => {
    return (
      <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden p-0.5">        
        {/* Hint about upcoming multi-project capability */}
        {progressionStatus.progressToNext > 0.7 && progressionStatus.nextMilestone && (
          <Alert className="border-yellow-600/70 bg-stone-900/90 shrink-0 mb-2 py-2">
            <TrendingUp className="w-4 h-4 text-yellow-400" />
            <AlertDescription className="text-yellow-200 text-xs">
              <strong>Studio Expansion Coming Soon:</strong> You're close to unlocking multi-project management. 
            </AlertDescription>
          </Alert>
        )}

        {/* Traditional single project interface */}
        <ActiveProject
          gameState={gameState}
          setGameState={setGameState}
          // focusAllocation={currentFocusAllocation} // REMOVED
          // setFocusAllocation={handleSetFocusAllocation} // REMOVED
          onProjectSelect={onProjectSelect}
          performDailyWork={performDailyWork}
          onMinigameReward={onMinigameReward}
          onProjectComplete={onProjectComplete}
          autoTriggeredMinigame={autoTriggeredMinigame}
          clearAutoTriggeredMinigame={clearAutoTriggeredMinigame}
        />
      </div>
    );
  };

  // Render transition view when multi-project is newly unlocked.
  // Condensed to the same single-row segmented switcher as the advanced view —
  // the unlock announcement is a toast, not a banner.
  const renderTransitionView = () => {
    return (
      <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden">
        <div className="mb-1.5 flex shrink-0 items-center gap-1 rounded border border-stone-700 bg-stone-900/70 p-0.5" role="tablist" aria-label="Project view">
          <button
            type="button"
            role="tab"
            aria-selected={!showMultiProjectInTransition}
            onClick={() => setShowMultiProjectInTransition(false)}
            className={`rst-btn flex-1 !min-h-7 !text-[11px] ${!showMultiProjectInTransition ? 'rst-btn-primary' : ''}`}
          >
            Simple
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={showMultiProjectInTransition}
            onClick={() => setShowMultiProjectInTransition(true)}
            className={`rst-btn flex-1 !min-h-7 !text-[11px] ${showMultiProjectInTransition ? 'rst-btn-primary' : ''}`}
          >
            Multi
          </button>
        </div>

        {/* Render selected view */}
        {showMultiProjectInTransition ? (
          <div className="edge-fade-b min-h-0 flex-1 overflow-y-auto pr-1">
            <MultiProjectDashboard
              gameState={gameState}
              setGameState={setGameState}
              onProjectSelect={onProjectSelect}
              onWorkSession={(project) => {
                onProjectSelect?.(project);
                setShowMultiProjectInTransition(false);
              }}
            />
          </div>
        ) : (
          <ActiveProject
            gameState={gameState}
            setGameState={setGameState}
            // focusAllocation={currentFocusAllocation} // REMOVED
            // setFocusAllocation={handleSetFocusAllocation} // REMOVED
            onProjectSelect={onProjectSelect}
            performDailyWork={performDailyWork}
            onMinigameReward={onMinigameReward}
            onProjectComplete={onProjectComplete}
            autoTriggeredMinigame={autoTriggeredMinigame}
            clearAutoTriggeredMinigame={clearAutoTriggeredMinigame}
          />
        )}
      </div>
    );
  };

  // Render advanced multi-project view for experienced players.
  // Same Session-work | Dashboard toggle as the transition view, so the
  // per-project session sliders are always one tap away (bead muk).
  const renderAdvancedMultiProjectView = () => {
    return (
      <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden">
        <div className="mb-1.5 flex shrink-0 items-center gap-1 rounded border border-stone-700 bg-stone-900/70 p-0.5" role="tablist" aria-label="Session workspace">
          <button
            type="button"
            role="tab"
            aria-selected={showSessionWork}
            onClick={() => setShowSessionWork(true)}
            className={`rst-btn flex-1 !min-h-7 !text-[11px] ${showSessionWork ? 'rst-btn-primary' : ''}`}
          >
            Session work
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!showSessionWork}
            onClick={() => setShowSessionWork(false)}
            className={`rst-btn flex-1 !min-h-7 !text-[11px] ${!showSessionWork ? 'rst-btn-primary' : ''}`}
          >
            Multi dashboard
          </button>
        </div>
        {showSessionWork ? (
          <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
            <ActiveProject
              gameState={gameState}
              setGameState={setGameState}
              onProjectSelect={onProjectSelect}
              performDailyWork={performDailyWork}
              onMinigameReward={onMinigameReward}
              onProjectComplete={onProjectComplete}
              autoTriggeredMinigame={autoTriggeredMinigame}
              clearAutoTriggeredMinigame={clearAutoTriggeredMinigame}
            />
          </div>
        ) : (
          <div className="edge-fade-b min-h-0 flex-1 overflow-y-auto pr-1">
            <MultiProjectDashboard
              gameState={gameState}
              setGameState={setGameState}
              onProjectSelect={onProjectSelect}
              onWorkSession={(project) => {
                onProjectSelect?.(project);
                setShowSessionWork(true);
              }}
            />
          </div>
        )}
      </div>
    );
  };

  // Main render logic based on progression
  const isMultiProjectUnlocked = progressionStatus.isMultiProjectUnlocked;
  const currentLevel = progressionStatus.currentMilestone?.level || 1;
  const isNewlyUnlocked = isMultiProjectUnlocked && currentLevel === 3; // First multi-project milestone

  if (!isMultiProjectUnlocked) {
    return renderSingleProjectView();
  } else if (isNewlyUnlocked) {
    return renderTransitionView();
  } else {
    return renderAdvancedMultiProjectView();
  }
};
