// Project Management Service for Multi-Project Automation
import { Project, StaffMember, GameState, AutomationMode, AutomationSettings } from '../types/game';
import { ProgressionSystem } from './ProgressionSystem';
import { calculateStaffProjectFit as getStaffProjectFit } from '@/utils/staffFitUtils';

export interface ProjectCapacity {
  maxProjects: number;
  currentProjects: number;
  efficiency: number;
  staffUtilization: number;
}

export interface StaffAssignment {
  staffId: string;
  projectId: string;
  allocation: number; // 0-1, percentage of time allocated
  priority: number; // 1-5, priority level
}

export interface ProjectPriority {
  projectId: string;
  score: number;
  factors: {
    deadline: number;
    profit: number;
    reputation: number;
    completion: number;
  };
}

export class ProjectManager {
  private gameState: GameState;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  /**
   * Calculate maximum concurrent projects based on studio level and equipment
   */
  calculateProjectCapacity(): ProjectCapacity {
    const maxProjects = ProgressionSystem.getMaxConcurrentProjects(this.gameState);
    const currentProjects = this.gameState.activeProjects.length;
    
    // Staff affects throughput, not whether a physical room exists.
    const totalStaff = this.gameState.hiredStaff.length;
    const efficiency = currentProjects === 0
      ? 1
      : totalStaff > 0
        ? Math.min(1, totalStaff / (currentProjects * 2))
        : 0;
    
    const workingStaff = this.gameState.hiredStaff.filter(s => s.status === 'Working').length;
    const staffUtilization = totalStaff > 0 ? workingStaff / totalStaff : 0;

    return {
      maxProjects,
      currentProjects,
      efficiency,
      staffUtilization
    };
  }

  /**
   * Check if a new project can be added
   */
  canAddProject(): boolean {
    const capacity = this.calculateProjectCapacity();
    return capacity.currentProjects < capacity.maxProjects;
  }

  /**
   * Add a new project if capacity allows
   */
  addProject(project: Project): boolean {
    // State updates are owned by the React hook. This service only validates
    // capacity so callers cannot accidentally append the same project twice.
    return this.canAddProject() && !!project.bookingRoomId;
  }

  /**
   * Remove a completed or cancelled project
   */
  removeProject(projectId: string): boolean {
    // The hook performs the immutable removal and staff cleanup.
    return this.gameState.activeProjects.some(project => project.id === projectId);
  }

