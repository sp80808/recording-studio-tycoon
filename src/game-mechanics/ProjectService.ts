import { GameState, Project, ProjectReport } from '../types/game';

export class ProjectService {
    private gameState: GameState;

    constructor(gameState: GameState) {
        this.gameState = JSON.parse(JSON.stringify(gameState));
    }

    public startProject(project: Project) {
        if (this.gameState.activeProjects.length < this.gameState.maxConcurrentProjects) {
            this.gameState.activeProjects.push(project);
        }
    }

    public updateProjects() {
        const completedProjects: Project[] = [];

        this.gameState.activeProjects.forEach(project => {
            // Simple progress model: each update adds 1% progress
            const progressIncrement = 1;
            const currentStage = project.stages[project.currentStageIndex];
            currentStage.workUnitsCompleted += (currentStage.workUnitsBase * progressIncrement) / 100;

            if (currentStage.workUnitsCompleted >= currentStage.workUnitsBase) {
                currentStage.workUnitsCompleted = currentStage.workUnitsBase;
                currentStage.completed = true;

                if (project.currentStageIndex < project.stages.length - 1) {
                    project.currentStageIndex++;
                } else {
                    completedProjects.push(project);
                }
            }
        });

        completedProjects.forEach(project => {
            this.completeProject(project);
        });
    }

    private completeProject(project: Project) {
        const report: ProjectReport = {
            projectId: project.id,
            projectTitle: project.title,
            moneyGained: project.payoutBase,
            reputationGained: project.repGainBase,
            overallQualityScore: Math.floor(Math.random() * 50) + 50, // 50-100
            playerManagementXpGained: 0,
            skillBreakdown: [],
            reviewSnippet: 'A solid effort.',
            assignedPerson: { type: 'player', id: 'player', name: 'Player' },
        };

        this.gameState.money += report.moneyGained;
        this.gameState.reputation += report.reputationGained;
        // Calculate influence gain based on project quality and reputation gained
        const influenceGained = Math.floor((report.overallQualityScore / 10) + (report.reputationGained / 5));
        this.gameState.influence += influenceGained;
        this.gameState.financials.reports.push(report);
        this.gameState.activeProjects = this.gameState.activeProjects.filter(p => p.id !== project.id);
    }

    public getActiveProjects(): Project[] {
        return this.gameState.activeProjects;
    }

    public getGameState(): GameState {
        return this.gameState;
    }
}
