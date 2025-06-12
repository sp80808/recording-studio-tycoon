import React from 'react';
import { StaffMember } from '@/types/game';

interface StaffCardProps {
  staff: StaffMember;
  projectMatch?: number; // Optional as per currentTask.md (may not be calculated yet)
  isAssigned: boolean;
  onAction: () => void; // Generic action (assign/unassign)
}

const StaffCard: React.FC<StaffCardProps> = ({
  staff,
  projectMatch,
  isAssigned,
  onAction,
}) => {
  return (
    <div className={`p-3 mb-2 border rounded-lg shadow ${isAssigned ? 'bg-green-100' : 'bg-white'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h5 className="font-semibold">{staff.name} <span className="text-sm text-gray-600">({staff.role})</span></h5>
          <p className="text-xs text-gray-500">
            C: {staff.primaryStats.creativity}, T: {staff.primaryStats.technical}, S: {staff.primaryStats.speed}
          </p>
          {projectMatch !== undefined && (
            <p className="text-xs text-gray-500">Match: {projectMatch}%</p>
          )}
        </div>
        <button
          onClick={onAction}
          className={`px-3 py-1 text-sm rounded ${
            isAssigned 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isAssigned ? 'Unassign' : 'Assign'}
        </button>
      </div>
      {/* Additional details like energy, mood can be added here later */}
    </div>
  );
};

export default StaffCard;
