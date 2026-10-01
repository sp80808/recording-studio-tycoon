import { BookOpen } from 'lucide-react';
import {
  KNOW_HOW_DOMAINS,
  canUnlockCapability,
  createInitialKnowHow,
  isCapabilityUnlocked,
  nextCapabilities,
  STUDIO_CAPABILITIES,
  type StudioKnowHow,
} from '@/rpg/studioKnowHow';

interface KnowHowPanelProps {
  knowHow?: StudioKnowHow;
  onUnlock: (capabilityId: string) => void;
}

/** Compact Career surface for Studio Know-How (#66): pool, familiarity bars, next unlocks. */
export function KnowHowPanel({ knowHow = createInitialKnowHow(), onUnlock }: KnowHowPanelProps) {
  const next = nextCapabilities(knowHow, 3);
  const unlocked = STUDIO_CAPABILITIES.filter(c => isCapabilityUnlocked(knowHow, c.id));
  const topDomains = KNOW_HOW_DOMAINS.filter(d => knowHow.domains[d] > 0).sort(
    (a, b) => knowHow.domains[b] - knowHow.domains[a],
  );
  return (
    <section className="rst-surface m-1 mt-3 p-3 text-xs" aria-label="Studio Know-How">
      <header className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-stone-100">
          <BookOpen size={15} aria-hidden="true" />Studio Know-How
        </h3>
        <span className="font-bold text-cyan-300" data-testid="know-how-available">{knowHow.available}</span>
      </header>
      <p className="mt-1 text-stone-400">Learn by doing. Spend Know-How on advanced training and studio workflows.</p>
      {topDomains.length > 0 && (
        <ul className="mt-2 space-y-1">
          {topDomains.map(d => (
            <li key={d} className="flex items-center gap-2">
              <span className="w-20 capitalize text-stone-300">{d}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded bg-stone-800" aria-hidden="true">
                <span className="block h-full bg-cyan-400" style={{ width: `${Math.min(100, knowHow.domains[d])}%` }} />
              </span>
              <span className="w-6 text-right text-stone-400">{knowHow.domains[d]}</span>
            </li>
          ))}
        </ul>
      )}
      {next.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {next.map(cap => {
            const ready = canUnlockCapability(knowHow, cap);
            return (
              <li key={cap.id} className="flex items-center justify-between gap-2">
                <span>
                  <span className="text-stone-100">{cap.name}</span>
                  <span className="block text-stone-400">
                    {cap.blurb} · {cap.cost} KH · {cap.minDomain} {cap.domain}
                  </span>
                </span>
                <button className="rst-btn" disabled={!ready} onClick={() => onUnlock(cap.id)}>Unlock</button>
              </li>
            );
          })}
        </ul>
      )}
      {unlocked.length > 0 && (
        <p className="mt-2 text-emerald-300">Unlocked: {unlocked.map(c => c.name).join(', ')}</p>
      )}
    </section>
  );
}
