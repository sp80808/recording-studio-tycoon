import {
  Project,
  ProjectStage,
  MatchRating,
  ProjectReview,
  GameState,
  FocusArea,
  StageOutcome,
  FocusAreaOutcome,
  StaffContributionDetail,
  StaffRole,
  StaffMember,
} from './types';
import { addPlayerXP } from './playerProgress';

// Project name generators
const projectTypes = ['Album', 'Single', 'EP', 'Remix', 'Soundtrack', 'Jingle', 'Theme Song'];
const descriptors = ['Summer', 'Winter', 'Epic', 'Urban', 'Retro', 'Modern', 'Fusion', 'Acoustic', 'Electronic'];
const clientTypes = ['Independent Artist', 'Major Label', 'TV Studio', 'Game Developer', 'Advertising Agency', 'Film Director'];

// Genre requirements mapping
const genreSkillRequirements: Record<string, Record<string, number>> = {
  rock: { rock: 3, acoustic: 1 },
  pop: { pop: 3, electronic: 1 },
  electronic: { electronic: 3, pop: 1 },
  hiphop: { hiphop: 3, electronic: 1 },
  acoustic: { acoustic: 3, rock: 1 },
  fusion: { rock: 2, electronic: 2, pop: 1 }
};

// Common project stages
const projectStages: Record<string, () => ProjectStage[]> = {
  standard: () => [
    {
      stageName: 'Pre-Production',
      focusAreas: [
        { name: 'Planning', value: 50, creativityWeight: 0.7, technicalWeight: 0.3 },
        { name: 'Composition', value: 50, creativityWeight: 0.8, technicalWeight: 0.2 }
      ],
      workUnitsRequired: 10,
      workUnitsCompleted: 0
    },
    {
      stageName: 'Recording & Production',
      focusAreas: [
        { name: 'Performance', value: 33, creativityWeight: 0.6, technicalWeight: 0.4 },
        { name: 'Sound Capture', value: 33, creativityWeight: 0.3, technicalWeight: 0.7 },
        { name: 'Layering', value: 34, creativityWeight: 0.5, technicalWeight: 0.5 }
      ],
      workUnitsRequired: 15,
      workUnitsCompleted: 0
    },
    {
      stageName: 'Mixing & Mastering',
      focusAreas: [
        { name: 'Mixing', value: 50, creativityWeight: 0.4, technicalWeight: 0.6 },
        { name: 'Mastering', value: 50, creativityWeight: 0.2, technicalWeight: 0.8 }
      ],
      workUnitsRequired: 12,
      workUnitsCompleted: 0
    }
  ],

  commercial: () => [
    {
      stageName: 'Concept Development',
      focusAreas: [
        { name: 'Client Requirements', value: 50, creativityWeight: 0.5, technicalWeight: 0.5 },
        { name: 'Creative Direction', value: 50, creativityWeight: 0.9, technicalWeight: 0.1 }
      ],
      workUnitsRequired: 8,
      workUnitsCompleted: 0
    },
    {
      stageName: 'Production',
      focusAreas: [
        { name: 'Recording', value: 33, creativityWeight: 0.4, technicalWeight: 0.6 },
        { name: 'Sound Design', value: 33, creativityWeight: 0.7, technicalWeight: 0.3 },
        { name: 'Editing', value: 34, creativityWeight: 0.3, technicalWeight: 0.7 }
      ],
      workUnitsRequired: 12,
      workUnitsCompleted: 0
    },
    {
      stageName: 'Finalization',
      focusAreas: [
        { name: 'Mixing', value: 60, creativityWeight: 0.4, technicalWeight: 0.6 },
        { name: 'Client Revisions', value: 40, creativityWeight: 0.5, technicalWeight: 0.5 }
      ],
      workUnitsRequired: 10,
      workUnitsCompleted: 0
    }
  ]
};

/**
 * Generates a specified number of new projects
 */
