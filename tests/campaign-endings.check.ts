import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { countCompromises, getCampaignEnding } from '../src/narrative/endings';
import { buildActIntroCutscene, buildEndingCutscene } from '../src/narrative/actCinematics';
import { generateCampaignTree, getStorylineNode, initializeStorylineState } from '../src/narrative/branchingStorylineEngine';
import type { GameState } from '../src/types/game';

const FINALES = ['act3_golden_legend', 'act3_sonic_alchemy', 'act3_billboard_monopoly', 'act3_rogue_factory'] as const;

const finished = (finale: string, flags: Record<string, boolean> = {}): GameState => {
  const s = initializeStorylineState({
    money: 9000,
    reputation: 80,
    currentDay: 120,
    currentEra: 'analog60s',
    selectedEra: 'analog60s',
    playerData: { playstyle: 'purist', originId: 'tape-purist', xp: 0, level: 9 },
    financials: { income: 0, expenses: 0, profit: 0, reports: [{ projectId: 'a', genre: 'Rock', overallQualityScore: 91 }] },
    studioRooms: [{ unlocked: true }],
    hiredStaff: [],
    unlockedAchievements: { first_cut: 3 },
  } as unknown as GameState);
  return {
    ...s,
    storylineState: { ...s.storylineState!, activeCampaignNodeId: finale, campaignCompleted: true, storyFlags: flags },
  } as GameState;
};

describe('campaign endings', () => {
  it('has no ending until the campaign is finished', () => {
    const s = initializeStorylineState({ money: 1, reputation: 0, currentDay: 1, playerData: { xp: 0 } } as unknown as GameState);
    assert.equal(getCampaignEnding(s), null);
  });

  it('gives each finale its own title, epigraph and rival', () => {
    const endings = FINALES.map((f) => getCampaignEnding(finished(f))!);
    assert.equal(new Set(endings.map((e) => e.title)).size, 4);
    assert.equal(new Set(endings.map((e) => e.legacyTitle)).size, 4);
    for (const e of endings) {
      assert.ok(e.lines.length >= 4, e.id);
      assert.ok(e.rivalLine.length > 20, e.id);
      assert.match(e.rivalInitials, /^[A-Z]{2}$/);
    }
    assert.equal(new Set(endings.map((e) => e.rivalName)).size, 4, 'four finales, four rivals');
  });

  it('a clean record beats the rival; a compromised one only earns respect', () => {
    const clean = getCampaignEnding(finished('act3_golden_legend', { refused_ghost_contract: true, signed_union_scale: true }))!;
    const dirty = getCampaignEnding(finished('act3_golden_legend', { ghost_producer_contract: true, paid_the_curator: true, pushed_the_crew: true }))!;
    assert.equal(clean.compromised, false);
    assert.equal(dirty.compromised, true);
    assert.notEqual(clean.rivalLine, dirty.rivalLine);
    assert.notEqual(clean.id, dirty.id);
    assert.match(clean.lines[clean.lines.length - 1], /refused to sell your name/);
    assert.match(dirty.lines[dirty.lines.length - 1], /complicated/);
    assert.equal(countCompromises(finished('act3_golden_legend', { paid_the_curator: true })), 1);
  });

  it('recaps real numbers', () => {
    const e = getCampaignEnding(finished('act3_billboard_monopoly'))!;
    const byLabel = Object.fromEntries(e.stats.map((s) => [s.label, s.value]));
    assert.equal(byLabel['Days in business'], '120');
    assert.equal(byLabel['Sessions delivered'], '1');
    assert.equal(byLabel['Best session'], 'Q91');
    assert.equal(byLabel['Trophies'], '1');
  });
});

describe('cinematic payloads', () => {
  it('builds an act opening from the node itself', () => {
    const tree = generateCampaignTree({ runSeed: 9, originId: 'tape-purist', selectedEra: 'analog60s', playstyle: 'purist' });
    const node = getStorylineNode(tree, 'act2_commercial')!;
    const p = buildActIntroCutscene(node, 'hit-maker');
    assert.equal(p.chapter.startsWith('Act II'), true);
    assert.equal(p.speaker, node.rivalName);
    assert.ok(p.lines.some((l) => l.includes(node.objectiveDescription)), 'objective is read out');
    assert.equal(p.finalLabel, 'Begin Act II');
  });

  it('builds an epilogue that ends on the rival’s line and carries the recap', () => {
    const e = getCampaignEnding(finished('act3_rogue_factory'))!;
    const p = buildEndingCutscene(e);
    assert.equal(p.lines[p.lines.length - 1], e.rivalLine);
    assert.equal(p.stats!.length, 5);
    assert.equal(p.title, 'The Open Stem');
  });

  it('is wired into the Index once, behind every other story popup', () => {
    const idx = fs.readFileSync('src/pages/Index.tsx', 'utf8');
    assert.match(idx, /showEpilogue/);
    assert.match(idx, /showActIntro/);
    assert.match(idx, /storyStageClear/);
    assert.match(idx, /endingSeen: true/);
    const cin = fs.readFileSync('src/components/cutscenes/CinematicStoryCutscene.tsx', 'utf8');
    assert.ok(!/gradient/.test(cin), 'cinematic surface is flat');
    assert.ok(!/text-amber|border-amber|bg-amber/.test(cin), 'no leftover amber utility palette');
  });
});
