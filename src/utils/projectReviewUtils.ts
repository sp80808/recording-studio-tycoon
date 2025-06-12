import { Project, ProjectReport, ProjectReportSkillEntry, PlayerData, StaffMember, Skill } from '@/types/game';
import { grantSkillXp } from './skillUtils'; // Assuming grantSkillXp is in skillUtils.ts

// Helper to determine relevant skills for a project
const getRelevantSkillsForProject = (
  project: Project, 
  personSkills: PlayerData['skills'] | StaffMember['skills']
): Array<keyof (PlayerData['skills'] | StaffMember['skills'])> => {
  let relevant: Array<keyof (PlayerData['skills'] | StaffMember['skills'])> = [
    'songwriting', 'rhythm', 'tracking', 'mixing', 'mastering' // Foundational skills are always relevant
  ];

  // Add genre-specific skills
  // This is a simplified mapping; can be expanded based on project.genre
  switch (project.genre.toLowerCase()) {
    case 'rock':
    case 'pop':
    case 'country': // Genres that might benefit from traditional analog techniques
      if (personSkills.hasOwnProperty('tapeSplicing')) relevant.push('tapeSplicing');
      if (personSkills.hasOwnProperty('vocalComping')) relevant.push('vocalComping');
      break;
    case 'electronic':
    case 'hip-hop': // Genres that might benefit from digital/creative techniques
      if (personSkills.hasOwnProperty('soundDesign')) relevant.push('soundDesign');
      if (personSkills.hasOwnProperty('sampleWarping')) relevant.push('sampleWarping');
      break;
    default: // For other genres, maybe pick one of each category if available
      if (personSkills.hasOwnProperty('vocalComping')) relevant.push('vocalComping');
      if (personSkills.hasOwnProperty('soundDesign')) relevant.push('soundDesign');
      break;
  }
  
  // Ensure no duplicates and filter out skills the person might not have (e.g. staff don't have 'management')
  const uniqueRelevant = Array.from(new Set(relevant));
  return uniqueRelevant.filter(skillName => personSkills.hasOwnProperty(skillName)) as Array<keyof (PlayerData['skills'] | StaffMember['skills'])>;
};


/**
 * Generates a project report after a project is completed.
 * This includes calculating skill scores, XP gains, overall quality, and rewards.
 * @param project - The completed project.
 * @param assignedPerson - Details of the person (player or staff) who worked on the project.
 * @param equipmentQuality - A general score (0-100) representing the quality of equipment used.
 * @param currentPlayerData - The current state of PlayerData (needed for player's skills).
 * @param currentStaffData - Array of StaffMembers (needed if staff worked on project).
 * @returns A ProjectReport object.
 */
