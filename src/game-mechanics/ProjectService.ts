import { applyKnowHowEvents } from '../rpg/studioKnowHow';
import { awardExpertise } from '../rpg/houseStyle';
import { recordRelease } from '../rpg/artistCareer';
import { creditSession, mentorshipScale } from '../rpg/staffCareer';
import { getProjectBrief } from '../rpg/projectBrief';
import { awardProjectCrate, recordGearUse } from '@/features/usedGear/session';
import { GameState, Project, ProjectReport, StaffMember } from '../types/game';
import { generateProjectReview } from '../utils/projectReviewUtils';
import { grantSkillXp } from '../utils/skillUtils';
import {
  calculateBaseWorkPoints,
  applyFocusAndMultipliers,
  applyStudioSkillBonusesToWorkPoints,
  applyEquipmentBonusesToWorkPoints,
  calculateStaffWorkContribution,
} from '../utils/projectUtils';
import { calculateStudioSkillBonus, getEquipmentBonuses, resolveSessionEquipment } from '../utils/gameUtils';
import {
  getFocusEffectiveness,
  getMoodEffectiveness,
  getCreativityMultiplier,
  getTechnicalMultiplier,
} from '../utils/playerUtils';
import { getGenreMarketMultiplier } from '../utils/eraProgression';
import { getSettlementBonuses } from '../utils/settlementBonuses';
import { getOriginEffects } from '../narrative/originPerks';
import { addAllocations, earn } from '../economy/ledger';
import { calculateEquipmentUpkeep } from '../economy/upkeep';
import { growFamiliarity } from '@/rpg/signalChain';
import { settlementAfterDeposit, recordService, quoteFor } from '@/rpg/serviceQuote';
import {
  findProjectForReport,
  resolveDeliveryClient,
  applyDeliveryToClientRelationships,
  buildRelationshipSnippet,
} from './relationship-management';

/**
 * Canonical lifecycle service for the multi-project path (bead ruc.1).
 *
 * Previously this class used a mock model (+1% progress, random 50-100
 * quality, base payouts). It now delegates to the same authoritative
 * settlement functions as the foreground single-project path:
 * projectUtils work-point chain for progression and
 * projectReviewUtils.generateProjectReview for completion scoring.
 */
export class ProjectService {
    private gameState: GameState;

    constructor(gameState: GameState) {
        this.gameState = JSON.parse(JSON.stringify(gameState));
    }

    public startProject(project: Project): boolean {
        if (this.gameState.activeProjects.length >= this.gameState.maxConcurrentProjects) {
            return false;
        }
        if (this.gameState.activeProjects.some(p => p.id === project.id)) {
            return false;
        }
        this.gameState.activeProjects.push({ ...project });
        return true;
    }

    public assignStaffToProject(projectId: string, staffId: string): boolean {
        const project = this.gameState.activeProjects.find(p => p.id === projectId);
        const staff = this.gameState.hiredStaff.find(s => s.id === staffId);
        if (!project || !staff) return false;
        if (staff.status !== 'Idle' || staff.assignedProjectId) return false;
        if (staff.energy < 20) return false; // Never schedule an exhausted member
        staff.status = 'Working';
        staff.assignedProjectId = projectId;
        return true;
    }

    public unassignStaffFromProject(staffId: string): void {
        const staff = this.gameState.hiredStaff.find(s => s.id === staffId);
        if (!staff) return;
        staff.status = 'Idle';
        staff.assignedProjectId = null;
    }

