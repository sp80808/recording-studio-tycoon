import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, ArrowUp, Disc, Sparkles, TrendingUp } from 'lucide-react';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import { buildTracklist, scoreAlbum } from '@/minigames/albumSequence';
import { gameAudio } from '@/utils/audioSystem';
import { triggerProjectCompleteJuice } from '@/utils/confettiJuice';
import { tc } from '@/i18n/content';

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

  const trackTitle = (title: string) => tc(`mg.AlbumSequenceGame.track_${title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`, title);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (done || j < 0 || j >= order.length) return;
    void gameAudio.playTactileClick();
    setOrder((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const handleSendToPress = () => {
    void gameAudio.playGearSwitch();
    setDone(true);
    if (result.total >= 600) {
      void gameAudio.playSuccess();
      triggerProjectCompleteJuice();
    }
  };

  // Build SVG path points for the dynamic Album Energy Arc
  const energyPoints = order.map((track, i) => {
    const x = 20 + i * ((280 - 40) / Math.max(1, order.length - 1));
    const y = 46 - (track.energy / 10) * 36;
    return { x, y, energy: track.energy, single: track.single };
  });

  const svgPath = energyPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
  const svgArea = `${svgPath} L ${energyPoints[energyPoints.length - 1].x} 48 L ${energyPoints[0].x} 48 Z`;

  return (
    <MinigameChrome title={tc('mg.AlbumSequenceGame.title', 'Track Listing')} score={done ? result.total : undefined} accent="yellow">
      <Card className="border-0 bg-transparent">
        <CardContent className="space-y-3 p-4">
          <p className="text-xs text-stone-300">
            {tc('mg.AlbumSequenceGame.instructions', 'Put the songs in order. Open strong, build to one peak, close on a slow burn, and give the single (★) a spot near the front. Taller bars are louder songs.')}
          </p>

          {/* Dynamic Album Energy Flow Arc */}
          <div className="rounded-lg border border-stone-700 bg-stone-950/70 p-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 mb-1">
              <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                Album Energy Flow Arc
              </span>
              <span>Side A (1-3) → Side B (4-7)</span>
            </div>

            <div className="relative h-14 w-full">
              <svg viewBox="0 0 280 50" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="energyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Energy Fill Area */}
                <path d={svgArea} fill="url(#energyGrad)" />

                {/* Trajectory Line */}
                <path d={svgPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Side A / Side B Split line */}
                <line x1="120" y1="4" x2="120" y2="48" stroke="#52525b" strokeWidth="1" strokeDasharray="2 2" />

                {/* Node dots */}
                {energyPoints.map((pt, i) => (
                  <g key={i}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={pt.single ? 4.5 : 3}
                      fill={pt.single ? '#facc15' : '#ffffff'}
                      stroke={pt.single ? '#ca8a04' : '#d97706'}
                      strokeWidth="1.5"
                    />
                    {pt.single && (
                      <text x={pt.x} y={pt.y - 7} textAnchor="middle" fill="#fde047" fontSize="8" fontWeight="bold">
                        ★
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Interactive Tracklist */}
          <div className="space-y-1.5">
            {order.map((track, i) => {
              const isSideA = i < 3;
              return (
                <div key={track.id}>
                  {i === 3 && (
                    <div className="flex items-center gap-2 my-1 text-[10px] font-mono text-stone-500 uppercase tracking-widest px-1">
                      <Disc className="w-3 h-3 text-stone-400" />
                      <span>Side B Flip</span>
                      <div className="flex-1 h-px bg-stone-800" />
                    </div>
                  )}

                  <div className={`flex items-center gap-2 rounded-lg border p-2 transition-colors ${
                    track.single 
                      ? 'border-amber-500/60 bg-amber-950/20' 
                      : 'border-stone-700 bg-stone-900/60'
                  }`}>
                    <span className="w-5 text-center font-mono text-xs font-bold text-stone-400">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-stone-100 flex items-center gap-1.5">
                        {track.single && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-400 text-amber-300 bg-amber-950/60">
                            ★ SINGLE
                          </Badge>
                        )}
                        <span>{trackTitle(track.title)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 rounded bg-stone-800 overflow-hidden">
                          <div
                            className={`h-full rounded transition-all ${
                              track.energy >= 8 
                                ? 'bg-gradient-to-r from-amber-500 to-red-500' 
                                : track.energy >= 5 
                                  ? 'bg-amber-400' 
                                  : 'bg-sky-400'
                            }`}
                            style={{ width: `${track.energy * 10}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-stone-400 w-8 text-right">
                          {track.energy}/10
                        </span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      aria-label={tc('mg.AlbumSequenceGame.move_up', 'Move {{title}} up', { title: trackTitle(track.title) })} 
                      disabled={done || i === 0} 
                      onClick={() => move(i, -1)} 
                      className="rounded border border-stone-600 p-1.5 text-stone-200 hover:bg-stone-800 disabled:opacity-30 transition-transform active:scale-90"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button 
                      type="button" 
                      aria-label={tc('mg.AlbumSequenceGame.move_down', 'Move {{title}} down', { title: trackTitle(track.title) })} 
                      disabled={done || i === order.length - 1} 
                      onClick={() => move(i, 1)} 
                      className="rounded border border-stone-600 p-1.5 text-stone-200 hover:bg-stone-800 disabled:opacity-30 transition-transform active:scale-90"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {done && (
            <div className="rounded-lg border border-emerald-500/50 bg-emerald-950/60 p-3 text-center text-xs text-stone-200">
              <h4 className="mb-1 font-bold text-emerald-300">{tc('mg.AlbumSequenceGame.pressed', 'Pressed and shipped')}</h4>
              {result.tips.length === 0 ? tc('mg.AlbumSequenceGame.result_clean', 'Side one could open a festival.') : result.tips.join(' ')}
            </div>
          )}
        </CardContent>
      </Card>
      <DialogFooter className="p-4 pt-0">
        {!done ? (
          <KenneyButton onClick={handleSendToPress} variant="green">{tc('mg.AlbumSequenceGame.send', 'Send to the pressing plant')}</KenneyButton>
        ) : (
          <KenneyButton onClick={() => onComplete(result.total, result.total >= 500)} variant="green">{tc('mg.AlbumSequenceGame.done', 'Done')}</KenneyButton>
        )}
      </DialogFooter>
    </MinigameChrome>
  );
};
