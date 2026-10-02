/** Home city (career start): currency display, regional taste, local names, local events, legacy neutrality. */
import {
  CITIES, COOL_POPULARITY, HOT_ENQUIRY_WEIGHT, HOT_POPULARITY, describeCity, formatMoney, getCity, isCityId,
  localName, regionalEnquiryWeight, regionalPopularityDelta, toLocalAmount,
} from '../src/rpg/cities';
import { getGenreMarketMultiplier } from '../src/utils/eraProgression';
import { createNewGameState } from '../src/utils/newGameState';
import { generateCandidates } from '../src/utils/staffRecruitment';
import { generateSessionMusicians } from '../src/utils/bandUtils';
import { generateNewProjects } from '../src/utils/projectUtils';
import { CITY_EVENTS, MORE_CITY_EVENTS } from '../src/narrative/cityEvents';
import { applyCityEdge, cityEraLore, currencyFor, CITY_ERAS } from '../src/rpg/cities';
import { money, moneyValue, setDisplayCurrency, signedMoney } from '../src/utils/displayMoney';
import { DIRECTOR_EVENTS } from '../src/narrative/directorEvents';
import { EFFECT_LIMITS, buildFacts, validateEffects } from '../src/narrative/eventDirector';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };

// Data shape.
ok(CITIES.length === 6 && new Set(CITIES.map((c) => c.id)).size === 6, 'six distinct cities');
ok(CITIES.every((c) => c.hotGenres.length >= 3 && c.coolGenres.length >= 1 && c.names.first.length >= 8 && c.names.last.length >= 8), 'every city has taste and name pools');
ok(CITIES.every((c) => c.hotGenres.every((g) => !c.coolGenres.includes(g))), 'no genre is both hot and cool in a city');
ok(isCityId('london') && !isCityId('atlantis') && !isCityId(undefined), 'city id guard');
ok(CITIES.every((c) => describeCity(c).length === 5), 'every city describes five changes');

// Currency is display only.
ok(formatMoney(1000) === '$1,000' && formatMoney(1000, 'nashville') === '$1,000', 'dollars stay dollars');
ok(formatMoney(1000, 'london') === '£800' && formatMoney(1000, 'berlin') === '€920', 'pounds and euros convert for display');
ok(formatMoney(1000, 'tokyo') === '¥150,000' && formatMoney(100, 'rio') === 'R$500', 'yen and reais convert for display');
ok(formatMoney(-250, 'london') === '-£200', 'negative amounts keep the sign in front');
ok(toLocalAmount(1234, undefined) === 1234 && toLocalAmount(1234, 'nope') === 1234, 'unknown or missing city is dollars');

// Regional taste.
ok(regionalPopularityDelta('Country', 'nashville') === HOT_POPULARITY, 'Nashville loves country');
ok(regionalPopularityDelta('EDM', 'nashville') === COOL_POPULARITY, 'Nashville cools on EDM');
ok(regionalPopularityDelta('Jazz', 'nashville') === 0 && regionalPopularityDelta('Country', undefined) === 0, 'neutral otherwise');
ok(regionalPopularityDelta('hip hop', 'los-angeles') === HOT_POPULARITY, 'genre names match loosely');
ok(regionalEnquiryWeight('Electronic', 'berlin') === HOT_ENQUIRY_WEIGHT && regionalEnquiryWeight('Electronic', undefined) === 1, 'hot genres turn up more often');
const base = getGenreMarketMultiplier('Electronic', 'internet2000s');
const berlin = getGenreMarketMultiplier('Electronic', 'internet2000s', 'berlin');
ok(getGenreMarketMultiplier('Electronic', 'internet2000s', undefined) === base, 'no city leaves the market multiplier untouched');
ok(berlin > base && berlin <= 1.3, 'a hot local genre pays more, within the cap');
ok(getGenreMarketMultiplier('Country', 'analog60s', 'berlin') < getGenreMarketMultiplier('Country', 'analog60s'), 'a cool local genre pays less');

