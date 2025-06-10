import React from 'react';
import { StaffMember, Project } from '../types/game';
import { calculateStaffProjectMatch } from '../utils/staffUtils';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

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
  return (
    <Card className="p-4 mb-2 hover:bg-gray-100 transition-colors">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium">{staff.name}</h4>
          <div className="text-sm text-gray-600">
            Match: {projectMatch}%
          </div>
        </div>
        <Button
          variant={isAssigned ? "destructive" : "default"}
          onClick={onAction}
        >
          {isAssigned ? "Remove" : "Assign"}
        </Button>
      </div>
    </Card>
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
  return (
    <div className="mt-4 border rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Staff Assignment</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={onAutoOptimize}>
              Auto-Optimize
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Automatically optimize staff positions
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="mb-2 font-medium">Available Staff</h4>
          <ScrollArea className="h-[200px]">
            {availableStaff.map(staff => (
              <StaffCard
                key={staff.id}
                staff={staff}
                projectMatch={calculateStaffProjectMatch(staff, project)}
                isAssigned={false}
                onAction={() => onAssign(staff.id)}
              />
            ))}
          </ScrollArea>
        </div>

        <div>
          <h4 className="mb-2 font-medium">Assigned Staff</h4>
          <ScrollArea className="h-[200px]">
            {assignedStaff.map(staff => (
              <StaffCard
                key={staff.id}
                staff={staff}
                projectMatch={calculateStaffProjectMatch(staff, project)}
                isAssigned={true}
                onAction={() => onUnassign(staff.id)}
              />
            ))}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
