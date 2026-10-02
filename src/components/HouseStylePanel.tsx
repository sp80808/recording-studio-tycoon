import { Award } from 'lucide-react';
import { houseStyleProfile, levelPerk, type StudioExpertise } from '@/rpg/houseStyle';
import { SERVICE_LABELS, PRODUCTION_APPROACHES, type BriefServiceType } from '@/rpg/projectBrief';

interface HouseStylePanelProps {
  expertise?: StudioExpertise;
}

const labelFor = (kind: string, key: string) =>
  kind === 'services' ? SERVICE_LABELS[key as BriefServiceType] ?? key
    : kind === 'approaches' ? PRODUCTION_APPROACHES.find(a => a.id === key)?.label ?? key
      : key;

/** Compact Career profile for studio house style (#71): what the studio is known for and what is next. */
export function HouseStylePanel({ expertise }: HouseStylePanelProps) {
  const lines = houseStyleProfile(expertise, 4);
  return (
    <section className="rst-surface m-1 mt-3 p-3 text-xs" aria-label="House style">
      <header className="flex items-center gap-1.5">
        <Award size={15} aria-hidden="true" />
        <h3 className="text-sm font-semibold text-stone-100">House style</h3>
      </header>
      {lines.length === 0 ? (
        <p className="mt-1 text-stone-400">Finish sessions to build a reputation for a genre, a service or an approach.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {lines.map(l => (
            <li key={`${l.kind}:${l.key}`} data-testid="house-style-line">
              <div className="flex justify-between gap-2">
                <span className="text-stone-100">{labelFor(l.kind, l.key)}</span>
                <span className="text-amber-300">{l.name}</span>
              </div>
              <p className="text-stone-400">
                {levelPerk(l.level)}{l.toNext !== null ? ` · ${l.toNext} more to level up` : ''}
              </p>
              {l.notable.length > 0 && <p className="text-stone-500">{l.notable.length} standout session{l.notable.length > 1 ? 's' : ''}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default HouseStylePanel;
