import { useCallback } from 'react';
import { GameState, StaffMember, Project } from '@/types/game';
import {
  updateStaffStatus,
  assignStaffToProject,
  startStaffTraining,
  calculateHiringCost,
  canHireStaff,
} from '@/utils/staffManagement';
import { generateCandidates } from '@/utils/staffGeneration';

export const useStaffManagement = (gameState: GameState, updateGameState: (updater: (prevState: GameState) => GameState) => void) => {

  // Update all staff members' status and energy
  const updateAllStaff = useCallback(() => {
    updateGameState(prevState => ({
      ...prevState,
      hiredStaff: prevState.hiredStaff.map((staff: StaffMember) => updateStaffStatus(staff, prevState))
    }));
  }, [updateGameState]);

  // Assign staff to project
  const assignStaff = useCallback((staffId: string, project: Project) => {
    const staff = gameState.hiredStaff.find((s: StaffMember) => s.id === staffId);
    if (!staff) return false;

    const result = assignStaffToProject(staff, project, gameState);
    if (result.success) {
      updateGameState(prevState => ({
        ...prevState,
        hiredStaff: prevState.hiredStaff.map((s: StaffMember) =>
          s.id === staffId
            ? { ...s, status: 'Working', assignedProjectId: project.id }
            : s
        )
      }));
    }
    return result.success;
  }, [gameState, updateGameState]);

  // Unassign staff from project
  const unassignStaff = useCallback((staffId: string) => {
    updateGameState(prevState => ({
      ...prevState,
      hiredStaff: prevState.hiredStaff.map((s: StaffMember) =>
        s.id === staffId
          ? { ...s, status: 'Idle', assignedProjectId: null }
          : s
      )
    }));
  }, [updateGameState]);

  // Toggle staff rest status
  const toggleStaffRest = useCallback((staffId: string) => {
    updateGameState(prevState => ({
      ...prevState,
      hiredStaff: prevState.hiredStaff.map((s: StaffMember) =>
        s.id === staffId
          ? {
              ...s,
              status: s.status === 'Resting' ? 'Idle' : 'Resting',
              assignedProjectId: s.status === 'Resting' ? s.assignedProjectId : null
            }
          : s
      )
    }));
  }, [updateGameState]);

  // Start staff training
  const startTraining = useCallback((staffId: string, trainingType: string) => {
    const staff = gameState.hiredStaff.find((s: StaffMember) => s.id === staffId);
    if (!staff) return false;

    const result = startStaffTraining(staff, trainingType, gameState);
    if (result.success) {
      updateGameState(prevState => ({
        ...prevState,
        hiredStaff: prevState.hiredStaff.map((s: StaffMember) =>
          s.id === staffId
            ? {
                ...s,
                status: 'Training',
                trainingType,
                trainingStartDay: prevState.currentDay
              }
            : s
        )
      }));
    }
    return result.success;
  }, [gameState, updateGameState]);

  // Hire new staff member
  const hireStaff = useCallback((candidate: StaffMember) => {
    const hiringCost = calculateHiringCost(candidate);
    if (!canHireStaff(candidate, gameState)) return false;

    updateGameState(prevState => ({
      ...prevState,
      money: prevState.money - hiringCost,
      hiredStaff: [...prevState.hiredStaff, candidate],
      availableCandidates: prevState.availableCandidates.filter((c: StaffMember) => c.id !== candidate.id)
    }));
    return true;
  }, [gameState, updateGameState]);

  // Refresh available candidates
  const refreshCandidates = useCallback(() => {
    const refreshCost = 50;
    if (gameState.money < refreshCost) return false;

    updateGameState(prevState => ({
      ...prevState,
      money: prevState.money - refreshCost,
      availableCandidates: generateCandidates(3)
    }));
    return true;
  }, [gameState, updateGameState]);

  return {
    updateAllStaff,
    assignStaff,
    unassignStaff,
    toggleStaffRest,
    startTraining,
    hireStaff,
    refreshCandidates,
    addStaffXP: useCallback((staffId: string, xp: number) => {
      updateGameState(prevState => {
        const staffToUpdate = prevState.hiredStaff.find((s: StaffMember) => s.id === staffId);
        if (staffToUpdate) {
          console.log(`Adding ${xp} XP to ${staffToUpdate.name} (placeholder)`);
          // Example: staffToUpdate.xpInRole += xp;
          // This part needs to be fleshed out based on how XP is tracked.
        }
        return prevState;
      });
    }, [updateGameState]),
    openTrainingModal: useCallback((staff: StaffMember) => { // Placeholder
      // Logic to determine if training modal can be opened for this staff
      // For example, check if staff is idle
      console.log(`Checking if training modal can be opened for ${staff.name} (placeholder)`);
      return staff.status === 'Idle'; // Example condition
    }, []),
  };
};