export function generateNewProjects(count: number, gameState: GameState): Project[] {
  const projects: Project[] = [];

  for (let i = 0; i < count; i++) {
    const projectType = projectTypes[Math.floor(Math.random() * projectTypes.length)];
    const descriptor = descriptors[Math.floor(Math.random() * descriptors.length)];
    const clientType = clientTypes[Math.floor(Math.random() * clientTypes.length)];

    // Determine genre
    const genres = Object.keys(genreSkillRequirements);
    const genre = genres[Math.floor(Math.random() * genres.length)];

    // Determine difficulty (adjusted by player level)
    const baseDifficulty = Math.floor(Math.random() * 3) + 1; // 1-3
    const playerLevelAdjustment = Math.floor((gameState.playerData.level - 1) / 2);
    const difficulty = Math.min(5, baseDifficulty + playerLevelAdjustment);

    // Create required skills based on genre and difficulty
    const requiredSkills = {...genreSkillRequirements[genre]};

    // Determine match rating based on player's studio skills
    let matchRating: MatchRating = 'Poor';
    let skillMatch = 0;

    Object.entries(requiredSkills).forEach(([skillId, levelRequired]) => {
      const playerSkillLevel = gameState.studioSkills[skillId]?.level || 0;
      if (playerSkillLevel >= levelRequired) {
        skillMatch++;
      }
    });

    const matchPercentage = skillMatch / Object.keys(requiredSkills).length;

    if (matchPercentage >= 0.8) {
      matchRating = 'Excellent';
    } else if (matchPercentage >= 0.5) {
      matchRating = 'Good';
    }

    // Determine project stages
    let stages: ProjectStage[];
    if (projectType === 'Jingle' || projectType === 'Theme Song') {
      stages = projectStages.commercial();
    } else {
      stages = projectStages.standard();
    }

    // Calculate payout and reputation based on difficulty and match
    const payoutBase = 500 + (difficulty * 200);
    const matchMultiplier = matchRating === 'Excellent' ? 1.2 : matchRating === 'Good' ? 1.0 : 0.8;
    const adjustedPayout = Math.floor(payoutBase * matchMultiplier);

    const repGainBase = 5 + difficulty;

    // Create the project
    const project: Project = {
      id: `project-${Date.now()}-${i}`,
      title: `${descriptor} ${genre.charAt(0).toUpperCase() + genre.slice(1)} ${projectType}`,
      genre,
      clientType,
      difficulty,
      durationDaysTotal: 3 + difficulty,
      payoutBase: adjustedPayout,
      repGainBase,
      requiredSkills,
      stages,
      matchRating,
      accumulatedCPoints: 0,
      accumulatedTPoints: 0,
      currentStageIndex: 0,
      daysWorked: 0,
      assignedStaff: [] // Added assignedStaff
    };

    projects.push(project);
  }

  return projects;
}

/**
 * Calculates creativity and technical points based on focus allocation
 */
export function calculateStagePoints(
  gameState: GameState,
  focusAreas: FocusArea[]
): { creativityPoints: number, technicalPoints: number } {
  let creativityPoints = 0;
  let technicalPoints = 0;

  const creativeAttribute = gameState.playerData.attributes.creativeIntuition;
  const technicalAttribute = gameState.playerData.attributes.technicalAptitude;
  const focusMastery = gameState.playerData.attributes.focusMastery;

  // Process each focus area
  focusAreas.forEach(area => {
    // Base points from focus allocation
    const basePoints = area.value / 10; // 0-10 points from 0-100%

    // Apply creative and technical weights
    creativityPoints += basePoints * area.creativityWeight * (1 + (creativeAttribute * 0.1));
    technicalPoints += basePoints * area.technicalWeight * (1 + (technicalAttribute * 0.1));
  });

  // Apply focus mastery bonus (better distribution of points)
  const focusBonus = 1 + (focusMastery * 0.05);
  creativityPoints *= focusBonus;
  technicalPoints *= focusBonus;

  // Apply bonuses from engineers if applicable
  if (gameState.activeProject) {
    const workingEngineers = gameState.hiredStaff.filter(
      e => e.status === 'Working' && e.assignedProjectId === gameState.activeProject?.id
    );

    workingEngineers.forEach(engineer => {
      // Check if engineer's genre affinity matches project genre
      const genreMatchBonus = (engineer.genreAffinity && gameState.activeProject?.genre && engineer.genreAffinity.genre === gameState.activeProject.genre)
        ? (engineer.genreAffinity.bonus / 100) : 0;

      const engineerBonus = 1 + ((engineer.levelInRole * engineer.primaryStats.speed) / 100) + genreMatchBonus;
      creativityPoints *= engineerBonus;
      technicalPoints *= engineerBonus;
    });
  }

  return {
    creativityPoints: Math.round(creativityPoints),
    technicalPoints: Math.round(technicalPoints)
  };
}

