import React from 'react';
import { cityEraLore, cityText, getCityById } from '@/rpg/cities';
import { tc, useContentLocale } from '@/i18n/content';
import { CitySkyline } from '@/components/CitySkyline';

/** Career-tab card: the home city's story, in the player's era. Renders nothing on legacy saves. */
export function CityLorePanel({ cityId, eraId }: { cityId?: string; eraId?: string }) {
  useContentLocale();
  const city = getCityById(cityId);
  if (!city) return null;
  const text = cityText(city);
  return (
    <section className="rst-surface relative overflow-hidden p-3" aria-label={tc('city_ui.lore_aria', '{{name}} lore', { name: city.name })} data-testid="city-lore" style={{ borderColor: `${city.accent}55` }}>
      <CitySkyline cityId={city.id} className="pointer-events-none absolute inset-x-0 bottom-0 h-12 w-full opacity-[0.14]" />
      <div className="relative">
        <p className="rst-kicker" style={{ color: city.accent }}>{tc('city_ui.home_city', 'Home city')}</p>
        <h3 className="rst-title text-lg">{city.name}, {city.country}</h3>
        <p className="mt-1 text-xs italic text-stone-400">{text.tagline}</p>
        <p className="mt-2 text-xs leading-relaxed text-stone-200">{cityEraLore(city.id, eraId)}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-stone-300">{text.blurb}</p>
        <ul className="mt-2 space-y-0.5 text-[11px] text-stone-300">
          {text.landmarks.map((l) => <li key={l}>· {l}</li>)}
        </ul>
        <p className="mt-2 text-[11px] italic text-stone-400">“{text.legend}”</p>
        <p className="mt-2 text-[11px] text-stone-300"><b style={{ color: city.accent }}>{tc('city_ui.local_edge', 'Local edge:')}</b> +1 {text.edgeLabel}. {text.edgeWhy}</p>
      </div>
    </section>
  );
}

export default CityLorePanel;
