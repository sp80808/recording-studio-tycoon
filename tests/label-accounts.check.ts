/** Label accounts (#50): deterministic package offers, negotiable terms, bounded delivery consequences. */
import {
  labelOffersFor, withChoices, resolveTerms, labelOutcome, applyLabelOutcome, NO_CHOICES, TIER_UNLOCK, INTEREST_FLOOR,
  LATE_FEE_CAP, ON_TIME_BONUS, RUSH_DAYS,
} from '../src/rpg/labelAccounts';
import { createNewGameState } from '../src/utils/newGameState';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };

const base: any = { ...createNewGameState(), saveSeed: 'lbl', currentDay: 21, currentEra: 'streaming2020s', labelInterest: undefined, claimedOffers: [] };
ok(labelOffersFor(base).length === 0, 'no interest, no label offers');
ok(labelOffersFor({ ...base, labelInterest: { indie_label_001: 24 } }).length === 0, 'just under the indie line sends nothing');
const indie = labelOffersFor({ ...base, labelInterest: { indie_label_001: TIER_UNLOCK.indie } });
ok(indie.length === 1 && indie[0].labelTerms?.tier === 'indie', 'the indie label sends one package at its line');
ok(labelOffersFor({ ...base, labelInterest: { electronic_label_001: 49 } }).length === 0, 'regional needs more interest');
const both = labelOffersFor({ ...base, labelInterest: { indie_label_001: 30, electronic_label_001: 50 } });
ok(both.length === 2 && both.map((p) => p.labelTerms!.tier).sort().join() === 'indie,regional', 'indie and regional accounts both work');
ok(labelOffersFor({ ...base, labelInterest: { hiphop_label_001: 99, major_label_001: 99 } }).length === 0, 'national and global are not in this slice');

const o = indie[0];
ok(o.stages.length === 3 && o.clientType === 'Record Label', 'a package is three sessions from a label');
ok(JSON.stringify(labelOffersFor({ ...base, labelInterest: { indie_label_001: 25 } })) === JSON.stringify(indie), 'the same save and week give the same offer');
ok(labelOffersFor({ ...base, currentDay: 28, labelInterest: { indie_label_001: 25 } })[0].id !== o.id, 'a new week brings a new offer');
ok(labelOffersFor({ ...base, labelInterest: { indie_label_001: 25 }, claimedOffers: [o.id] }).length === 0, 'a booked offer does not return');
ok(o.labelTerms!.baseRevisions === 1 && o.durationDaysTotal === o.labelTerms!.deadlineDays, 'booking length follows the deadline');

const t = o.labelTerms!;
const rush = withChoices(o, { ...NO_CHOICES, rush: true });
ok(rush.payoutBase > o.payoutBase && rush.durationDaysTotal === o.durationDaysTotal - RUSH_DAYS, 'rush pays more and shortens the deadline');
const rev = withChoices(o, { ...NO_CHOICES, extraRevision: true });
ok(rev.payoutBase < o.payoutBase && rev.labelTerms!.revisions === 2, 'an extra revision costs fee');
const free = withChoices(o, { ...NO_CHOICES, openFreedom: true });
ok(free.payoutBase < o.payoutBase && free.labelTerms!.qualityTarget < t.qualityTarget, 'open freedom costs fee and lowers the target');
ok(withChoices(withChoices(o, { rush: true, extraRevision: true, openFreedom: true }), NO_CHOICES).payoutBase === o.payoutBase, 'choices always resolve from the base terms');
ok(resolveTerms(t, { rush: true, extraRevision: false, openFreedom: false }).deadlineDays >= 3, 'deadline never collapses');

const good = labelOutcome(t, t.deadlineDays, t.qualityTarget + 5, 1000);
ok(good.money === Math.round(1000 * ON_TIME_BONUS) && good.interest > 0, 'on time and on target earns a bonus and interest');
const late = labelOutcome(t, t.deadlineDays + 2, 90, 1000);
ok(late.money === -200 && late.interest < 0, 'two days late costs 20% and some interest');
ok(labelOutcome(t, t.deadlineDays + 40, 90, 1000).money === -Math.round(1000 * LATE_FEE_CAP), 'lateness is capped');
const short = labelOutcome(t, 3, t.qualityTarget - 5, 1000);
ok(short.money === -100 && short.interest === 0, 'under target trims the fee but costs no interest');
const absorbed = labelOutcome({ ...t, revisions: 2 }, 3, t.qualityTarget - 5, 1000);
ok(absorbed.money === 0, 'an extra revision round absorbs a small quality miss');

const project = { ...o, bookedDay: 10 };
const st: any = { ...base, currentDay: 10 + t.deadlineDays + 3, money: 5000, labelInterest: { indie_label_001: 12 }, notifications: [] };
const after = applyLabelOutcome(st, project, 90, 1000);
ok(after.money < 5000 && after.labelInterest.indie_label_001 >= INTEREST_FLOOR, 'a late delivery trims money and never drops interest below the floor');
ok(after.notifications.length === 1 && /knocked/.test(after.notifications[0].message), 'the outcome is explained');
const onTimeState: any = { ...st, currentDay: 10 + 3, labelInterest: { indie_label_001: 30 } };
ok(applyLabelOutcome(onTimeState, project, 95, 1000).labelInterest.indie_label_001 === 35, 'a clean delivery raises interest');
ok(applyLabelOutcome(st, { ...o, labelTerms: undefined }, 90, 1000) === st, 'non-label projects are untouched');
const frozen = JSON.stringify(st);
applyLabelOutcome(st, project, 90, 1000);
ok(JSON.stringify(st) === frozen, 'applying an outcome never mutates state');
console.log(`label-accounts: ${n} checks passed`);