    /**
     * Advance every active project by one passive work tick using the real
     * work-point chain (focus, studio skills, equipment, staff). Returns the
     * settlement reports for projects that finished this tick.
     */
    public updateProjects(): ProjectReport[] {
        const completedReports: ProjectReport[] = [];
        const completedIds: string[] = [];

        this.gameState.activeProjects.forEach(project => {
            if (project.awaitingReview || project.stages.every(stage => stage.completed)) {
                completedIds.push(project.id);
                return;
            }
            const assignedStaff = this.gameState.hiredStaff.filter(
                s => s.assignedProjectId === project.id && s.status === 'Working'
            );
            const focus = project.focusAllocation || { performance: 33, soundCapture: 33, layering: 34 };

            // Passive tick uses a bounded capacity so background progress never
            // outpaces attended sessions; same functions as useStageWork.
            let workPoints = calculateBaseWorkPoints(2, this.gameState.playerData.attributes);
            workPoints = applyFocusAndMultipliers(
                workPoints,
                focus,
                getCreativityMultiplier(this.gameState),
                getTechnicalMultiplier(this.gameState),
                getFocusEffectiveness(this.gameState)
            );
            workPoints = applyStudioSkillBonusesToWorkPoints(workPoints, project.genre, this.gameState.studioSkills);
            workPoints = applyEquipmentBonusesToWorkPoints(
                workPoints,
                resolveSessionEquipment(this.gameState, project.bookingRoomId),
                project.genre
            );
            workPoints = calculateStaffWorkContribution(workPoints, assignedStaff, project.genre, getMoodEffectiveness);

            const creativityGain = Math.max(1, Math.round(workPoints.creativity));
            const technicalGain = Math.max(1, Math.round(workPoints.technical));
            const totalPoints = creativityGain + technicalGain;

            project.accumulatedCPoints += creativityGain;
            project.accumulatedTPoints += technicalGain;
            project.workSessionCount = (project.workSessionCount || 0) + 1;

            const currentStage = project.stages[project.currentStageIndex];
            if (currentStage && !currentStage.completed) {
                const workUnitsToAdd = Math.max(1, Math.floor(totalPoints / 4));
                currentStage.workUnitsCompleted = Math.min(
                    currentStage.workUnitsCompleted + workUnitsToAdd,
                    currentStage.workUnitsBase
                );
                if (currentStage.workUnitsCompleted >= currentStage.workUnitsBase) {
                    currentStage.completed = true;
                    if (project.currentStageIndex < project.stages.length - 1) {
                        project.currentStageIndex++;
                    } else {
                        completedIds.push(project.id);
                    }
                }
            } else if (project.stages.every(s => s.completed)) {
                completedIds.push(project.id);
            }

            const gearUse = recordGearUse(this.gameState, project);
            this.gameState = { ...gearUse.state };
            project.gearNotes = gearUse.project.gearNotes;

            // Assigned crew tires passively, mirroring the foreground path.
            this.gameState.hiredStaff = this.gameState.hiredStaff.map(staff => assignedStaff.some(assigned => assigned.id === staff.id)
                ? { ...staff, energy: Math.max(0, staff.energy - 10), mood: Math.max(0, staff.mood - 1) } : staff);
        });

        completedIds.forEach(id => {
            const project = this.gameState.activeProjects.find(p => p.id === id);
            if (project) {
                completedReports.push(this.completeProject(project));
            }
        });

        return completedReports;
    }

    public completeProject(project: Project): ProjectReport {
        const assignedStaff = this.gameState.hiredStaff.filter(s => s.assignedProjectId === project.id);
        const lead = assignedStaff[0];
        const assignedPerson = lead
            ? { type: 'staff' as const, id: lead.id, name: lead.name }
            : { type: 'player' as const, id: 'player', name: 'Player' };

        const report = generateProjectReview(
            project,
            assignedPerson,
            computeEquipmentQuality(this.gameState, project.bookingRoomId),
            this.gameState.playerData,
            this.gameState.hiredStaff,
            {
                focusEffectiveness: getFocusEffectiveness(this.gameState),
                staffContribution: computeStaffContribution(assignedStaff, project.genre),
                studioQualityBonus: computeStudioQualityBonus(this.gameState, project.genre),
                equipmentQualityBonus: computeEquipmentQualityBonus(this.gameState, project.genre, project.bookingRoomId),
                marketMultiplier: getGenreMarketMultiplier(project.genre, this.gameState.currentEra, this.gameState.cityId),
                sessionEquipment: resolveSessionEquipment(this.gameState, project.bookingRoomId),
                brewReady:
                    this.gameState.choreState?.chores.brew_espresso?.completed === true,
                ...getSettlementBonuses(
                    this.gameState,
                    project,
                    getGenreMarketMultiplier(project.genre, this.gameState.currentEra, this.gameState.cityId),
                ),
            }
        );

        const settled = applyReportToState(this.gameState, report);
        settled.activeProjects = settled.activeProjects.filter(p => p.id !== project.id);
        this.gameState = settled;
        return report;
    }

    public getActiveProjects(): Project[] {
        return this.gameState.activeProjects;
    }

    public getGameState(): GameState {
        return this.gameState;
    }
}

function computeEquipmentQuality(gameState: GameState, bookingRoomId?: string | null): number {
    const equipment = resolveSessionEquipment(gameState, bookingRoomId);
    if (equipment.length === 0) return 50;
    const avgCondition = equipment.reduce((sum, eq) => sum + (eq.condition ?? 100), 0) / equipment.length;
    const qualityBonus = getEquipmentBonuses(equipment).quality || 0;
    return Math.max(0, Math.min(100, Math.round(avgCondition * 0.6 + Math.min(40, qualityBonus))));
}

function computeEquipmentQualityBonus(
    gameState: GameState,
    genre: string,
    bookingRoomId?: string | null
): number {
    const bonuses = getEquipmentBonuses(resolveSessionEquipment(gameState, bookingRoomId), genre);
    return Math.max(0, Math.min(10, Math.round((bonuses.quality || 0) / 2 + (bonuses.genre || 0) / 4)));
}