// People.
ok(localName(undefined, 0.1, 0.1) === undefined, 'neutral save has no local names');
ok(localName('tokyo', 0, 0) === 'Haruto Tanaka' && localName('tokyo', 0, 0) === localName('tokyo', 0, 0), 'local names are deterministic');
const ctx = { count: 12, saveSeed: 'city-test', day: 3, era: 'modern', year: 2020 } as const;
const neutral = generateCandidates(ctx).map((c) => c.name);
ok(JSON.stringify(neutral) === JSON.stringify(generateCandidates({ ...ctx }).map((c) => c.name)), 'neutral candidates are seeded and repeatable');
const berlinStaff = generateCandidates({ ...ctx, cityId: 'berlin' }).map((c) => c.name);
ok(JSON.stringify(berlinStaff) === JSON.stringify(generateCandidates({ ...ctx, cityId: 'berlin' }).map((c) => c.name)), 'city candidates are seeded and repeatable');
const berlinNames = new Set(CITIES.find((c) => c.id === 'berlin')!.names.first);
ok(berlinStaff.some((nm) => berlinNames.has(nm.split(' ')[0])), 'some Berlin candidates carry local first names');
ok(generateSessionMusicians(40, 'rio').some((m) => CITIES.find((c) => c.id === 'rio')!.names.first.includes(m.name.split(' ')[0])), 'some session musicians are local');
ok(generateSessionMusicians(5).every((m) => m.name.length > 0), 'neutral session musicians still named');

// New game, saves.
const la = createNewGameState();
ok(la.cityId === 'los-angeles' && getCity(la)?.name === 'Los Angeles', 'new games default to Los Angeles');
const ldn = createNewGameState({ cityId: 'london' });
ok(ldn.cityId === 'london', 'a chosen city is kept');
ok(createNewGameState({ cityId: 'atlantis' as never }).cityId === 'los-angeles', 'an invalid city falls back');
ok(getCity({ cityId: undefined }) === undefined, 'legacy saves have no city (neutral)');

// Enquiries.
const realRandom = Math.random;
let seed = 7;
Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const genres = (cityId?: string) => {
  seed = 7;
  const counts: Record<string, number> = {};
  for (const p of generateNewProjects(400, 1, 'internet2000s', [], 1.1, 0, cityId)) counts[p.genre] = (counts[p.genre] ?? 0) + 1;
  return counts;
};
const noCity = genres(); const withBerlin = genres('berlin');
Math.random = realRandom;
ok((withBerlin.Electronic ?? 0) > (noCity.Electronic ?? 0), 'hot local genre appears more often in enquiries');

// Local events.
const ids = DIRECTOR_EVENTS.map((e) => e.id);
ok(new Set(ids).size === ids.length, 'director event ids stay unique');
ok(CITY_EVENTS.length === CITIES.length && CITY_EVENTS.every((e) => ids.includes(e.id)), 'one local event per city, all in the pool');
ok(CITY_EVENTS.every((e) => e.options.length >= 2 && e.options.every((o) => validateEffects(o.effects).length === o.effects.length)), 'every option has valid, uncapped effects');
ok(CITY_EVENTS.every((e) => e.options.some((o) => o.id === e.defaultOptionId)), 'every default option exists');
ok(CITY_EVENTS.every((e) => e.options.every((o) => o.effects.every((x) => !('amount' in x) || Math.abs(x.amount) <= EFFECT_LIMITS[x.kind as keyof typeof EFFECT_LIMITS]))), 'effects stay inside the director caps');
const factsFor = (cityId?: string) => buildFacts({ ...ldn, cityId: cityId as never, reputation: 40 });
for (const c of CITIES) {
  const mine = CITY_EVENTS.filter((e) => e.eligible(factsFor(c.id)));
  ok(mine.length === 1 && mine[0].id.startsWith(({ 'los-angeles': 'la', nashville: 'nashville', london: 'london', berlin: 'berlin', tokyo: 'tokyo', rio: 'rio' } as Record<string, string>)[c.id]), `${c.name}: only its own local event is eligible`);
}
ok(CITY_EVENTS.every((e) => !e.eligible(factsFor(undefined))), 'legacy saves never see local events');
// Era-aware currency (display only).
ok(currencyFor('london', 'analog60s').perDollar === 0.36 && currencyFor('london', 'streaming2020s').perDollar === 0.8, 'sterling has era-indexed rates');
ok(currencyFor('berlin', 'digital80s').symbol === 'DM' && currencyFor('berlin', 'internet2000s').symbol === '€', 'Berlin pays in marks, then euros');
ok(formatMoney(1000, 'tokyo', 'analog60s') === '¥360,000' && formatMoney(1000, 'tokyo', 'internet2000s') === '¥115,000', 'yen follows the era');
ok(formatMoney(1000, 'nashville', 'analog60s') === '$1,000' && formatMoney(1000, undefined, 'analog60s') === '$1,000', 'dollar cities and legacy saves stay in dollars');
ok(CITIES.every((c) => CITY_ERAS.every((e) => currencyFor(c.id, e).perDollar > 0)), 'every city has a positive rate in every era');
setDisplayCurrency('london', 'analog60s');
ok(money(1000) === '£360' && signedMoney(-100) === '-£36' && signedMoney(50) === '+£18' && moneyValue(1000) === 360, 'display helpers follow city and era');
setDisplayCurrency(undefined, undefined);
ok(money(1234) === '$1,234' && signedMoney(5) === '+$5', 'display helpers default to dollars');

