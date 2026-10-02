import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GenreIcon, StatIcon, genreKey } from '../src/components/icons/GameIcons';

const genres = ['pop','rock','hip-hop','electronic','jazz','classical','country','r&b','reggae','folk','blues','punk','metal','indie','alternative','funk'];
for (const g of genres) {
  const html = renderToStaticMarkup(<GenreIcon genre={g} />);
  if (!html.includes('<svg') || !html.includes(`data-genre-icon="${g.replace("&", "&amp;")}"`)) throw new Error(`genre icon missing for ${g}`);
  if (/[\u{1F300}-\u{1FAFF}]/u.test(html)) throw new Error('emoji leaked');
}
if (genreKey('Hip Hop') !== 'hip-hop') throw new Error('genreKey normalisation');
if (genreKey('unknown-genre') !== 'pop') throw new Error('genreKey fallback');
for (const n of ['energy','combo','bank','mood','goal','chartUp','unlock','check','cash','creativity','technical','flame','bulb','sparkle','phone','note','pad','party','users'] as const) {
  if (!renderToStaticMarkup(<StatIcon name={n} />).includes('<path') && n !== 'mood' && n !== 'goal' && n !== 'bulb' && n !== 'cash') throw new Error(`stat icon ${n}`);
}
console.log('game-icons check passed');
