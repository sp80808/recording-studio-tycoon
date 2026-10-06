import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createNewGameState } from '../src/utils/newGameState';
import { nextTechniqueTease, createExperiencedProgress } from '../src/rpg/featureUnlocks';
import type { GameState } from '../src/types/game';

const fresh = (): GameState => createNewGameState({ saveSeed: 1 });
const withSessions = (s: GameState, n: number): GameState => ({
  ...s,
  financials: { ...s.financials, reports: Array.from({ length: n }, (_, i) => ({ projectId: `p${i}` }) as never) },
});

describe('CareerHub technique tease (#260)', () => {
  it('teases the next locked technique in order, never a later one', () => {
    assert.equal(nextTechniqueTease(fresh())?.feature, 'overdrive');
    const s = withSessions(fresh(), 4);
    assert.equal(nextTechniqueTease(s)?.feature, 'streak-bank');
    assert.ok(nextTechniqueTease(s)!.requirement.length > 0);
  });

  it('shows nothing once everything is unlocked (Experienced start)', () => {
    assert.equal(nextTechniqueTease({ ...fresh(), featureProgress: createExperiencedProgress() }), null);
  });

  it('tease keys exist in every locale and CareerHub uses them', () => {
    const keys = ['technique_tease_title', 'technique_tease_overdrive', 'technique_tease_combo', 'technique_tease_streak-bank'];
    for (const l of ['en', 'en-GB', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pl', 'pt-BR', 'ru', 'zh-CN']) {
      const d = JSON.parse(readFileSync(`public/locales/${l}/common.json`, 'utf8'));
      for (const k of keys) assert.ok(typeof d[k] === 'string' && d[k].length > 0, `${l}:${k}`);
    }
    assert.match(readFileSync('src/components/CareerHub.tsx', 'utf8'), /technique_tease_\$\{tease\.feature\}/);
  });
});
