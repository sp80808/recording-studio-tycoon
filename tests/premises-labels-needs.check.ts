/** #366: one canonical studio name in the HUD, and a visible "Needs ..." reason for unavailable premises offers. */
import fs from 'node:fs';
import { getStudioSignage } from '../src/components/WebGLCanvas';
import { PREMISES_TIERS, getPremisesOffer } from '../src/rpg/premises';
import { opportunityBlockers } from '../src/rpg/premisesPressure';
import { createNewGameState } from '../src/utils/newGameState';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };

for (const t of [0, 1, 2, 3] as const) {
  const name = PREMISES_TIERS[t].name;
  ok(getStudioSignage('analog60s', 0, 'Nashville', name).endsWith(name.toUpperCase()), `HUD signage names the studio by premises tier ${t}`);
}
ok(!/BEDROOM\+/.test(getStudioSignage('analog60s', 2, undefined, PREMISES_TIERS[0].name)), 'HUD no longer shows the console-tier name when premises are known');

const s = { ...createNewGameState(), money: 50 };
const offer = getPremisesOffer(s)!;
const blockers = opportunityBlockers(offer, 2500, s.money);
ok(blockers.length >= 2 && blockers.some(b => /paid sessions/.test(b)), 'unmet conditions are listed as reasons');
ok(opportunityBlockers({ conditions: [{ label: '5 paid sessions (5/5)', met: true }] }, 2500, 100)[0].includes('deposit'), 'a deposit shortfall is its own reason');
ok(opportunityBlockers({ conditions: [{ label: 'x', met: true }] }, 100, 500).length === 0, 'no reason when everything is met');

const panel = fs.readFileSync('src/components/PremisesPanel.tsx', 'utf8');
ok(panel.includes('premises-needs') && panel.includes("tc('premises.needs'"), 'the panel prints the reason beside a disabled Take button');
for (const code of fs.readdirSync('public/locales').filter(c => fs.existsSync(`public/locales/${c}/content.json`))) {
  const d = JSON.parse(fs.readFileSync(`public/locales/${code}/content.json`, 'utf8')) as Record<string, string>;
  ok(typeof d['premises.needs'] === 'string' && d['premises.needs'].includes('{{what}}'), `${code}: premises.needs locale key`);
}
console.log(`${n} premises label checks passed`);