function computeStudioQualityBonus(gameState: GameState, genre: string): number {
    const genreSkill = gameState.studioSkills[genre];
    if (!genreSkill) return 0;
    return Math.max(0, Math.min(10, Math.round(calculateStudioSkillBonus(genreSkill, 'quality'))));
}

function computeStaffContribution(assignedStaff: StaffMember[], genre: string): number {
    if (assignedStaff.length === 0) return 0;
    const total = assignedStaff.reduce((sum, staff) => {
        const base = (staff.primaryStats.creativity + staff.primaryStats.technical) / 2;
        const moodMultiplier = getMoodEffectiveness(staff.mood);
        const affinityBonus = staff.genreAffinity && staff.genreAffinity.genre === genre
            ? staff.genreAffinity.bonus / 10
            : 0;
        return sum + base * 0.08 * moodMultiplier + affinityBonus;
    }, 0);
    return Math.max(0, Math.min(10, Math.round(total / Math.max(1, assignedStaff.length))));
}

/**
 * Canonical report settlement (bead ruc.2) — PURE.
 *
 * Applies everything a completed ProjectReport should change: money,
 * reputation, influence, financial income/profit/report history, plus
 * player or staff skill + XP gains and crew release.
 *
 * Previously this logic lived in two hand-copied places (this file and
 * useProjectManagement.completeProject) that could silently drift apart.
 * Both now call this single function: the foreground path passes prev state
 * through it inside setGameState, the background path reassigns its snapshot.
 *
 * @returns a NEW GameState; the input is never mutated.
 */
