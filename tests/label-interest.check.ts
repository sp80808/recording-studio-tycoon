/** Label interest (#49): strong releases raise bounded, cash-free label interest. */
import { applyLabelSignals, labelsForGenre, labelInterestLines, BAND_INTEREST, INTEREST_CAP } from '../src/rpg/labelInterest';
import { recordRelease, resolveDueReleases } from '../src/rpg/artistCareer';
import type { ClientRelationship } from '../src/types/game';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };
const sig = (genre: string, band: 'quiet' | 'solid' | 'breakthrough' | 'prestige') => ({ genre, band, title: 'Glass Rooms', clientName: 'Maya Ross' });

ok(labelsForGenre('Hip-Hop').length >= 2, 'a genre can interest more than one label');
ok(labelsForGenre('Zydeco').length === 0, 'an unknown genre interests no label');

const none = applyLabelSignals(undefined, [sig('Pop', 'quiet'), sig('Pop', 'solid')]);
ok(none.interest === undefined && none.notifications.length === 0, 'quiet and solid releases do not move labels');

const a = applyLabelSignals(undefined, [sig('Indie', 'breakthrough')]);
ok(a.interest?.indie_label_001 === BAND_INTEREST.breakthrough, 'a breakthrough indie release warms the indie label');
ok(a.interest?.electronic_label_001 === undefined, 'labels outside the genre are untouched');

let interest: Record<string, number> | undefined;
for (let i = 0; i < 40; i++) interest = applyLabelSignals(interest, [sig('Pop', 'prestige')]).interest;
ok(Object.values(interest!).every((v) => v <= INTEREST_CAP), 'interest is capped');

let crossed = 0;
let cur: Record<string, number> | undefined;
for (let i = 0; i < 10; i++) { const r = applyLabelSignals(cur, [sig('Indie', 'prestige')]); cur = r.interest; crossed += r.notifications.length; }
ok(crossed === 3, 'each interest line (25/50/75) fires one note, once');

const frozen = JSON.stringify(cur);
applyLabelSignals(cur, [sig('Indie', 'prestige')]);
ok(JSON.stringify(cur) === frozen, 'applying signals does not mutate the old map');
ok(labelInterestLines(cur)[0].name === 'Underground Sounds', 'the warmest label lists first');
ok(labelInterestLines(undefined).length === 0, 'legacy saves show no labels');

// Wired through release resolution: each release emits one signal, exactly once.
const client: ClientRelationship = { clientId: 'm', clientName: 'Maya Ross', primaryGenre: 'Indie', relationshipXp: 100, tier: 'Friendly', sessionsCompleted: 1, lastSessionDay: 1, bestQualityScore: 95, referralCount: 0 };
const rel = recordRelease(client, { projectId: 'p-label', title: 'Glass Rooms', genre: 'Indie', qualityScore: 99, day: 3 });
const day = rel.releases![0].resolveDay;
const first = resolveDueReleases({ m: rel }, day);
ok(first.labelSignals.length === 1 && first.labelSignals[0].genre === 'Indie', 'a resolved release emits one label signal');
const again = resolveDueReleases(first.relationships, day + 1);
ok(again.labelSignals.length === 0, 'a resolved release never signals twice');
ok(resolveDueReleases(undefined, 5).labelSignals.length === 0, 'no relationships means no signals');
console.log(`label-interest: ${n} checks passed`);
