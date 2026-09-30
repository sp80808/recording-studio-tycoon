import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { forecastDelivery, type DeliveryDecision, type UnresolvedIssue } from '@/rpg/sessionIssues';

interface DeliveryChoiceDialogProps {
  issues: UnresolvedIssue[];
  payout: number;
  onChoose: (decision: DeliveryDecision) => void;
}

const SEVERITY = ['', 'minor', 'noticeable', 'serious'];

/** Deliver now or polish first, with the bounded forecast from #87. */
export const DeliveryChoiceDialog: React.FC<DeliveryChoiceDialogProps> = ({ issues, payout, onChoose }) => {
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
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <button type="button" onClick={() => onChoose('deliver')} className="rst-btn flex-col !items-start text-left">
            <span className="font-semibold">Deliver now</span>
            <span className="text-stone-400">Up to -{f.deliver.qualityPenalty} quality, {f.deliver.revisionChance}% revision risk. Frees the room today.</span>
          </button>
          <button type="button" onClick={() => onChoose('polish')} className="rst-btn rst-btn-primary flex-col !items-start text-left">
            <span className="font-semibold">Polish first</span>
            <span className="text-stone-200">-${f.polish.cost} studio time, issues cleared, +{f.polish.knowHow} Know-How.</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryChoiceDialog;
