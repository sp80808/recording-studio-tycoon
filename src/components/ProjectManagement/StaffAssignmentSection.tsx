import React, { useState, useMemo } from 'react';
import { StaffMember } from '@/types/game'; // Assuming StaffMember type is in game.ts
import StaffCard from './StaffCard'; // Import StaffCard

interface StaffAssignmentSectionProps {
  projectId: string;
  availableStaff: StaffMember[];
  assignedStaff: StaffMember[];
  onAssign: (staffId: string) => void;
  onUnassign: (staffId: string) => void;
  onAutoOptimize: () => void;
}

const StaffAssignmentSection: React.FC<StaffAssignmentSectionProps> = ({
  projectId,
  availableStaff,
  assignedStaff,
  onAssign,
  onUnassign,
  onAutoOptimize,
}) => {
  const [filterText, setFilterText] = useState('');

  const filteredAvailableStaff = useMemo(() => {
    if (!filterText) {
      return availableStaff;
    }
    return availableStaff.filter(
      (staff) =>
        staff.name.toLowerCase().includes(filterText.toLowerCase()) ||
        staff.role.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [availableStaff, filterText]);

  return (
    <div className="p-4 border rounded-lg shadow-md bg-card text-card-foreground">
      <h3 className="mb-4 text-lg font-semibold">Staff Assignment (Project: {projectId})</h3>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter staff by name or role..."
          className="w-full p-2 border rounded-md bg-input text-foreground placeholder:text-muted-foreground"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
      </div>
      
      {/* Available Staff List using StaffCard */}
      <div className="mb-4">
        <h4 className="mb-2 font-medium">Available Staff ({filteredAvailableStaff.length})</h4>
        {filteredAvailableStaff.length > 0 ? (
          <div className="max-h-60 overflow-y-auto pr-1">
            {filteredAvailableStaff.map((staff) => (
              <StaffCard
                key={staff.id}
                staff={staff}
                isAssigned={false}
                onAction={() => onAssign(staff.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {filterText ? 'No staff match your filter.' : 'No staff available.'}
          </p>
        )}
      </div>

      {/* Assigned Staff List using StaffCard */}
      <div className="mb-4">
        <h4 className="mb-2 font-medium">Assigned Staff ({assignedStaff.length})</h4>
        {assignedStaff.length > 0 ? (
          <div className="max-h-60 overflow-y-auto pr-1">
            {assignedStaff.map((staff) => (
              <StaffCard
                key={staff.id}
                staff={staff}
                isAssigned={true}
                onAction={() => onUnassign(staff.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No staff assigned to this project.</p>
        )}
      </div>

      {/* Auto-Optimize Button */}
      <div>
        <button
          onClick={onAutoOptimize}
          className="w-full px-4 py-2 font-semibold text-white bg-green-500 rounded hover:bg-green-600"
        >
          Auto-Optimize Assignments
        </button>
      </div>
    </div>
  );
};

export default StaffAssignmentSection;
