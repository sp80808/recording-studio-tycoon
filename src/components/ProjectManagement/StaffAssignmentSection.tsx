import React, { useState, useMemo } from 'react'; // Import useState and useMemo
import { StaffMember, Project } from '@/types/game'; // Adjusted import path, add Project
import { StaffCard } from './StaffCard'; // Import StaffCard
import { calculateStaffProjectMatch } from '@/utils/projectUtils'; // Import utility

interface StaffAssignmentSectionProps {
  project: Project | null; // Changed from projectId to full project object
  availableStaff: StaffMember[];
  assignedStaff: StaffMember[];
  onAssign: (staffId: string) => void;
  onUnassign: (staffId: string) => void;
  onAutoOptimize: () => void;
}

export const StaffAssignmentSection: React.FC<StaffAssignmentSectionProps> = ({
  project, // Destructure project instead of projectId
  availableStaff,
  assignedStaff,
  onAssign,
  onUnassign,
  onAutoOptimize,
}) => {
  const [staffFilter, setStaffFilter] = useState('');

  const filteredAvailableStaff = useMemo(() => 
    availableStaff.filter(staff =>
      staff.name.toLowerCase().includes(staffFilter.toLowerCase())
    ), [availableStaff, staffFilter]);

  if (!project) {
    return <div className="p-4 border rounded-lg shadow-sm text-gray-500">No active project to assign staff.</div>;
  }

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Staff Assignment (Project: {project.title})</h3>
      
      <div className="mb-4 flex space-x-2">
        <button 
          onClick={onAutoOptimize}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Auto-Optimize Staff
        </button>
        <input
          type="text"
          placeholder="Filter staff by name..."
          className="px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={staffFilter}
          onChange={(e) => setStaffFilter(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-1">Available Staff ({filteredAvailableStaff.length})</h4>
          {filteredAvailableStaff.length === 0 && staffFilter === '' && <p className="text-sm text-gray-500">No staff available.</p>}
          {filteredAvailableStaff.length === 0 && staffFilter !== '' && <p className="text-sm text-gray-500">No staff match your filter.</p>}
          <div className="space-y-2 max-h-96 overflow-y-auto"> {/* Added max-h and overflow for long lists */}
            {filteredAvailableStaff.map(staff => (
              <StaffCard
                key={staff.id}
                staff={staff}
                isAssigned={false}
                onAction={() => onAssign(staff.id)}
                projectMatch={calculateStaffProjectMatch(staff, project)}
              />
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-medium mb-1">Assigned Staff</h4>
          {assignedStaff.length === 0 && <p className="text-sm text-gray-500">No staff assigned.</p>}
          <div className="space-y-2">
            {assignedStaff.map(staff => (
              <StaffCard
                key={staff.id}
                staff={staff}
                isAssigned={true}
                onAction={() => onUnassign(staff.id)}
                projectMatch={calculateStaffProjectMatch(staff, project)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
