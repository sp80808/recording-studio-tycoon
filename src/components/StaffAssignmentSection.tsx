import React, { useState, useMemo } from 'react';
import { StaffMember, Project } from '../types/game';
import { calculateStaffProjectMatch, getStaffMatchColor, getStaffMatchDescription, getStaffStatusColor } from '../utils/staffUtils';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './ui/tooltip';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Filter, Users, Zap, TrendingUp, Star } from 'lucide-react';

interface StaffAssignmentSectionProps {
  projectId: string;
  project: Project;
  availableStaff: StaffMember[];
  assignedStaff: StaffMember[];
  onAssign: (staffId: string) => void;
  onUnassign: (staffId: string) => void;
  onAutoOptimize: () => void;
}

const StaffCard: React.FC<{
  staff: StaffMember;
  projectMatch: number;
  isAssigned: boolean;
  onAction: () => void;
}> = ({ staff, projectMatch, isAssigned, onAction }) => {
  const [isHovered, setIsHovered] = useState(false);
  const matchColor = getStaffMatchColor(projectMatch);
  const matchDescription = getStaffMatchDescription(projectMatch);
  const statusColor = getStaffStatusColor(staff.status);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card 
            className={`p-3 mb-2 transition-all duration-300 cursor-pointer border-l-4 ${
              isAssigned 
                ? 'bg-green-50 border-l-green-500 hover:bg-green-100' 
                : 'bg-white border-l-gray-300 hover:bg-gray-50 hover:border-l-blue-400'
            } ${isHovered ? 'shadow-lg transform scale-[1.02] translate-y-[-2px]' : 'shadow-sm'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="font-medium text-sm">{staff.name}</h4>
                  <Badge variant="outline" className={`text-xs ${statusColor} transition-colors duration-300`}>
                    {staff.status}
                  </Badge>
                </div>
                
                <div className="text-xs text-gray-600 mb-2">
                  {staff.role} • Level {staff.levelInRole}
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${matchColor} border-current transition-colors duration-300`}
                  >
                    <Star className="w-3 h-3 mr-1" />
                    {projectMatch}% {matchDescription}
                  </Badge>
                  {staff.genreAffinity && (
                    <Badge variant="outline" className="text-xs text-purple-600 transition-colors duration-300">
                      {staff.genreAffinity.genre}
                    </Badge>
                  )}
                </div>

                {isHovered && (
                  <div className="text-xs text-gray-500 space-y-1.5 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Creativity</span>
                      <span className="font-medium text-blue-600">{staff.primaryStats.creativity}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Technical</span>
                      <span className="font-medium text-green-600">{staff.primaryStats.technical}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Speed</span>
                      <span className="font-medium text-yellow-600">{staff.primaryStats.speed}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <Button
                variant={isAssigned ? "destructive" : "default"}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction();
                }}
                className="ml-2 transition-transform duration-200 hover:scale-105"
              >
                {isAssigned ? "Remove" : "Assign"}
              </Button>
            </div>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-medium">{staff.name} - {staff.role}</div>
            <div className="text-sm space-y-1">
              <div><strong>Match Analysis:</strong> {matchDescription} ({projectMatch}%)</div>
              <div><strong>Stats:</strong> C:{staff.primaryStats.creativity} T:{staff.primaryStats.technical} S:{staff.primaryStats.speed}</div>
              <div><strong>Experience:</strong> Level {staff.levelInRole} ({staff.xpInRole} XP)</div>
              {staff.genreAffinity && (
                <div><strong>Genre Specialty:</strong> {staff.genreAffinity.genre} (+{staff.genreAffinity.bonus}%)</div>
              )}
              <div><strong>Status:</strong> {staff.status}</div>
              <div><strong>Salary:</strong> ${staff.salary}/day</div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const StaffAssignmentSection: React.FC<StaffAssignmentSectionProps> = ({
  projectId,
  project,
  availableStaff,
  assignedStaff,
  onAssign,
  onUnassign,
  onAutoOptimize,
}) => {
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState<'match' | 'name' | 'level'>('match');

  const filteredAndSortedAvailableStaff = useMemo(() => {
    const filtered = availableStaff.filter((staff: StaffMember) =>
      staff.name.toLowerCase().includes(filterText.toLowerCase()) ||
      staff.role.toLowerCase().includes(filterText.toLowerCase()) ||
      (staff.genreAffinity?.genre.toLowerCase().includes(filterText.toLowerCase()))
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'match':
          return calculateStaffProjectMatch(b, project) - calculateStaffProjectMatch(a, project);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'level':
          return b.levelInRole - a.levelInRole;
        default:
          return 0;
      }
    });
  }, [availableStaff, filterText, sortBy, project]);

  const predictedOutcome = useMemo(() => {
    if (assignedStaff.length === 0) return null;
    
    const totalCreativity = assignedStaff.reduce((sum, staff) => sum + staff.primaryStats.creativity, 0);
    const totalTechnical = assignedStaff.reduce((sum, staff) => sum + staff.primaryStats.technical, 0);
    const totalSpeed = assignedStaff.reduce((sum, staff) => sum + staff.primaryStats.speed, 0);
    const avgMatch = assignedStaff.reduce((sum, staff) => sum + calculateStaffProjectMatch(staff, project), 0) / assignedStaff.length;
    
    return {
      avgCreativity: Math.round(totalCreativity / assignedStaff.length),
      avgTechnical: Math.round(totalTechnical / assignedStaff.length),
      avgSpeed: Math.round(totalSpeed / assignedStaff.length),
      avgMatch: Math.round(avgMatch),
      estimatedEfficiency: Math.round(avgMatch * 0.8 + (totalSpeed / assignedStaff.length) * 0.2)
    };
  }, [assignedStaff, project]);

  return (
    <TooltipProvider>
      <div className="mt-4 border rounded-lg p-4 bg-gray-50">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Staff Assignment</h3>
            <Badge variant="outline" className="text-xs">
              {assignedStaff.length}/{availableStaff.length + assignedStaff.length} assigned
            </Badge>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                onClick={onAutoOptimize}
                className="bg-blue-600 text-white hover:bg-blue-700"
                disabled={availableStaff.length === 0}
              >
                <Zap className="w-4 h-4 mr-2" />
                Auto-Optimize
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Automatically assign the best matching staff for this project
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Filters and Controls */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Filter className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Filter by name, role, or genre..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-10"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'match' | 'name' | 'level')}
            className="px-3 py-2 border rounded-md bg-white text-sm"
          >
            <option value="match">Sort by Match</option>
            <option value="name">Sort by Name</option>
            <option value="level">Sort by Level</option>
          </select>
        </div>

        {/* Prediction Panel */}
        {predictedOutcome && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h4 className="font-medium text-blue-800">Predicted Performance</h4>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Avg Match:</div>
                <div className={`font-bold ${getStaffMatchColor(predictedOutcome.avgMatch)}`}>
                  {predictedOutcome.avgMatch}%
                </div>
              </div>
              <div>
                <div className="text-gray-600">Team Efficiency:</div>
                <div className="font-bold text-green-600">{predictedOutcome.estimatedEfficiency}%</div>
              </div>
              <div>
                <div className="text-gray-600">Team Stats:</div>
                <div className="font-bold text-gray-700">
                  C:{predictedOutcome.avgCreativity} T:{predictedOutcome.avgTechnical} S:{predictedOutcome.avgSpeed}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Staff Lists */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Available Staff</h4>
              <Badge variant="outline" className="text-xs">
                {filteredAndSortedAvailableStaff.length} shown
              </Badge>
            </div>
            <ScrollArea className="h-[300px] pr-2">
              {filteredAndSortedAvailableStaff.length > 0 ? (
                filteredAndSortedAvailableStaff.map(staff => (
                  <StaffCard
                    key={staff.id}
                    staff={staff}
                    projectMatch={calculateStaffProjectMatch(staff, project)}
                    isAssigned={false}
                    onAction={() => onAssign(staff.id)}
                  />
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  {filterText ? 'No staff match your filter' : 'No available staff'}
                </div>
              )}
            </ScrollArea>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Assigned Staff</h4>
              <Badge variant="outline" className="text-xs">
                {assignedStaff.length} assigned
              </Badge>
            </div>
            <ScrollArea className="h-[300px] pr-2">
              {assignedStaff.length > 0 ? (
                assignedStaff.map(staff => (
                  <StaffCard
                    key={staff.id}
                    staff={staff}
                    projectMatch={calculateStaffProjectMatch(staff, project)}
                    isAssigned={true}
                    onAction={() => onUnassign(staff.id)}
                  />
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No staff assigned to this project
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
