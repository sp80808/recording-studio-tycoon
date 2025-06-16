// Multi-Project Management Hook
import { useCallback, useMemo } from 'react';
import { GameState, Project, StaffMember, AutomationMode, AutomationSettings, FocusAllocation } from '@/types/game'; // Added FocusAllocation
import { ProjectManager, ProjectCapacity, StaffAssignment } from '@/services/ProjectManager';
import { ProgressionSystem } from '@/services/ProgressionSystem';
import { getStageOptimalFocus } from '@/utils/stageUtils'; // ADDED

interface UseMultiProjectManagementProps {
  gameState: GameState;
  setGameState: (state: GameState | ((prev: GameState) => GameState)) => void;
}

export const useMultiProjectManagement = ({ gameState, setGameState }: UseMultiProjectManagementProps) => {
  const projectManager = useMemo(() => new ProjectManager(gameState), [gameState]);

  // Get current project capacity information
  const projectCapacity = useMemo((): ProjectCapacity => {
    return projectManager.calculateProjectCapacity();
  }, [projectManager]);

  // Check if a new project can be added (respects progression limits)
  const canAddProject = useCallback((): boolean => {
    const maxAllowed = ProgressionSystem.getMaxConcurrentProjects(gameState);
    return gameState.activeProjects.length < maxAllowed && projectManager.canAddProject();
  }, [gameState, projectManager]);

  // Add a new project to active projects
  const addProject = useCallback((project: Project): boolean => {
    const success = projectManager.addProject(project);
    if (success) {
      setGameState(prev => ({
        ...prev,
        activeProjects: [...prev.activeProjects, project],
        maxConcurrentProjects: projectManager.calculateProjectCapacity().maxProjects,
        // Remove from available projects
        availableProjects: prev.availableProjects.filter(p => p.id !== project.id)
      }));
    }
    return success;
  }, [projectManager, setGameState]);

  // Remove a project from active projects
  const removeProject = useCallback((projectId: string): boolean => {
    const project = gameState.activeProjects.find(p => p.id === projectId);
    if (!project) return false;

    const success = projectManager.removeProject(projectId);
    if (success) {
      setGameState(prev => ({
        ...prev,
        activeProjects: prev.activeProjects.filter(p => p.id !== projectId),
        // Clear staff assignments for this project
        hiredStaff: prev.hiredStaff.map(staff => ({
          ...staff,
          assignedProjectId: staff.assignedProjectId === projectId ? null : staff.assignedProjectId,
          status: staff.assignedProjectId === projectId ? 'Idle' : staff.status
        }))
      }));
    }
    return success;
  }, [gameState.activeProjects, projectManager, setGameState]);

  // Toggle automation on/off (respects progression features)
  const toggleAutomation = useCallback((enabled: boolean): void => {
    if (enabled && !ProgressionSystem.isFeatureUnlocked(gameState, 'basic_automation')) {
      // Don't enable automation if not unlocked
      return;
    }
    
    setGameState(prev => ({
      ...prev,
      automation: {
        ...prev.automation!,
        enabled,
        mode: enabled ? (prev.automation!.mode === 'off' ? 'basic' : prev.automation!.mode) : 'off'
      }
    }));
  }, [gameState, setGameState]);

  // Update automation mode
  const setAutomationMode = useCallback((mode: AutomationMode): void => {
    setGameState(prev => ({
      ...prev,
      automation: {
        ...prev.automation!,
        mode,
        enabled: mode !== 'off'
      }
    }));
  }, [setGameState]);

  // Update automation settings
  const updateAutomationSettings = useCallback((settings: Partial<AutomationSettings>): void => {
    setGameState(prev => ({
      ...prev,
      automation: {
        ...prev.automation!,
        settings: {
          ...prev.automation!.settings,
          ...settings
        }
      }
    }));
  }, [setGameState]);

  // Get optimal staff assignments for current projects
  const getOptimalStaffAssignments = useCallback((): StaffAssignment[] => {
    return projectManager.optimizeStaffAssignments();
  }, [projectManager]);

  // Apply optimal staff assignments
  const applyOptimalStaffAssignments = useCallback((): void => {
    const assignments = projectManager.optimizeStaffAssignments();
    
    setGameState(prev => {
      const newHiredStaff = prev.hiredStaff.map(staff => {
        const assignment = assignments.find(a => a.staffId === staff.id);
        return {
          ...staff,
          assignedProjectId: assignment?.projectId || null,
          status: assignment ? 'Working' : 'Idle'
        };
      });

      const updatedActiveProjects = prev.activeProjects.map(proj => {
        const assignedStaffToThisProject = newHiredStaff.filter(s => s.assignedProjectId === proj.id);
        let aggregatedSkills: { creativity?: number; technical?: number; arrangement?: number } = {
          creativity: 0,
          technical: 0,
          arrangement: 0,
        };

        if (assignedStaffToThisProject.length > 0) {
          let totalCreativity = 0;
          let totalTechnical = 0;
          let totalArrangementScore = 0;
          let staffWithArrangementSkills = 0;

          assignedStaffToThisProject.forEach(staff => {
            totalCreativity += staff.primaryStats.creativity || 0;
            totalTechnical += staff.primaryStats.technical || 0;
            
            const mixingSkill = staff.skills.mixing?.level || 0;
            const songwritingSkill = staff.skills.songwriting?.level || 0;
            // Consider staff contributing to arrangement if they have either skill
            if (mixingSkill > 0 || songwritingSkill > 0) {
              totalArrangementScore += (mixingSkill + songwritingSkill) / 2; // Simple average for now
              staffWithArrangementSkills++;
            }
          });

          aggregatedSkills.creativity = totalCreativity / assignedStaffToThisProject.length;
          aggregatedSkills.technical = totalTechnical / assignedStaffToThisProject.length;
          aggregatedSkills.arrangement = staffWithArrangementSkills > 0 ? totalArrangementScore / staffWithArrangementSkills : 0;
        }
        
        const currentStage = proj.stages[proj.currentStageIndex];
        if (currentStage) {
          const newOptimalFocus = getStageOptimalFocus(currentStage, proj.genre, aggregatedSkills);
          return {
            ...proj,
            focusAllocation: {
              performance: newOptimalFocus.performance,
              soundCapture: newOptimalFocus.soundCapture,
              layering: newOptimalFocus.layering,
            } as FocusAllocation, // Ensure type correctness
          };
        }
        return proj;
      });

      return {
        ...prev,
        hiredStaff: newHiredStaff,
        activeProjects: updatedActiveProjects,
      };
    });
  }, [projectManager, setGameState]);

  // Execute one round of automated work
  const executeAutomatedWork = useCallback((): void => {
    if (!gameState.automation?.enabled) return;

    // Create a mutable copy for the project manager to work with
    const updatedGameState = { ...gameState };
    const updatedProjectManager = new ProjectManager(updatedGameState);
    
    updatedProjectManager.executeAutomatedWork();
    
    // Apply the changes back to the game state
    setGameState(updatedGameState);
  }, [gameState, setGameState]);

  // Get project priorities for display
  const getProjectPriorities = useCallback(() => {
    return projectManager.calculateProjectPriorities();
  }, [projectManager]);

  // Get current staff workload distribution
  const getStaffWorkload = useCallback((): { [staffId: string]: string[] } => {
    const workload: { [staffId: string]: string[] } = {};
    
    gameState.hiredStaff.forEach(staff => {
      workload[staff.id] = staff.assignedProjectId ? [staff.assignedProjectId] : [];
    });

    return workload;
  }, [gameState.hiredStaff]);

  // Get project progress summary
  const getProjectProgress = useCallback(() => {
    return gameState.activeProjects.map(project => {
      const totalStages = project.stages.length;
      const completedStages = project.stages.filter(s => s.completed).length;
      const currentStage = project.stages[project.currentStageIndex];
      const currentStageProgress = currentStage ? 
        currentStage.workUnitsCompleted / currentStage.workUnitsBase : 0;

      const overallProgress = (completedStages + currentStageProgress) / totalStages;
      const assignedStaff = gameState.hiredStaff.filter(s => s.assignedProjectId === project.id);

      return {
        projectId: project.id,
        title: project.title,
        overallProgress,
        currentStage: currentStage?.stageName || 'Complete',
        currentStageProgress,
        assignedStaffCount: assignedStaff.length,
        estimatedCompletion: calculateEstimatedCompletion(project, assignedStaff)
      };
    });
  }, [gameState.activeProjects, gameState.hiredStaff]);

  // Calculate estimated days to complete a project
  const calculateEstimatedCompletion = useCallback((project: Project, assignedStaff: StaffMember[]): number => {
    if (assignedStaff.length === 0) return Infinity;

    let remainingWork = 0;
    for (let i = project.currentStageIndex; i < project.stages.length; i++) {
      const stage = project.stages[i];
      if (i === project.currentStageIndex) {
        remainingWork += Math.max(0, stage.workUnitsBase - stage.workUnitsCompleted);
      } else {
        remainingWork += stage.workUnitsBase;
      }
    }

    // Calculate daily work capacity of assigned staff
    const dailyCapacity = assignedStaff.reduce((total, staff) => {
      const efficiency = (staff.energy / 100) * (staff.mood / 100);
      return total + efficiency;
    }, 0);

    return dailyCapacity > 0 ? Math.ceil(remainingWork / dailyCapacity) : Infinity;
  }, []);

  // Get automation status summary
  const getAutomationStatus = useCallback(() => {
    const automation = gameState.automation;
    if (!automation) return null;

    return {
      enabled: automation.enabled,
      mode: automation.mode,
      settings: automation.settings,
      efficiency: automation.efficiency,
      totalProjects: gameState.activeProjects.length,
      workingStaff: gameState.hiredStaff.filter(s => s.status === 'Working').length,
      totalStaff: gameState.hiredStaff.length,
      studioActivity: gameState.animations?.globalEffects.studioActivity || 0
    };
  }, [gameState.automation, gameState.activeProjects, gameState.hiredStaff, gameState.animations]);

  return {
    // Data
    projectCapacity,
    activeProjects: gameState.activeProjects,
    automationStatus: getAutomationStatus(),
    
    // Actions
    canAddProject,
    addProject,
    removeProject,
    toggleAutomation,
    setAutomationMode,
    updateAutomationSettings,
    applyOptimalStaffAssignments,
    executeAutomatedWork,
    
    // Queries
    getOptimalStaffAssignments,
    getProjectPriorities,
    getStaffWorkload,
    getProjectProgress,
    calculateEstimatedCompletion
  };
};