export function applyReportToState(state: GameState, report: ProjectReport): GameState {
    if (state.financials.reports.some(existing => existing.projectId === report.projectId)) return state;
    const influenceGained = Math.floor(report.overallQualityScore / 10 + report.reputationGained / 5);
    const income = state.financials.income + report.moneyGained;

    let playerData = state.playerData;

    const applySkillBreakdown = <T extends { skills: Record<string, {
        xp: number; level: number; xpToNextLevel: number;
    }> }>(person: T): T => {
        const newSkills = { ...person.skills };
        report.skillBreakdown.forEach(skillDetail => {
            const skillName = skillDetail.skillName as keyof typeof newSkills;
            const current = newSkills[skillName];
            if (current) {
                newSkills[skillName] = {
                    ...current,
                    xp: skillDetail.finalXp,
                    level: skillDetail.finalLevel,
                    xpToNextLevel: skillDetail.xpToNextLevelAfter,
                };
            }
        });
        return { ...person, skills: newSkills };
    };

    let hiredStaff = state.hiredStaff;

    if (report.assignedPerson.type === 'player') {
        playerData = {
            ...applySkillBreakdown(state.playerData),
            xp: state.playerData.xp + 25 + Math.floor(report.overallQualityScore / 10),
        };
    } else {
        hiredStaff = state.hiredStaff.map(staff => {
            if (staff.id !== report.assignedPerson.id) return staff;
            // Staff career (#67): the settled project credits the disciplines it exercised.
            const sessionStages = (findProjectForReport(state, report.projectId)?.stages ?? []).map(st => st.stageName);
            return {
                ...creditSession(applySkillBreakdown(staff), report.projectId, sessionStages, report.overallQualityScore, mentorshipScale(staff, state.hiredStaff)),
                xpInRole: staff.xpInRole + 20 + Math.floor(report.overallQualityScore / 2),
                status: 'Idle' as const,
                assignedProjectId: null,
            };
        });

        if (report.playerManagementXpGained > 0) {
            const { updatedSkill } = grantSkillXp(
                state.playerData.skills.management,
                report.playerManagementXpGained
            );
            playerData = {
                ...state.playerData,
                skills: { ...state.playerData.skills, management: updatedSkill },
            };
        }
    }

    // Release any crew still tied to this project.
    const projectId = report.projectId;
    const chain = [state.activeProject, ...(state.activeProjects ?? [])].find(p => p?.id === projectId)?.signalChain;
    const crewIds = new Set(hiredStaff.filter(s => s.assignedProjectId === projectId).map(s => s.id));
    if (report.assignedPerson.type === 'staff') crewIds.add(report.assignedPerson.id);
    // Gear familiarity grows from actual use (#86, capped at 10 sessions per item).
    if (chain) hiredStaff = growFamiliarity(hiredStaff, chain, crewIds);
    const releasedStaff = hiredStaff.map(s =>
        s.assignedProjectId === projectId
            ? { ...s, status: 'Idle' as const, assignedProjectId: null }
            : s
    );

    // Issue #10 lightweight client relationships (append-only; the settlement
    // math above is untouched). Canonical delivery spot: both the foreground
    // path (useProjectManagement) and the background path (completeProject)
    // settle through here, so one guarded update covers every delivery.
    // NOTE: appends one line to report.reviewSnippet in place so the live
    // report and the stored history agree; guarded and idempotent, and a
    // missing project/client skips silently without blocking settlement.
    let clientRelationships = state.clientRelationships;
    const deliveryProject = findProjectForReport(state, report.projectId);
    const deliveryClient = resolveDeliveryClient(deliveryProject);
    if (deliveryClient) {
        const applied = applyDeliveryToClientRelationships(clientRelationships, {
            clientKey: deliveryClient.clientKey,
            clientName: deliveryClient.clientName,
            primaryGenre: deliveryClient.primaryGenre,
            qualityScore: report.overallQualityScore,
            matchRating: deliveryClient.matchRating,
            currentDay: state.currentDay,
            xpMultiplier: getOriginEffects(state).relationshipXpMultiplier,
        });
        clientRelationships = applied.relationships;
        // Artist career (#49): one release record per settled client project; the
        // delayed outcome later pays reputation/referrals only, never the fee again.
        if (deliveryProject?.id && deliveryProject.title) {
            const dp = deliveryProject as { id: string; title: string; genre?: string; followUpOf?: string };
            clientRelationships = {
                ...clientRelationships,
                [deliveryClient.clientKey]: recordRelease(applied.record, {
                    projectId: dp.id,
                    title: dp.title.replace(/^(Return|Follow-up): /, ''),
                    genre: dp.genre ?? deliveryClient.primaryGenre,
                    qualityScore: report.overallQualityScore,
                    day: state.currentDay,
                    followUpOf: dp.followUpOf,
                }),
            };
        }
        const snippetLine = buildRelationshipSnippet(
            deliveryClient.clientName,
            applied.previousTier,
            applied.record.tier,
            report.overallQualityScore
        );
        if (
            snippetLine &&
            typeof report.reviewSnippet === 'string' &&
            !report.reviewSnippet.includes('relationship with') &&
            !report.reviewSnippet.includes('barely moved')
        ) {
            report.reviewSnippet = `${report.reviewSnippet}${snippetLine}`;
        }
    }

    const project =
        state.activeProject?.id === report.projectId
            ? state.activeProject
            : [...(state.activeProjects ?? []), ...(state.availableProjects ?? [])]
                .find(p => p?.id === report.projectId);
    const days = Math.max(1, project?.durationDaysTotal ?? 1);
    const assigned = state.hiredStaff.filter(s => s.assignedProjectId === report.projectId);
    const staffShare = assigned.reduce((t, s) => t + s.salary, 0) * days;
    const overheadShare = Math.round(calculateEquipmentUpkeep(state.ownedEquipment, getOriginEffects(state)) * days);
    const booked = addAllocations(
        earn(state, settlementAfterDeposit(report.moneyGained, project?.depositPaid), {
            category: 'session-income',
            projectId: report.projectId,
            sourceId: `settle-${report.projectId}-${state.financials.reports.length}`,
            memo: report.projectTitle,
        }),
        [
            { projectId: report.projectId, day: state.currentDay, kind: 'staff', amount: staffShare },
            { projectId: report.projectId, day: state.currentDay, kind: 'overhead', amount: overheadShare },
        ],
    );

    return awardProjectCrate({
        ...booked,
        serviceLog: project
            ? recordService(state.serviceLog, {
                projectId: report.projectId,
                service: getProjectBrief(project).serviceType,
                roomHours: quoteFor(state, project).roomHours,
                revenue: report.moneyGained,
                day: state.currentDay,
            })
            : state.serviceLog,
        reputation: state.reputation + report.reputationGained,
        influence: state.influence + influenceGained,
        playerData,
        hiredStaff: releasedStaff,
        clientRelationships,
        // House style (#71): finished work builds studio expertise, idempotent per project.
        studioExpertise: project
            ? awardExpertise(state.studioExpertise, {
                projectId: report.projectId,
                genre: project.genre,
                serviceType: getProjectBrief(project).serviceType,
                approachId: project.approachId,
                quality: report.overallQualityScore,
                difficulty: project.difficulty,
            })
            : state.studioExpertise,
        // Polishing feeds the same Know-How pool as everything else (#66).
        studioKnowHow: applyKnowHowEvents(state, report.knowHowGained
            ? [{ kind: 'polish', eventId: `polish:${report.projectId}`, amount: report.knowHowGained }]
            : []).game.studioKnowHow,
        financials: {
            ...state.financials,
            income,
            profit: income - state.financials.expenses,
            reports: [...state.financials.reports, report],
        },
    }, state.activeProject?.id === report.projectId ? state.activeProject : state.activeProjects.find(project => project.id === report.projectId), report.overallQualityScore);
}
