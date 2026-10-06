import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { forecastDelivery, REVISION_ROUND_FEE, type DeliveryDecision, type UnresolvedIssue } from '@/rpg/sessionIssues';

interface DeliveryChoiceDialogProps {
  issues: UnresolvedIssue[];
  payout: number;
  /** Revision rounds this booking already includes (#51). */
  revisionAllowance?: number;
  onChoose: (decision: DeliveryDecision) => void;
}

const SEVERITY = ['', 'minor', 'noticeable', 'serious'];

/** Deliver now or polish first, with the bounded forecast from #87. */
export const DeliveryChoiceDialog: React.FC<DeliveryChoiceDialogProps> = ({ issues, payout, revisionAllowance = 0, onChoose }) => {
  const f = forecastDelivery(issues, payout);
  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent className="mx-4 max-w-md border-stone-600 bg-stone-900 text-white" data-testid="delivery-choice">
        <DialogHeader>
          <DialogTitle>Ready to deliver?</DialogTitle>
          <DialogDescription className="text-stone-400">
            {issues.length} open issue{issues.length === 1 ? '' : 's'} from this session.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-1 text-sm text-stone-200">
          {issues.map((i) => (
            <li key={i.id}>
              · {i.label} <span className="text-stone-500">({SEVERITY[i.severity]}, {i.phase})</span> — {i.cause}
              {i.habit && <span className="block pl-3 text-xs text-amber-200/80">Next time: {i.habit}</span>}
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <button type="button" data-rst-surface="contextual" data-rst-action-id="wrap:deliver" onClick={() => onChoose('deliver')} className="rst-btn flex-col !items-start text-left">
            <span className="font-semibold">Deliver now</span>
            <span className="text-stone-400">Up to -{f.deliver.qualityPenalty} quality, {f.deliver.revisionChance}% revision risk{revisionAllowance > 0 ? ` (a round is included: costs ${Math.round(REVISION_ROUND_FEE * 100)}% of the fee, not trust)` : ''}. Frees the room today.</span>
          </button>
          <button type="button" data-rst-surface="contextual" data-rst-action-id="wrap:polish" onClick={() => onChoose('polish')} className="rst-btn rst-btn-primary flex-col !items-start text-left">
            <span className="font-semibold">Polish first</span>
            <span className="text-stone-200">-${f.polish.cost} studio time, issues cleared, +{f.polish.knowHow} Know-How.</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryChoiceDialog;
