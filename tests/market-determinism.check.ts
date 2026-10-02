import { marketService, resetMarketTrends } from '@/services/marketService';
let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };
const state = (day: number, seed = 7): any => ({ saveSeed: seed, currentDay: day });
const run = (seed: number, days: number) => { resetMarketTrends(seed); let t = marketService.getAllTrends(); for (let d = 1; d <= days; d++) t = marketService.updateAllMarketTrends(state(d, seed)); return JSON.stringify(t); };

ok(run(7, 20) === run(7, 20), 'same seed and days give identical trends');
ok(run(7, 20) !== run(8, 20), 'different seeds differ');
resetMarketTrends(3);
ok(JSON.stringify(marketService.getAllTrends()) === (resetMarketTrends(3), JSON.stringify(marketService.getAllTrends())), 'reset is repeatable');
let t = marketService.getAllTrends();
for (let d = 1; d <= 200; d++) t = marketService.updateAllMarketTrends(state(d));
ok(t.every((x) => x.popularity >= 5 && x.popularity <= 100 && Math.abs(x.growthRate) <= 10), 'trend effects stay bounded over 200 days');
ok(t.every((x) => x.lastUpdated === 200 && !x.id.includes('NaN')), 'trends are stamped with the game day, not the wall clock');
console.log(`market-determinism: ${n} checks passed`);
