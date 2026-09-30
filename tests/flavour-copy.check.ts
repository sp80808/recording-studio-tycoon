import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_STATES, IDLE_CHATTER, INDUSTRY_TIPS, LOADING_LINES, pickFlavour } from '../src/data/flavour';

const banned = /\b(Spotify|Apple|Napster|TikTok|MTV|YouTube|Beatles|Phil Collins|Spector|Auto-Tune|Live Aid|Idol|Linn|Kate Bush|Fleetwood|Grammy|Grammys|Billboard|Pro Tools|Abbey Road|Neumann|Shure|Fender|Gibson|Van Halen|M&M|Rolling Stone|Motown|Sun Records)\b/i;
const all = [
  ...INDUSTRY_TIPS, ...LOADING_LINES, ...IDLE_CHATTER,
  ...Object.values(EMPTY_STATES).flatMap((e) => [e.title, e.hint]),
];

describe('flavour copy', () => {
  it('avoids real brand and personal names', () => {
    for (const line of all) assert.ok(!banned.test(line), `real name in: ${line}`);
  });
  it('has unique lines of sane length and a healthy pool', () => {
    assert.equal(new Set(all).size, all.length);
    assert.ok(INDUSTRY_TIPS.length >= 15 && IDLE_CHATTER.length >= 8);
    for (const line of all) assert.ok(line.length > 8 && line.length <= 170, line);
  });
  it('picks deterministically per seed', () => {
    assert.equal(pickFlavour(INDUSTRY_TIPS, 'a'), pickFlavour(INDUSTRY_TIPS, 'a'));
  });
});