  /**
   * Calculate project priorities based on automation settings
   */
  calculateProjectPriorities(): ProjectPriority[] {
    const settings = this.gameState.automation?.settings;
    if (!settings) return [];

    return this.gameState.activeProjects.map(project => {
      const factors = {
        deadline: this.calculateDeadlineFactor(project),
        profit: this.calculateProfitFactor(project),
        reputation: this.calculateReputationFactor(project),
        completion: this.calculateCompletionFactor(project)
      };

      let score = 0;
      switch (settings.priorityMode) {
        case 'deadline':
          score = factors.deadline * 0.6 + factors.completion * 0.4;
          break;
        case 'profit':
          score = factors.profit * 0.6 + factors.completion * 0.4;
          break;
        case 'reputation':
          score = factors.reputation * 0.6 + factors.completion * 0.4;
          break;
        case 'balanced':
        default:
          score = (factors.deadline + factors.profit + factors.reputation + factors.completion) / 4;
          break;
      }

      return {
        projectId: project.id,
        score,
        factors
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Optimize staff assignments across all active projects
   */
  optimizeStaffAssignments(): StaffAssignment[] {
    const priorities = this.calculateProjectPriorities();
    // Work on temporary staff snapshots while calculating assignments.
    // Recommendation code must not mutate the live game state.
    const availableStaff = this.gameState.hiredStaff
      .filter(s => s.status === 'Idle' || s.status === 'Working')
      .map(staff => ({ ...staff }));

    const assignments: StaffAssignment[] = [];
    const settings = this.gameState.automation?.settings;

    if (!settings) return assignments;

    // Clear existing assignments
    availableStaff.forEach(staff => {
      staff.assignedProjectId = null;
    });

    // Assign staff based on project priorities and constraints
    priorities.forEach((priority, priorityIndex) => {
      const project = this.gameState.activeProjects.find(p => p.id === priority.projectId);
      if (!project) return;

      const minStaff = settings.minStaffPerProject;
      const maxStaff = settings.maxStaffPerProject;
      
      // Find best staff for this project
      const suitableStaff = this.findBestStaffForProject(project, availableStaff);
      const staffToAssign = suitableStaff.slice(0, maxStaff);

      staffToAssign.forEach((staff, staffIndex) => {
        if (staffIndex < minStaff || assignments.filter(a => a.projectId === project.id).length < maxStaff) {
          const allocation = this.calculateStaffAllocation(staff, project, settings.workloadDistribution);
          
          assignments.push({
            staffId: staff.id,
            projectId: project.id,
            allocation,
            priority: priorityIndex + 1
          });

          staff.assignedProjectId = project.id;
          staff.status = 'Working';
        }
      });
    });

    return assignments;
  }

  /**
   * Execute automated work for all active projects
   */
  executeAutomatedWork(): void {
    if (!this.gameState.automation?.enabled) return;

    const assignments = this.optimizeStaffAssignments();
    const efficiency = this.gameState.automation.efficiency || {};

    this.gameState.activeProjects.forEach(project => {
      const projectStaff = assignments.filter(a => a.projectId === project.id);
      const projectEfficiency = efficiency[project.id] || 0.5;

      if (projectStaff.length > 0) {
        this.performAutomatedWork(project, projectStaff, projectEfficiency);
      }
    });

    this.updateAnimationStates();
  }

  /**
   * Update the max concurrent projects in game state
   */
  private updateMaxConcurrentProjects(): void {
    const capacity = this.calculateProjectCapacity();
    this.gameState.maxConcurrentProjects = capacity.maxProjects;
  }

  /**
   * Reassign staff when project lineup changes
   */
  private reassignStaff(): void {
    if (this.gameState.automation?.enabled) {
      this.optimizeStaffAssignments();
    }
  }

  /**
   * Calculate deadline urgency factor (0-1)
   */
  private calculateDeadlineFactor(project: Project): number {
    const daysRemaining = project.durationDaysTotal - project.workSessionCount;
    const totalDays = project.durationDaysTotal;
    
    if (daysRemaining <= 1) return 1;
    if (daysRemaining >= totalDays * 0.5) return 0.3;
    
    return Math.max(0.3, 1 - (daysRemaining / totalDays));
  }

  /**
   * Calculate profit potential factor (0-1)
   */
  private calculateProfitFactor(project: Project): number {
    const maxPayout = 50000; // Adjust based on game balance
    return Math.min(1, project.payoutBase / maxPayout);
  }

  /**
   * Calculate reputation value factor (0-1)
   */
  private calculateReputationFactor(project: Project): number {
    const maxRep = 1000; // Adjust based on game balance
    return Math.min(1, project.repGainBase / maxRep);
  }

  /**
   * Calculate completion progress factor (0-1)
   */
  private calculateCompletionFactor(project: Project): number {
    const totalStages = project.stages.length;
    const completedStages = project.stages.filter(s => s.completed).length;
    return completedStages / totalStages;
  }

  /**
   * Find best staff members for a specific project
   */
  private findBestStaffForProject(project: Project, availableStaff: StaffMember[]): StaffMember[] {
    return availableStaff
      .filter(staff => !staff.assignedProjectId) // Only unassigned staff
      .map(staff => ({
        staff,
        score: this.calculateStaffProjectFit(staff, project)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.staff);
  }

  /**
   * Calculate how well a staff member fits a project
   */
  private calculateStaffProjectFit(staff: StaffMember, project: Project): number {
    return getStaffProjectFit(staff, project).score;
  }

  /**
   * Calculate staff time allocation for a project
   */
  private calculateStaffAllocation(
    staff: StaffMember, 
    project: Project, 
    distribution: AutomationSettings['workloadDistribution']
  ): number {
    switch (distribution) {
      case 'even':
        return 1 / this.gameState.activeProjects.length;
      case 'focus_one':
        return 1; // Full allocation to highest priority project
      case 'adaptive':
      default:
        // Adaptive allocation based on project needs and staff capacity
        const urgency = this.calculateDeadlineFactor(project);
        const baseAllocation = 0.6;
        return Math.min(1, baseAllocation + (urgency * 0.4));
    }
  }

  /**
   * Perform automated work for a project
   */
  private performAutomatedWork(
    project: Project, 
    assignedStaff: StaffAssignment[], 
    efficiency: number
  ): void {
    const currentStage = project.stages[project.currentStageIndex];
    if (!currentStage || currentStage.completed) return;

    // Calculate work output based on staff assignments and efficiency
    let workOutput = 0;
    assignedStaff.forEach(assignment => {
      const staff = this.gameState.hiredStaff.find(s => s.id === assignment.staffId);
      if (!staff) return;

      const staffEfficiency = (staff.energy / 100) * (staff.mood / 100);
      const workContribution = assignment.allocation * staffEfficiency * efficiency;
      workOutput += workContribution;
    });

    // Apply work to current stage
    currentStage.workUnitsCompleted += workOutput;
    
    // Check if stage is completed
    if (currentStage.workUnitsCompleted >= currentStage.workUnitsBase) {
      currentStage.completed = true;
      project.completedStages.push(project.currentStageIndex);
      
      // Move to next stage if available
      if (project.currentStageIndex < project.stages.length - 1) {
        project.currentStageIndex++;
      }
    }

    // Update efficiency based on performance
    if (!this.gameState.automation!.efficiency) {
      this.gameState.automation!.efficiency = {};
    }
    this.gameState.automation!.efficiency[project.id] = Math.min(1, efficiency + 0.01);
  }

  /**
   * Update animation states for projects and staff
   */
  private updateAnimationStates(): void {
    if (!this.gameState.animations) {
      this.gameState.animations = {
        projects: {},
        staff: {},
        globalEffects: {
          studioActivity: 0,
          projectTransitions: {},
          automationPulse: false,
          lastGlobalUpdate: Date.now()
        }
      };
    }

    const now = Date.now();

    // Update project animation states
    this.gameState.activeProjects.forEach(project => {
      const assignedStaff = this.gameState.hiredStaff.filter(s => s.assignedProjectId === project.id);
      
      this.gameState.animations!.projects[project.id] = {
        isActive: assignedStaff.length > 0,
        workIntensity: Math.min(1, assignedStaff.length / 3),
        staffCount: assignedStaff.length,
        progressPulse: this.shouldShowProgressPulse(project),
        lastUpdate: now
      };
    });

    // Update staff animation states
    this.gameState.hiredStaff.forEach(staff => {
      this.gameState.animations!.staff[staff.id] = {
        currentAction: staff.status === 'Working' ? 'working' : 'idle',
        workIntensity: staff.assignedProjectId ? (staff.energy / 100) : 0,
        assignedProjects: staff.assignedProjectId ? [staff.assignedProjectId] : [],
        focusTransition: false,
        lastActionChange: now
      };
    });

    // Update global animation state
    const workingStaff = this.gameState.hiredStaff.filter(s => s.status === 'Working').length;
    const totalStaff = this.gameState.hiredStaff.length;
    
    this.gameState.animations!.globalEffects = {
      studioActivity: totalStaff > 0 ? workingStaff / totalStaff : 0,
      projectTransitions: {},
      automationPulse: this.gameState.automation?.enabled || false,
      lastGlobalUpdate: now
    };
  }

  /**
   * Determine if project should show progress pulse animation
   */
  private shouldShowProgressPulse(project: Project): boolean {
    const currentStage = project.stages[project.currentStageIndex];
    if (!currentStage) return false;

    const progress = currentStage.workUnitsCompleted / currentStage.workUnitsBase;
    return progress > 0.8; // Pulse when close to completion
  }
}
