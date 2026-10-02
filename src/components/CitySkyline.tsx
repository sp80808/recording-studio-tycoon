import React from 'react';
import { getCityById } from '@/rpg/cities';

/** Hand-drawn skyline silhouettes (original, simple shapes) keyed by city. Width 240, height 60. */
const SKYLINES: Record<string, string> = {
  'los-angeles': 'M0 60V44h14V30h8v14h10V38h6V20h4v18h8V46h12V34h10v12h8V40h14V26h6v14h12V48h14V36h10v12h14V42h12V50h18V44h10v16Z M178 18v22 M180 14v26',
  nashville: 'M0 60V46h16V34h10v12h12V28h8v18h14V38h12V48h18V30h6V20h4v10h6v18h16V40h12V50h20V44h14v16Z',
  london: 'M0 60V46h12V36h8v10h10V30h10v16h8V24h4V14h4v10h4v22h10V38h12V50h14V34h6v-6h4v6h6v16h14V44h14v16Z',
  berlin: 'M0 60V48h20V40h14V48h16V36h6V8h3v28h5V44h14V34h8V50h16V42h12V30h20V46h12V38h14V50h18V44h12v16Z',
  tokyo: 'M0 60V46h12V36h10v10h8V26h6V16h2V6h2v10h2v10h6v20h12V38h10V50h10V30h8V42h12V34h14V48h10V40h16V50h16V44h8v16Z',
  rio: 'M0 60V50h14L40 30l16 12 12-8 20 18h8V44h10V32l12 12h10V40l16-26 22 36h14V46h14V52h12V46h10v14Z',
};

export const CitySkyline: React.FC<{ cityId?: string; className?: string }> = ({ cityId, className = '' }) => {
  const city = getCityById(cityId);
  if (!city) return null;
  return (
    <svg viewBox="0 0 240 60" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true" data-testid="city-skyline" data-city={city.id}>
      <path d={SKYLINES[city.id]} fill={city.accent} fillRule="evenodd" />
    </svg>
  );
};

export default CitySkyline;
