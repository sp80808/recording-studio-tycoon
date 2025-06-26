// Multi-Project Dashboard Component
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Users, Zap, Settings, Play, Pause, Plus, X } from 'lucide-react';
import { GameState, Project, AutomationMode } from '@/types/game';
import { useMultiProjectManagement } from '@/hooks/useMultiProjectManagement';

interface MultiProjectDashboardProps {
  gameState: GameState;
  setGameState: (state: GameState | ((prev: GameState) => GameState)) => void;
  onProjectSelect?: (project: Project) => void;
}

export const MultiProjectDashboard: React.FC<MultiProjectDashboardProps> = ({
  gameState,
  setGameState,
  onProjectSelect
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
    if (priority === 1) return 'bg-red-600 text-white';
    if (priority === 2) return 'bg-orange-600 text-white';
    if (priority === 3) return 'bg-yellow-600 text-white';
    return 'bg-gray-600 text-white';
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Multi-Project Studio</h1>
          <p className="text-gray-600">
            Managing {activeProjects.length} of {projectCapacity.maxProjects} projects
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge variant={automationStatus?.enabled ? 'default' : 'secondary'}>
            {automationStatus?.enabled ? 'Automation ON' : 'Manual Mode'}
          </Badge>
          
          <Button
            onClick={() => handleAutomationToggle(!automationStatus?.enabled)}
            variant={automationStatus?.enabled ? 'destructive' : 'default'}
            size="sm"
          >
            {automationStatus?.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {automationStatus?.enabled ? 'Pause' : 'Start'} Automation
          </Button>
        </div>
      </div>

      {/* Capacity Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {activeProjects.length}/{projectCapacity.maxProjects}
              </div>
              <div className="text-sm text-gray-600">Active Projects</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(projectCapacity.efficiency * 100)}%
              </div>
              <div className="text-sm text-gray-600">Efficiency</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {automationStatus?.workingStaff || 0}/{automationStatus?.totalStaff || 0}
              </div>
              <div className="text-sm text-gray-600">Staff Working</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round((automationStatus?.studioActivity || 0) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Studio Activity</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <p className="text-gray-500 text-center py-8">No active projects</p>
                ) : (
                  projectProgress.map((progress, index) => (
                    <div key={progress.projectId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{progress.title}</span>
                        <Badge className={getPriorityColor(index + 1)}>
                          Priority {index + 1}
                        </Badge>
                      </div>
                      <Progress 
                        value={progress.overallProgress * 100} 
                        className="h-2"
                        aria-label={`${progress.title} project progress`}
                      />
                      <div className="flex justify-between text-sm text-gray-600">
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
                  <p className="text-gray-500 text-center py-8">No available projects</p>
                ) : (
                  gameState.availableProjects.slice(0, 3).map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{project.title}</div>
                        <div className="text-sm text-gray-600">
                          {project.genre} • ${project.payoutBase.toLocaleString()}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAddProject(project)}
                        disabled={!canAddProject()}
                        size="sm"
                      >
                        Add
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeProjects.map((project) => {
              const progress = projectProgress.find(p => p.projectId === project.id);
              const assignedStaff = gameState.hiredStaff.filter(s => s.assignedProjectId === project.id);
              const priority = projectPriorities.findIndex(p => p.projectId === project.id) + 1;
              
              return (
                <Card key={project.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <Button
                        onClick={() => handleRemoveProject(project.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{project.genre}</Badge>
                      <Badge className={getPriorityColor(priority)}>
                        P{priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
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
                    
                    <div className="text-sm text-gray-600">
                      <div>Current: {progress?.currentStage}</div>
                      <div>Staff: {assignedStaff.length}</div>
                      <div>Est. Completion: {progress?.estimatedCompletion === Infinity ? 'N/A' : `${progress?.estimatedCompletion} days`}</div>
                    </div>
                    
                    <div className="pt-2">
                      <Button
                        onClick={() => onProjectSelect?.(project)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {/* Add Project Card */}
            {canAddProject() && (
              <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Add a new project</p>
                    <p className="text-sm text-gray-500">
                      {projectCapacity.maxProjects - activeProjects.length} slots available
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Staff Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gameState.hiredStaff.map((staff) => {
                  const workload = staffWorkload[staff.id] || [];
                  const assignedProject = workload[0] ? activeProjects.find(p => p.id === workload[0]) : null;
                  
                  return (
                    <div key={staff.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{staff.name}</span>
                        <Badge variant={staff.status === 'Working' ? 'default' : 'secondary'}>
                          {staff.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {staff.role} • Level {staff.levelInRole}
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Energy:</span>
                          <span>{staff.energy}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mood:</span>
                          <span>{staff.mood}%</span>
                        </div>
                      </div>
                      
                      {assignedProject && (
                        <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                          <div className="font-medium">Assigned to:</div>
                          <div>{assignedProject.title}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Automation Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable Automation */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Enable Automation</div>
                  <div className="text-sm text-gray-600">
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
              <div className="space-y-4">
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
                  <div className="text-sm text-gray-600">
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
                  <div className="text-sm text-gray-600">
                    {automationStatus?.settings.maxStaffPerProject || 3} staff maximum
                  </div>
                </div>
              </div>

              {/* Additional Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Pause on Issues</div>
                    <div className="text-sm text-gray-600">
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

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Milestone Notifications</div>
                    <div className="text-sm text-gray-600">
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
              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={applyOptimalStaffAssignments}
                  variant="outline"
                  className="flex-1"
                >
                  Apply Optimal Assignments
                </Button>
                <Button
                  onClick={executeAutomatedWork}
                  disabled={!automationStatus?.enabled}
                  className="flex-1"
                >
                  Execute Work Round
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
