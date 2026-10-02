import { Mic2 } from 'lucide-react';
import { clientCareerLines } from '@/rpg/artistCareer';
import type { ClientRelationship } from '@/types/game';

const TIER_LABEL = { local: 'Local', emerging: 'Emerging', established: 'Established', breakout: 'Breakout', prestige: 'Prestige' } as const;
const BAND_LABEL = { quiet: 'Quiet', solid: 'Solid', breakthrough: 'Breakthrough', prestige: 'Prestige' } as const;

/** Compact client history for Career (#49): career tier, releases made here, best result. */
export function ClientCareerPanel({ relationships }: { relationships?: Record<string, ClientRelationship> }) {
  const lines = clientCareerLines(relationships, 3);
  return (
    <section className="rst-surface m-1 mt-3 p-3 text-xs" aria-label="Client careers">
      <header className="flex items-center gap-1.5">
        <Mic2 size={15} aria-hidden="true" />
        <h3 className="text-sm font-semibold text-stone-100">Client careers</h3>
      </header>
      {lines.length === 0 ? (
        <p className="mt-1 text-stone-400">Deliver sessions for clients and their releases will build a history here.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {lines.map(l => (
            <li key={l.clientName} data-testid="client-career-line">
              <div className="flex justify-between gap-2">
                <span className="text-stone-100">{l.clientName}</span>
                <span className="text-amber-300">{TIER_LABEL[l.tier]}</span>
              </div>
              <p className="text-stone-400">
                {l.releasesMade} release{l.releasesMade === 1 ? '' : 's'} made here
                {l.best ? ` · best: ${l.best.title} (${BAND_LABEL[l.best.band]})` : ''}
                {l.pending > 0 ? ` · ${l.pending} out in the world` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ClientCareerPanel;
