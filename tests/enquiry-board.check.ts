/** Bookings board filter/sort — story pinning, fit filters, sort modes. */
import assert from 'node:assert/strict';
import { filterAndSortBoard, matchesEnquiryFit, matchesEnquiryQuery } from '../src/utils/enquiryBoard';
import type { Project } from '../src/types/game';

console.log('Testing enquiry board...');

const offer = (over: Partial<Project> & Pick<Project, 'id' | 'title'>): Project =>
  ({
    genre: 'Rock',
    clientName: 'Client',
    clientType: 'Band',
    matchRating: 'Good',
    payoutBase: 100,
    repGainBase: 2,
    durationDaysTotal: 3,
    ...over,
  }) as Project;

const a = offer({ id: 'a', title: 'Alpha Session', genre: 'Jazz', matchRating: 'Excellent', payoutBase: 300, repGainBase: 5, durationDaysTotal: 5 });
const b = offer({ id: 'b', title: 'Beta Groove', genre: 'Rock', matchRating: 'Good', payoutBase: 500, repGainBase: 2, durationDaysTotal: 2 });
const c = offer({ id: 'c', title: 'Gamma Stretch', genre: 'Metal', matchRating: 'Poor', payoutBase: 100, repGainBase: 8, durationDaysTotal: 7 });
const story = offer({ id: 's', title: 'Story Showdown', matchRating: 'Poor', isStoryContract: true, payoutBase: 50, repGainBase: 1, durationDaysTotal: 9 });

// Query matches title, genre, client; blank query passes everything.
assert.equal(matchesEnquiryQuery(a, ''), true);
assert.equal(matchesEnquiryQuery(a, 'alpha'), true);
assert.equal(matchesEnquiryQuery(a, 'JAZZ'), true);
assert.equal(matchesEnquiryQuery(a, 'client'), true);
assert.equal(matchesEnquiryQuery(a, 'techno'), false);

// Fit filters; story is immune.
assert.equal(matchesEnquiryFit(a, 'excellent'), true);
assert.equal(matchesEnquiryFit(b, 'excellent'), false);
assert.equal(matchesEnquiryFit(b, 'good'), true);
assert.equal(matchesEnquiryFit(c, 'good'), false);
assert.equal(matchesEnquiryFit(c, 'stretch'), true);
assert.equal(matchesEnquiryFit(a, 'stretch'), false);
assert.equal(matchesEnquiryFit(story, 'stretch'), true, 'story survives any fit filter');

// Recommended: fit rank first, rep breaks ties.
assert.deepEqual(
  filterAndSortBoard([c, b, a], { query: '', fit: 'all', sort: 'recommended' }).map((p) => p.id),
  ['a', 'b', 'c'],
);

// Story pins above everything in every mode.
for (const sort of ['recommended', 'fee', 'rep', 'quick'] as const) {
  const ids = filterAndSortBoard([c, b, a, story], { query: '', fit: 'all', sort }).map((p) => p.id);
  assert.equal(ids[0], 's', `story first under ${sort}`);
}

assert.deepEqual(
  filterAndSortBoard([a, b, c], { query: '', fit: 'all', sort: 'fee' }).map((p) => p.id),
  ['b', 'a', 'c'],
);
assert.deepEqual(
  filterAndSortBoard([a, b, c], { query: '', fit: 'all', sort: 'rep' }).map((p) => p.id),
  ['c', 'a', 'b'],
);
assert.deepEqual(
  filterAndSortBoard([a, b, c], { query: '', fit: 'all', sort: 'quick' }).map((p) => p.id),
  ['b', 'a', 'c'],
);

// Query + fit compose.
assert.deepEqual(
  filterAndSortBoard([a, b, c, story], { query: 'gamma', fit: 'stretch', sort: 'recommended' }).map((p) => p.id),
  ['c'],
  'query excludes the story; only the gamma match remains',
);
assert.deepEqual(
  filterAndSortBoard([a, b, c, story], { query: '', fit: 'excellent', sort: 'recommended' }).map((p) => p.id),
  ['s', 'a'],
);

console.log('enquiry-board.check.ts: ok');
