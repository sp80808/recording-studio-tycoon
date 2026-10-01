import assert from 'node:assert/strict';
import {
  SKILL_PRACTICE_CATALOG,
  PRACTICE_ENERGY_COST,
  STUDY_NOTES_SKILL_XP,
  normalizePracticeScore,
  gradeFromScore,
  skillXpFromPracticeScore,
  computePracticeReward,
  applySkillPractice,
  applyStudyNotes,
  canAffordPractice,
  minigameForSkill,
  type PlayerSkillName,
} from '../src/rpg/skillPractice';
import { initializeSkillsPlayer, calculateXpToNextLevel } from '../src/utils/skillUtils';
import type { GameState } from '../src/types/game';

function stubGame(energy = 3): GameState {
  return {
    playerData: {
      xp: 10,
      level: 1,
      xpToNextLevel: 100,
      perkPoints: 0,
      attributes: {
        focusMastery: 0,
        creativeIntuition: 0,
        technicalAptitude: 0,
        businessAcumen: 0,
      },
      dailyWorkCapacity: energy,
      reputation: 0,
      skills: initializeSkillsPlayer(),
    },
  } as GameState;
}

// Catalog covers every player craft skill exactly once with a minigame mapping.
const skills = initializeSkillsPlayer();
const skillKeys = Object.keys(skills) as PlayerSkillName[];
assert.equal(SKILL_PRACTICE_CATALOG.length, skillKeys.length, 'catalog covers all player skills');
for (const key of skillKeys) {
  assert.ok(
    SKILL_PRACTICE_CATALOG.some((d) => d.skill === key),
    `missing practice def for ${key}`
  );
  assert.ok(typeof minigameForSkill(key) === 'string', `${key} maps to a minigame id`);
}

// Score normalization uses per-minigame ceilings so a perfect mix (80) grades as S.
assert.equal(normalizePracticeScore(80, 'mixing'), 1000);
assert.equal(normalizePracticeScore(40, 'mixing'), 500);
assert.equal(normalizePracticeScore(80, 'lyric-focus'), 800);
assert.equal(normalizePracticeScore(850, 'beat-pad'), 850);
assert.equal(normalizePracticeScore(10, 'maintenance'), 500);

assert.equal(gradeFromScore(900), 'S');
assert.equal(gradeFromScore(720), 'A');
assert.equal(gradeFromScore(510), 'B');
assert.equal(gradeFromScore(320), 'C');
assert.equal(gradeFromScore(100), 'F');

// Strong play awards more XP than a botched take.
const strongXp = skillXpFromPracticeScore(900);
const weakXp = skillXpFromPracticeScore(120);
assert.ok(strongXp > weakXp * 3, `strong (${strongXp}) should dwarf weak (${weakXp})`);
assert.ok(weakXp <= 8, 'failure awards little XP');

const baseSkill = { level: 1, xp: 0, xpToNextLevel: calculateXpToNextLevel(1) };
const strong = computePracticeReward(baseSkill, 80, 'mixing'); // perfect desk
const weak = computePracticeReward(baseSkill, 5, 'mixing');
assert.ok(strong.skillXp > weak.skillXp, 'computePracticeReward grades by score');
assert.equal(strong.grade, 'S');
assert.equal(weak.grade, 'F');

// applySkillPractice spends energy and grants craft XP.
const before = stubGame(2);
assert.equal(canAffordPractice(before), true);
const practiced = applySkillPractice(before, 'mixing', 800);
assert.ok(practiced, 'practice should apply with energy');
assert.equal(practiced!.next.playerData.dailyWorkCapacity, 2 - PRACTICE_ENERGY_COST);
assert.ok(practiced!.reward.skillXp > 0);
assert.ok(
  practiced!.next.playerData.skills.mixing.xp > before.playerData.skills.mixing.xp ||
    practiced!.next.playerData.skills.mixing.level > before.playerData.skills.mixing.level
);

const broke = stubGame(0);
assert.equal(canAffordPractice(broke), false);
assert.equal(applySkillPractice(broke, 'rhythm', 900), null);

// Study notes fallback is weaker than a decent practice score.
const notes = applyStudyNotes(stubGame(1), 'songwriting');
assert.ok(notes);
assert.equal(notes!.skillXp, STUDY_NOTES_SKILL_XP);
assert.ok(notes!.skillXp < skillXpFromPracticeScore(600));

console.log('PASS: skill practice mapping, grading, and energy spend');
