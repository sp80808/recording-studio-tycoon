import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ProgressionSystem } from '../src/services/ProgressionSystem';
import { PREMISES_TIERS } from '../src/rpg/premises';
import { buildStoryContractBrief, buildRivalIntro } from '../src/narrative/storyContractBrief';
import { RIVAL_STUDIOS } from '../src/narrative/studioLore';
import { STAKE_LABEL, STAKE_ORDER, STAKE_MIN_LEVEL, describeStake, describeStakeUnlock } from '../src/rpg/contractStakes';

const rival = RIVAL_STUDIOS.find(r => r.id === 'distortion-cellar') ?? RIVAL_STUDIOS[0];
for (const stake of STAKE_ORDER) {
  const b = buildStoryContractBrief(rival, stake, 1);
  assert.ok(b.watching.includes(rival.name), 'names the rival studio');
  assert.ok(b.voice.includes(rival.headProducer) && b.voice.includes(rival.epithet) && b.voice.includes(rival.catchphrase), 'rival brief carries producer, epithet, catchphrase');
  assert.equal(b.stakeKicker, `Stake: ${STAKE_LABEL[stake]}`);
  assert.equal(b.stakeTerms, describeStake(stake));
  assert.ok(b.stakeMeaning.length > 10 && !/\{\{/.test(b.stakeMeaning + b.voice + b.watching), 'no unresolved placeholders');
  const locked = STAKE_MIN_LEVEL[stake] > 1;
  assert.equal(Boolean(b.unlockNote), locked, 'unlock note only when level is below the stake unlock');
  if (b.unlockNote) assert.ok(b.unlockNote.includes(describeStakeUnlock(stake)), 'unlock note uses describeStakeUnlock');
  assert.equal(buildStoryContractBrief(rival, stake, STAKE_MIN_LEVEL[stake]).unlockNote, undefined);
}

const keys = ['story.brief.watching', 'story.brief.voice', 'story.brief.stake', 'story.stake.safe', 'story.stake.ambitious', 'story.stake.moonshot', 'story.stake.unlockNote', 'story.brief.node', 'story.rivalIntro.headline', 'story.rivalIntro.catchphrase', 'tier.upgrade.kicker', 'tier.upgrade.footerPremises'];
for (const code of fs.readdirSync('public/locales')) {
  const f = `public/locales/${code}/content.json`;
  if (!fs.existsSync(f)) continue;
  const d = JSON.parse(fs.readFileSync(f, 'utf8')) as Record<string, string>;
  for (const k of keys) assert.ok(d[k], `${code} content.json has ${k}`);
}

const src = fs.readFileSync('src/components/ProjectList.tsx', 'utf8');
const block = src.slice(src.indexOf('const StoryBrief'), src.indexOf('const StakePicker'));
assert.ok(block.includes('data-testid="story-brief"') && !/truncate|line-clamp|text-ellipsis/.test(block), 'story brief is never truncated');

// #334 addendum: CareerStartScreen shows epithet + catchphrase; board adds the optional node-title line.
for (const r of RIVAL_STUDIOS) {
  const i = buildRivalIntro(r, 'Act I: Test');
  assert.ok(i.headline.includes(r.headProducer) && i.headline.includes(r.epithet) && i.headline.includes(r.name), 'rival intro headline');
  assert.ok(i.catchphrase.includes(r.catchphrase) && i.nodeLine?.includes('Act I: Test'), 'rival intro catchphrase + node line');
  assert.equal(buildRivalIntro(r).nodeLine, undefined);
}
assert.ok(buildStoryContractBrief(rival, 'safe', 1, 'Act I: X').nodeLine?.includes('Act I: X'));
assert.equal(buildStoryContractBrief(rival, 'safe', 1).nodeLine, undefined);
const start = fs.readFileSync('src/components/CareerStartScreen.tsx', 'utf8');
assert.ok(start.includes('buildRivalIntro') && start.includes('rival-intro-catchphrase') && !/truncate/.test(start.slice(start.indexOf('data-testid="rival-intro"'), start.indexOf('data-testid="rival-intro"') + 700)), 'start screen renders full rival intro');

// #366: the tier-upgrade animation names the studio by premises and the desk by gear; no studio names on gear.
const studioNames = new Set(Object.values(PREMISES_TIERS).map((t) => t.name.toLowerCase()));
for (let t = 1; t <= 5; t++) {
  const n = ProgressionSystem.getStudioTierDetails(t).name;
  assert.ok(!studioNames.has(n.toLowerCase()) && !/hit factory|home studio|bedroom|studio a|project studio/i.test(n), `console tier ${t} name "${n}" is a gear name`);
}
const anim = fs.readFileSync('src/components/TierUpgradeAnimation.tsx', 'utf8');
assert.ok(anim.includes('premisesName') && !anim.includes('getStudioTierName'), 'animation uses premises name, not the console-tier studio name');
assert.ok(fs.readFileSync('src/components/StudioRoom.tsx', 'utf8').includes('premisesName={getPremisesDef(gameState).name}'), 'StudioRoom passes the premises name');
console.log('story contract brief check passed');
