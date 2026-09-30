import { Project, ProjectReport, ProjectReportSkillEntry, PlayerData, StaffMember, Skill } from '@/types/game';
import { grantSkillXp } from './skillUtils'; // Assuming grantSkillXp is in skillUtils.ts
import { createSeededRandom, pickWithRandom, randomInt } from '@/simulation/seededRandom';
import { STAGE_GRADE_CARRY, gradeCapsProject, A_GRADE_CAP } from '@/rpg/stageGrades';
import { gradeQuality } from '@/rpg/rankChase';
import { settleStake } from '@/rpg/contractStakes';

/**
 * Optional settlement context for real lifecycle scoring (bead ruc.1).
 * All fields optional for backward compatibility — absent values fall back
 * to neutral defaults so existing callers keep working.
 */
export interface SettlementContext {
  /** Multiplier from player focus mastery, e.g. getFocusEffectiveness(gameState) (~1.0-1.2). */
  focusEffectiveness?: number;
  /** Flat quality points (0-10) from assigned staff stats/mood/affinity. */
  staffContribution?: number;
  /** Flat quality points (0-10) from studio genre-skill quality bonus. */
  studioQualityBonus?: number;
  /** Flat quality points (0-10) from equipment quality bonuses. */
  equipmentQualityBonus?: number;
  /** Flat quality points (0-12) from active Studio Synergies. */
  synergyQualityBonus?: number;
  /** Market multiplier from genre popularity via getGenreMarketMultiplier (centred on 1.0). */
  marketMultiplier?: number;
  /** Override for match-rating multiplier; defaults from project.matchRating. */
  matchRatingMultiplier?: number;
}