/**
 * Updates the focus area of a project's current stage.
 * Assumes focus areas for a stage are in an array.
 * @param stage The project stage to update.
 * @param areaName The name of the focus area to change (string).
 * @param value The new value for the focus area (number).
 * @returns The updated project stage.
 */
export function updateStageFocusArea(stage: ProjectStage, areaName: string, value: number): ProjectStage {
  const newFocusAreas: FocusArea[] = stage.focusAreas.map(area => {
    if (area.name === areaName) {
      // Clamp value between 0 and 100
      return { ...area, value: Math.max(0, Math.min(100, value)) };
    }
    return area;
  });

  // TODO: Implement normalization logic if sliders must sum to 100%
  const totalFocus = newFocusAreas.reduce((sum, area) => sum + area.value, 0);
  if (totalFocus !== 100 && newFocusAreas.length > 1) {
      const excessOrDeficit = totalFocus - 100;
      const otherAreasCount = newFocusAreas.length - 1;
      // Simple proportional adjustment for other areas
      if (otherAreasCount > 0) {
          const adjustmentPerArea = excessOrDeficit / otherAreasCount;
          return { ...stage, focusAreas: newFocusAreas.map(area => {
              if (area.name !== areaName) {
                  return { ...area, value: Math.max(0, Math.min(100, area.value - adjustmentPerArea)) };
              }
              return area;
          })};
      }
  }

  return { ...stage, focusAreas: newFocusAreas };
}

/**
 * Process work for the current stage of a project
 * Returns the updated game state and a boolean indicating if the stage was completed.
 */
export function processStageWork(
  gameState: GameState,
  creativityPoints: number,
  technicalPoints: number
): { newState: GameState, stageCompleted: boolean, projectCompleted: boolean } {
  if (!gameState.activeProject) return { newState: gameState, stageCompleted: false, projectCompleted: false };

  // Create a deep copy of the necessary parts of the state to maintain immutability
  const newState = JSON.parse(JSON.stringify(gameState));
  const project = newState.activeProject;
  const currentStage = project.stages[project.currentStageIndex];

  // Add points to accumulated totals
  project.accumulatedCPoints += creativityPoints;
  project.accumulatedTPoints += technicalPoints;

  // Progress work units based on total points
  const totalPoints = creativityPoints + technicalPoints;
  currentStage.workUnitsCompleted += totalPoints / 5; // 5 points = 1 work unit

  let stageCompleted = false;
  let projectCompleted = false;

  // Check if stage is complete
  if (currentStage.workUnitsCompleted >= currentStage.workUnitsRequired) {
    stageCompleted = true;
    // Move to next stage or complete project
    if (project.currentStageIndex < project.stages.length - 1) {
      project.currentStageIndex++;
    } else {
      // Project is complete
      projectCompleted = true;
    }
  }

  return { newState, stageCompleted, projectCompleted };
}

/**
 * Simulates working on a project for one day.
 * Calculates points, processes work, and determines if stages or projects are completed.
 * Returns the updated game state, completion flags, and points earned.
 */
export function simulateProjectWork(
  gameState: GameState
): { newState: GameState, stageCompleted: boolean, projectCompleted: boolean, creativityEarned: number, technicalEarned: number } {
  if (!gameState.activeProject) return { newState: gameState, stageCompleted: false, projectCompleted: false, creativityEarned: 0, technicalEarned: 0 };

  // Calculate points based on focus allocation (this function is pure)
  const { creativityPoints, technicalPoints } = calculateStagePoints(gameState, gameState.activeProject.stages[gameState.activeProject.currentStageIndex].focusAreas);
  
  // Process work and get the new state and completion flags (this function is now refactored to be immutable)
  const { newState, stageCompleted, projectCompleted } = processStageWork(gameState, creativityPoints, technicalPoints);
  
  // Return the new state, completion flags, and the points earned for the day
  return { newState, stageCompleted, projectCompleted, creativityEarned: creativityPoints, technicalEarned: technicalPoints };
}

/**
 * Completes a project and generates a review.
 * Returns the updated game state and the project review.
 */
