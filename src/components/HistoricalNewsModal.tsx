import React from 'react';
import { ArrowRight, Briefcase, Cpu, Drama, Newspaper, Scale, TrendingDown, TrendingUp, Users, type LucideIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { HistoricalEvent } from '@/utils/historicalEvents';

interface HistoricalNewsModalProps {
  event: HistoricalEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_META: Record<string, { icon: LucideIcon; chip: string }> = {
  technology: { icon: Cpu, chip: 'rst-chip-live' },
  cultural: { icon: Drama, chip: 'rst-chip-story' },
  business: { icon: Briefcase, chip: 'rst-chip-money' },
  legal: { icon: Scale, chip: 'rst-chip-danger' },
  social: { icon: Users, chip: 'rst-chip-brass' },
};

const typeMeta = (type: string) => TYPE_META[type] ?? { icon: Newspaper, chip: '' };

/** Signed pill: green for a rise, rose for a fall. Text carries the direction, never colour alone. */
const Delta: React.FC<{ label: string; positive: boolean; value: string }> = ({ label, positive, value }) => (
  <span className={`rst-chip ${positive ? 'rst-chip-money' : 'rst-chip-danger'}`}>
    {positive ? <TrendingUp size={12} aria-hidden="true" /> : <TrendingDown size={12} aria-hidden="true" />}
    {label} {positive ? '+' : '−'}{value}
  </span>
);

export const HistoricalNewsModal: React.FC<HistoricalNewsModalProps> = ({ event, isOpen, onClose }) => {
  if (!event) return null;

  const meta = typeMeta(event.type);
  const Icon = meta.icon;
  const { genrePopularityChanges, equipmentDemandChanges, marketChanges } = event.impact;
  const hasImpact = genrePopularityChanges || equipmentDemandChanges || marketChanges;

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-2xl" data-testid="historical-news-modal">
        <div className="flex flex-wrap items-center gap-2 pr-9">
          <p className="rst-kicker flex items-center gap-1.5">
            <Newspaper size={13} aria-hidden="true" /> Breaking news · {event.year}
          </p>
          <span className={`rst-chip ml-auto ${meta.chip}`}>
            <Icon size={12} aria-hidden="true" />
            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
          </span>
        </div>

        <DialogTitle className="text-2xl">{event.title.replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, '')}</DialogTitle>
        <DialogDescription className="rst-body">{event.description}</DialogDescription>

        {event.educationalInfo && (
          <div className="rounded-xl border border-[var(--rst-brass-line)] bg-[var(--rst-brass-fill)] p-4">
            <p className="rst-kicker mb-1.5 text-[var(--rst-brass-300)]">Industry context</p>
            <p className="text-sm leading-relaxed text-[var(--rst-ivory-soft)]">{event.educationalInfo}</p>
          </div>
        )}

        {hasImpact && (
          <div className="grid gap-3 rounded-xl border border-[var(--rst-line)] bg-[var(--rst-fill-1)] p-4">
            <p className="rst-kicker">What it means for your studio</p>

            {genrePopularityChanges && (
              <div>
                <p className="rst-muted mb-1.5 text-xs">Genre trends</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(genrePopularityChanges).map(([genre, change]) => (
                    <Delta key={genre} label={genre} positive={change > 0} value={`${Math.abs(change)}%`} />
                  ))}
                </div>
              </div>
            )}

            {equipmentDemandChanges && (
              <div>
                <p className="rst-muted mb-1.5 text-xs">Equipment demand</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(equipmentDemandChanges).map(([equipment, multiplier]) => (
                    <Delta
                      key={equipment}
                      label={equipment.replace(/_/g, ' ')}
                      positive={multiplier > 1}
                      value={`${Math.abs(Math.round((multiplier - 1) * 100))}%`}
                    />
                  ))}
                </div>
              </div>
            )}

            {marketChanges && (
              <div>
                <p className="rst-muted mb-1.5 text-xs">Market effects</p>
                <div className="flex flex-wrap gap-1.5">
                  {marketChanges.payoutMultiplier && (
                    <Delta
                      label="Project revenue"
                      positive={marketChanges.payoutMultiplier > 1}
                      value={`${Math.abs(Math.round((marketChanges.payoutMultiplier - 1) * 100))}%`}
                    />
                  )}
                  {marketChanges.reputationMultiplier && (
                    <Delta
                      label="Reputation gain"
                      positive={marketChanges.reputationMultiplier > 1}
                      value={`${Math.abs(Math.round((marketChanges.reputationMultiplier - 1) * 100))}%`}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="rst-btn rst-btn-primary" autoFocus>
            Back to the studio <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