export const generateProjectReview = (
  project: Project,
  assignedPersonDetails: { type: 'player' | 'staff'; id: string; name: string },
  equipmentQuality: number, // Assuming a 0-100 scale
  currentPlayerData: PlayerData,
  allStaffMembers: StaffMember[]
): ProjectReport => {
  const skillBreakdown: ProjectReportSkillEntry[] = [];
  let totalSkillScoreContribution = 0;
  let numContributingSkills = 0;

  let personSkills: PlayerData['skills'] | StaffMember['skills'] | undefined;
  let isPlayer = assignedPersonDetails.type === 'player';

  if (isPlayer) {
    personSkills = currentPlayerData.skills;
  } else {
    const staffMember = allStaffMembers.find(s => s.id === assignedPersonDetails.id);
    if (staffMember) {
      personSkills = staffMember.skills;
    }
  }

  if (!personSkills) {
    // This should ideally not happen if data is consistent
    console.error("Error: Could not find skills for assigned person:", assignedPersonDetails);
    // Fallback or throw error
    return {
        projectId: project.id,
        projectTitle: project.title,
        overallQualityScore: 0,
        moneyGained: 0,
        reputationGained: 0,
        playerManagementXpGained: 0,
        skillBreakdown: [],
        reviewSnippet: "Error generating review: Person's skills not found.",
        assignedPerson: assignedPersonDetails,
    };
  }
  
  // Determine relevant skills for this project and person
  const relevantSkillKeys = getRelevantSkillsForProject(project, personSkills);

  relevantSkillKeys.forEach(skillKey => {
    const skillName = skillKey as keyof typeof personSkills;
    const currentSkillState = (personSkills as any)[skillName] as Skill;

    if (!currentSkillState) return; // Should not happen if relevantSkillKeys is correct

    // Refined scoring logic:
    // Base score from skill level (more impact at higher levels)
    const skillLevelContribution = currentSkillState.level * 3 + Math.pow(currentSkillState.level, 1.2); // Max around 40-50 for level 10-15
    
    // Equipment quality bonus (0-15 points)
    const equipmentBonus = Math.floor(equipmentQuality / 7); 
    
    // Project difficulty modifier (can be positive or negative for very easy projects)
    // Difficulty ranges 1-5 (example). Let's say it adds/subtracts up to 10 points.
    const difficultyModifier = (project.difficulty - 3) * 3; // e.g. diff 1 = -6, diff 3 = 0, diff 5 = +6

    // Randomness (5-15 points)
    const randomFactor = Math.floor(Math.random() * 11) + 5; 

    // Synergy with project's C/T points (accumulated from minigames, etc.)
    // If a skill aligns with the type of points accumulated, give a small bonus
    let pointsSynergyBonus = 0;
    const creativeSkills: Array<keyof (PlayerData['skills'] | StaffMember['skills'])> = ['songwriting', 'soundDesign', 'sampleWarping'];
    const technicalSkills: Array<keyof (PlayerData['skills'] | StaffMember['skills'])> = ['tracking', 'mixing', 'mastering', 'tapeSplicing', 'vocalComping'];
    if (creativeSkills.includes(skillName) && project.accumulatedCPoints > project.accumulatedTPoints) {
        pointsSynergyBonus = Math.min(5, Math.floor(project.accumulatedCPoints / 20));
    } else if (technicalSkills.includes(skillName) && project.accumulatedTPoints > project.accumulatedCPoints) {
        pointsSynergyBonus = Math.min(5, Math.floor(project.accumulatedTPoints / 20));
    }
    
    let skillScore = Math.round(skillLevelContribution + equipmentBonus + difficultyModifier + randomFactor + pointsSynergyBonus);
    skillScore = Math.max(5, Math.min(100, skillScore)); // Clamp score between 5 and 100

    // XP Gained for this skill:
    // Base XP for participation + bonus for score + bonus for project difficulty
    const baseSkillXp = 20;
    const xpFromScore = Math.floor(skillScore * 0.75); // Max 75 XP from score
    const xpFromDifficulty = project.difficulty * 15;   // Max 75 XP from difficulty (assuming difficulty 1-5)
    const skillXpGained = baseSkillXp + xpFromScore + xpFromDifficulty + Math.floor(Math.random() * 25); // Add some randomness

    const { updatedSkill, levelUps } = grantSkillXp(currentSkillState, skillXpGained);

    skillBreakdown.push({
      skillName: skillName.toString(),
      initialXp: currentSkillState.xp,
      xpGained: skillXpGained,
      finalXp: updatedSkill.xp,
      initialLevel: currentSkillState.level,
      finalLevel: updatedSkill.level,
      xpToNextLevelBefore: currentSkillState.xpToNextLevel,
      xpToNextLevelAfter: updatedSkill.xpToNextLevel,
      levelUps,
      score: skillScore,
    });

    totalSkillScoreContribution += skillScore;
    numContributingSkills++;
  });

  const averageSkillScore = numContributingSkills > 0 ? totalSkillScoreContribution / numContributingSkills : 0;
  
  // Overall Quality: based on average skill score, project's C/T points, and project difficulty
  const pointsFactor = (project.accumulatedCPoints + project.accumulatedTPoints) / 15; // Increased impact from C/T points
  const difficultyBonus = project.difficulty * 2; // Small bonus for harder projects
  let overallQualityScore = Math.floor((averageSkillScore * 0.6) + (pointsFactor * 0.3) + (difficultyBonus * 0.1));
  overallQualityScore = Math.min(100, Math.max(0, overallQualityScore + Math.floor(Math.random()*10 - 5))); // Add small randomness +/- 5

  // Rewards calculation (more dynamic)
  const qualityMultiplier = 0.5 + (overallQualityScore / 100) * 1.5; // Ranges from 0.5 to 2.0
  const moneyGained = Math.floor(project.payoutBase * qualityMultiplier);
  const reputationGained = Math.floor(project.repGainBase * qualityMultiplier);
  
  let playerManagementXpGained = 0;
  if (!isPlayer) { // Player gets Management XP if staff did the work
    playerManagementXpGained = 30 + Math.floor(overallQualityScore / 5) + project.difficulty * 10; 
  }

  // Generate more varied Review Snippet
  let reviewSnippet = "";
  const highQualityThreshold = 80;
  const midQualityThreshold = 55;
  const lowQualityThreshold = 30;

  const positiveAdjectives = ["stellar", "outstanding", "impressive", "solid", "remarkable", "excellent", "superb"];
  const neutralAdjectives = ["decent", "acceptable", "standard", "average", "competent"];
  const negativeAdjectives = ["lackluster", "uninspired", "mediocre", "disappointing", "rough"];
  
  const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  if (overallQualityScore >= highQualityThreshold) {
    reviewSnippet = `A truly ${pickRandom(positiveAdjectives)} production for "${project.title}"! This is chart-topping material.`;
  } else if (overallQualityScore >= midQualityThreshold) {
    reviewSnippet = `The work on "${project.title}" is ${pickRandom(neutralAdjectives)}. A good effort that meets expectations.`;
  } else if (overallQualityScore >= lowQualityThreshold) {
    reviewSnippet = `"${project.title}" turned out to be a bit ${pickRandom(negativeAdjectives)}. There's room for improvement.`;
  } else {
    reviewSnippet = `Unfortunately, "${project.title}" didn't quite hit the mark. Back to the drawing board.`;
  }

  const sortedSkills = [...skillBreakdown].sort((a, b) => b.score - a.score);
  if (sortedSkills.length > 0) {
    const bestSkill = sortedSkills[0];
    const worstSkill = sortedSkills[sortedSkills.length - 1];

    if (bestSkill.score > 85) {
      reviewSnippet += ` The ${bestSkill.skillName} was particularly ${pickRandom(positiveAdjectives)}.`;
    } else if (worstSkill.score < 40 && sortedSkills.length > 1 && bestSkill.skillName !== worstSkill.skillName) {
      reviewSnippet += ` However, the ${worstSkill.skillName} felt a bit ${pickRandom(negativeAdjectives)}.`;
    } else if (bestSkill.score > 70 && overallQualityScore < midQualityThreshold) {
         reviewSnippet += ` Despite some challenges, the ${bestSkill.skillName} showed promise.`;
    }
  }
  if (project.accumulatedCPoints > 50 && project.accumulatedTPoints < 20 && overallQualityScore < highQualityThreshold) {
      reviewSnippet += " Lots of creative flair, but the technical execution could be tighter."
  } else if (project.accumulatedTPoints > 50 && project.accumulatedCPoints < 20 && overallQualityScore < highQualityThreshold) {
      reviewSnippet += " Technically proficient, though it could use a bit more creative spark."
  }


  return {
    projectId: project.id,
    projectTitle: project.title,
    overallQualityScore,
    moneyGained,
    reputationGained,
    playerManagementXpGained,
    skillBreakdown,
    reviewSnippet,
    assignedPerson: assignedPersonDetails,
  };
};