export function completeProject(gameState: GameState): { newState: GameState, review: ProjectReview } {
  if (!gameState.activeProject) {
    throw new Error("No active project to complete");
  }

  // Create a deep copy of the state to maintain immutability
  const newState = JSON.parse(JSON.stringify(gameState));
  const project = newState.activeProject;

  // Calculate final score based on accumulated points
  const totalPossiblePoints = project.stages.reduce(
    (sum: number, stage: ProjectStage) => sum + (stage.workUnitsRequired * 10),
    0
  );

  const totalPoints = project.accumulatedCPoints + project.accumulatedTPoints;
  const completionPercentage = Math.min(1, totalPoints / totalPossiblePoints);

  // Calculate rating (1-5 stars)
  let rating = 1;
  if (completionPercentage >= 0.9) rating = 5;
  else if (completionPercentage >= 0.75) rating = 4;
  else if (completionPercentage >= 0.6) rating = 3;
  else if (completionPercentage >= 0.4) rating = 2;

  // Apply match rating modifier
  const matchModifier = project.matchRating === 'Excellent' ? 1.2 :
                        project.matchRating === 'Good' ? 1.0 : 0.8;

  // Apply business acumen for better payouts
  const businessBonus = 1 + (newState.playerData.attributes.businessAcumen * 0.05);

  // Calculate final rewards
  const finalScore = Math.floor(completionPercentage * 100);
  const payout = Math.floor(project.payoutBase * completionPercentage * matchModifier * businessBonus);
  const repGain = Math.floor(project.repGainBase * completionPercentage * matchModifier);

  // Generate detailed stage outcomes and focus area feedback
  const stageOutcomes: StageOutcome[] = project.stages.map((stage: ProjectStage) => {
    const stageTotalPoints = stage.workUnitsCompleted * 5; // Assuming 5 points per work unit
    const stageCompletionPercentage = Math.min(1, stage.workUnitsCompleted / stage.workUnitsRequired);

    const focusAreaOutcomes: FocusAreaOutcome[] = stage.focusAreas.map((area: FocusArea) => {
        // This is a simplification; actual point contribution per focus area per day would be more complex
        // For now, we'll distribute the stage's total points proportionally based on focus value and weights
        const areaPoints = (stageTotalPoints * (area.value / 100));
        const areaCreativityPoints = areaPoints * area.creativityWeight;
        const areaTechnicalPoints = areaPoints * area.technicalWeight;

        let feedback = `${area.name}: Completed ${Math.floor(area.value)}%.`;
        if (stageCompletionPercentage < 1) {
            feedback += ` More work needed.`;
        } else {
            feedback += ` Well done.`;
        }

        return {
            name: area.name,
            value: area.value,
            creativityPoints: Math.round(areaCreativityPoints),
            technicalPoints: Math.round(areaTechnicalPoints),
            feedback: feedback
        };
    });

    let stageFeedback = `${stage.stageName}: Completed ${Math.floor(stageCompletionPercentage * 100)}%.`;
    if (stageCompletionPercentage < 0.5) {
        stageFeedback += ` Significant work is still required.`;
    } else if (stageCompletionPercentage < 1) {
        stageFeedback += ` Could benefit from more effort.`;
    } else {
        stageFeedback += ` Successfully completed.`;
    }


    return {
      stageName: stage.stageName,
      workUnitsCompleted: stage.workUnitsCompleted,
      workUnitsRequired: stage.workUnitsRequired,
      creativityPointsEarned: Math.round(project.accumulatedCPoints * (stageTotalPoints / totalPoints)), // Simplified distribution
      technicalPointsEarned: Math.round(project.accumulatedTPoints * (stageTotalPoints / totalPoints)), // Simplified distribution
      focusAreaOutcomes,
      feedback: stageFeedback
    };
  });

  // Calculate staff contributions (Simplified)
  const staffContributions: StaffContributionDetail[] = project.assignedStaff.map((staffId: string) => {
      const staff = newState.hiredStaff.find((s: StaffMember) => s.id === staffId);
      if (!staff) return null; // Should not happen

      // Simplified: Distribute total project points based on staff's primary stats and efficiency
      // A more complex model would track points contributed per day per staff member
      const staffTotalStat = staff ? staff.primaryStats.creativity + staff.primaryStats.technical + staff.primaryStats.speed : 0; // Add null check
      const totalStatsSum = newState.hiredStaff.reduce((sum: number, s: StaffMember) => sum + s.primaryStats.creativity + s.primaryStats.technical + s.primaryStats.speed, 0) + newState.playerData.attributes.creativeIntuition + newState.playerData.attributes.technicalAptitude;
      const contributionRatio = totalStatsSum > 0 ? staffTotalStat / totalStatsSum : 0; // Handle division by zero
      const pointsContributed = Math.round(totalPoints * contributionRatio);

      let feedback = `${staff?.name || 'Unknown Staff'} (${staff?.role || 'Unknown Role'}): Contributed significantly to the project.`;
      if (staff && staff.energy < 50) { // Add null check for staff
          feedback = `${staff.name} (${staff.role}): Contributed, but seemed low on energy.`;
      }
      // Add more feedback based on staff skills, traits, morale (future)

      return staff ? { // Return null if staff is null
          staffId: staff.id,
          staffName: staff.name,
          role: staff.role,
          pointsContributed: pointsContributed,
          feedback: feedback
      } : null;
  }).filter(Boolean) as StaffContributionDetail[]; // Filter out nulls

  // Generate detailed client satisfaction feedback
  let clientSatisfactionFeedback = `Overall project quality: ${finalScore}%. `;
  if (rating >= 4) {
    clientSatisfactionFeedback += "The client is extremely satisfied and impressed with the high quality of the work. This will significantly boost your studio's reputation!";
  } else if (rating === 3) {
    clientSatisfactionFeedback += "The project meets the client's expectations. Solid work, but there's room for improvement to truly impress.";
  } else {
    clientSatisfactionFeedback += "The client is somewhat disappointed with the final result. The quality did not fully meet their standards. Focus on improving your team's skills and project execution for future work.";
  }

  if (project.matchRating === 'Excellent') {
      clientSatisfactionFeedback += ` The project genre (${project.genre}) was an excellent match for your studio's skills, contributing positively to the outcome.`;
  } else if (project.matchRating === 'Good') {
      clientSatisfactionFeedback += ` The project genre (${project.genre}) was a good match for your studio's skills.`;
  } else {
      clientSatisfactionFeedback += ` The project genre (${project.genre}) was not a strong match for your studio's skills, which may have impacted the final quality.`;
  }


  // Apply rewards to the new state
  newState.money += payout;
  newState.reputation += repGain;
  newState.completedProjects += 1;

  // Add player XP (using the refactored pure function)
  const { newState: stateAfterPlayerXP, levelUpOccurred } = addPlayerXP(newState, 20 + (rating * 10));
  newState.playerData = stateAfterPlayerXP.playerData; // Update player data
  // Note: levelUpOccurred can be used by the caller (StudioTycoon) to trigger a modal if needed.

  // Add skill XP and handle level ups on the new state
  const skillXpGain: Record<string, number> = {};
  Object.keys(project.requiredSkills).forEach(skillId => {
    const xpGain = 5 + Math.floor(rating * 3);
    if (newState.studioSkills[skillId]) {
      newState.studioSkills[skillId].xp += xpGain;
      skillXpGain[skillId] = xpGain;
    }
  });

  // Check for skill level ups on the new state
  Object.keys(skillXpGain).forEach(skillId => {
    const skill = newState.studioSkills[skillId];
    while (skill.xp >= skill.xpToNextLevel) {
      skill.xp -= skill.xpToNextLevel;
      skill.level += 1;
      skill.xpToNextLevel = Math.floor(skill.xpToNextLevel * 1.5);
    }
  });

  // Remove active project from the new state
  const completedProject = newState.activeProject; // Keep reference for review object
  newState.activeProject = null;

  // Generate new projects if needed (Assuming generateNewProjects is pure or will be refactored)
  if (newState.availableProjects.length < 2) {
    // **TODO: Refactor generateNewProjects to be pure and return new projects**
    // For now, assume it modifies the state directly and we use the modified newState
    const { generateNewProjects: generateNewProjectsPure } = require('./projectManager'); // Assuming a pure version exists or will be created
    const newProjects = generateNewProjectsPure(3 - newState.availableProjects.length, newState); // Call with newState
    newState.availableProjects = [...newState.availableProjects, ...newProjects]; // Update available projects
  }

  // Create and return review
  const review: ProjectReview = {
    projectId: completedProject.id,
    projectTitle: completedProject.title,
    genre: completedProject.genre,
    finalScore,
    rating,
    comments: clientSatisfactionFeedback, // Use detailed feedback as main comment for now
    payout,
    repGain,
    playerXp: 20 + (rating * 10), // Use the calculated XP for review object
    skillXp: skillXpGain, // Use the calculated skill XP gains for review object
    // staffXp is not calculated in completeProject, so it's not included in the review object for now.
    stageOutcomes,
    staffContributions,
    clientSatisfactionFeedback // Also keep it in its dedicated field
  };

  // The showReviewModal call is removed here and will be handled by the caller (StudioTycoon).

  return { newState, review };
}
