import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DIRECTOR_GAP_DAYS,
  EFFECT_LIMITS,
  addMemory,
  applyDomainEffects,
  canAffordEffects,
  getDirector,
  getEventLog,
  hasMemory,
  takeDirectorOpportunity,
  validateEffects,
  type StudioEventDefinition,
} from '../src/narrative/eventDirector';
import {
  DIRECTOR_EVENTS,
  delegateDirector,
  getPendingDirectorEvent,
  resolveDirectorChoice,
  tickDirector,
} from '../src/narrative/directorEvents';
import { CALLBACK_SUBPLOTS } from '../src/narrative/callbackSubplots';
import { getPendingSubplotEvent, resolveSubplotChoice } from '../src/narrative/branchingStorylineEngine';
import { advanceStory } from '../src/narrative/storyProgression';

const client = (over: any = {}) => ({
  clientId: 'mara',
  clientName: 'Mara Vale',
  primaryGenre: 'Rock',
  relationshipXp: 100,
  tier: 'Friendly',
  sessionsCompleted: 3,
  lastSessionDay: 20,
  bestQualityScore: 80,
  referralCount: 0,
  ...over,
});

const makeState = (over: any = {}): any => ({
  currentDay: 30,
  currentEra: 'analog60s',
  selectedEra: 'analog60s',
  saveSeed: 777,
  money: 5000,
  reputation: 60,
  hiredStaff: [],
  ownedEquipment: [],
  studioRooms: [],
  playerData: { xp: 0, level: 3 },
  clientRelationships: { mara: client() },
  storylineState: {
    runSeed: 1,
    activeCampaignNodeId: 'x',
    campaignCompleted: false,
    branchHistory: [],
    activeSubplots: [],
    resolvedSubplotIds: [],
    storyFlags: {},
  },
  ...over,
});

const only = (id: string): StudioEventDefinition[] => DIRECTOR_EVENTS.filter((d) => d.id === id);
const at = (s: any, day: number) => ({ ...s, currentDay: day });

