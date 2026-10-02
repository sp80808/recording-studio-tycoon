/** Artist career arcs + delayed release outcomes (#49 first slice). */
import {
  recordRelease, resolveDueReleases, outcomeBandFor, careerTierForPoints, clientCareerTier, clientCareerLines,
  requestedServiceFor, followUpCandidate, CAREER_TIERS, CAREER_POINTS, BAND_REPUTATION,
} from '../src/rpg/artistCareer';
import { generateNewProjects } from '../src/utils/projectUtils';
import type { ClientRelationship } from '../src/types/game';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };
const client = (over: Partial<ClientRelationship> = {}): ClientRelationship => ({
  clientId: 'maya|independent', clientName: 'Maya Ross', primaryGenre: 'Pop', relationshipXp: 120, tier: 'Friendly',
  sessionsCompleted: 2, lastSessionDay: 5, bestQualityScore: 80, referralCount: 0, ...over,
});
const input = (id: string, quality = 85, day = 10) => ({ projectId: id, title: 'Glass Rooms', genre: 'Pop', qualityScore: quality, day });

// Five tiers, thresholds ascending.
ok(CAREER_TIERS.length === 5, 'five career tiers exist');
ok(CAREER_TIERS.every((t, i) => i === 0 || CAREER_POINTS[t] > CAREER_POINTS[CAREER_TIERS[i - 1]]), 'tier thresholds ascend');
ok(careerTierForPoints(0) === 'local' && careerTierForPoints(3) === 'emerging' && careerTierForPoints(100) === 'prestige', 'points map to tiers');

// One release per settled project, idempotent.
const r1 = recordRelease(client(), input('p1'));
ok(r1.releases!.length === 1 && !r1.releases![0].resolved, 'a settled project creates one unresolved release');
ok(recordRelease(r1, input('p1')) === r1, 'settling the same project again cannot duplicate the release');
ok(recordRelease(r1, input('p2')).releases!.length === 2, 'a different project adds a second release');
let many = client();
for (let i = 0; i < 12; i++) many = recordRelease(many, input(`m${i}`));
ok(many.releases!.length === 8, 'release history is capped');

// Deterministic outcome; quality drives the band; no market input exists.
ok(outcomeBandFor('x', 80) === outcomeBandFor('x', 80), 'same project and quality give the same outcome');
const rank = { quiet: 0, solid: 1, breakthrough: 2, prestige: 3 } as const;
ok(rank[outcomeBandFor('y', 99)] >= rank[outcomeBandFor('y', 20)], 'higher quality never lands a lower band for the same seed');
ok(outcomeBandFor.length === 2, 'the outcome reads only project id and quality (no market input)');

// Delayed resolution: reputation/referrals only, exactly once, never early.
const rels = { 'maya|independent': r1 };
const rel = r1.releases![0];
const early = resolveDueReleases(rels, rel.resolveDay - 1);
ok(early.relationships === rels && early.reputation === 0, 'nothing resolves before its day');
const due = resolveDueReleases(rels, rel.resolveDay);
ok(due.relationships!['maya|independent'].releases![0].resolved, 'the release resolves on its day');
ok(due.reputation === BAND_REPUTATION[rel.outcomeBand], 'resolution pays the bounded reputation for its band');
ok(Object.keys(due).sort().join() === 'notifications,relationships,reputation', 'resolution has no cash channel (the session fee is never repaid)');
const again = resolveDueReleases(due.relationships, rel.resolveDay + 3);
ok(again.reputation === 0 && again.notifications.length === 0, 'resolving again is a no-op (reload safe)');
const gain = due.relationships!['maya|independent'];
ok((gain.careerPoints ?? 0) >= 0 && gain.referralCount >= 0, 'career points and referrals are non-negative');

// Career tier only ever grows.
let strong = client();
let rs: Record<string, ClientRelationship> = { k: strong };
let lastTier = 0;
for (let i = 0; i < 12; i++) {
  rs = { k: recordRelease(rs.k, input(`s${i}`, 95, i * 10)) };
  rs = resolveDueReleases(rs, i * 10 + 10).relationships!;
  const t = CAREER_TIERS.indexOf(clientCareerTier(rs.k));
  ok(t >= lastTier, `tier never drops after release ${i + 1}`);
  lastTier = t;
}
ok(lastTier >= 1, 'repeated strong releases lift the career tier');
const idle = resolveDueReleases(rs, 9999);
ok(clientCareerTier(idle.relationships!.k) === clientCareerTier(rs.k), 'inactivity never demotes a client');

// Tier shapes the work requested.
const prestige = client({ careerPoints: 40 });
const local = client({ careerPoints: 0 });
let sawFull = false, localFull = false;
for (let i = 0; i < 20; i++) {
  if (requestedServiceFor(prestige, `r${i}`) !== 'full-production') throw new Error('FAIL: prestige asks for full production');
  sawFull = true;
  if (requestedServiceFor(local, `r${i}`) === 'full-production') localFull = true;
}
ok(sawFull && !localFull, 'prestige clients ask for flagship work, local clients do not');

// Legacy clients (no release history) load safely.
ok(clientCareerTier(client()) === 'local' && clientCareerLines({ a: client() }).length === 0 && clientCareerLines(undefined).length === 0, 'legacy clients without releases are safe');

// Follow-up chain: a strong resolved release seeds a follow-up enquiry, once.
let seeded = recordRelease(client(), input('base', 95));
seeded = resolveDueReleases({ k: seeded }, 999).relationships!.k;
const seed = followUpCandidate(seeded);
if (!seed) { ok(outcomeBandFor('base', 95) === 'quiet', 'only a quiet release offers no follow-up'); }
else {
  ok(seed.projectId === 'base', 'a resolved, non-quiet release is a follow-up candidate');
  const realRandom = Math.random;
  Math.random = () => 0.01; // forces the returning-client roll
  let offers;
  try { offers = generateNewProjects(2, 3, 'modern', [seeded], 1.1, 10); } finally { Math.random = realRandom; }
  const followUps = offers.filter(p => p.followUpOf === seed.id);
  ok(followUps.length === 1, 'exactly one follow-up enquiry is offered for the release');
  ok(followUps[0].title.startsWith('Follow-up: ') && followUps[0].clientName === 'Maya Ross', 'the enquiry names the earlier release and the same client');
  const done = recordRelease(seeded, { ...input('seq', 80), followUpOf: seed.id });
  ok(followUpCandidate(done)?.id !== seed.id, 'once followed up, the release does not seed another sequel');
}
console.log(`artist-career: all ${n} checks passed`);
