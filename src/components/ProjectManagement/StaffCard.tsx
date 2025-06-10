import React from 'react';
import { StaffMember } from '@/types/game'; // Adjusted import path

interface StaffCardProps {
  staff: StaffMember;
  projectMatch?: number; // Optional as it might not always be calculated or relevant
  isAssigned: boolean;
  onAction: () => void; // Generic action, could be assign or unassign
}

export const StaffCard: React.FC<StaffCardProps> = ({
  staff,
  projectMatch,
  isAssigned,
  onAction,
}) => {
  return (
    <div className={`p-3 border rounded-md shadow-sm ${isAssigned ? 'bg-green-50' : 'bg-white'}`}>
      <div className="flex justify-between items-center">
        <h5 className="font-semibold">{staff.name}</h5>
        <button
          onClick={onAction}
          className={`px-3 py-1 text-sm rounded ${
            isAssigned 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isAssigned ? 'Unassign' : 'Assign'}
        </button>
      </div>
      <div className="text-xs text-gray-600 mt-1">
        {/* Placeholder for staff skills/stats */}
        <p>Skills: {Object.keys(staff.skills).join(', ') || 'N/A'}</p>
        {projectMatch !== undefined && (
          <p>Project Match: {projectMatch}%</p>
        )}
      </div>
    </div>
  );
};
