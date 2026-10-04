// Multi-Project Dashboard Component (rst-styled to match the session views).
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Users, Zap, Settings, Play, Pause, Plus, X } from 'lucide-react';
import { GameState, Project, AutomationMode, AutomationSettings } from '@/types/game';
import { useMultiProjectManagement } from '@/hooks/useMultiProjectManagement';
import { calculateStaffProjectFit } from '@/utils/staffFitUtils';
import { formatNumber } from '@/i18n/formatLocale';

interface MultiProjectDashboardProps {
  gameState: GameState;
  setGameState: (state: GameState | ((prev: GameState) => GameState)) => void;
  onProjectSelect?: (project: Project) => void;
  /** Jump to per-project session work (sliders) for this project. */
  onWorkSession?: (project: Project) => void;
}

export const MultiProjectDashboard: React.FC<MultiProjectDashboardProps> = ({
  gameState,
  setGameState,
  onProjectSelect,
  onWorkSession
}) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  
  const {
    projectCapacity,
    activeProjects,
    automationStatus,
    canAddProject,
    addProject,
    removeProject,
    toggleAutomation,
    setAutomationMode,
    updateAutomationSettings,
    applyOptimalStaffAssignments,
    executeAutomatedWork,
    getOptimalStaffAssignments,
    getProjectPriorities,
    getStaffWorkload,
    getProjectProgress
  } = useMultiProjectManagement({ gameState, setGameState });

  const projectProgress = getProjectProgress();
  const staffWorkload = getStaffWorkload();
  const projectPriorities = getProjectPriorities();

  const handleAddProject = (availableProject: Project) => {
    if (canAddProject()) {
      addProject(availableProject);
    }
  };

  const handleRemoveProject = (projectId: string) => {
    removeProject(projectId);
  };

  const handleAutomationToggle = (enabled: boolean) => {
    toggleAutomation(enabled);
    if (enabled) {
      applyOptimalStaffAssignments();
    }
  };

  const handleAutomationModeChange = (mode: AutomationMode) => {
    setAutomationMode(mode);
    if (mode !== 'off') {
      applyOptimalStaffAssignments();
    }
  };

  const getProjectStatusColor = (progress: number) => {
    if (progress < 0.3) return 'bg-red-600';
    if (progress < 0.7) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return 'rst-chip-danger';
    if (priority === 2) return 'rst-chip-brass';
    if (priority === 3) return 'rst-chip-brass';
    return '';
  };

  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="rst-title text-lg">Multi-Project Studio</h1>
          <p className="rst-muted text-xs">
            Managing {activeProjects.length} of {projectCapacity.maxProjects} projects
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`rst-chip whitespace-nowrap ${automationStatus?.enabled ? 'rst-chip-money' : ''}`}>
            {automationStatus?.enabled ? 'Automation ON' : 'Manual Mode'}
          </span>

          <button
            type="button"
            onClick={() => handleAutomationToggle(!automationStatus?.enabled)}
            className={`rst-btn !min-h-9 !px-3 !text-xs ${automationStatus?.enabled ? '' : 'rst-btn-primary'}`}
          >
            {automationStatus?.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {automationStatus?.enabled ? 'Pause' : 'Start'}
          </button>
        </div>
      </div>

      {/* Capacity strip */}
      <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--rst-line)] bg-black/20 px-3 py-2 text-center">
        <div className="min-w-0">
          <div className="text-sm font-bold text-[var(--rst-brass-300)]">
            {activeProjects.length}/{projectCapacity.maxProjects}
          </div>
          <div className="rst-muted text-[10px]">Projects</div>
        </div>

        <div className="min-w-0">
          <div className="text-sm font-bold text-[var(--rst-money)]">
            {Math.round(projectCapacity.efficiency * 100)}%
          </div>
          <div className="rst-muted text-[10px]">Efficiency</div>
        </div>

        <div className="min-w-0">
          <div className="text-sm font-bold text-purple-300">
            {automationStatus?.workingStaff || 0}/{automationStatus?.totalStaff || 0}
          </div>
          <div className="rst-muted text-[10px]">Staff on</div>
        </div>

        <div className="min-w-0">
          <div className="text-sm font-bold text-orange-300">
            {Math.round((automationStatus?.studioActivity || 0) * 100)}%
          </div>
          <div className="rst-muted text-[10px]">Activity</div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Active Projects Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Active Projects
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {projectProgress.length === 0 ? (
                  <p className="rst-muted text-center py-6">No active projects</p>
                ) : (
                  projectProgress.map((progress, index) => (
                    <div key={progress.projectId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{progress.title}</span>
                        <span className={`rst-chip whitespace-nowrap ${getPriorityColor(index + 1)}`}>
                          Priority {index + 1}
                        </span>
                      </div>
                      <Progress 
                        value={progress.overallProgress * 100} 
                        className="h-2"
                        aria-label={`${progress.title} project progress`}
                      />
                      <div className="flex justify-between text-sm rst-muted">
                        <span>{progress.currentStage}</span>
                        <span>{progress.assignedStaffCount} staff</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Available Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Available Projects
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {gameState.availableProjects.length === 0 ? (
                  <p className="rst-muted text-center py-6">No available projects</p>
                ) : (
                  gameState.availableProjects.slice(0, 3).map((project) => (
                    <div key={project.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-[var(--rst-line)] bg-black/20">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{project.title}</div>
                        <div className="rst-muted text-xs">
                          {project.genre} • ${formatNumber(project.payoutBase)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddProject(project)}
                        disabled={!canAddProject()}
                        className="rst-btn rst-btn-primary shrink-0 !min-h-9 !px-3 !text-xs"
                      >
                        Add
                      </button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {activeProjects.map((project) => {
              const progress = projectProgress.find(p => p.projectId === project.id);
              const assignedStaff = gameState.hiredStaff.filter(s => s.assignedProjectId === project.id);
              const priority = projectPriorities.findIndex(p => p.projectId === project.id) + 1;
              
              return (
                <Card key={project.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg truncate">{project.title}</CardTitle>
                      <button
                        type="button"
                        onClick={() => handleRemoveProject(project.id)}
                        aria-label={`Remove ${project.title}`}
                        title="Remove project"
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-stone-400 hover:bg-white/10 hover:text-rose-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="rst-chip whitespace-nowrap">{project.genre}</span>
                      <span className={`rst-chip whitespace-nowrap ${getPriorityColor(priority)}`}>
                        P{priority}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Overall Progress</span>
                        <span>{Math.round((progress?.overallProgress || 0) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(progress?.overallProgress || 0) * 100} 
                        className="h-2"
                        aria-label={`${project.title} overall progress`}
                      />
                    </div>
                    
                    <div className="rst-muted text-xs space-y-0.5">
                      <div>Current: {progress?.currentStage}</div>
                      <div>
                        Room: {gameState.studioRooms.find(room => room.id === project.bookingRoomId)?.name || 'Unassigned'}
                      </div>
                      <div>Staff: {assignedStaff.length}</div>
                      <div>Est. Completion: {progress?.estimatedCompletion === Infinity ? 'N/A' : `${progress?.estimatedCompletion} days`}</div>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onWorkSession?.(project)}
                        className="rst-btn rst-btn-primary flex-1 !min-h-9 !text-xs"
                      >
                        Open session
                      </button>
                      <button
                        type="button"
                        onClick={() => onProjectSelect?.(project)}
                        className="rst-btn flex-1 !min-h-9 !text-xs"
                      >
                        View Details
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {/* Add Project Card */}
            {canAddProject() && (
              <Card className="border-dashed border-2 border-stone-300 hover:border-stone-400 transition-colors">
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Plus className="w-10 h-10 text-stone-400 mx-auto mb-3" />
                    <p className="rst-muted mb-2 text-sm">Add a new project</p>
                    <p className="rst-muted text-xs">
                      {projectCapacity.maxProjects - activeProjects.length} slots available
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Staff Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {gameState.hiredStaff.map((staff) => {
                  const workload = staffWorkload[staff.id] || [];
                  const assignedProject = workload[0] ? activeProjects.find(p => p.id === workload[0]) : null;
                  
                  return (
                    <div key={staff.id} className="p-3 rounded-lg border border-[var(--rst-line)] bg-black/20">
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <span className="font-medium truncate">{staff.name}</span>
                        <span className={`rst-chip whitespace-nowrap ${staff.status === 'Working' ? 'rst-chip-money' : ''}`}>
                          {staff.status}
                        </span>
                      </div>
                      
                      <div className="rst-muted text-xs mb-2">
                        {staff.role} • Level {staff.levelInRole}
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="rst-muted">Energy:</span>
                          <span>{staff.energy}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="rst-muted">Mood:</span>
                          <span>{staff.mood}%</span>
                        </div>
                      </div>
                      
                      {assignedProject && (() => {
                        const fit = calculateStaffProjectFit(staff, assignedProject);
                        return (
                          <div className="mt-2 p-2 rounded border border-[var(--rst-line)] bg-black/25 text-xs">
                            <div className="font-medium">Assigned to:</div>
                            <div className="truncate">{assignedProject.title}</div>
                            <div className="text-[var(--rst-brass-300)] mt-1">
                              Fit {fit.score}/100 · {fit.reasons.slice(0, 3).join(' · ')}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Automation Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enable/Disable Automation */}
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium">Enable Automation</div>
                  <div className="rst-muted text-xs">
                    Automatically assign staff and manage project work
                  </div>
                </div>
                <Switch
                  checked={automationStatus?.enabled || false}
                  onCheckedChange={handleAutomationToggle}
                />
              </div>

              <Separator />

              {/* Automation Mode */}
              <div className="space-y-2">
                <label className="font-medium">Automation Mode</label>
                <Select
                  value={automationStatus?.mode || 'off'}
                  onValueChange={handleAutomationModeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select automation mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="smart">Smart</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Mode */}
              <div className="space-y-2">
                <label className="font-medium">Priority Mode</label>
                <Select
                  value={automationStatus?.settings.priorityMode || 'balanced'}
                  onValueChange={(value: AutomationSettings['priorityMode']) => 
                    updateAutomationSettings({ priorityMode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deadline">Deadline Priority</SelectItem>
                    <SelectItem value="profit">Profit Priority</SelectItem>
                    <SelectItem value="reputation">Reputation Priority</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Staff Allocation Limits */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="font-medium">Min Staff per Project</label>
                  <Slider
                    value={[automationStatus?.settings.minStaffPerProject || 1]}
                    onValueChange={([value]) => 
                      updateAutomationSettings({ minStaffPerProject: value })
                    }
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="rst-muted text-xs">
                    {automationStatus?.settings.minStaffPerProject || 1} staff minimum
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-medium">Max Staff per Project</label>
                  <Slider
                    value={[automationStatus?.settings.maxStaffPerProject || 3]}
                    onValueChange={([value]) => 
                      updateAutomationSettings({ maxStaffPerProject: value })
                    }
                    max={8}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="rst-muted text-xs">
                    {automationStatus?.settings.maxStaffPerProject || 3} staff maximum
                  </div>
                </div>
              </div>

              {/* Additional Settings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">Pause on Issues</div>
                    <div className="rst-muted text-xs">
                      Pause automation when problems occur
                    </div>
                  </div>
                  <Switch
                    checked={automationStatus?.settings.pauseOnIssues || false}
                    onCheckedChange={(checked) => 
                      updateAutomationSettings({ pauseOnIssues: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">Milestone Notifications</div>
                    <div className="rst-muted text-xs">
                      Notify when projects reach milestones
                    </div>
                  </div>
                  <Switch
                    checked={automationStatus?.settings.notifyOnMilestones || false}
                    onCheckedChange={(checked) => 
                      updateAutomationSettings({ notifyOnMilestones: checked })
                    }
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={applyOptimalStaffAssignments}
                  className="rst-btn flex-1 !min-h-9 !text-xs"
                >
                  Apply Optimal Assignments
                </button>
                <button
                  type="button"
                  onClick={executeAutomatedWork}
                  disabled={!automationStatus?.enabled}
                  className="rst-btn rst-btn-primary flex-1 !min-h-9 !text-xs"
                >
                  Execute Work Round
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