describe('event director: selection', () => {
  it('same state and seed give the same event', () => {
    const a = tickDirector(makeState());
    const b = tickDirector(JSON.parse(JSON.stringify(makeState())));
    assert.ok(getDirector(a).pending, 'something should be eligible');
    assert.deepEqual(getDirector(a).pending, getDirector(b).pending);
  });

  it('a different seed can give a different pick, but never an ineligible one', () => {
    const picks = new Set<string>();
    for (let seed = 1; seed < 40; seed++) {
      const s = tickDirector(makeState({ saveSeed: seed, hiredStaff: [{ id: 's1', name: 'Sam' }] }));
      const p = getDirector(s).pending;
      if (p) picks.add(p.eventId);
    }
    assert.ok(picks.size >= 2, `expected variety, got ${[...picks]}`);
    for (const id of picks) assert.ok(DIRECTOR_EVENTS.some((d) => d.id === id));
  });

  it('no eligible event means no event (silence beats filler)', () => {
    const s = tickDirector(makeState({ clientRelationships: {}, reputation: 0, day: 1, currentDay: 5 }));
    assert.equal(getDirector(s).pending, undefined);
    assert.equal(getDirector(s).history.length, 0);
    assert.equal(getDirector(s).opportunitySeq, 1, 'the opportunity is spent even when silent');
  });

  it('cooldown blocks an immediate repeat of the same event', () => {
    const defs = only('studio_press_inquiry');
    let s = takeDirectorOpportunity(makeState({ clientRelationships: {} }), defs);
    assert.equal(getDirector(s).pending?.eventId, 'studio_press_inquiry');
    s = resolveDirectorChoice(s, 'press_statement');
    const soon = takeDirectorOpportunity(at(s, 30 + DIRECTOR_GAP_DAYS), defs);
    assert.equal(getDirector(soon).pending, undefined, 'inside the 45-day cooldown');
    const later = takeDirectorOpportunity(at(s, 30 + 46), defs);
    assert.equal(getDirector(later).pending?.eventId, 'studio_press_inquiry');
  });

  it('respects maxOccurrences', () => {
    const defs = only('studio_press_inquiry');
    let s: any = makeState({ clientRelationships: {} });
    for (let i = 0; i < 2; i++) {
      s = takeDirectorOpportunity(at(s, 30 + i * 50), defs);
      s = resolveDirectorChoice(s, 'press_statement');
    }
    const third = takeDirectorOpportunity(at(s, 300), defs);
    assert.equal(getDirector(third).pending, undefined);
  });

  it('memory prerequisites gate events, and blocked memories suppress them', () => {
    const base = makeState();
    const noMemory = tickDirector(at(makeState(), 30));
    assert.notEqual(getDirector(noMemory).pending?.eventId, 'client_referral_ask');
    const defs = only('client_referral_ask');
    const rich = makeState({ clientRelationships: { mara: client({ tier: 'Loyal', sessionsCompleted: 5 }) } });
    assert.equal(getDirector(takeDirectorOpportunity(rich, defs)).pending, undefined, 'needs rush-success');
    const withMemory = addMemory(rich, { scope: 'client', entityId: 'mara', key: 'rush-success', sourceEventId: 't' });
    assert.equal(getDirector(takeDirectorOpportunity(withMemory, defs)).pending?.eventId, 'client_referral_ask');
    const blocked = addMemory(withMemory, { scope: 'client', entityId: 'mara', key: 'referral-made', sourceEventId: 't' });
    assert.equal(getDirector(takeDirectorOpportunity(blocked, defs)).pending, undefined);
    void base;
  });

  it('memories expire', () => {
    let s = addMemory(makeState(), { scope: 'studio', key: 'temp', ttlDays: 10, sourceEventId: 't' });
    assert.ok(hasMemory(s, 'studio', 'temp'));
    assert.ok(hasMemory(at(s, 39), 'studio', 'temp'));
    assert.ok(!hasMemory(at(s, 40), 'studio', 'temp'));
  });

  it('same-family anti-repeat: at most two of a family inside the window', () => {
    const fam = (id: string): StudioEventDefinition => ({
      ...only('studio_press_inquiry')[0],
      id,
      family: 'loud',
      cooldownDays: 0,
      maxOccurrences: undefined,
    });
    const defs = [fam('a'), fam('b'), fam('c')];
    let s: any = makeState({ clientRelationships: {} });
    const seen: string[] = [];
    for (let i = 0; i < 3; i++) {
      s = takeDirectorOpportunity(at(s, 30 + i * 4), defs);
      const p = getDirector(s).pending;
      if (p) {
        seen.push(p.eventId);
        s = resolveDirectorChoice(s, 'press_statement');
      }
    }
    assert.equal(seen.length, 2, `third same-family event must be suppressed, got ${seen}`);
  });

  it('never opens a second event while one is pending, and only one per day (offline catch-up)', () => {
    let s = tickDirector(makeState());
    const first = getDirector(s).pending;
    assert.ok(first);
    for (let i = 0; i < 5; i++) s = tickDirector(at(s, 40 + i * 10));
    assert.deepEqual(getDirector(s).pending, first, 'still the same single pending event');
    assert.equal(getDirector(s).history.length, 1);
  });

  it('waits for an active subplot and respects the gap after one', () => {
    const busy = makeState();
    busy.storylineState.activeSubplots = [{ subplotId: 'subplot_hometown_hero', currentStage: 1, startedDay: 29 }];
    assert.equal(getDirector(tickDirector(busy)).pending, undefined);
    const justEnded = makeState();
    justEnded.storylineState.lastSubplotEndDay = 29;
    assert.equal(getDirector(tickDirector(justEnded)).pending, undefined);
  });
});

