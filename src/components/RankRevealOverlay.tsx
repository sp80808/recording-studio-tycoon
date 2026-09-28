import React, { useEffect } from 'react';
import type { ProjectRank } from '@/rpg/rankChase';
import { gameAudio } from '@/utils/audioSystem';
import './chip-fidelity.css';

/**
 * RankRevealOverlay — the delivery climax (k6e.2).
 * Non-blocking stamp over the review: dim → spring stamp → auto-dismiss
 * (1.6s) or click. S/S+ fire the rank sting on mount (audio IS the reward
 * under reduced-motion); A stamps silently (confetti already fired).
 */
export const RankRevealOverlay: React.FC<{
  rank: ProjectRank;
  pointsToNext: number;
  nextRank: ProjectRank | null;
  onDone: () => void;
}> = ({ rank, pointsToNext, nextRank, onDone }) => {
  useEffect(() => {
    if (rank === 'S+') void gameAudio.playUISound('rankSPlus');
    else if (rank === 'S') void gameAudio.playUISound('rankS');
    const timer = setTimeout(onDone, 1600);
    return () => clearTimeout(timer);
  }, [rank, onDone]);

  const nearMiss = nextRank !== null && pointsToNext > 0 && pointsToNext <= 3;
  const tint =
    rank === 'S+'
      ? 'from-yellow-300 via-amber-400 to-yellow-600 text-black'
      : rank === 'S'
        ? 'from-yellow-400 to-amber-600 text-black'
        : 'from-slate-600 to-slate-800 text-white';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60"
      role="status"
      aria-live="polite"
      aria-label={nearMiss && nextRank ? `Rank ${rank}. Need ${pointsToNext} more for ${nextRank}` : `Rank ${rank}`}
      onClick={onDone}
    >
      <div className={`kenney-bevel chip-grain rank-stamp-in rounded-2xl bg-gradient-to-b ${tint} px-12 py-8 text-center`}>
        <div className="text-7xl font-black tracking-tight">{rank}</div>
        {nearMiss && nextRank ? (
          <div className="mt-2 text-sm font-bold">NEED +{pointsToNext} FOR {nextRank}</div>
        ) : (
          <div className="mt-2 text-sm font-bold opacity-80">
            {rank === 'S+' ? 'LEGENDARY TAKE' : rank === 'S' ? 'CHART-TOPPER' : 'STUDIO STANDARD'}
          </div>
        )}
      </div>
    </div>
  );
};
