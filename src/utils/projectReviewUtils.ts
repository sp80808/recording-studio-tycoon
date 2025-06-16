import { Project, ProjectReport, PlayerData, StaffMember, StudioSkill, GameState, StudioSkillType } from '@/types/game'; // Added GameState, StudioSkillType
import { grantSkillXp } from './skillUtils'; 

// Define ProjectReportSkillEntry locally if not exported, or ensure it's exported from types/game
interface ProjectReportSkillEntry {
  skillName: string;
  initialXp: number;
  xpGained: number;
  finalXp: number;
  initialLevel: number;
  finalLevel: number;
  xpToNextLevelBefore: number;
  xpToNextLevelAfter: number;
  levelUps: number;
  score: number;
}


const getRelevantSkillsForProject = (
  project: Project, 
  personSkills: PlayerData['skills'] | StaffMember['skills']
): StudioSkillType[] => {
  // Assuming PlayerData['skills'] is Record<StudioSkillType, number>
  // and StaffMember['skills'] is Record<StudioSkillType, StudioSkill>
  // We need a consistent way to check skill existence and get its name.
  // For simplicity, let's assume personSkills keys are StudioSkillType.

  const relevant: StudioSkillType[] = [
    'composition', 'soundDesign', 'recording', 'mixing', 'mastering' 
  ];

  // Add genre-specific skills based on actual StudioSkillType values
  switch (project.genre.toLowerCase()) {
    case 'rock':
    case 'pop':
    case 'country':
      if (personSkills && 'recording' in personSkills) relevant.push('recording'); // Example, adjust to actual skills
      if (personSkills && 'mixing' in personSkills) relevant.push('mixing');
      break;
    case 'electronic':
    case 'hip-hop':
      if (personSkills && 'soundDesign' in personSkills) relevant.push('soundDesign');
      if (personSkills && 'sequencing' in personSkills) relevant.push('sequencing');
      break;
    default:
      if (personSkills && 'composition' in personSkills) relevant.push('composition');
      break;
  }
  
  const uniqueRelevant = Array.from(new Set(relevant));
  return uniqueRelevant.filter(skillName => personSkills && Object.prototype.hasOwnProperty.call(personSkills, skillName));
};

