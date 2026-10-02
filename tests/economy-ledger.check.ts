import assert from 'node:assert';
import { createDefaultGameState } from '../src/utils/newGameState';
import { applyReportToState } from '../src/game-mechanics/ProjectService';
import { grantRewardBundle, buyFlightCase } from '../src/economy/flightCaseEconomy';
import {
  addAllocations, bookEntry, earn, getCashFlowForDays, getCategorySpend, getCostBreakdown,
  getGemFlow, getProfit, getProjectPnl, getRunway, getTotalExpenses, getTotalIncome, spend,
} from '../src/economy/ledger';
import { applyAmbientTick } from '../src/economy/ambientIncome';
import type { ProjectReport } from '../src/types/game';

console.log('Testing studio ledger...');
const base = { ...createDefaultGameState(), money: 1000, currentDay: 10, ledger: undefined };

// legacy save: no ledger, money preserved, starts on first booking
assert.strictEqual(getTotalIncome(base), 0);
const first = spend(base, 100, { category: 'training', memo: 'x' });
assert.strictEqual(first.money, 900);
assert.strictEqual(first.ledger!.startDay, 10);
assert.strictEqual(base.ledger, undefined, 'input never mutated');

// entries sum: ledger net equals cash moved
let s = earn(first, 500, { category: 'session-income', projectId: 'p1', sourceId: 'a' });
s = spend(s, 60, { category: 'staff-payroll', sourceId: 'pay-10' });
assert.strictEqual(s.money, 1000 - 100 + 500 - 60);
assert.strictEqual(getProfit(s), s.money - base.money);
assert.strictEqual(getTotalIncome(s), 500);
assert.strictEqual(getTotalExpenses(s), 160);

// no double booking of the same transaction
const again = spend(s, 60, { category: 'staff-payroll', sourceId: 'pay-10' });
assert.strictEqual(again, s);
assert.strictEqual(again.money, s.money);
assert.strictEqual(bookEntry(s, { category: 'other', amount: 0 }), s);

// deterministic
const run = () => spend(earn(base, 5, { category: 'other' }), 3, { category: 'other' }).ledger;
assert.deepStrictEqual(run(), run());

// cash flow window + category spend
const later = { ...s, currentDay: 20 };
assert.strictEqual(getCashFlowForDays(later, 7).inflow, 0);
assert.strictEqual(getCashFlowForDays(later, 11).inflow, 500);
assert.strictEqual(getCategorySpend(s, 'staff-payroll'), 60);
assert.strictEqual(getCostBreakdown(s)[0].category, 'training');

// settlement path books revenue + allocations; P&L includes scoped costs
const report = {
  projectId: 'p2', projectTitle: 'Demo', overallQualityScore: 50, moneyGained: 850, reputationGained: 1,
  playerManagementXpGained: 0, skillBreakdown: [], reviewSnippet: 'ok',
  assignedPerson: { type: 'player', id: 'player', name: 'You' },
} as ProjectReport;
const settled = applyReportToState({ ...base, ledger: undefined }, report);
assert.strictEqual(settled.money, 1850);
assert.strictEqual(settled.financials.income, 850);
assert.strictEqual(getTotalIncome(settled), 850);
let pnl = getProjectPnl(settled, 'p2');
assert.strictEqual(pnl.revenue, 850);
const withFee = spend(settled, 120, { category: 'freelancer-fee', projectId: 'p2' });
pnl = getProjectPnl(addAllocations(withFee, [
  { projectId: 'p2', day: 10, kind: 'staff', amount: 180 }]), 'p2');
assert.strictEqual(pnl.directCosts, 120);
assert.strictEqual(pnl.contribution, 850 - 120 - pnl.staffAllocation - pnl.overheadAllocation);

// reward payouts + gems (gems never touch cash totals)
const rewarded = grantRewardBundle(base, { money: 40, gems: 6, memo: 'Chart' }).state;
assert.strictEqual(rewarded.money, 1040);
assert.strictEqual(getTotalIncome(rewarded), 40);
assert.deepStrictEqual(getGemFlow(rewarded), { gained: 6, spent: 0 });
const shop = buyFlightCase({ ...base, currentDay: 200, gems: 50 }, 'road_case', 'gems');
assert(shop.ok && getGemFlow(shop.state).spent === 30 && getTotalExpenses(shop.state) === 0);

// ambient income books under its own category, never as project revenue
const amb = applyAmbientTick({ ...base, saveSeed: 'amb' }).state;
assert(amb.money > base.money);
assert.strictEqual(getCategorySpend(amb, 'ambient-income'), amb.money - base.money);
assert.strictEqual(getTotalIncome(amb), amb.money - base.money);
assert.strictEqual(getProjectPnl(amb, 'anything').revenue, 0);

// runway: zero burn, bands, negative cash explainable
assert.strictEqual(getRunway({ ...base, money: 500 }, 0).days, Infinity);
assert.strictEqual(getRunway({ ...base, money: 500 }, 0).band, 'comfortable');
assert.strictEqual(getRunway({ ...base, money: 2000 }, 100).band, 'tight');
assert.strictEqual(getRunway({ ...base, money: 6000 }, 100).band, 'comfortable');
assert.strictEqual(getRunway({ ...base, money: 4000 }, 100).band, 'watch');
assert.strictEqual(getRunway({ ...base, money: 300 }, 100).band, 'critical');
const broke = getRunway({ ...base, money: -250 }, 100);
assert.strictEqual(broke.days, 0);
assert.strictEqual(broke.band, 'critical');
assert(broke.explanation.includes('-250'));

console.log('Studio ledger checks passed.');
