import { briefReasonLimit } from '@/rpg/studioKnowHow';
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

const ICON_BASE = '/assets/icons/booking';
const FIT_ICON: Record<BriefFitGrade, string> = { excellent: 'S', strong: 'A', workable: 'B', experimental: 'B', poor: 'C' };
const APPROACH_ICON: Partial<Record<ProductionApproach['id'], string>> = {
  'clean-commercial': 'approach-safe',
  'experimental-layers': 'approach-moonshot',
};

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
        <span className="rst-kicker flex items-center gap-1 !text-[10px]">
          <img src={`${ICON_BASE}/brief.svg`} alt="" width={14} height={14} aria-hidden="true" />
          {SERVICE_LABELS[brief.serviceType]} · {DIRECTION_LABELS[brief.direction]} · {PRIORITY_LABELS[brief.priority]}
        </span>
        <span className={`rst-chip ${gradeChip(fit.grade)} whitespace-nowrap`}><img src={`${ICON_BASE}/fit-${FIT_ICON[fit.grade]}.svg`} alt="" width={14} height={14} aria-hidden="true" className="mr-1 inline-block" />
          {GRADE_LABELS[fit.grade]}
        </span>
      </div>
      <ul className="space-y-0.5 text-stone-300">
        {topReasons(fit, briefReasonLimit(state.studioKnowHow)).map((reason) => (
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
            {APPROACH_ICON[a.id] && (
              <img src={`${ICON_BASE}/${APPROACH_ICON[a.id]}.svg`} alt="" width={12} height={12} aria-hidden="true" className="mr-1 inline-block" />
            )}
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BriefPanel;
