import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import { buildTracklist, scoreAlbum } from '@/minigames/albumSequence';

interface Props {
  minigameId: string;
  onComplete: (score: number, success?: boolean) => void;
  onClose: () => void;
}

export const AlbumSequenceGame: React.FC<Props> = ({ onComplete }) => {
  const initial = useMemo(() => buildTracklist(Date.now()), []);
  const [order, setOrder] = useState(initial);
  const [done, setDone] = useState(false);
  const result = useMemo(() => scoreAlbum(order), [order]);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (done || j < 0 || j >= order.length) return;
    setOrder((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  return (
    <MinigameChrome title="Track Listing" score={done ? result.total : 0} accent="yellow">
      <Card className="border-0 bg-transparent">
        <CardContent className="space-y-2 p-4">
          <p className="text-xs text-stone-300">
            Put the songs in order. Open strong, build to one peak, close on a slow burn, and give the single (★) a
            spot near the front. Taller bars are louder songs.
          </p>
          {order.map((track, i) => (
            <div key={track.id} className="flex items-center gap-2 rounded-lg border border-stone-700 bg-stone-900/60 p-2">
              <span className="w-5 text-center font-mono text-xs text-stone-400">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-stone-100">
                  {track.single && <span className="text-amber-300">★ </span>}
                  {track.title}
                </div>
                <div className="mt-1 h-1.5 rounded bg-stone-800">
                  <div className="h-full rounded bg-amber-400" style={{ width: `${track.energy * 10}%` }} />
                </div>
              </div>
              <button type="button" aria-label={`Move ${track.title} up`} disabled={done || i === 0} onClick={() => move(i, -1)} className="rounded border border-stone-600 p-1 text-stone-200 disabled:opacity-30">
                <ArrowUp size={14} />
              </button>
              <button type="button" aria-label={`Move ${track.title} down`} disabled={done || i === order.length - 1} onClick={() => move(i, 1)} className="rounded border border-stone-600 p-1 text-stone-200 disabled:opacity-30">
                <ArrowDown size={14} />
              </button>
            </div>
          ))}
          {done && (
            <div className="rounded-lg border border-emerald-500/50 bg-emerald-950/60 p-3 text-center text-xs text-stone-200">
              <h4 className="mb-1 font-bold text-emerald-300">Pressed and shipped</h4>
              {result.tips.length === 0 ? 'Side one could open a festival.' : result.tips.join(' ')}
            </div>
          )}
        </CardContent>
      </Card>
      <DialogFooter className="p-4 pt-0">
        {!done ? (
          <KenneyButton onClick={() => setDone(true)} variant="green">Send to the pressing plant</KenneyButton>
        ) : (
          <KenneyButton onClick={() => onComplete(result.total, result.total >= 500)} variant="green">Done</KenneyButton>
        )}
      </DialogFooter>
    </MinigameChrome>
  );
};
