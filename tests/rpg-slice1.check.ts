/** Slice-1 verification: pure RPG + narrative foundations. Bundled via esbuild, run with node. */
import { gradeQuality } from '../src/rpg/rankChase';
import { evaluateCombo, comboKey } from '../src/rpg/comboCodex';
import { xpNext, skillXpForProject, overlevelMultiplier, talentPointsEarned } from '../src/rpg/unifiedXp';
import { detectSlump } from '../src/narrative/comebackDetector';
import { eligibleNominees, winChance, pickWinnerSeeded } from '../src/narrative/awardsScoring';
import { generateFanLetters } from '../src/narrative/fanMail';
import { createSeededRandom } from '../src/simulation/seededRandom';

const assert = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
};

// S-rank
assert(gradeQuality(97).rank === 'S+', 'S+ at 97');
assert(gradeQuality(90).rank === 'S', 'S at 90');
assert(gradeQuality(89).nearMiss === true, 'near-miss at 89 (needs 1 for S)');
assert(gradeQuality(55).rank === 'B', 'B at 55');
assert(gradeQuality(99).pointsToNext === 0, 'S+ has no next');
assert(gradeQuality(96).pointsToNext === 1, '96 needs 1 for S+');

// Combos
assert(evaluateCombo('Hip-Hop', 'Aggressive', { isFirstDiscovery: true }).tier === 'Amazing', 'trap forge amazing');
assert(evaluateCombo('Metal', 'Lullaby').tier === 'Terrible', 'metal lullaby terrible');
assert(evaluateCombo('Pop', 'Upbeat').qualityBonus >= 3, 'pop upbeat promising+');
assert(comboKey('Hip-Hop', ' Aggressive ') === 'hip-hop|aggressive', 'combo key normalizes');

// XP curves increase monotonically
assert(xpNext('skill', 2) > xpNext('skill', 1), 'skill curve grows');
assert(xpNext('producer', 10) > xpNext('skill', 10), 'producer pricier than skill at 10');
assert(skillXpForProject(80, 3, 6) >= 50 && skillXpForProject(80, 3, 6) <= 130, 'skill xp in 50-130 band');
assert(overlevelMultiplier(10, 2) < 1, 'overlevel brake applies');
assert(overlevelMultiplier(3, 3) === 1, 'no brake at level');
assert(talentPointsEarned(30) === 36, '30 levels = 36 talent pts');

// Comeback
assert(detectSlump({ reputation: 20, peakReputation: 60, daysSinceProject: 2, consecutiveLowScores: 0, currentDay: 100, lastOfferDay: null })?.kind === 'redemption-rush', 'rep crash -> rush');
assert(detectSlump({ reputation: 60, peakReputation: 60, daysSinceProject: 2, consecutiveLowScores: 2, currentDay: 100, lastOfferDay: null })?.kind === 'loyal-regular', 'flop streak -> loyal');
assert(detectSlump({ reputation: 60, peakReputation: 60, daysSinceProject: 2, consecutiveLowScores: 0, currentDay: 100, lastOfferDay: 95 }) === null, 're-arm blocks (21d)');
assert(detectSlump({ reputation: 60, peakReputation: 60, daysSinceProject: 1, consecutiveLowScores: 0, currentDay: 100, lastOfferDay: null }) === null, 'healthy -> no offer');

// Awards
const noms = eligibleNominees([
  { projectId: 'a', title: 'A', quality: 95, charted: true },
  { projectId: 'b', title: 'B', quality: 72, charted: false },
  { projectId: 'c', title: 'C', quality: 40, charted: false },
]);
assert(noms.length === 2 && noms[0].projectId === 'a', 'nominees filter + sort');
assert(winChance(95, { attend: true, charted: true }) > winChance(95, {}), 'attend helps');
const w1 = pickWinnerSeeded(noms, 'reels-2026-studio1', 0.8);
const w2 = pickWinnerSeeded(noms, 'reels-2026-studio1', 0.8);
assert(w1.winnerId === w2.winnerId, 'seeded winner deterministic');

// Fan mail uses injected RNG only
const rng = createSeededRandom('proj-1');
const letters = generateFanLetters({ projectId: 'p1', quality: 92, genre: 'Pop', charted: true, currentDay: 50 }, rng);
assert(letters.length === 3, 'charted hit -> 3 letters');
assert(letters.every((l) => l.expiresDay === 64), '14d expiry');

console.log('rpg-slice1: all checks passed');
