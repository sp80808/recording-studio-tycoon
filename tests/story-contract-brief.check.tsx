import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildStoryContractBrief } from '../src/narrative/storyContractBrief';
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

const keys = ['story.brief.watching', 'story.brief.voice', 'story.brief.stake', 'story.stake.safe', 'story.stake.ambitious', 'story.stake.moonshot', 'story.stake.unlockNote'];
for (const code of fs.readdirSync('public/locales')) {
  const f = `public/locales/${code}/content.json`;
  if (!fs.existsSync(f)) continue;
  const d = JSON.parse(fs.readFileSync(f, 'utf8')) as Record<string, string>;
  for (const k of keys) assert.ok(d[k], `${code} content.json has ${k}`);
}

const src = fs.readFileSync('src/components/ProjectList.tsx', 'utf8');
const block = src.slice(src.indexOf('const StoryBrief'), src.indexOf('const StakePicker'));
assert.ok(block.includes('data-testid="story-brief"') && !/truncate|line-clamp|text-ellipsis/.test(block), 'story brief is never truncated');
console.log('story contract brief check passed');
