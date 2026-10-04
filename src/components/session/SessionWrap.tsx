import React from 'react';
import { Banknote, ChevronRight, FileText, Sparkles, Star } from 'lucide-react';
import type { ProjectReport } from '@/types/game';
import { gradeQuality } from '@/rpg/rankChase';
import { money } from '@/utils/displayMoney';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface SessionWrapProps {
  report: ProjectReport;
  isOpen: boolean;
  onSettle: () => void;
  onViewDetails: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export function sessionWrapFeedback(report: ProjectReport) {
  const skills = [...report.skillBreakdown].filter(skill => Number.isFinite(skill.score))
    .sort((a, b) => b.score - a.score);
  const strongest = skills[0];
  const weakest = skills.at(-1);
  const describe = (skill: NonNullable<typeof strongest>) =>
    `${skill.skillName.replace(/([a-z])([A-Z])/g, '$1 $2')} · ${Math.round(skill.score)}/100`;
  return {
    strength: strongest ? describe(strongest) : null,
    nextFocus: weakest && strongest && weakest.score < strongest.score && weakest.skillName !== strongest.skillName ? describe(weakest) : null,
    factors: (report.qualityFactors ?? []).filter(factor => typeof factor === 'string' && factor.trim()).slice(0, 2),
  };
}

// Kept beside the component so the focused contract check validates the exact
// report-to-receipt mapping without introducing another production module.
// eslint-disable-next-line react-refresh/only-export-components
export const sessionWrapSummary = (report: ProjectReport) => ({
  title: report.projectTitle,
  genre: report.genre ?? 'Studio release',
  producer: report.assignedPerson.name,
  quality: Math.max(0, Math.min(100, report.overallQualityScore)),
  rank: gradeQuality(report.overallQualityScore).rank,
  payout: report.moneyGained,
  reputation: report.reputationGained,
  managementXp: report.playerManagementXpGained,
  knowHow: report.knowHowGained ?? 0,
});

/**
 * Immediate end-of-session receipt. All values are read from the canonical
 * ProjectReport; collecting delegates settlement to the parent authority.
 */
export const SessionWrap: React.FC<SessionWrapProps> = ({
  report,
  isOpen,
  onSettle,
  onViewDetails,
}) => {
  const summary = sessionWrapSummary(report);
  const feedback = sessionWrapFeedback(report);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onViewDetails(); }}>
      <DialogContent
        className="w-[calc(100%-1rem)] max-w-md gap-3 overflow-hidden p-0 motion-reduce:transition-none sm:w-[calc(100%-2rem)]"
        data-rst-surface="contextual"
        data-rst-world-target="console"
      >
        <DialogHeader className="border-b border-[var(--rst-line)] bg-black/20 px-4 pb-3 pt-4 pr-12 text-left sm:px-5 sm:pt-5">
          <p className="rst-kicker text-[var(--rst-brass-300)]">Session wrapped · {summary.genre}</p>
          <DialogTitle className="mt-1 truncate text-xl text-[var(--rst-ivory)] sm:text-2xl">
            {summary.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-400">
            Produced by {summary.producer}. The release is ready to collect.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[6.25rem_1fr] gap-3 px-4 sm:grid-cols-[7rem_1fr] sm:px-5">
          <div
            className="grid aspect-square place-items-center rounded-full border border-[var(--rst-brass-line)] bg-[radial-gradient(circle,rgba(230,184,102,0.14),rgba(15,13,11,0.96)_68%)] text-center shadow-[inset_0_0_28px_rgba(230,184,102,0.08)]"
            aria-label={`Quality ${summary.quality} out of 100, rank ${summary.rank}`}
          >
            <div>
              <p className="text-3xl font-black tabular-nums text-[var(--rst-brass-200)]">{summary.quality}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">Quality</p>
              <p className="mt-1 text-xs font-black text-[var(--rst-brass-300)]">Rank {summary.rank}</p>
            </div>
          </div>

          <dl className="grid content-center gap-1.5 text-sm" aria-label="Release payout">
            <div className="flex min-h-9 items-center justify-between gap-3 rounded border border-emerald-500/25 bg-emerald-500/[0.07] px-3">
              <dt className="flex items-center gap-2 text-stone-300"><Banknote size={15} aria-hidden="true" />Payout</dt>
              <dd className="font-bold tabular-nums text-emerald-300">{money(summary.payout)}</dd>
            </div>
            <div className="flex min-h-9 items-center justify-between gap-3 rounded border border-[var(--rst-line)] bg-white/[0.025] px-3">
              <dt className="flex items-center gap-2 text-stone-300"><Star size={15} aria-hidden="true" />Reputation</dt>
              <dd className="font-bold tabular-nums text-amber-300">+{summary.reputation}</dd>
            </div>
            {summary.managementXp > 0 && (
              <div className="flex min-h-9 items-center justify-between gap-3 rounded border border-[var(--rst-line)] bg-white/[0.025] px-3">
                <dt className="flex items-center gap-2 text-stone-300"><Sparkles size={15} aria-hidden="true" />Management XP</dt>
                <dd className="font-bold tabular-nums text-violet-300">+{summary.managementXp}</dd>
              </div>
            )}
            {summary.knowHow > 0 && (
              <div className="flex min-h-9 items-center justify-between gap-3 rounded border border-[var(--rst-line)] bg-white/[0.025] px-3">
                <dt className="flex items-center gap-2 text-stone-300"><Sparkles size={15} aria-hidden="true" />Know-How</dt>
                <dd className="font-bold tabular-nums text-sky-300">+{summary.knowHow}</dd>
              </div>
            )}
          </dl>
        </div>

        {(feedback.strength || feedback.factors.length > 0) && <div className="space-y-1 px-4 text-xs leading-relaxed sm:px-5" aria-label="Session feedback">
          {feedback.strength && <p className="text-stone-300"><span className="text-amber-300">Strongest contribution:</span> {feedback.strength}</p>}
          {feedback.nextFocus && <p className="text-stone-300"><span className="text-stone-400">Next focus:</span> {feedback.nextFocus}</p>}
          {feedback.factors.length > 0 && <p className="text-stone-400">{feedback.factors.join(' · ')}</p>}
        </div>}
        <p className="line-clamp-2 px-4 text-xs italic leading-relaxed text-stone-400 sm:px-5">
          “{report.reviewSnippet}”
        </p>

        <DialogFooter className="grid grid-cols-1 gap-2 border-t border-[var(--rst-line)] bg-black/20 px-4 py-3 sm:grid-cols-[1fr_1.35fr] sm:space-x-0 sm:px-5">
          <button
            type="button"
            className="rst-btn min-h-11 w-full justify-center"
            onClick={onViewDetails}
          >
            <FileText size={16} aria-hidden="true" /> Detailed report
          </button>
          <button
            type="button"
            autoFocus
            className="rst-btn rst-btn-primary min-h-11 w-full justify-center"
            data-rst-action-id="review:settle"
            data-rst-surface="contextual"
            data-rst-world-target="console"
            onClick={onSettle}
          >
            Collect release <ChevronRight size={17} aria-hidden="true" />
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SessionWrap;
