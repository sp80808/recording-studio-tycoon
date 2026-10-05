import React from 'react';
import { moveDayStage, type MoveDayStage } from '@/rpg/premisesAffordance';

export const CASE_W = 28;
/** Arrival sign box (x 246..286); cases must end before it so the sign sits beside them. */
export const SIGN_X = 246;
export const moveDayCaseX = (i: number, n: number): number => 6 + i * (n <= 6 ? 34 : 29);

interface Props {
  /** Current cutscene line index: 0 packing, 1 the old room empties, 2+ arrival. */
  lineIndex: number;
  cases: number;
  affordanceLabel: string;
  accent: string;
}

/**
 * Move-day visual (#250), inline SVG drawn in code (in-house, no assets): flight
 * cases fill up, the old room is left as dashed outlines, then the same cases
 * stand in the new room beside the new affordance. Presentation only.
 */
export const MoveDayStrip: React.FC<Props> = ({ lineIndex, cases, affordanceLabel, accent }) => {
  const stage: MoveDayStage = moveDayStage(lineIndex);
  const n = Math.max(1, Math.min(8, cases));
  const slot = (i: number) => moveDayCaseX(i, n);
  const caseBox = (i: number, x: number, filled: boolean) => (
    <g key={i} transform={`translate(${x} ${i % 2 ? 40 : 44})`}>
      <rect width="28" height="20" rx="2.5" fill={filled ? '#2b2f38' : 'none'} stroke={filled ? '#8a93a6' : 'rgba(243,236,221,0.28)'} strokeDasharray={filled ? undefined : '3 3'} />
      {filled && (
        <>
          <rect x="0" y="8" width="28" height="3" fill="#1b1e25" />
          <rect x="11" y="6.5" width="6" height="6" rx="1" fill={accent} />
          <rect x="2" y="2" width="3" height="3" rx="0.6" fill="#c9974a" />
          <rect x="23" y="2" width="3" height="3" rx="0.6" fill="#c9974a" />
        </>
      )}
    </g>
  );
  return (
    <svg
      viewBox="0 0 296 72"
      role="img"
      aria-label={stage === 'pack' ? 'Gear packed into flight cases' : stage === 'empty' ? 'The old room is empty' : `Cases unpacked in the new room beside the ${affordanceLabel}`}
      className="mt-4 h-16 w-full max-w-md"
      data-stage={stage}
    >
      <line x1="4" y1="66" x2="292" y2="66" stroke="rgba(243,236,221,0.2)" />
      {Array.from({ length: n }, (_, i) => caseBox(i, slot(i), stage !== 'empty'))}
      {stage === 'arrive' && (
        <g transform="translate(246 28)">
          <rect width="40" height="36" rx="3" fill="none" stroke={accent} strokeWidth="1.5" />
          <text x="20" y="22" textAnchor="middle" fontSize="7" fill={accent}>{affordanceLabel.toUpperCase().slice(0, 12)}</text>
        </g>
      )}
    </svg>
  );
};
