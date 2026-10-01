/** GH #55: explainable booking forecast — deterministic, bounded, no RNG. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { forecastSession } from '@/rpg/sessionForecast';

let passed = 0;
const ok = (c: boolean, m: string) => {
  assert(c, `FAIL: ${m}`);
  passed += 1;
  console.log(`PASS: ${m}`);
};

const base = {
  difficulty: 4,
  matchRating: 'Good' as const,
  durationDays: 4,
  payout: 2400,
  genre: 'Rock',
  clientSessions: 0,
  staff: [
    { energy: 72, mood: 68, technical: 62, creativity: 55, speed: 58, genreBonus: 12 },
  ],
  avgGearCondition: 82,
  worstGearCondition: 76,
  gearQualityBonus: 2,
  roomTier: 2,
  workload: 0,
};

const a = forecastSession(base);
const b = forecastSession({ ...base });
ok(JSON.stringify(a) === JSON.stringify(b), 'deterministic for the same visible setup');
ok(a.quality.likelyMin < a.quality.likelyMax, 'quality band has a range');
ok(a.quality.likelyMin >= 5 && a.quality.likelyMax <= 99, 'quality stays in bounds');
ok(['low', 'medium', 'high'].includes(a.quality.confidence), 'confidence is bounded');
ok(a.positives.length <= 3 && a.risks.length <= 3, 'at most three causes per side');
ok(a.time.estimatedDays >= 1, 'time estimate is sane');
ok(['low', 'medium', 'high'].includes(a.time.lateRisk), 'late risk is bounded');
ok(['poor', 'thin', 'healthy', 'strong'].includes(a.economics.marginBand), 'margin band is bounded');

const excellent = forecastSession({ ...base, matchRating: 'Excellent', clientSessions: 3 });
const poor = forecastSession({ ...base, matchRating: 'Poor' });
ok(excellent.quality.likelyMin > poor.quality.likelyMin, 'excellent fit outranks a stretch booking');

const tired = forecastSession({
  ...base,
  staff: [{ energy: 22, mood: 40, technical: 60, creativity: 50, speed: 50, genreBonus: 0 }],
});
ok(
  tired.risks.some((r) => r.key === 'energy') && tired.fatigueRisk !== 'low',
  'low energy surfaces fatigue risk',
);

const worn = forecastSession({ ...base, avgGearCondition: 48, worstGearCondition: 22 });
ok(worn.risks.some((r) => r.key === 'gear'), 'worn gear surfaces a risk');

const busy = forecastSession({ ...base, workload: 1 });
ok(busy.risks.some((r) => r.key === 'workload'), 'occupied studio surfaces split attention');

const thin = forecastSession({ ...base, payout: 100, durationDays: 6 });
ok(thin.economics.marginBand === 'poor' && thin.risks.some((r) => r.key === 'margin'), 'thin margin is explained');

const src = readFileSync('src/rpg/sessionForecast.ts', 'utf8');
ok(!/Math\.random|Date\.now|createSeededRandom/.test(src), 'forecast is analytical — no RNG to exploit');

// Booking picks nudge the forecast deterministically (GH #55 reactivity).
import { forecastSessionForBooking } from '@/rpg/sessionForecast';
const fakeProject = {
  id: 'p1', difficulty: 4, matchRating: 'Good' as const, durationDaysTotal: 4,
  payoutBase: 2400, genre: 'Rock', stages: [],
} as never;
const fakeState = {
  hiredStaff: [], ownedEquipment: [], studioLevel: 2, clientRelationships: {},
  activeProject: null, activeProjects: [],
} as never;
const plain = forecastSessionForBooking(fakeProject, fakeState);
const withPicks = forecastSessionForBooking(fakeProject, fakeState, {
  approachId: 'vocal-up', chainState: 'valid', stake: 'safe',
});
ok(JSON.stringify(withPicks) === JSON.stringify(forecastSessionForBooking(fakeProject, fakeState, {
  approachId: 'vocal-up', chainState: 'valid', stake: 'safe',
})), 'booking picks are deterministic');
ok(withPicks.quality.likelyMin >= plain.quality.likelyMin, 'approach + valid chain lift the floor');
ok(withPicks.positives.some((p) => p.key === 'approach' || p.key === 'chain'), 'picks are explained as reasons');
const moonshot = forecastSessionForBooking(fakeProject, fakeState, { stake: 'moonshot' });
ok(
  moonshot.quality.likelyMax - moonshot.quality.likelyMin >= plain.quality.likelyMax - plain.quality.likelyMin,
  'moonshot widens the band',
);
ok(moonshot.risks.some((r) => r.key === 'stake'), 'moonshot risk is explained');
const broken = forecastSessionForBooking(fakeProject, fakeState, { chainState: 'broken' });
ok(broken.risks.some((r) => r.key === 'chain'), 'broken chain surfaces a risk');

console.log(`${passed} session forecast checks passed`);
