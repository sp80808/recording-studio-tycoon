import React from 'react';
import type { GameState, Project } from '@/types/game';
import {
  DIRECTION_LABELS,
  GRADE_LABELS,
  PRIORITY_LABELS,
  PRODUCTION_APPROACHES,
  SERVICE_LABELS,
  evaluateProjectBriefFit,
  getProjectBrief,
  topReasons,
  type BriefFitGrade,
  type ProductionApproach,
} from '@/rpg/projectBrief';

const gradeChip = (grade: BriefFitGrade) =>
  grade === 'excellent' ? 'rst-chip-money' : grade === 'strong' ? 'rst-chip-brass' : grade === 'poor' ? 'rst-chip-danger' : '';

interface BriefPanelProps {
  project: Project;
  state: GameState;
  approachId?: ProductionApproach['id'];
  onApproach: (id: ProductionApproach['id']) => void;
}

/** Compact enquiry preview: the brief, a fit grade and at most two reasons (#48). */
export const BriefPanel: React.FC<BriefPanelProps> = ({ project, state, approachId, onApproach }) => {
  const brief = getProjectBrief(project);
  const fit = evaluateProjectBriefFit(project, state, approachId);
  return (
    <div className="mb-3 rounded-lg border border-[var(--rst-line)] bg-black/20 p-2.5 text-xs" data-testid="brief-panel">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="rst-kicker !text-[10px]">
          {SERVICE_LABELS[brief.serviceType]} · {DIRECTION_LABELS[brief.direction]} · {PRIORITY_LABELS[brief.priority]}
        </span>
        <span className={`rst-chip ${gradeChip(fit.grade)} whitespace-nowrap`}>{GRADE_LABELS[fit.grade]}</span>
      </div>
      <ul className="space-y-0.5 text-stone-300">
        {topReasons(fit).map((reason) => (
          <li key={reason}>· {reason}</li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Production approach">
        {PRODUCTION_APPROACHES.map((a) => (
          <button
            key={a.id}
            type="button"
            title={a.blurb}
            aria-pressed={approachId === a.id}
            onClick={() => onApproach(a.id)}
            className={`rst-chip cursor-pointer ${approachId === a.id ? 'rst-chip-brass' : ''}`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BriefPanel;