describe('event director: resolving', () => {
  const opened = () => tickDirector(makeState());

  it('resolves exactly once and survives save/reload without paying twice', () => {
    const s0: any = takeDirectorOpportunity(makeState(), only('client_rush_request'));
    const reloaded = JSON.parse(JSON.stringify(s0));
    assert.deepEqual(getDirector(reloaded).pending, getDirector(s0).pending, 'reload shows the same pending event');
    const once = resolveDirectorChoice(reloaded, 'rush_accept');
    assert.equal(once.money, 5600);
    const twice = resolveDirectorChoice(JSON.parse(JSON.stringify(once)), 'rush_accept');
    assert.equal(twice.money, 5600, 'second resolve is a no-op');
    assert.equal(getDirector(twice).pending, undefined);
    assert.equal(getEventLog(twice).length, 1);
  });

  it('unknown options and unaffordable options change nothing', () => {
    const s = takeDirectorOpportunity(makeState({ money: 10, clientRelationships: {} }), only('studio_press_inquiry'));
    assert.strictEqual(resolveDirectorChoice(s, 'nope'), s);
    const poor = resolveDirectorChoice(s, 'press_talk');
    assert.strictEqual(poor, s, 'press_talk costs 100');
    const view = getPendingDirectorEvent(s)!;
    assert.equal(view.options.find((o) => o.id === 'press_talk')!.affordable, false);
  });

  it('writes the option memories for the subject and logs it in the chronicle', () => {
    const s = resolveDirectorChoice(takeDirectorOpportunity(makeState(), only('client_rush_request')), 'rush_accept');
    assert.ok(hasMemory(s, 'client', 'rush-accepted', 'mara'));
    assert.ok(!hasMemory(s, 'client', 'rush-accepted', 'someone-else'));
    const last = s.storylineState.chronicle.slice(-1)[0];
    assert.equal(last.kind, 'event');
    assert.match(last.title, /Mara Vale/);
  });

  it('effects are validated outside the narrative content: caps, whitelist, affordability', () => {
    const v = validateEffects([
      { kind: 'money', amount: 1_000_000 },
      { kind: 'reputation', amount: -999 },
      { kind: 'xp', amount: 0 },
      { kind: 'teleport', amount: 5 } as any,
    ]);
    assert.deepEqual(v, [
      { kind: 'money', amount: EFFECT_LIMITS.money },
      { kind: 'reputation', amount: -EFFECT_LIMITS.reputation },
    ]);
    const s = makeState({ money: 100 });
    assert.equal(canAffordEffects(s, [{ kind: 'money', amount: -101 }]), false);
    const hit = applyDomainEffects(s, [{ kind: 'money', amount: -5000 }]);
    assert.ok(hit.money >= 0, 'money never goes negative');
  });

  it('presentation data cannot mutate state: definitions are plain data', () => {
    for (const d of DIRECTOR_EVENTS) for (const o of d.options) {
      assert.ok(Array.isArray(o.effects));
      for (const e of o.effects) assert.ok(['money', 'reputation', 'xp', 'clientXp', 'referral'].includes(e.kind), `${d.id}/${o.id}`);
    }
  });

  it('old saves without a director ledger migrate to an empty one', () => {
    const old = makeState();
    assert.equal(old.storylineState.director, undefined);
    const d = getDirector(old);
    assert.deepEqual(d.memories, []);
    assert.deepEqual(d.history, []);
    assert.doesNotThrow(() => advanceStory(old));
  });

  it('Focus Mode can delegate a delegable event to its authored default', () => {
    const s = takeDirectorOpportunity(makeState(), only('client_rush_request'));
    const done = delegateDirector(s);
    assert.equal(getDirector(done).pending, undefined);
    assert.ok(hasMemory(done, 'client', 'rush-declined', 'mara'));
    const nonDelegable = takeDirectorOpportunity(makeState({ clientRelationships: { mara: client({ tier: 'Loyal', sessionsCompleted: 5 }) } }),
      only('client_referral_ask'));
    assert.equal(getDirector(nonDelegable).pending, undefined, 'needs a memory first');
    void opened;
  });
});

