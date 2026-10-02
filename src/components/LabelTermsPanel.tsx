import { Disc3 } from 'lucide-react';
import { FREEDOM_FEE, FREEDOM_TARGET, RUSH_DAYS, RUSH_FEE, REVISION_FEE, type LabelChoices, type LabelTerms } from '@/rpg/labelAccounts';
import { money } from '@/utils/displayMoney';

const pct = (v: number) => `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`;

/** Compact label-contract terms (#50): three chips, each a visible trade of fee against pressure. */
export function LabelTermsPanel({ terms, onChange }: { terms: LabelTerms; onChange: (c: LabelChoices) => void }) {
  const c = terms.choices;
  const chips: { key: keyof LabelChoices; label: string; effect: string }[] = [
    { key: 'rush', label: 'Rush delivery', effect: `${pct(RUSH_FEE)} fee, ${RUSH_DAYS} days sooner` },
    { key: 'extraRevision', label: 'Extra revision', effect: `${pct(REVISION_FEE)} fee, one more round` },
    { key: 'openFreedom', label: 'Open creative freedom', effect: `${pct(FREEDOM_FEE)} fee, target ${FREEDOM_TARGET}` },
  ];
  return (
    <div data-testid="label-terms" className="mb-3 rounded-lg border border-[var(--rst-line)] bg-black/20 p-2.5 text-xs text-stone-300">
      <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-stone-100">
        <Disc3 size={13} aria-hidden="true" />
        {terms.labelName} · {terms.tier} label · 3-track package
      </div>
      <p className="mb-2 text-stone-400" data-testid="label-terms-summary">
        {money(terms.fee)} · {terms.deadlineDays} days · quality target {terms.qualityTarget} · {terms.revisions} revision{terms.revisions === 1 ? '' : 's'} included
      </p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Negotiate terms">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            title={chip.effect}
            aria-pressed={c[chip.key]}
            onClick={() => onChange({ ...c, [chip.key]: !c[chip.key] })}
            className={`rst-chip cursor-pointer ${c[chip.key] ? 'rst-chip-brass' : ''}`}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-stone-500">Late or under target trims the fee a little. Never a blacklist.</p>
    </div>
  );
}

export default LabelTermsPanel;
