import { StaffMember, Project, ProjectStage, FocusAllocation } from '@/types/game';

/**
 * Calculates a match score between a staff member and a project.
 * Placeholder logic: Can be expanded to consider skills, roles, genre affinity, etc.
 * @param staff - The staff member.
 * @param project - The project.
 * @returns A match score between 0 and 100.
 */
export const calculateStaffProjectMatch = (
  staff: StaffMember,
  project: Project
): number => {
  // Placeholder: Basic match based on primary stats and project difficulty
  let score = 50; // Base score

  if (project.requiredSkills?.creativity && staff.primaryStats.creativity > (project.requiredSkills.creativity / 2)) {
    score += Math.min(25, staff.primaryStats.creativity / 4);
  }

  if (project.requiredSkills?.technical && staff.primaryStats.technical > (project.requiredSkills.technical / 2)) {
    score += Math.min(25, staff.primaryStats.technical / 4);
  }
  
  score -= project.difficulty * 2;

  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Calculates optimal slider positions for staff on a given project stage.
 * Placeholder logic: Needs actual implementation based on game mechanics.
 * @param staffMembers - Array of staff members available for assignment.
 * @param projectStage - The current stage of the project.
 * @returns A FocusAllocation object.
 */
export const getOptimalSliderPositions = (
  staffMembers: StaffMember[],
  projectStage: ProjectStage
): FocusAllocation => {
  console.warn(
    'getOptimalSliderPositions is not yet fully implemented. Returning placeholder based on stage focus areas.',
    staffMembers, // Will be used in future more complex logic
    projectStage
  );

  // Placeholder: Distribute focus based on projectStage.focusAreas
  // This is a very basic placeholder. Real logic would consider staff skills.
  const reasoning = "Default distribution based on stage focus areas.";
  const focusAllocation: FocusAllocation = {
    performance: 33,
    soundCapture: 34,
    layering: 33,
    reasoning
  };

  if (projectStage.focusAreas.length > 0) {
    // A more sophisticated approach would map projectStage.focusAreas
    // to performance, soundCapture, layering based on their meaning.
    // For now, just a simple distribution if specific areas are named.
    if (projectStage.focusAreas.includes('Performance') && projectStage.focusAreas.includes('Sound Quality') && projectStage.focusAreas.includes('Arrangement')) {
        // Example: if all three are primary focus areas
        focusAllocation.performance = 35;
        focusAllocation.soundCapture = 35;
        focusAllocation.layering = 30;
    } else if (projectStage.focusAreas.includes('Vocals') || projectStage.focusAreas.includes('Lead Instrument')) {
        focusAllocation.performance = 40;
        focusAllocation.soundCapture = 30;
        focusAllocation.layering = 30;
    } else if (projectStage.focusAreas.includes('Mixing') || projectStage.focusAreas.includes('Mastering')) {
        focusAllocation.performance = 25;
        focusAllocation.soundCapture = 40;
        focusAllocation.layering = 35;
    }
    // Add more rules based on actual focusArea strings used in projectStages
  }

  // Ensure total is 100 (simple normalization)
  const total = focusAllocation.performance + focusAllocation.soundCapture + focusAllocation.layering;
  if (total !== 100 && total > 0) {
    focusAllocation.performance = Math.round((focusAllocation.performance / total) * 100);
    focusAllocation.soundCapture = Math.round((focusAllocation.soundCapture / total) * 100);
    // Adjust the last one to ensure sum is exactly 100 due to rounding
    focusAllocation.layering = 100 - focusAllocation.performance - focusAllocation.soundCapture;
  } else if (total === 0) { // Prevent division by zero if all are 0
    focusAllocation.performance = 33;
    focusAllocation.soundCapture = 34;
    focusAllocation.layering = 33;
  }
  
  focusAllocation.reasoning = reasoning + ` Final distribution: P:${focusAllocation.performance}, S:${focusAllocation.soundCapture}, L:${focusAllocation.layering}.`;

  return focusAllocation;
};

/**
 * Predicts the outcome of a project based on current staff assignments.
 * Placeholder logic: Needs actual implementation.
 * @param assignedStaff - Array of staff members assigned to the project.
 * @param project - The project.
 * @returns An object predicting quality, speed, etc. (structure TBD).
 */
export const predictProjectOutcome = (
  assignedStaff: StaffMember[],
  project: Project
): { quality: number; speed: number; cPoints: number; tPoints: number } => {
  console.warn(
    'predictProjectOutcome is not yet implemented. Returning placeholder.',
    assignedStaff,
    project
  );
  let quality = 50;
  let speed = 50;
  let cPoints = 0;
  let tPoints = 0;

  assignedStaff.forEach(staff => {
    quality += staff.primaryStats.technical / 10;
    speed += staff.primaryStats.speed / 10;
    cPoints += staff.primaryStats.creativity;
    tPoints += staff.primaryStats.technical;
  });
  
  return { 
    quality: Math.min(100, Math.round(quality)), 
    speed: Math.min(100, Math.round(speed)),
    cPoints: Math.round(cPoints),
    tPoints: Math.round(tPoints)
  };
};
