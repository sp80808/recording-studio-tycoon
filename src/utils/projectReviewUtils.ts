import { Project, ProjectReport, ProjectReportSkillEntry, PlayerData, StaffMember, Skill } from '@/types/game';
import { grantSkillXp } from './skillUtils'; // Assuming grantSkillXp is in skillUtils.ts

// Helper to determine relevant skills for a project (can be expanded)
// For now, let's assume all foundational skills are relevant to every project.
// And technical/creative skills might be randomly relevant or based on project type/genre.
const getRelevantSkillsForProject = (project: Project, personSkills: PlayerData['skills'] | StaffMember['skills']): Array<keyof (PlayerData['skills'] | StaffMember['skills'])> => {
  const relevant: Array<keyof (PlayerData['skills'] | StaffMember['skills'])> = [
    'songwriting', 'rhythm', 'tracking', 'mixing', 'mastering'
  ];
  // Add a couple of technical/creative skills randomly for now
  const otherSkills: Array<keyof (PlayerData['skills'] | StaffMember['skills'])> = [
    'tapeSplicing', 'vocalComping', 'soundDesign', 'sampleWarping'
  ];
  const shuffled = otherSkills.sort(() => 0.5 - Math.random());
  if (personSkills.hasOwnProperty(shuffled[0])) relevant.push(shuffled[0]);
  if (personSkills.hasOwnProperty(shuffled[1])) relevant.push(shuffled[1]);
  
  // Filter out skills the person might not have (e.g. staff don't have 'management')
  return relevant.filter(skillName => personSkills.hasOwnProperty(skillName)) as Array<keyof (PlayerData['skills'] | StaffMember['skills'])>;
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

    // Placeholder scoring logic: skill level + equipment bonus + random factor
    // Max score per skill: 100
    const skillLevelScore = Math.min(currentSkillState.level * 5, 50); // Max 50 from level
    const equipmentBonus = Math.floor(equipmentQuality / 10); // Max 10 from equipment
    const randomFactor = Math.floor(Math.random() * 21) + 10; // 10-30 random points
    const projectDifficultyFactor = project.difficulty * 2; // Max 10-20 for higher difficulty

    let skillScore = Math.min(100, skillLevelScore + equipmentBonus + randomFactor + projectDifficultyFactor);
    
    // XP Gained for this skill: base on score and project difficulty
    const xpFromScore = Math.floor(skillScore * 0.5); // Max 50 XP from score
    const xpFromDifficulty = project.difficulty * 10; // Max 50-100 XP from difficulty
    const skillXpGained = xpFromScore + xpFromDifficulty + Math.floor(Math.random() * 20); // Add some randomness

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
  
  // Overall Quality: based on average skill score and project's C/T points
  // C/T points are accumulated during project work (e.g. minigames)
  const pointsFactor = (project.accumulatedCPoints + project.accumulatedTPoints) / 20; // Max ~50-100 if points are high
  const overallQualityScore = Math.min(100, Math.floor((averageSkillScore * 0.7) + (pointsFactor * 0.3)));

  // Rewards calculation (simplified, can be refined)
  const moneyGained = Math.floor(project.payoutBase * (overallQualityScore / 100) * (0.8 + Math.random() * 0.4));
  const reputationGained = Math.floor(project.repGainBase * (overallQualityScore / 100) * (0.8 + Math.random() * 0.4));
  
  let playerManagementXpGained = 0;
  if (!isPlayer) { // Player gets Management XP if staff did the work
    playerManagementXpGained = 20 + Math.floor(overallQualityScore / 10) + project.difficulty * 5; // Base + quality bonus + difficulty
  }


  // Generate Review Snippet (Placeholder)
  let reviewSnippet = `The project "${project.title}" achieved an overall quality of ${overallQualityScore}%. `;
  if (overallQualityScore > 85) {
    reviewSnippet += "Truly outstanding work! A masterpiece for the ages.";
  } else if (overallQualityScore > 70) {
    reviewSnippet += "Excellent results, this will surely be a hit!";
  } else if (overallQualityScore > 50) {
    reviewSnippet += "Solid effort, a respectable production.";
  } else if (overallQualityScore > 30) {
    reviewSnippet += "It's... something. Some interesting ideas, perhaps.";
  } else {
    reviewSnippet += "Well, it's finished. Let's hope the client is forgiving.";
  }
  
  // Add a comment about a high-scoring or low-scoring skill
  const sortedSkills = [...skillBreakdown].sort((a, b) => b.score - a.score);
  if (sortedSkills.length > 0) {
    if (sortedSkills[0].score > 80) {
      reviewSnippet += ` The ${sortedSkills[0].skillName} was particularly impressive.`;
    } else if (sortedSkills[sortedSkills.length - 1].score < 40 && sortedSkills.length > 1) {
      reviewSnippet += ` However, the ${sortedSkills[sortedSkills.length - 1].skillName} could use some improvement.`;
    }
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