describe('event director: the three-beat recurring-client chain', () => {
  const run = (state: any, defId: string, option: string) => resolveDirectorChoice(takeDirectorOpportunity(state, only(defId)), option);

  it('accept -> success -> referral ask, with no trap along the way', () => {
    let s: any = run(makeState(), 'client_rush_request', 'rush_accept');
    // Too soon / wrong quality: the consequence beat waits.
    const lowQ = makeState({ ...s, clientRelationships: { mara: client({ bestQualityScore: 50 }) } });
    assert.equal(getDirector(takeDirectorOpportunity(at(lowQ, 60), only('client_rush_payoff'))).pending, undefined);
    s = run(at(s, 60), 'client_rush_payoff', 'payoff_thanks');
    assert.ok(hasMemory(s, 'client', 'rush-success', 'mara'));
    assert.ok(s.clientRelationships.mara.relationshipXp > 100);
    s = { ...s, clientRelationships: { mara: client({ tier: 'Loyal', sessionsCompleted: 5, relationshipXp: s.clientRelationships.mara.relationshipXp }) } };
    s = run(at(s, 100), 'client_referral_ask', 'referral_take');
    assert.equal(s.clientRelationships.mara.referralCount, 1);
    assert.ok(hasMemory(s, 'client', 'referral-made', 'mara'));
  });

  it('accept -> poor result makes the client cautious, and the caution fades', () => {
    let s: any = run(makeState(), 'client_rush_request', 'rush_accept');
    s = { ...s, clientRelationships: { mara: client({ bestQualityScore: 55 }) } };
    s = run(at(s, 60), 'client_rush_fallout', 'fallout_rework');
    assert.ok(hasMemory(at(s, 60), 'client', 'rush-poor', 'mara'));
    assert.ok(!hasMemory(at(s, 101), 'client', 'rush-poor', 'mara'), 'forty days later it is forgotten');
  });

  it('decline stays neutral when the relationship is healthy', () => {
    let s: any = run(makeState(), 'client_rush_request', 'rush_decline');
    assert.equal(s.money, 5000);
    s = run(at(s, 60), 'client_rush_respected', 'respected_note');
    assert.ok(hasMemory(s, 'client', 'rush-respected', 'mara'));
    // A declined rush never leads to the referral ask on its own.
    const rich = { ...s, clientRelationships: { mara: client({ tier: 'Loyal', sessionsCompleted: 6 }) } };
    assert.equal(getDirector(takeDirectorOpportunity(at(rich, 120), only('client_referral_ask'))).pending, undefined);
  });

  it('the rush request is offered once per client and needs an established client', () => {
    const fresh = makeState({ clientRelationships: { mara: client({ sessionsCompleted: 1 }) } });
    assert.equal(getDirector(takeDirectorOpportunity(fresh, only('client_rush_request'))).pending, undefined);
    const s = run(makeState(), 'client_rush_request', 'rush_decline');
    assert.equal(getDirector(takeDirectorOpportunity(at(s, 200), only('client_rush_request'))).pending, undefined);
  });

  it('has at least eight authored events and unique ids', () => {
    assert.ok(DIRECTOR_EVENTS.length >= 8);
    assert.equal(new Set(DIRECTOR_EVENTS.map((d) => d.id)).size, DIRECTOR_EVENTS.length);
  });
});

describe('subplots on top of the director', () => {
  it('subplot choices become studio memories the director can read', () => {
    const s0: any = makeState();
    s0.storylineState.activeSubplots = [{ subplotId: 'subplot_hometown_hero', currentStage: 1, startedDay: 30 }];
    const s1 = resolveSubplotChoice(s0, 'hero_secret_session');
    assert.ok(hasMemory(s1, 'studio', 'gave_hero_secret_session'));
  });

  it('long callbacks have a third beat that resolves the subplot only after stage 3', () => {
    const threeBeat = CALLBACK_SUBPLOTS.filter((c) => c.stages.length === 3);
    assert.ok(threeBeat.length >= 4);
    const sub = threeBeat.find((c) => c.id === 'subplot_union_reckoning')!;
    let s: any = makeState({ money: 9000 });
    s.storylineState.storyFlags = { signed_union_scale: true };
    s.storylineState.activeSubplots = [{ subplotId: sub.id, currentStage: 1, startedDay: 30 }];
    s = resolveSubplotChoice(s, sub.stages[0].options[0].id);
    assert.equal(s.storylineState.activeSubplots[0].currentStage, 2);
    s = at(s, 40);
    s = resolveSubplotChoice(s, sub.stages[1].options[0].id);
    assert.equal(s.storylineState.activeSubplots[0].currentStage, 3);
    assert.ok(!s.storylineState.resolvedSubplotIds.includes(sub.id));
    s = at(s, 50);
    const pending = getPendingSubplotEvent(s)!;
    assert.equal(pending.stage.stageNumber, 3);
    s = resolveSubplotChoice(s, sub.stages[2].options[0].id);
    assert.equal(s.storylineState.activeSubplots.length, 0);
    assert.ok(s.storylineState.resolvedSubplotIds.includes(sub.id));
  });

  it('advanceStory is deterministic with the director in the loop', () => {
    const a = advanceStory(makeState());
    const b = advanceStory(JSON.parse(JSON.stringify(makeState())));
    assert.deepEqual(a.storylineState, b.storylineState);
  });
});
