/** Recruitment channels (#68): seeded searches, channel differences, unlocks, apprentices. */
import {
  RECRUITMENT_CHANNELS, startRecruitmentSearchInState, resolveRecruitmentSearchInState, searchBlocker, isChannelOpen, getRecruitmentSearch,
} from '../src/rpg/recruitment';
import { mentorshipScale, creditSession, experienceIn, APPRENTICE_XP_SCALE } from '../src/rpg/staffCareer';
import { createNewGameState } from '../src/utils/newGameState';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };

const base: any = { ...createNewGameState(), money: 2000, currentDay: 10, premisesTier: 1, saveSeed: 99 };
const free: any = { ...base, premisesTier: 0 };

ok(isChannelOpen(free, 'referral') && !isChannelOpen(free, 'college') && !isChannelOpen(free, 'board') && isChannelOpen(base, 'board'), 'referral is always open, college and board need a project studio');
ok(searchBlocker(free, 'college') !== null && startRecruitmentSearchInState(free, 'college') === free, 'a locked channel cannot be searched');
ok(searchBlocker({ ...base, money: 10 }, 'board') !== null, 'a search needs the cash');

const started = startRecruitmentSearchInState(base, 'college');
const search = getRecruitmentSearch(started)!;
ok(started.money === base.money - RECRUITMENT_CHANNELS.college.cost && search.resolvesDay === 13 && search.candidateCount === 3, 'search charges the exact cost and resolves after its days');
ok(startRecruitmentSearchInState(started, 'referral') === started, 'only one search runs at a time');
ok(resolveRecruitmentSearchInState(started, 12) === started, 'a search does not resolve early');

// Save/reload cannot reroll: resolving a reloaded copy gives the same shortlist.
const reloaded = JSON.parse(JSON.stringify(started));
const a = resolveRecruitmentSearchInState(started, 13);
const b = resolveRecruitmentSearchInState(reloaded, 13);
ok(JSON.stringify(a.availableCandidates) === JSON.stringify(b.availableCandidates) && a.recruitmentSearch === null, 'same search resolves to the same people after reload, then clears');
ok(resolveRecruitmentSearchInState(a, 14) === a, 'a resolved search never rerolls');

// Channels differ observably.
const pool = (id: any) => resolveRecruitmentSearchInState(startRecruitmentSearchInState(base, id), 20).availableCandidates;
const college = pool('college'), referral = pool('referral'), board = pool('board');
ok(referral.length === 2 && college.length === 3 && board.length === 5, 'each channel has its own pool size');
ok(college.every((c: any) => c.apprentice && c.levelInRole === 1 && c.genreAffinity === null && c.source.channelId === 'college'), 'college candidates are apprentices at level 1 with a stated source');
const avg = (xs: any[]) => xs.reduce((t, c) => t + c.salary, 0) / xs.length;
ok(college.every((c: any) => c.salary <= 110) && avg(college) < avg(board), "apprentices are cheaper than board hires");
ok(board.every((c: any) => !c.apprentice && c.source.channelId === 'board') && referral.every((c: any) => c.source.why.length > 0), 'every candidate says why they appeared');
const crew: any = { ...base, hiredStaff: [{ id: 's', role: 'Producer', skills: {}, levelInRole: 1 }] };
ok(resolveRecruitmentSearchInState(startRecruitmentSearchInState(crew, 'referral'), 20).availableCandidates.every((c: any) => c.role === 'Producer'), 'referrals lean toward the current crew\'s role');

// Apprentices grow faster at low levels, and stop getting the bonus once the discipline is level 3.
const app: any = { ...college[0], id: 'a1' };
ok(mentorshipScale(app, [app]) === APPRENTICE_XP_SCALE, 'an apprentice learns faster at low level');
let grown = app;
for (let i = 0; i < 30; i++) grown = creditSession(grown, `p${i}`, ['Basic Tracking', 'Final Mix', 'Vocal Tracking', 'Gear Setup'], 90);
ok(experienceIn(grown.career, grown.career.activeDiscipline).level >= 3 && mentorshipScale(grown, [grown]) === 1, 'the apprentice bonus fades at level 3');
ok(mentorshipScale({ ...app, apprentice: false }, [app]) === 1, 'ordinary hires get no bonus');
// Specialist network and headhunter: unlocked by premises, narrower and costlier.
const t2: any = { ...base, premisesTier: 2, money: 9000 };
const t3: any = { ...base, premisesTier: 3, money: 9000 };
ok(!isChannelOpen(base, 'specialist') && isChannelOpen(t2, 'specialist') && !isChannelOpen(t2, 'headhunter') && isChannelOpen(t3, 'headhunter'), 'specialist opens with the commercial studio, headhunter with the facility');
const pool2 = (st: any, id: any) => resolveRecruitmentSearchInState(startRecruitmentSearchInState(st, id), 30).availableCandidates;
const spec = pool2(t2, 'specialist'), hh = pool2(t3, 'headhunter'), brd = pool2(t3, 'board');
ok(spec.length === 3 && spec.every((c: any) => c.role === 'Engineer' && c.career.activeDiscipline === 'technical' && c.career.seniority === 'regular' && c.source.channelId === 'specialist'), 'specialists are mid-career technical engineers');
ok(hh.length === 2 && hh.every((c: any) => c.career.seniority === 'senior' && c.levelInRole >= 4), 'headhunted candidates are seniors');
const avgSal = (xs: any[]) => xs.reduce((t, c) => t + c.salary, 0) / xs.length;
ok(avgSal(hh) > avgSal(brd) * 1.5, 'headhunters cost meaningfully more than the board');
ok(t3.money - startRecruitmentSearchInState(t3, 'headhunter').money === RECRUITMENT_CHANNELS.headhunter.cost, 'the headhunter fee is charged up front');
ok(JSON.stringify(pool2(t3, 'headhunter')) === JSON.stringify(hh), 'headhunter shortlists are deterministic');
// Work-style trait: every candidate has one, deterministic, survives reload, and channels bias it.
import { WORK_STYLES, pickWorkStyle } from '../src/rpg/workStyle';
ok([...college, ...referral, ...board, ...spec, ...hh].every((c: any) => c.workStyle in WORK_STYLES), 'every candidate carries a known work style');
ok(JSON.stringify(a.availableCandidates.map((c: any) => c.workStyle)) === JSON.stringify(b.availableCandidates.map((c: any) => c.workStyle)), 'work styles survive reload unchanged');
const tally = (ch: string) => { const t: Record<string, number> = {}; for (let i = 0; i < 600; i++) { const k = pickWorkStyle(ch, `s${i}`); t[k] = (t[k] ?? 0) + 1; } return t; };
ok(tally('college')['quick-study'] > tally('board')['quick-study'] && tally('specialist').methodical > tally('board').methodical, 'channels bias which work styles appear');
console.log(`recruitment-channels: all ${n} checks passed`);
