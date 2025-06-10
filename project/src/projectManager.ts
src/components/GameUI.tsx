// Calculate staff contributions (Simplified)
const staffContributions: StaffContributionDetail[] = project.assignedStaff.map((staffId: string) => {
    const staff = newState.hiredStaff.find((s): s is StaffMember => s.id === staffId); // Explicitly cast s to StaffMember
    if (!staff) return null; // Should not happen

    const totalStatsSum = newState.hiredStaff.reduce((sum: number, s): number => sum + s.primaryStats.creativity + s.primaryStats.technical + s.primaryStats.speed, 0) + newState.playerData.attributes.creativeIntuition + newState.playerData.attributes.technicalAptitude; // Explicitly cast s to StaffMember and sum to number

    return {
        staffId,
        totalStatsSum
    };
});

interface GameUIProps {
  money: number;
  reputation: number;
  day: number;
  completedProjects: number;
  availableProjects: Project[];
  studioSkills: Record<string, StudioSkill>; // Updated type
  upgrades: Upgrade[];
  hiredStaff: StaffMember[]; // Added hiredStaff prop
  onRefreshProjects: () => void;
  onStartProject: (project: Project) => void;
  onPurchaseUpgrade: (upgrade: Upgrade) => void;
  onAdvanceDay: () => void;
  activeProject: Project | null; // Updated type
  onCompleteStage: () => void;
  getMatchColor: (match: MatchRating) => string; // Updated type
  getDifficultyColor: (difficulty: number) => string;
  reviewData: ProjectReview | null; // Added reviewData prop
  onCloseReviewModal: () => void; // Added onCloseReviewModal prop
}

const GameUI: React.FC<GameUIProps> = ({
// ... existing code ...
}); 