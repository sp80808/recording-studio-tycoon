import React from 'react';
import { cityEraLore, getCityById } from '@/rpg/cities';
import { CitySkyline } from '@/components/CitySkyline';

/** Career-tab card: the home city's story, in the player's era. Renders nothing on legacy saves. */
export function CityLorePanel({ cityId, eraId }: { cityId?: string; eraId?: string }) {
  const city = getCityById(cityId);
  if (!city) return null;
  return (
    <section className="rst-surface relative overflow-hidden p-3" aria-label={`${city.name} lore`} data-testid="city-lore" style={{ borderColor: `${city.accent}55` }}>
      <CitySkyline cityId={city.id} className="pointer-events-none absolute inset-x-0 bottom-0 h-12 w-full opacity-[0.14]" />
      <div className="relative">
        <p className="rst-kicker" style={{ color: city.accent }}>Home city</p>
        <h3 className="rst-title text-lg">{city.name}, {city.country}</h3>
        <p className="mt-1 text-xs italic text-stone-400">{city.tagline}</p>
        <p className="mt-2 text-xs leading-relaxed text-stone-200">{cityEraLore(city.id, eraId)}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-stone-300">{city.lore.blurb}</p>
        <ul className="mt-2 space-y-0.5 text-[11px] text-stone-300">
          {city.lore.landmarks.map((l) => <li key={l}>· {l}</li>)}
        </ul>
        <p className="mt-2 text-[11px] italic text-stone-400">“{city.lore.legend}”</p>
        <p className="mt-2 text-[11px] text-stone-300"><b style={{ color: city.accent }}>Local edge:</b> +1 {city.edge.label}. {city.edge.why}</p>
      </div>
    </section>
  );
}

export default CityLorePanel;
