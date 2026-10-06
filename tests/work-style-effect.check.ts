/** Work-style stage-fit effect and label/client referral on candidates (#68 tails). */
import {
  WORK_STYLE_FIT, WORK_STYLE_FIT_CAP, WORK_STYLES, workStyleStageFit, workStyleEffectText, type WorkStyle,
} from '../src/rpg/workStyle';
import { calculateStaffProjectFit } from '../src/utils/staffFitUtils';
import {
  startRecruitmentSearchInState, resolveRecruitmentSearchInState, REFERRED_CLIENT_FAMILIARITY, LABEL_REFERRAL_MIN_INTEREST,
} from '../src/rpg/recruitment';
import { LABEL_ACCOUNTS } from '../src/rpg/labelInterest';
import { createNewGameState } from '../src/utils/newGameState';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };

// Table is bounded and every style has an explanation.
const styles = Object.keys(WORK_STYLES) as WorkStyle[];
ok(styles.every((s) => Object.values(WORK_STYLE_FIT[s]).every((v) => Math.abs(v!) <= WORK_STYLE_FIT_CAP)), 'every style effect is within the cap');
ok(styles.every((s) => workStyleEffectText(s).length > 0 && Object.values(WORK_STYLE_FIT[s]).some((v) => v! > 0) && Object.values(WORK_STYLE_FIT[s]).some((v) => v! < 0)), 'every style has a plus and a minus, and a UI explanation');
ok(workStyleStageFit(undefined, 'mixing').points === 0 && workStyleStageFit('methodical', 'general').points === 0, 'no style (legacy saves) or an unlisted stage is neutral');
ok(workStyleStageFit('methodical', 'mixing').points === 3 && /Methodical \+3 on mixing/.test(workStyleStageFit('methodical', 'mixing').reason ?? ''), 'a style gives an explained point change on its stage');

// Fit: same person, different style, differs by exactly the style points on the right stage.
const skill = { level: 2, xp: 0 };
const person: any = {
  id: 's1', name: 'S', role: 'Engineer', primaryStats: { creativity: 30, technical: 30, speed: 30 }, energy: 100, mood: 100,
  genreAffinity: null, clientFamiliarity: {}, levelInRole: 1,
  skills: { songwriting: skill, rhythm: skill, tracking: skill, mixing: skill, mastering: skill, tapeSplicing: skill, vocalComping: skill, soundDesign: skill, sampleWarping: skill },
};
const project = (stageName: string): any => ({ id: 'p', genre: 'Rock', clientId: 'c', currentStageIndex: 0, stages: [{ stageName }] });
const fit = (style: WorkStyle | undefined, stage: string) => calculateStaffProjectFit({ ...person, workStyle: style }, project(stage));
const none = fit(undefined, 'Final Mix'), meth = fit('methodical', 'Final Mix'), night = fit('night-owl', 'Final Mix');
ok(meth.score - none.score === 3 && night.score - none.score === 1, 'work style moves the fit score by its stated points on a mixing stage');
ok(meth.reasons.some((r) => r.includes('Methodical +3 on mixing')), 'the fit explains the work style effect');
ok(fit('showman', 'Final Mix').score < none.score, 'a mismatched style is a small penalty');
ok(none.score > 20 && Math.abs(meth.score - none.score) <= WORK_STYLE_FIT_CAP, 'the effect is small relative to the score');

// Referral: label/client connections.
const base: any = { ...createNewGameState(), money: 99999, currentDay: 10, premisesTier: 3, saveSeed: 7 };
const pool = (state: any, ch: any, day = 30) => resolveRecruitmentSearchInState(startRecruitmentSearchInState(state, ch), day).availableCandidates;
ok(pool(base, 'referral').every((c: any) => !c.referredBy), 'with no known clients or labels nobody is referred');

const known: any = {
  ...base,
  clientRelationships: { client_a: { clientId: 'client_a', clientName: 'Mara Vale', sessionsCompleted: 3, releases: [] }, client_b: { clientId: 'client_b', clientName: 'Fresh', sessionsCompleted: 0 } },
  labelInterest: { [LABEL_ACCOUNTS[0].id]: LABEL_REFERRAL_MIN_INTEREST, [LABEL_ACCOUNTS[1].id]: 5 },
};
let referred = 0, total = 0, clientRef = 0, labelRef = 0, factsOk = true;
for (let day = 10; day < 70; day++) {
  const st = { ...known, currentDay: day };
  for (const c of pool(st, 'referral', day + 5) as any[]) {
    total++;
    if (!c.referredBy) continue;
    referred++;
    if (c.referredBy.kind === 'client') {
      clientRef++;
      if (c.referredBy.id !== 'client_a' || c.clientFamiliarity.client_a !== REFERRED_CLIENT_FAMILIARITY || !c.source.why.includes('Mara Vale')) factsOk = false;
    } else {
      labelRef++;
      if (c.referredBy.id !== LABEL_ACCOUNTS[0].id || !c.source.why.includes(LABEL_ACCOUNTS[0].name)) factsOk = false;
    }
  }
}
ok(referred > 0 && referred < total && clientRef > 0 && labelRef > 0, 'referral candidates sometimes arrive referred by a known client or interested label');
ok(factsOk, 'only clients with a session and labels above the interest line refer, and the card says who');
ok(pool(known, 'college').every((c: any) => !c.referredBy), 'college placements are never referred');
ok(JSON.stringify(pool(known, 'referral')) === JSON.stringify(pool(JSON.parse(JSON.stringify(known)), 'referral')), 'referrals are deterministic across save and reload');

// A referred client gives a real, small, bounded fit gain on that client's project.
const refd = (() => { for (let d = 10; d < 200; d++) { const c = (pool({ ...known, currentDay: d }, 'referral', d + 5) as any[]).find((x) => x.referredBy?.kind === 'client'); if (c) return c; } })();
ok(!!refd, 'found a client-referred candidate');
const cp: any = { ...project('Final Mix'), clientId: 'client_a' };
const plain = { ...refd, clientFamiliarity: {}, workStyle: undefined }, withRef = { ...refd, workStyle: undefined };
const gain = calculateStaffProjectFit(withRef, cp).score - calculateStaffProjectFit(plain, cp).score;
ok(gain >= 0 && gain <= 3, "knowing the artist raises fit slightly on that artist's session");

console.log(`${n} work-style and referral checks passed`);
