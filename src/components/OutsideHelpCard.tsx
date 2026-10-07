import React from 'react';
import type { GameState } from '@/types/game';
import { money } from '@/utils/displayMoney';
import {
  arrangeFreelancer, offersFor, lockedForStage, outsourcedAt, specialtiesForStage, CONTACT_BY_ID, RATE_LABEL, SPECIALTY_LABEL,
} from '@/rpg/freelancers';
import { toast } from '@/hooks/use-toast';
import { tc, useContentLocale } from '@/i18n/content';

/**
 * Stage-boundary choice (#69): keep the stage in-house, or book an outside specialist. Shown only when a known
 * contact specialises in the current stage's work, so it never interrupts a stage nobody could take over.
 */
export const OutsideHelpCard: React.FC<{
  gameState: GameState;
  setGameState: (updater: (prev: GameState) => GameState) => void;
  /** Phone: a one-line chip that opens the offers, so the transport dock keeps its space. */
  compact?: boolean;
}> = ({ gameState, setGameState, compact }) => {
  useContentLocale();
  const [open, setOpen] = React.useState(false);
  const project = gameState.activeProject;
  if (!project) return null;
  const idx = project.currentStageIndex;
  const stage = project.stages[idx];
  if (!stage || stage.completed || !specialtiesForStage(stage.stageName).length) return null;
  const booked = outsourcedAt(project, idx);

  if (booked) {
    const c = CONTACT_BY_ID[booked.contactId];
    const waiting = gameState.currentDay < booked.readyDay;
    return (
      <div data-testid="outside-help-booked" className="rounded-[2px] border border-stone-800 bg-stone-900/90 p-2.5 text-xs text-stone-300">
        <span className="font-semibold text-amber-200">{c?.name ?? 'Specialist'}</span> is on {stage.stageName}
        {waiting ? <> and arrives day {booked.readyDay}. Until then the crew carries it.</> : <>: in the room.</>}
        <span className="text-stone-500"> Fee {money(booked.fee)} paid.</span>
      </div>
    );
  }

  const offers = offersFor(gameState, project, idx);
  if (!offers.length) return null;
  const nextContact = lockedForStage(gameState, stage.stageName)[0];
  const nextU = nextContact?.contact.unlock;
  const nextHint = !nextContact ? '' : nextU?.kind === 'label'
    ? tc('freelancer.unlock.label', nextContact.hint, { n: nextU.interest })
    : nextU?.kind === 'venue' ? tc('freelancer.unlock.venue', nextContact.hint, { n: nextU.fame }) : nextContact.hint;
  const deadlineDay = (project.bookedDay ?? gameState.currentDay) + project.durationDaysTotal;
  const book = (contactId: string) => {
    const res = arrangeFreelancer(gameState, idx, contactId);
    if ('reason' in res) { toast({ title: 'Cannot book', description: res.reason, variant: 'destructive' }); return; }
    setGameState((prev) => {
      const again = arrangeFreelancer(prev, idx, contactId);
      return 'state' in again ? again.state : prev;
    });
    toast({ title: `${res.offer.contact.name} booked`, description: res.offer.leadDays > 0 ? `Arrives in ${res.offer.leadDays} day${res.offer.leadDays === 1 ? '' : 's'}.` : 'In the room today.' });
  };

  if (compact && !open) {
    return (
      <button type="button" data-testid="outside-help-chip" onClick={() => setOpen(true)} className="shrink-0 truncate rounded border border-stone-700 bg-stone-900/80 px-2 py-1 text-left text-[11px] text-amber-200">
        Outside help for {stage.stageName}: {offers.length} specialist{offers.length === 1 ? '' : 's'} from {money(offers[0].fee)}
      </button>
    );
  }

  return (
    <div data-testid="outside-help" className={`space-y-1.5 rounded-[2px] border border-stone-800 bg-stone-900/90 p-2.5 text-xs text-stone-300${compact ? ' max-h-[40vh] shrink-0 overflow-y-auto' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="font-bold uppercase tracking-wider text-stone-300">Outside help for {stage.stageName}</span>
        <span className="text-stone-500">Or keep it in-house: no fee, and your crew learns from it</span>
      </div>
      <ul className="space-y-1">
        {offers.map((o) => {
          const late = o.readyDay > deadlineDay;
          return (
            <li key={o.contact.id} data-testid="outside-offer" className="flex items-center justify-between gap-2 rounded border border-stone-800 bg-black/20 px-2 py-1.5">
              <div className="min-w-0">
                <div className="truncate"><span className="font-semibold text-stone-100">{o.contact.name}</span> <span className="text-stone-500">{SPECIALTY_LABEL[o.contact.specialties.find((s) => specialtiesForStage(stage.stageName).includes(s)) ?? o.contact.specialties[0]]} · {RATE_LABEL[o.contact.rateBand]}</span></div>
                <div className="text-stone-400">
                  {o.genreNote} · +{Math.round(o.uplift * 100)}% on this stage · {o.leadDays === 0 ? 'in today' : `arrives in ${o.leadDays} day${o.leadDays === 1 ? '' : 's'}`}
                  {o.limited && <span className="text-amber-300"> · limited availability</span>}
                  {late && <span className="text-red-300"> · after the deadline (day {deadlineDay})</span>}
                  {o.familiarity > 0 && <span> · worked together {o.familiarity}×{o.discount > 0 ? `, ${Math.round(o.discount * 100)}% off` : ''}</span>}
                </div>
              </div>
              <button
                type="button"
                data-testid="outside-book"
                disabled={gameState.money < o.fee}
                onClick={() => book(o.contact.id)}
                className="shrink-0 rounded border border-amber-500/60 px-2 py-1 font-semibold text-amber-200 disabled:opacity-40"
              >
                Book {money(o.fee)}
              </button>
            </li>
          );
        })}
      </ul>
      {nextContact && (
        <div data-testid="outside-next-contact" className="text-stone-500">
          {tc('freelancer.next', 'Next contact: {{name}}. {{hint}}', { name: nextContact.contact.name, hint: nextHint })}
        </div>
      )}
    </div>
  );
};

export default OutsideHelpCard;
