import { StaffMember, GameState, Project } from '@/types/game';

// Constants
const MAX_ENERGY = 100;
const ENERGY_REST_RATE = 20; // Energy restored per day while resting
const ENERGY_WORK_COST = 10; // Energy cost per day while working
const MIN_ENERGY_TO_WORK = 30; // Minimum energy required to work

// Staff status management
export const updateStaffStatus = (staff: StaffMember, gameState: GameState): StaffMember => {
  const updatedStaff = { ...staff };

  // Update energy based on status
  switch (staff.status) {
    case 'Resting':
      updatedStaff.energy = Math.min(MAX_ENERGY, staff.energy + ENERGY_REST_RATE);
      if (updatedStaff.energy >= MAX_ENERGY) {
        updatedStaff.status = 'Idle';
      }
      break;
    case 'Working':
      updatedStaff.energy = Math.max(0, staff.energy - ENERGY_WORK_COST);
      if (updatedStaff.energy < MIN_ENERGY_TO_WORK) {
        updatedStaff.status = 'Idle';
        updatedStaff.assignedProjectId = null;
      }
      break;
  }

  return updatedStaff;
};

// Staff assignment
export const canAssignToProject = (staff: StaffMember, project: Project): boolean => {
  return (
    staff.status === 'Idle' &&
    staff.energy >= MIN_ENERGY_TO_WORK &&
    !staff.assignedProjectId
  );
};

export const assignStaffToProject = (
  staff: StaffMember,
  project: Project,
  gameState: GameState
): { success: boolean; message: string } => {
  if (!canAssignToProject(staff, project)) {
    return {
      success: false,
      message: 'Staff member cannot be assigned to project'
    };
  }

  const updatedStaff = {
    ...staff,
    status: 'Working',
    assignedProjectId: project.id
  };

  return {
    success: true,
    message: 'Staff member assigned successfully'
  };
};

// Staff training
export const canTrainStaff = (staff: StaffMember, gameState: GameState): boolean => {
  return (
    staff.status === 'Idle' &&
    staff.energy >= MIN_ENERGY_TO_WORK &&
    gameState.playerData.level >= 3
  );
};

export const startStaffTraining = (
  staff: StaffMember,
  trainingType: string,
  gameState: GameState
): { success: boolean; message: string } => {
  if (!canTrainStaff(staff, gameState)) {
    return {
      success: false,
      message: 'Staff member cannot start training'
    };
  }

  const updatedStaff = {
    ...staff,
    status: 'Training',
    trainingType,
    trainingStartDay: gameState.currentDay
  };

  return {
    success: true,
    message: 'Training started successfully'
  };
};

// Staff hiring
export const calculateHiringCost = (staff: StaffMember): number => {
  return staff.salary * 3; // 3x daily salary as signing fee
};

export const canHireStaff = (staff: StaffMember, gameState: GameState): boolean => {
  const hiringCost = calculateHiringCost(staff);
  return gameState.money >= hiringCost;
};

// Staff skill development
export const calculateSkillGain = (
  staff: StaffMember,
  project: Project,
  daysWorked: number
): Record<string, number> => {
  const skillGains: Record<string, number> = {};
  
  // Base skill gain per day
  const baseGain = 0.1;
  
  // Calculate gains for each required skill
  Object.entries(project.requiredSkills).forEach(([skill, requiredLevel]) => {
    const currentLevel = staff.skills?.[skill]?.level || 0; // Added optional chaining for staff.skills
    const gap = Math.max(0, requiredLevel - currentLevel);
    
    // More gain if there's a bigger gap to fill
    const gainMultiplier = 1 + (gap * 0.2);
    skillGains[skill] = baseGain * gainMultiplier * daysWorked;
  });
  
  return skillGains;
};

// Staff energy management
export const updateStaffEnergy = (staff: StaffMember, gameState: GameState): StaffMember => {
  const updatedStaff = { ...staff };
  
  switch (staff.status) {
    case 'Working':
      updatedStaff.energy = Math.max(0, staff.energy - ENERGY_WORK_COST);
      if (updatedStaff.energy < MIN_ENERGY_TO_WORK) {
        updatedStaff.status = 'Idle';
        updatedStaff.assignedProjectId = null;
      }
      break;
    case 'Resting':
      updatedStaff.energy = Math.min(MAX_ENERGY, staff.energy + ENERGY_REST_RATE);
      if (updatedStaff.energy >= MAX_ENERGY) {
        updatedStaff.status = 'Idle';
      }
      break;
  }
  
  return updatedStaff;
};
