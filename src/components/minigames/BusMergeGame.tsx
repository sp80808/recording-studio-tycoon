import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import { FAMILY_STYLE, TrackGlyph } from './busMergeArt';
import {
  PAR_DEPTH,
  TRACK_FAMILY,
  TRACK_LABELS,
  createBusMerge,
  finish,
  move,
  scoreBusMerge,
  type BusDir,
  type BusMergeState,
} from '@/minigames/busMerge';
import { playPadTone } from '@/minigames/chainTones';
import { tc } from '@/i18n/content';

interface Props {
  minigameId: string;
  onComplete: (score: number, success?: boolean) => void;
  onClose: () => void;
  difficulty?: 1 | 2 | 3;
  /** Extra headroom from engineer skill / gear condition. */
  bonusHeadroom?: number;
}

const KEYS: Record<string, BusDir> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
};
const ARROWS: Record<BusDir, string> = { up: '▲', down: '▼', left: '◀', right: '▶' };
const NOTES = ['C4', 'E4', 'G4', 'C5', 'E5'];

export const BusMergeGame: React.FC<Props> = ({ onComplete, difficulty = 1, bonusHeadroom = 0 }) => {
  const [state, setState] = useState<BusMergeState>(() => createBusMerge(Date.now(), { difficulty, bonusHeadroom }));
  const result = useMemo(() => scoreBusMerge(state), [state]);

  const trackLabel = (kind: keyof typeof TRACK_LABELS) => tc(`mg.BusMergeGame.track_${kind.replace(/-/g, '_')}`, TRACK_LABELS[kind]);

  const slide = (dir: BusDir) => {
    setState((s) => {
      const next = move(s, dir);
      if (next !== s && next.merges > s.merges) void playPadTone(NOTES[Math.min(NOTES.length - 1, next.built.length % NOTES.length)]);
      return next;
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = KEYS[e.key];
      if (!dir) return;
      e.preventDefault();
      slide(dir);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const headroomPct = Math.max(0, Math.round((state.headroom / state.startHeadroom) * 100));
  const meterColour = headroomPct > 50 ? 'bg-emerald-500' : headroomPct > 25 ? 'bg-amber-500' : 'bg-red-500';
  const mixed = state.built.includes('mix');

  return (
    <MinigameChrome title={tc('mg.BusMergeGame.title', 'Bus & Stem Merge')} subtitle={tc('mg.BusMergeGame.subtitle', 'Route the tracks into one mix')} score={state.finished ? result.total : undefined} accent="yellow">
      <Card className="border-0 bg-transparent">
        <CardContent className="space-y-3 p-4">
          <p className="text-xs text-stone-300">
            {tc('mg.BusMergeGame.instructions', 'Slide tracks (arrow keys, WASD or the pad). Matching tracks merge: Kick + Snare = Drum Bus, Guitar L + R = Guitar Bus, then DRUM + MUSIC + VOX stems become the MIX. Merging eats headroom and duplicates add bus depth (par {{par}}). Merge the Hero Sample into the finished MIX to print it.', { par: PAR_DEPTH })}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-stone-300">
            <span className="w-20">{tc('mg.BusMergeGame.headroom', 'Headroom')}</span>
            <div className="h-2 flex-1 overflow-hidden rounded bg-stone-800" role="meter" aria-valuenow={headroomPct} aria-valuemin={0} aria-valuemax={100}>
              <div className={`h-full ${meterColour}`} style={{ width: `${headroomPct}%` }} />
            </div>
            <span className="w-24 text-right">{tc('mg.BusMergeGame.moves', 'Moves')} <b>{state.movesLeft}</b></span>
          </div>
          <div className="mx-auto grid max-w-xs grid-cols-4 gap-1.5 rounded-lg bg-stone-950/70 p-1.5">
            {state.cells.map((cell, i) =>
              cell ? (
                <div
                  key={i}
                  title={tc('mg.BusMergeGame.tile_title', '{{label}} (depth {{depth}})', { label: trackLabel(cell.kind), depth: cell.depth })}
                  className={`flex aspect-square flex-col items-center justify-center rounded-md border text-center ${FAMILY_STYLE[TRACK_FAMILY[cell.kind]].tile}`}
                >
                  <TrackGlyph kind={cell.kind} />
                  <span className="mt-0.5 text-[9px] font-bold leading-none">{trackLabel(cell.kind)}</span>
                </div>
              ) : (
                <div key={i} className="aspect-square rounded-md border border-stone-800 bg-stone-900/60" />
              ),
            )}
          </div>
          <p className="text-center text-[11px] text-stone-400">
            {tc('mg.BusMergeGame.status', 'Built: {{built}}/8 milestones · Incoming: {{incoming}} tracks', { built: state.built.length, incoming: state.deck.length })}{mixed ? ' · ' + tc('mg.BusMergeGame.mix_ready', 'MIX ready') : ''}
          </p>
          {!state.finished && (
            <div className="mx-auto grid w-32 grid-cols-3 gap-1" aria-label={tc('mg.BusMergeGame.slide_pad', 'Slide pad')}>
              <span />
              <KenneyButton onClick={() => slide('up')} variant="blue">{ARROWS.up}</KenneyButton>
              <span />
              <KenneyButton onClick={() => slide('left')} variant="blue">{ARROWS.left}</KenneyButton>
              <KenneyButton onClick={() => slide('down')} variant="blue">{ARROWS.down}</KenneyButton>
              <KenneyButton onClick={() => slide('right')} variant="blue">{ARROWS.right}</KenneyButton>
            </div>
          )}
          {state.finished && (
            <div className="rounded-lg border border-stone-600 bg-stone-900/70 p-3 text-xs text-stone-200">
              <h4 className="mb-1 font-bold text-amber-300">
                {result.mixed ? tc('mg.BusMergeGame.mix_bounced', 'Mix bounced') : tc('mg.BusMergeGame.out_of_road', 'Session ran out of road')} · {tc('mg.BusMergeGame.milestones', '{{n}}/8 milestones', { n: result.milestones })}
              </h4>
              {result.tips.join(' ') || tc('mg.BusMergeGame.result_clean', 'Clean routing, plenty of headroom, and the sample is printed.')}
            </div>
          )}
        </CardContent>
      </Card>
      <DialogFooter className="gap-2 p-4 pt-0">
        {!state.finished ? (
          <KenneyButton onClick={() => setState(finish)} variant="green">{mixed ? tc('mg.BusMergeGame.bounce_mix', 'Bounce mix') : tc('mg.BusMergeGame.bounce_anyway', 'Bounce anyway')}</KenneyButton>
        ) : (
          <KenneyButton onClick={() => onComplete(result.total, result.total >= 500)} variant="green">{tc('mg.BusMergeGame.done', 'Done')}</KenneyButton>
        )}
      </DialogFooter>
    </MinigameChrome>
  );
};
