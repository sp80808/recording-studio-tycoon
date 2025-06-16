import { StaffMember, Project, ProjectStage, FocusAllocation, StudioSkillType } from '@/types/game';
import { StageOptimalFocus } from './stageUtils'; // Import StageOptimalFocus

/**
 * Calculates a match score between a staff member and a project.
 */
export const calculateStaffProjectMatch = (
  staff: StaffMember,
  project: Project
): number => {
  let score = 50;

  const requiredCreativity = project.requiredSkills?.['composition'] || project.requiredSkills?.['soundDesign'] || 0;
  const requiredTechnical = project.requiredSkills?.['recording'] || project.requiredSkills?.['mixing'] || project.requiredSkills?.['mastering'] || 0;

  if (requiredCreativity > 0 && staff.primaryStats.creativity > (requiredCreativity / 2)) {
    score += Math.min(25, staff.primaryStats.creativity / 4);
  }

  if (requiredTechnical > 0 && staff.primaryStats.technical > (requiredTechnical / 2)) {
    score += Math.min(25, staff.primaryStats.technical / 4);
  }
  
  score -= project.difficulty * 2;

  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Calculates optimal slider positions for staff on a given project stage.
 */
export const getOptimalSliderPositions = (
  staffMembers: StaffMember[],
  projectStage: ProjectStage
): StageOptimalFocus => { // Changed return type to StageOptimalFocus
  console.warn(
    'getOptimalSliderPositions is not yet fully implemented. Returning placeholder based on stage focus areas.',
    staffMembers,
    projectStage
  );

  let reasoning = "Default distribution based on stage focus areas.";
  // Initialize with all fields from FocusAllocation, and add reasoning for StageOptimalFocus
  const focusAllocation: StageOptimalFocus = {
    performance: 33,
    soundCapture: 34,
    layering: 33,
    creativity: 33, 
    technical: 33,  
    business: 34,   
    reasoning // Initial reasoning
  };

  if (projectStage.focusAreas.length > 0) {
    if (projectStage.focusAreas.includes('Performance') && projectStage.focusAreas.includes('Sound Quality') && projectStage.focusAreas.includes('Arrangement')) {
        focusAllocation.performance = 35;
        focusAllocation.soundCapture = 35;
        focusAllocation.layering = 30;
        reasoning = "Stage focuses on Performance, Sound Quality, and Arrangement.";
    } else if (projectStage.focusAreas.includes('Vocals') || projectStage.focusAreas.includes('Lead Instrument')) {
        focusAllocation.performance = 40;
        focusAllocation.soundCapture = 30;
        focusAllocation.layering = 30;
        reasoning = "Stage emphasizes Vocals/Lead Instrument performance.";
    } else if (projectStage.focusAreas.includes('Mixing') || projectStage.focusAreas.includes('Mastering')) {
        focusAllocation.performance = 25;
        focusAllocation.soundCapture = 40;
        focusAllocation.layering = 35;
        reasoning = "Stage is focused on Mixing/Mastering.";
    }
    // Add more rules based on actual focusArea strings used in projectStages
    // For example, if a stage focuses on 'Creativity', adjust the creativity slider
    if (projectStage.focusAreas.includes('Creativity')) {
        focusAllocation.creativity = 40;
        focusAllocation.technical = 30;
        focusAllocation.business = 30;
        reasoning += " Prioritizing creativity for this stage.";
    }
  }

  // Normalize primary sliders (performance, soundCapture, layering)
  const primaryTotal = focusAllocation.performance + focusAllocation.soundCapture + focusAllocation.layering;
  if (primaryTotal !== 100 && primaryTotal > 0) {
    const scaleFactor = 100 / primaryTotal;
    focusAllocation.performance = Math.round(focusAllocation.performance * scaleFactor);
    focusAllocation.soundCapture = Math.round(focusAllocation.soundCapture * scaleFactor);
    focusAllocation.layering = 100 - focusAllocation.performance - focusAllocation.soundCapture;
  } else if (primaryTotal === 0) { 
    focusAllocation.performance = 33;
    focusAllocation.soundCapture = 34;
    focusAllocation.layering = 33;
  }

  // Normalize secondary sliders (creativity, technical, business)
  const secondaryTotal = focusAllocation.creativity + focusAllocation.technical + focusAllocation.business;
  if (secondaryTotal !== 100 && secondaryTotal > 0) {
      const scaleFactor = 100 / secondaryTotal;
      focusAllocation.creativity = Math.round(focusAllocation.creativity * scaleFactor);
      focusAllocation.technical = Math.round(focusAllocation.technical * scaleFactor);
      focusAllocation.business = 100 - focusAllocation.creativity - focusAllocation.technical;
  } else if (secondaryTotal === 0) {
      focusAllocation.creativity = 33;
      focusAllocation.technical = 34;
      focusAllocation.business = 33;
  }
  
  focusAllocation.reasoning = reasoning + ` Final distribution: P:${focusAllocation.performance}, S:${focusAllocation.soundCapture}, L:${focusAllocation.layering}, C:${focusAllocation.creativity}, T:${focusAllocation.technical}, B:${focusAllocation.business}.`;

  return focusAllocation;
};

/**
 * Predicts the outcome of a project based on current staff assignments.
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
    quality += (staff.primaryStats.technical || 0) / 10; // Add null check for safety
    speed += (staff.primaryStats.speed || 0) / 10;
    cPoints += (staff.primaryStats.creativity || 0);
    tPoints += (staff.primaryStats.technical || 0);
  });
  
  return { 
    quality: Math.min(100, Math.round(quality)), 
    speed: Math.min(100, Math.round(speed)),
    cPoints: Math.round(cPoints),
    tPoints: Math.round(tPoints)
  };
};