export const MATCH_RATING_MULTIPLIERS: Record<Project['matchRating'], number> = {
  Excellent: 1.15,
  Good: 1.0,
  Poor: 0.85,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

// Helper to determine relevant skills for a project
const getRelevantSkillsForProject = (
  project: Project, 
  personSkills: PlayerData['skills'] | StaffMember['skills']
): Array<keyof (PlayerData['skills'] | StaffMember['skills'])> => {
  const relevant: Array<keyof (PlayerData['skills'] | StaffMember['skills'])> = [
    'songwriting', 'rhythm', 'tracking', 'mixing', 'mastering' // Foundational skills are always relevant
  ];

  // Add genre-specific skills
  // This is a simplified mapping; can be expanded based on project.genre
  switch (project.genre.toLowerCase()) {
    case 'rock':
    case 'pop':
    case 'country': // Genres that might benefit from traditional analog techniques
      if (Object.prototype.hasOwnProperty.call(personSkills, 'tapeSplicing')) relevant.push('tapeSplicing');
      if (Object.prototype.hasOwnProperty.call(personSkills, 'vocalComping')) relevant.push('vocalComping');
      break;
    case 'electronic':
    case 'hip-hop': // Genres that might benefit from digital/creative techniques
      if (Object.prototype.hasOwnProperty.call(personSkills, 'soundDesign')) relevant.push('soundDesign');
      if (Object.prototype.hasOwnProperty.call(personSkills, 'sampleWarping')) relevant.push('sampleWarping');
      break;
    default: // For other genres, maybe pick one of each category if available
      if (Object.prototype.hasOwnProperty.call(personSkills, 'vocalComping')) relevant.push('vocalComping');
      if (Object.prototype.hasOwnProperty.call(personSkills, 'soundDesign')) relevant.push('soundDesign');
      break;
  }
  
  // Ensure no duplicates and filter out skills the person might not have (e.g. staff don't have 'management')
  const uniqueRelevant = Array.from(new Set(relevant));
  return uniqueRelevant.filter(skillName => Object.prototype.hasOwnProperty.call(personSkills, skillName)) as Array<keyof (PlayerData['skills'] | StaffMember['skills'])>;
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
  allStaffMembers: StaffMember[],
  settlementContext?: SettlementContext
): ProjectReport => {
  const rng = createSeededRandom(
    `${project.id}:review:${project.workSessionCount || 0}:${Math.round(project.accumulatedCPoints || 0)}:${Math.round(project.accumulatedTPoints || 0)}`
  );
  const skillBreakdown: ProjectReportSkillEntry[] = [];
  let totalSkillScoreContribution = 0;
  let numContributingSkills = 0;

  let personSkills: PlayerData['skills'] | StaffMember['skills'] | undefined;
  const isPlayer = assignedPersonDetails.type === 'player';

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
  
  // Real-lifecycle settlement factors (bead ruc.1). All clamped so no single
  // factor dominates; absent context falls back to neutral defaults.
  const focusEffectiveness = settlementContext?.focusEffectiveness ?? 1.0;
  const focusBonus = clamp(Math.round((focusEffectiveness - 1) * 60), 0, 12);
  const staffBonus = clamp(Math.round(settlementContext?.staffContribution ?? 0), 0, 10);
  const studioBonus = clamp(Math.round(settlementContext?.studioQualityBonus ?? 0), 0, 10);
  const equipBonusExtra = clamp(Math.round(settlementContext?.equipmentQualityBonus ?? 0), 0, 10);
  const minigameBonus = clamp(project.minigamePoints ?? 0, 0, 10);
  const matchMultiplier =
    settlementContext?.matchRatingMultiplier ?? MATCH_RATING_MULTIPLIERS[project.matchRating] ?? 1.0;
  const marketMultiplier = settlementContext?.marketMultiplier ?? 1.0;
  // Shared lifecycle bonus distributed into each skill score so skillBreakdown
  // reflects real production conditions instead of being cosmetic.
  const sharedSkillBonus = Math.round((focusBonus + staffBonus + studioBonus + equipBonusExtra) / 4);

  // Determine relevant skills for this project and person
  const relevantSkillKeys = getRelevantSkillsForProject(project, personSkills);

  relevantSkillKeys.forEach(skillKey => {
    const skillName = skillKey as keyof typeof personSkills;
    const currentSkillState = (personSkills as PlayerData['skills'] | StaffMember['skills'])[skillName] as Skill;

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
    const randomFactor = randomInt(rng, 5, 15); 

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
    
    let skillScore = Math.round(skillLevelContribution + equipmentBonus + difficultyModifier + randomFactor + pointsSynergyBonus + sharedSkillBonus);
    skillScore = Math.max(5, Math.min(100, skillScore)); // Clamp score between 5 and 100

    // XP Gained for this skill:
    // Base XP for participation + bonus for score + bonus for project difficulty
    const baseSkillXp = 20;
    const xpFromScore = Math.floor(skillScore * 0.75); // Max 75 XP from score
    const xpFromDifficulty = project.difficulty * 15;   // Max 75 XP from difficulty (assuming difficulty 1-5)
    const skillXpGained = baseSkillXp + xpFromScore + xpFromDifficulty + randomInt(rng, 0, 24);

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
  // Overall Quality: skill average + accumulated C/T production points + project
  // difficulty + real lifecycle conditions (focus, staff, studio, equipment).
  // C/T contribution is capped so long grinds can't push quality to 100 alone.
  const pointsFactor = clamp((project.accumulatedCPoints + project.accumulatedTPoints) / 15, 0, 15);
  const difficultyBonus = project.difficulty * 1.5;
  const synergyBonus = clamp(Math.round(settlementContext?.synergyQualityBonus ?? 0), 0, 12);
  let overallQualityScore = Math.floor(
    averageSkillScore * 0.5 +
    pointsFactor +
    difficultyBonus +
    focusBonus +
    staffBonus +
    studioBonus +
    equipBonusExtra +
    minigameBonus +
    synergyBonus
  );
  overallQualityScore = clamp(overallQualityScore + randomInt(rng, -5, 4), 0, 100);

  // Stage grades (sd3.2): Gold/Silver carry quality forward; a skipped/rough
  // stage caps the project at A no matter the score. Absent grades (old
  // saves, sims) change nothing.
  const stageGrades = project.stageGrades ?? [];
  const stageCarry = Math.max(
    0,
    Math.min(12, stageGrades.reduce((sum, g) => sum + (STAGE_GRADE_CARRY[g] ?? 0), 0))
  );
  const bronzeCapped = stageGrades.some(gradeCapsProject);
  overallQualityScore = clamp(overallQualityScore + stageCarry, 0, 100);
  if (bronzeCapped) overallQualityScore = Math.min(overallQualityScore, A_GRADE_CAP);

  // Contract stake (sd3.2): the booking gamble settles against the final
  // rank. Safe (default) is a no-op by construction.
  const finalRank = gradeQuality(overallQualityScore).rank;
  const stakeSettle = settleStake(project.stake ?? 'safe', finalRank);

  // Rewards: quality x difficulty x client-match x market trend (GH #19: no single
  // project type dominates — marketMultiplier comes from genre popularity).
  const qualityMultiplier = 0.5 + (overallQualityScore / 100) * 1.5; // Ranges from 0.5 to 2.0
  const difficultyFactor = 1 + (project.difficulty - 1) * 0.08;
  const moneyGained = Math.max(
    0,
    Math.floor(project.payoutBase * qualityMultiplier * difficultyFactor * matchMultiplier * marketMultiplier * stakeSettle.payoutMult)
  );
  const reputationGained = Math.max(
    0,
    Math.floor(project.repGainBase * qualityMultiplier * matchMultiplier * marketMultiplier) + stakeSettle.repDelta
  );
  
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
  
  const pickRandom = (arr: string[]) => pickWithRandom(rng, arr);

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

  // Competence-forward cause attribution (GH #20): name at least one factor that
  // affected quality instead of an unexplained score.
  const factorNotes: string[] = [];
  if (sortedSkills.length > 0) factorNotes.push(`${sortedSkills[0].skillName} led the session`);
  if (staffBonus >= 6) factorNotes.push('the assigned crew lifted the takes');
  if (studioBonus >= 6) factorNotes.push('studio genre expertise showed');
  if (equipBonusExtra >= 6) factorNotes.push('the gear chain stayed clean');
  if (focusBonus >= 6) factorNotes.push('sharp focus direction paid off');
  if (minigameBonus >= 4) factorNotes.push('standout session takes boosted the result');
  if (marketMultiplier >= 1.05) factorNotes.push('the current market wanted this sound');
  else if (marketMultiplier < 0.95) factorNotes.push('the current market was cool on this genre');
  if (project.matchRating === 'Excellent') factorNotes.push('a great client match helped');
  else if (project.matchRating === 'Poor') factorNotes.push('a tough client brief held it back');
  if (factorNotes.length > 0) {
    reviewSnippet += ` Key factors: ${factorNotes.slice(0, 3).join('; ')}.`;
  }

  // Issue #10: lightweight relationship acknowledgement. Tier growth itself is
  // reported at settlement (applyReportToState knows prior history); this line
  // only acknowledges the client, following the factorNotes pattern above.
  if (project.clientName) {
    if (overallQualityScore < lowQualityThreshold) {
      reviewSnippet += ` It'll take a stronger session to win ${project.clientName} back.`;
    } else if (overallQualityScore >= highQualityThreshold) {
      reviewSnippet += ` ${project.clientName} left the studio talking about this session.`;
    } else {
      reviewSnippet += ` ${project.clientName} will remember this session.`;
    }
  }

  // Stage + stake ledger (sd3.2): factual, one line each.
  if (stageGrades.length > 0) {
    reviewSnippet += ` Stage grades: ${stageGrades.join(', ')}.`;
    if (bronzeCapped) reviewSnippet += ' A rough stage capped this project at A.';
  }
  if ((project.stake ?? 'safe') !== 'safe') {
    reviewSnippet += stakeSettle.met
      ? ` The ${project.stake} gamble paid off.`
      : ` The ${project.stake} gamble missed its ${finalRank} bar.`;
  }


  if (project.gearNotes?.length) reviewSnippet += ` Gear: ${project.gearNotes.slice(-3).join(" ")}`;

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
    genre: project.genre,
  };
};