// Lore.
ok(CITIES.every((c) => c.lore.landmarks.length === 3 && c.lore.legend.length > 20 && CITY_ERAS.every((e) => c.lore.eras[e].length > 20)), 'every city has landmarks, a legend and four era notes');
ok(cityEraLore('rio', 'digital80s') === CITIES.find((c) => c.id === 'rio')!.lore.eras.digital80s && cityEraLore(undefined, 'digital80s') === undefined, 'era lore resolves; legacy saves have none');
ok(new Set(CITIES.map((c) => c.accent)).size === CITIES.length, 'every city has its own accent colour');

// Character edge.
const baseAttrs = createNewGameState({ cityId: 'nashville' }).playerData.attributes;
const noEdge = applyCityEdge({ playerData: { attributes: { ...baseAttrs } } }, undefined);
ok(JSON.stringify(noEdge.playerData.attributes) === JSON.stringify(baseAttrs), 'no city: no edge');
const ldnAttrs = createNewGameState({ cityId: 'london', originId: undefined }).playerData.attributes;
const rioAttrs = createNewGameState({ cityId: 'rio' }).playerData.attributes;
ok(ldnAttrs.focusMastery === 2 && rioAttrs.creativeIntuition === 2 && ldnAttrs.creativeIntuition === 1, 'a new game gets exactly one +1 from its city');
ok(CITIES.every((c) => ['focusMastery', 'creativeIntuition', 'technicalAptitude', 'businessAcumen'].includes(c.edge.attribute)), 'edges target real attributes');

// More local events.
ok(MORE_CITY_EVENTS.length === CITIES.length * 2, 'two more local events per city');
for (const c of CITIES) {
  const all = [...CITY_EVENTS, ...MORE_CITY_EVENTS].filter((e) => e.eligible(factsFor(c.id)));
  ok(all.length === 3, `${c.name}: three local events in the pool`);
}
ok(MORE_CITY_EVENTS.every((e) => !e.eligible(factsFor(undefined)) && ids.includes(e.id)), 'extra local events are gated and registered');
ok(MORE_CITY_EVENTS.every((e) => e.options.every((o) => validateEffects(o.effects).length === o.effects.length) && e.options.some((o) => o.id === e.defaultOptionId)), 'extra events are valid with real defaults');
ok(new Set([...CITY_EVENTS, ...MORE_CITY_EVENTS].map((e) => e.narrativeKey)).size === 18, 'eighteen distinct local events');
console.log(`city-selection: ${n} checks passed`);

// Wall tint: subtle, per-city, neutral for legacy saves.
import { cityWallColors, mixColor } from '../src/components/studio/cityWallTint';
{
  const l = 0x2a3345, r = 0x323d52;
  ok(cityWallColors(l, r).wallLeft === l && cityWallColors(l, r, 'nope').wallRight === r, 'wall tint leaves legacy saves untouched');
  ok(mixColor(0x000000, 0xffffff, 0) === 0 && mixColor(0x000000, 0xffffff, 1) === 0xffffff, 'mixColor endpoints');
  const tinted = new Set(CITIES.map((c) => cityWallColors(l, r, c.id).wallLeft));
  ok(tinted.size === CITIES.length && !tinted.has(l), 'every city tints the walls differently');
  const shift = (a: number, b: number) => Math.max(...[16, 8, 0].map((s) => Math.abs(((a >> s) & 255) - ((b >> s) & 255))));
  ok(CITIES.every((c) => shift(cityWallColors(l, r, c.id).wallLeft, l) <= 40), 'tint stays subtle');
}
