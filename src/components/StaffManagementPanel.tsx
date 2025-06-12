import React, { useState } from 'react';
import { useStaffManagement } from '../hooks/useStaffManagement';
import { StaffMember, Project, StudioSkill } from '../types/game';
import { AnimatedNumber } from './AnimatedNumber';
import { SkillProgressDisplay } from './SkillProgressDisplay';
import MoodIndicator from './MoodIndicator';
import HireStaffForm from './HireStaffForm';

interface StaffManagementPanelProps {
  onStaffSelect?: (staff: StaffMember) => void;
}

export const StaffManagementPanel: React.FC<StaffManagementPanelProps> = ({ onStaffSelect }) => {
  const { 
    updateAllStaff,
    assignStaff,
    unassignStaff,
    toggleStaffRest,
    startTraining,
    hireStaff,
    refreshCandidates
  } = useStaffManagement();
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [view, setView] = useState<'list' | 'details' | 'hire'>('list');

  const handleStaffSelect = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setView('details');
    onStaffSelect?.(staff);
  };

  const handleHire = async (candidate: StaffMember) => {
    try {
      const success = hireStaff(candidate);
      if (success) {
        setView('list');
      }
    } catch (error) {
      console.error('Failed to hire staff:', error);
    }
  };

  const handleTrain = async (staffId: string, trainingType: string) => {
    try {
      const success = startTraining(staffId, trainingType);
      if (success) {
        // Refresh staff list or update selected staff
        updateAllStaff();
      }
    } catch (error) {
      console.error('Failed to train staff:', error);
    }
  };

  const handleAssign = async (staffId: string, project: Project) => {
    try {
      const success = assignStaff(staffId, project);
      if (success) {
        // Refresh staff list or update selected staff
        updateAllStaff();
      }
    } catch (error) {
      console.error('Failed to assign staff:', error);
    }
  };

  const handleStatusUpdate = async (staffId: string) => {
    try {
      toggleStaffRest(staffId);
      // Refresh staff list or update selected staff
      updateAllStaff();
    } catch (error) {
      console.error('Failed to update staff status:', error);
    }
  };

  // Convert staff stats to StudioSkill format
  const getStaffSkills = (staff: StaffMember): Record<string, StudioSkill> => {
    return {
      creativity: {
        name: 'Creativity',
        level: Math.floor(staff.primaryStats.creativity),
        xp: (staff.primaryStats.creativity % 1) * 100,
        xpToNext: 100,
        bonuses: {} // Added missing bonuses
      },
      technical: {
        name: 'Technical',
        level: Math.floor(staff.primaryStats.technical),
        xp: (staff.primaryStats.technical % 1) * 100,
        xpToNext: 100,
        bonuses: {} // Added missing bonuses
      },
      speed: {
        name: 'Speed',
        level: Math.floor(staff.primaryStats.speed),
        xp: (staff.primaryStats.speed % 1) * 100,
        xpToNext: 100,
        bonuses: {} // Added missing bonuses
      }
    };
  };

  return (
    <div className="staff-management-panel">
      <div className="staff-management-header">
        <h2>Staff Management</h2>
        <div className="staff-stats">
          <div className="stat">
            <span>Total Staff:</span>
            <AnimatedNumber value={selectedStaff ? 1 : 0} />
          </div>
          <div className="stat">
            <span>Available:</span>
            <AnimatedNumber value={selectedStaff?.status === 'Idle' ? 1 : 0} />
          </div>
          <div className="stat">
            <span>Assigned:</span>
            <AnimatedNumber value={selectedStaff?.status === 'Working' ? 1 : 0} />
          </div>
        </div>
        <button 
          className="hire-button"
          onClick={() => setView('hire')}
        >
          Hire New Staff
        </button>
      </div>

      {view === 'list' && (
        <div className="staff-list">
          {selectedStaff && (
            <div 
              className="staff-card"
              onClick={() => handleStaffSelect(selectedStaff)}
            >
              <div className="staff-info">
                <h3>{selectedStaff.name}</h3>
                <span className="staff-type">{selectedStaff.role}</span>
                <MoodIndicator mood={selectedStaff.mood} />
              </div>
              <div className="staff-status">
                <span className={`status ${selectedStaff.status.toLowerCase()}`}>
                  {selectedStaff.status}
                </span>
              </div>
              <div className="staff-skills">
                <SkillProgressDisplay skills={getStaffSkills(selectedStaff)} />
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'details' && selectedStaff && (
        <div className="staff-details">
          <div className="staff-header">
            <h3>{selectedStaff.name}</h3>
            <button onClick={() => setView('list')}>Back to List</button>
          </div>
          <div className="staff-performance">
            <h4>Performance Metrics</h4>
            <div className="metrics-grid">
              <div className="metric">
                <span>Creativity</span>
                <AnimatedNumber value={selectedStaff.primaryStats.creativity} />
              </div>
              <div className="metric">
                <span>Technical</span>
                <AnimatedNumber value={selectedStaff.primaryStats.technical} />
              </div>
              <div className="metric">
                <span>Speed</span>
                <AnimatedNumber value={selectedStaff.primaryStats.speed} />
              </div>
            </div>
          </div>
          <div className="staff-actions">
            <button onClick={() => handleTrain(selectedStaff.id, 'production')}>
              Train Production
            </button>
            <button onClick={() => handleTrain(selectedStaff.id, 'mixing')}>
              Train Mixing
            </button>
            <button onClick={() => handleStatusUpdate(selectedStaff.id)}>
              Toggle Rest
            </button>
          </div>
        </div>
      )}

      {view === 'hire' && (
        <div className="hire-staff">
          <HireStaffForm
            onHire={handleHire}
            onCancel={() => setView('list')}
          />
        </div>
      )}
    </div>
  );
};

export default StaffManagementPanel;