export const generateProjectReview = (
  project: Project,
  assignedPersonDetails: { type: 'player' | 'staff'; id: string; name: string },
  equipmentQuality: number, 
  currentPlayerData: PlayerData,
  allStaffMembers: StaffMember[],
  gameState: GameState // Added gameState parameter
): ProjectReport => {
  const skillBreakdown: ProjectReportSkillEntry[] = [];
  let totalSkillScoreContribution = 0;
  let numContributingSkills = 0;

  let personSkillsSource: PlayerData['skills'] | StaffMember['skills'] | undefined;
  let personActualSkills: Record<StudioSkillType, StudioSkill> | undefined; // For staff
  const isPlayer = assignedPersonDetails.type === 'player';

  if (isPlayer) {
    personSkillsSource = currentPlayerData.skills;
    // For player, skills are levels (numbers). We need to adapt this or assume player has StudioSkill objects.
    // For now, let's assume player skills are also StudioSkill objects for consistency in this function.
    // This might require a change in how PlayerData.skills is structured or handled here.
    // As a temporary workaround, we'll map player skill levels to StudioSkill-like objects.
    personActualSkills = Object.entries(currentPlayerData.skills).reduce((acc, [key, level]) => {
        acc[key as StudioSkillType] = { name: key as StudioSkillType, level, experience: 0, multiplier: 1, xpToNextLevel: grantSkillXp({name: key as StudioSkillType, level, experience:0, multiplier:1, xpToNextLevel:100 },0).updatedSkill.xpToNextLevel }; // Simplified
        return acc;
    }, {} as Record<StudioSkillType, StudioSkill>);

  } else {
    const staffMember = allStaffMembers.find(s => s.id === assignedPersonDetails.id);
    if (staffMember && staffMember.skills) {
      personSkillsSource = staffMember.skills;
      personActualSkills = staffMember.skills as Record<StudioSkillType, StudioSkill>;
    }
  }

  if (!personSkillsSource || !personActualSkills) {
    console.error("Error: Could not find skills for assigned person:", assignedPersonDetails);
    return {
        projectTitle: project.title,
        qualityScore: 0, // Renamed from overallQualityScore
        efficiencyScore: 0, // Add if needed
        finalScore: 0, // Add if needed
        payout: 0, // Renamed from moneyGained
        repGain: 0, // Renamed from reputationGained
        xpGain: 0, // Renamed from playerManagementXpGained
        review: { // Match ProjectReport structure
            qualityScore: 0,
            payout: 0,
            xpGain: 0,
        },
        // skillBreakdown: [], // This is part of the main report now
        // reviewSnippet: "Error generating review: Person's skills not found.",
        // assignedPerson: assignedPersonDetails, // This is not part of ProjectReport
    } as ProjectReport; // Cast to satisfy return type, ensure all fields are present
  }
  
  const relevantSkillKeys = getRelevantSkillsForProject(project, personSkillsSource);

  relevantSkillKeys.forEach(skillKey => {
    const currentSkillState = personActualSkills![skillKey]; // Use personActualSkills

    if (!currentSkillState) return; 

    const skillLevelContribution = currentSkillState.level * 3 + Math.pow(currentSkillState.level, 1.2); 
    const equipmentBonus = Math.floor(equipmentQuality / 7); 
    const difficultyModifier = (project.difficulty - 3) * 3; 
    const randomFactor = Math.floor(Math.random() * 11) + 5; 
    
    let pointsSynergyBonus = 0;
    const creativeSkills: StudioSkillType[] = ['composition', 'soundDesign']; // Adjusted to StudioSkillType
    const technicalSkills: StudioSkillType[] = ['recording', 'mixing', 'mastering']; // Adjusted
    if (creativeSkills.includes(skillKey) && project.accumulatedCPoints > project.accumulatedTPoints) {
        pointsSynergyBonus = Math.min(5, Math.floor(project.accumulatedCPoints / 20));
    } else if (technicalSkills.includes(skillKey) && project.accumulatedTPoints > project.accumulatedCPoints) {
        pointsSynergyBonus = Math.min(5, Math.floor(project.accumulatedTPoints / 20));
    }
    
    let skillScore = Math.round(skillLevelContribution + equipmentBonus + difficultyModifier + randomFactor + pointsSynergyBonus);
    skillScore = Math.max(5, Math.min(100, skillScore)); 

    const baseSkillXp = 20;
    const xpFromScore = Math.floor(skillScore * 0.75); 
    const xpFromDifficulty = project.difficulty * 15;   
    const skillXpGained = baseSkillXp + xpFromScore + xpFromDifficulty + Math.floor(Math.random() * 25); 

    const { updatedSkill, levelUps } = grantSkillXp(currentSkillState, skillXpGained);

    skillBreakdown.push({
      skillName: skillKey.toString(),
      initialXp: currentSkillState.experience, // Use experience
      xpGained: skillXpGained,
      finalXp: updatedSkill.experience, // Use experience
      initialLevel: currentSkillState.level,
      finalLevel: updatedSkill.level,
      xpToNextLevelBefore: currentSkillState.xpToNextLevel || grantSkillXp(currentSkillState,0).updatedSkill.xpToNextLevel, // Ensure xpToNextLevel exists
      xpToNextLevelAfter: updatedSkill.xpToNextLevel,
      levelUps,
      score: skillScore,
    });

    totalSkillScoreContribution += skillScore;
    numContributingSkills++;
  });

  const averageSkillScore = numContributingSkills > 0 ? totalSkillScoreContribution / numContributingSkills : 0;
  
  const pointsFactor = (project.accumulatedCPoints + project.accumulatedTPoints) / 15; 
  const difficultyBonus = project.difficulty * 2; 
  let overallQualityScore = Math.floor((averageSkillScore * 0.6) + (pointsFactor * 0.3) + (difficultyBonus * 0.1));
  overallQualityScore = Math.min(100, Math.max(0, overallQualityScore + Math.floor(Math.random()*10 - 5))); 

  const qualityMultiplier = 0.5 + (overallQualityScore / 100) * 1.5; 
  const contractPayoutModifier = gameState.aggregatedPerkModifiers?.contractPayoutModifier || 1.0;
  const moneyGained = Math.floor(project.payoutBase * qualityMultiplier * contractPayoutModifier);
  const reputationGained = Math.floor(project.repGainBase * qualityMultiplier);
  
  let playerXpGained = 0; // Renamed from playerManagementXpGained to match ProjectReport.xpGain
  if (!isPlayer) { 
    playerXpGained = 30 + Math.floor(overallQualityScore / 5) + project.difficulty * 10; 
  } else { // Player also gains XP for their own projects
    playerXpGained = 50 + Math.floor(overallQualityScore / 4) + project.difficulty * 15;
  }

  let reviewSnippet = "";
  // ... (review snippet logic remains largely the same, ensure it doesn't cause errors)
  const highQualityThreshold = 80;
  const midQualityThreshold = 55;

  if (overallQualityScore >= highQualityThreshold) reviewSnippet = `Outstanding work on "${project.title}"!`;
  else if (overallQualityScore >= midQualityThreshold) reviewSnippet = `Solid effort on "${project.title}".`;
  else reviewSnippet = `"${project.title}" could use some more polish.`;


  return {
    projectTitle: project.title,
    qualityScore: overallQualityScore,
    efficiencyScore: 100, // Placeholder, calculate if needed
    finalScore: overallQualityScore, // Placeholder, can be a combined score
    payout: moneyGained,
    repGain: reputationGained,
    xpGain: playerXpGained,
    review: { // Nested review object as per ProjectReport type
        qualityScore: overallQualityScore,
        payout: moneyGained,
        xpGain: playerXpGained,
        // skillBreakdown, // skillBreakdown is not part of the nested review object
        // reviewSnippet, // reviewSnippet is not part of the nested review object
    },
    // assignedPerson is not part of ProjectReport type
    // skillBreakdown is part of the main report, not nested review
  };
};
