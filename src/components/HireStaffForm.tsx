import React, { useState } from 'react';
import { StaffMember } from '../types/game';
import { generateStaffMember } from '../utils/staffGeneration';
import { StaffRole } from '../types/game'; // Import StaffRole

interface HireStaffFormProps {
  onHire: (candidate: StaffMember) => void;
  onCancel: () => void;
}

export const HireStaffForm: React.FC<HireStaffFormProps> = ({ onHire, onCancel }) => {
  const allRoles: StaffRole[] = ['Engineer', 'Producer', 'Songwriter', 'Mix Engineer', 'Mastering Engineer', 'Sound Designer'];
  const generateInitialCandidates = () => {
    const newCandidates: StaffMember[] = [];
    for (let i = 0; i < 3; i++) {
      const randomRole = allRoles[Math.floor(Math.random() * allRoles.length)];
      newCandidates.push(generateStaffMember(randomRole));
    }
    return newCandidates;
  };

  const [candidates, setCandidates] = useState<StaffMember[]>(generateInitialCandidates());
  const [selectedCandidate, setSelectedCandidate] = useState<StaffMember | null>(null);

  const handleRefresh = () => {
    setCandidates(generateInitialCandidates());
    setSelectedCandidate(null);
  };

  const handleSelect = (candidate: StaffMember) => {
    setSelectedCandidate(candidate);
  };

  const handleHire = () => {
    if (selectedCandidate) {
      onHire(selectedCandidate);
    }
  };

  return (
    <div className="hire-staff-form">
      <div className="form-header">
        <h3>Hire New Staff</h3>
        <button onClick={handleRefresh} className="refresh-button">
          Refresh Candidates
        </button>
      </div>

      <div className="candidates-list">
        {candidates.map(candidate => (
          <div
            key={candidate.id}
            className={`candidate-card ${selectedCandidate?.id === candidate.id ? 'selected' : ''}`}
            onClick={() => handleSelect(candidate)}
          >
            <div className="candidate-info">
              <h4>{candidate.name}</h4>
              <span className="role">{candidate.role}</span>
            </div>
            <div className="candidate-stats">
              <div className="stat">
                <span>Creativity:</span>
                <span>{candidate.primaryStats.creativity.toFixed(1)}</span>
              </div>
              <div className="stat">
                <span>Technical:</span>
                <span>{candidate.primaryStats.technical.toFixed(1)}</span>
              </div>
              <div className="stat">
                <span>Speed:</span>
                <span>{candidate.primaryStats.speed.toFixed(1)}</span>
              </div>
            </div>
            <div className="candidate-details">
              <div className="detail">
                <span>Experience:</span>
                <span>{candidate.xpInRole} XP</span>
              </div>
              <div className="detail">
                <span>Level:</span>
                <span>{candidate.levelInRole}</span>
              </div>
              <div className="detail">
                <span>Salary:</span>
                <span>${candidate.salary}/day</span>
              </div>
            </div>
            {candidate.genreAffinity && (
              <div className="genre-affinity">
                <span>Genre Affinity:</span>
                <span>{candidate.genreAffinity.genre} (+{candidate.genreAffinity.bonus}%)</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button
          onClick={handleHire}
          disabled={!selectedCandidate}
          className="hire-button"
        >
          Hire Selected Candidate
        </button>
        <button onClick={onCancel} className="cancel-button">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default HireStaffForm;