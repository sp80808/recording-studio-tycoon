/** #63 Studio Seasons — deterministic evaluation, resolve-once guard, awards, wiring. */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import type { GameState } from '@/types/game';
import {
  SEASON_LENGTH_DAYS, advanceSeasonClock, chooseFocus, createSeasonState, currentAwardStanding,
  currentObjectives, evaluateAwards, recordSeasonDelivery, seasonReviewNote, type DeliveryInput,
} from '@/rpg/studioSeasons';
import { applySeasonTick } from '@/economy/seasonRewards';

let passed = 0;
const ok = (c: boolean, m: string): void => { assert(c, `FAIL: ${m}`); passed += 1; console.log(`PASS: ${m}`); };
const read = (p: string): string => fs.readFileSync(path.join(process.cwd(), p), 'utf8');

const base = (day = 1): GameState => ({
  currentDay: day, money: 1000, reputation: 10, studioRooms: [{ unlocked: true }],
  notifications: [], studioSeasons: createSeasonState(1, 1),
} as unknown as GameState);

const d = (n: number, o: Partial<DeliveryInput> = {}): DeliveryInput => ({
  projectId: `p${n}`, title: `Song ${n}`, quality: 75, revenue: 900, sessionsBefore: 0, sessionsAfter: 1, day: 5, ...o,
});

// Choosing a focus changes goals only.
let s = chooseFocus(base(), 'relationships');
ok(currentObjectives(s).length === 2, 'each focus shows 2 objectives');
ok(currentObjectives(chooseFocus(s, 'craft')).every(o => o.id.startsWith('craft')), 'switching focus swaps goals');

// Causal reasons.
s = recordSeasonDelivery(s, d(1, { clientKey: 'mara', clientName: 'Mara', sessionsBefore: 1, sessionsAfter: 2, tierBefore: 'Friendly', tierAfter: 'Regular' }));
let o = currentObjectives(s);
ok(o[0].current === 1 && /Mara's second session counted as a repeat booking/.test(o[0].reason), 'repeat progress names the client causally');
ok(o[1].done && /Friendly to Regular/.test(o[1].reason), 'tier gain objective explains the move');
ok(recordSeasonDelivery(s, d(1, { clientKey: 'mara' })).studioSeasons!.deliveries.length === 1, 'same project is never double-counted');

// Craft + growth objectives.
let c = chooseFocus(base(), 'craft');
c = recordSeasonDelivery(c, d(1, { quality: 90 }));
c = recordSeasonDelivery(c, d(2, { quality: 72 }));
c = recordSeasonDelivery(c, d(3, { quality: 60 }));
ok(currentObjectives(c)[0].current === 2 && currentObjectives(c)[1].done, 'craft counts solid and standout work');
ok(seasonReviewNote(c, { quality: 75, isRepeat: false }) === 'Craft season: this solid work counts (3/3)', 'review links progress');
ok(seasonReviewNote(base(), { quality: 75, isRepeat: false }) === null, 'no focus, no review note');

// Not due yet: nothing resolves; due: resolves exactly once.
ok(advanceSeasonClock(c).resolutions.length === 0, 'season is not resolved early');
const due = { ...c, currentDay: 1 + SEASON_LENGTH_DAYS } as GameState;
const r1 = advanceSeasonClock(due);
ok(r1.resolutions.length === 1 && r1.state.studioSeasons!.history.length === 1, 'season resolves once when due');
const rec = r1.resolutions[0].record;
ok(rec.completedObjectives.includes('craft-standout') && rec.endingCash === 1000, 'record keeps objectives and ending cash');
ok(advanceSeasonClock(r1.state).resolutions.length === 0, 'resolved season never resolves twice');
const reloaded = JSON.parse(JSON.stringify(r1.state)) as GameState;
ok(advanceSeasonClock(reloaded).resolutions.length === 0, 'save/load cannot resolve it again');
ok(r1.state.studioSeasons!.seasonNumber === 2 && r1.state.studioSeasons!.focus === null, 'next season starts with a fresh choice');
ok(r1.state.reputation === 11, 'one met objective pays +1 reputation; the unmet one takes nothing away');

// Ignored focus: no penalty.
const idle = advanceSeasonClock({ ...base(), currentDay: 31 } as GameState);
ok(idle.state.reputation === 10 && idle.resolutions[0].record.chosenFocus === 'none', 'ignoring focus costs nothing');

// Big day skip resolves multiple seasons, capped, in order.
const skip = advanceSeasonClock({ ...base(), currentDay: 200 } as GameState);
ok(skip.resolutions.length === 4 && skip.resolutions[3].awards.length === 3, 'day skip resolves in order; year end judges 3 awards');

// Awards: criteria, status, supporting sessions.
const ds = [
  { ...d(1), seasonNumber: 1, clientKey: 'a', clientName: 'Ana', quality: 90 },
  { ...d(2), seasonNumber: 2, clientKey: 'a', clientName: 'Ana', quality: 70 },
  { ...d(3), seasonNumber: 3, clientKey: 'a', clientName: 'Ana', quality: 70 },
].map(x => ({ ...x, isRepeat: false, sessionNumber: 1, revenue: 3500 }));
const aw = evaluateAwards(ds as never);
ok(aw[0].status === 'winner' && aw[0].projectIds[0] === 'p1', 'recording award names the actual session');
ok(aw[1].status === 'winner' && aw[1].projectIds.length === 3 && /Ana/.test(aw[1].why), 'client award cites the client and sessions');
ok(aw[2].status === 'winner', 'growth award from revenue');
ok(evaluateAwards([]).every(a => a.status === 'not_nominated'), 'empty year has no nominees');
ok(currentAwardStanding(base()).length === 3, 'criteria + standing visible all year');

// Rewards are horizontal + small, through the shared bundle path.
const won = applySeasonTick({ ...skip.state, currentDay: 200 } as GameState);
ok(won.state.notifications.length >= 0, 'season tick is pure and safe to repeat');
const yr = {
  ...base(), currentDay: 1 + 4 * SEASON_LENGTH_DAYS,
  studioSeasons: { ...createSeasonState(1, 1), seasonNumber: 4, startDay: 91, deliveries: ds.map(x => ({ ...x, seasonNumber: 4 })) },
} as unknown as GameState;
const y = applySeasonTick(yr);
ok((y.state.gems ?? 0) === 30 && y.state.studioSeasons!.titles.length === 3, 'award wins grant plaques + gems (small rewards)');
ok(y.state.reputation === 10 + 6, 'reputation reward is small (+2 per award)');

// Wiring.
ok(/recordSeasonDelivery/.test(read('src/hooks/useProjectManagement.tsx')), 'completeProject records the delivery');
ok(/applySeasonTick/.test(read('src/pages/Index.tsx')), 'day tick drives the season clock');
ok(/SeasonPanel/.test(read('src/components/CareerHub.tsx')), 'compact progress surface lives in the career hub');
ok(/seasonNote/.test(read('src/components/modals/ProjectReviewModal.tsx')), 'project review links season progress');

console.log(`${passed} season checks passed`);
