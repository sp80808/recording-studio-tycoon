import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import {
  LOCS,
  SESSION_MS,
  assignJob,
  cableFixed,
  createSessionScramble,
  earlyWarningShown,
  scoreSessionScramble,
  staffPosition,
  startSession,
  tick,
  unassign,
  visibleEtaMs,
  workDurationMs,
  type Job,
  type JobId,
  type ScrambleState,
  type Staff,
} from '@/minigames/sessionScramble';
import { tc } from '@/i18n/content';

interface Props {
  minigameId: string;
  onComplete: (score: number, success?: boolean) => void;
  onClose: () => void;
  difficulty?: 1 | 2 | 3;
}

const TICK_MS = 100;
const STAFF_COLORS = ['#38bdf8', '#f472b6', '#a3e635'];
const STAT_LABEL = { tech: 'Tech', hands: 'Hands', people: 'People' } as const;
const statLabel = (k: keyof typeof STAT_LABEL) => tc(`mg.SessionScrambleGame.stat_${k}`, STAT_LABEL[k]);

// Map units to SVG pixels (viewBox 0 0 280 250).
const mx = (x: number) => 30 + x * 55;
const my = (y: number) => 28 + y * 33;

const seconds = (ms: number) => tc('mg.SessionScrambleGame.seconds', '{{n}}s', { n: (ms / 1000).toFixed(0) });

const jobStatus = (job: Job, state: ScrambleState): string => {
  if (job.doneAtMs !== null) return tc('mg.SessionScrambleGame.status_done', 'Done');
  const who = state.staff.find((s) => s.jobId === job.id);
  if (!who) return job.progress > 0 ? tc('mg.SessionScrambleGame.status_paused', 'Paused') : tc('mg.SessionScrambleGame.status_unassigned', 'Unassigned');
  if (who.blocked === 'narrow') return tc('mg.SessionScrambleGame.status_corridor', '{{name}}: stuck in the corridor', { name: who.name });
  if (who.blocked === 'booth') return tc('mg.SessionScrambleGame.status_booth', '{{name}}: booth is occupied', { name: who.name });
  if (who.walkLeftMs > 0) return tc('mg.SessionScrambleGame.status_walking', '{{name}}: {{action}}', { name: who.name, action: who.slowed ? tc('mg.SessionScrambleGame.action_tripping', 'tripping over the cable') : tc('mg.SessionScrambleGame.action_walking', 'walking') });
  return tc('mg.SessionScrambleGame.status_working', '{{name}}: {{action}}', { name: who.name, action: tc(`mg.SessionScrambleGame.verb_${job.id}`, job.verb).toLowerCase() });
};

const Room: React.FC<{ state: ScrambleState }> = ({ state }) => {
  const fixed = cableFixed(state);
  const boothBusy = state.elapsedMs < state.boothFreeAtMs;
  return (
    <svg viewBox="0 0 280 250" className="h-auto w-full rounded-lg border border-stone-700 bg-stone-950/60" role="img" aria-label={tc('mg.SessionScrambleGame.floor_plan_aria', 'Studio floor plan with staff walking between rooms')}>
      {/* walkways */}
      <g stroke="#57534e" strokeWidth="14" strokeLinecap="round" fill="none">
        <path d={`M${mx(0)} ${my(0)} H${mx(4)} V${my(3)}`} />
        <path d={`M${mx(0)} ${my(0)} V${my(4)} L${mx(2)} ${my(6)}`} />
        <path d={`M${mx(4)} ${my(3)} L${mx(2)} ${my(6)}`} />
      </g>
      {/* narrow corridor marker */}
      <rect x={mx(0) - 9} y={my(2) - 8} width="18" height="16" fill="none" stroke="#fbbf24" strokeDasharray="3 2" rx="2" />
      <text x={mx(0) + 14} y={my(2) + 3} fontSize="8" fill="#fbbf24">{tc('mg.SessionScrambleGame.narrow', 'narrow')}</text>
      {/* cable across the live-room walkway */}
      {!fixed && (
        <path d={`M${mx(4) - 22} ${my(1) - 4} q6 -10 11 0 t11 0 t11 0 t11 0`} stroke="#f87171" strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
      {/* rooms */}
      {(Object.keys(LOCS) as (keyof typeof LOCS)[]).map((id) => (
        <g key={id}>
          <circle cx={mx(LOCS[id].x)} cy={my(LOCS[id].y)} r="13" fill={id === 'booth' && boothBusy ? '#7f1d1d' : '#292524'} stroke="#a8a29e" strokeWidth="1.5" />
          <text x={mx(LOCS[id].x)} y={my(LOCS[id].y) + 26} textAnchor="middle" fontSize="8" fill="#d6d3d1">{tc(`mg.SessionScrambleGame.loc_${id}`, LOCS[id].label)}</text>
        </g>
      ))}
      {boothBusy && <text x={mx(4)} y={my(3) + 3} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#fecaca">{tc('mg.SessionScrambleGame.busy', 'BUSY')}</text>}
      {/* staff */}
      {state.staff.map((m, i) => {
        const pos = staffPosition(m, state.jobs);
        return (
          <g key={m.id} transform={`translate(${mx(pos.x) + (i - 1) * 7} ${my(pos.y) - 2})`}>
            <circle r="7" fill={STAFF_COLORS[i]} stroke={m.blocked ? '#ef4444' : '#1c1917'} strokeWidth="2" />
            <text y="3" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1c1917">{m.name[0]}</text>
          </g>
        );
      })}
    </svg>
  );
};

export const SessionScrambleGame: React.FC<Props> = ({ onComplete, difficulty = 2 }) => {
  const [state, setState] = useState<ScrambleState>(() => createSessionScramble(Date.now(), difficulty));
  const [selected, setSelected] = useState<string>('s0');
  const last = useRef<number | null>(null);
  const result = useMemo(() => scoreSessionScramble(state), [state]);
  const running = state.phase === 'run';
  const done = state.phase === 'done';

  useEffect(() => {
    if (!running) { last.current = null; return; }
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = last.current === null ? TICK_MS : Math.min(250, now - last.current);
      last.current = now;
      setState((s) => tick(s, dt));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [running]);

  const give = (jobId: JobId) => setState((s) => assignJob(s, selected, jobId));
  const eta = visibleEtaMs(state);
  const warn = earlyWarningShown(state);
  const doneCount = state.jobs.filter((j) => j.doneAtMs !== null).length;
  const sel = state.staff.find((s) => s.id === selected) as Staff;
  const allReady = doneCount === state.jobs.length;

  return (
    <MinigameChrome title={tc('mg.SessionScrambleGame.title', 'Session Setup Scramble')} subtitle={tc('mg.SessionScrambleGame.ready_count', '{{done}}/{{total}} ready', { done: doneCount, total: state.jobs.length })} score={done ? result.total : undefined} accent="green">
      <Card className="border-0 bg-transparent">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between text-xs">
            <span className={`font-bold ${warn ? 'text-red-400' : 'text-amber-300'}`} aria-live="polite">
              {warn ? tc('mg.SessionScrambleGame.arriving_early', 'Artist is arriving early! {{time}}', { time: seconds(eta) }) : tc('mg.SessionScrambleGame.arrive_in', 'Artists arrive in {{time}}', { time: seconds(eta) })}
            </span>
            <span className="text-stone-400">{tc('mg.SessionScrambleGame.blocked', 'Blocked: {{time}}', { time: seconds(state.blockedMs) })}</span>
          </div>
          <div className="h-2 overflow-hidden rounded bg-stone-800" aria-hidden="true">
            <div className={`h-full ${warn ? 'bg-red-500' : 'bg-amber-400'}`} style={{ width: `${Math.min(100, (state.elapsedMs / SESSION_MS) * 100)}%` }} />
          </div>

          <Room state={state} />

          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={tc('mg.SessionScrambleGame.choose_staff_aria', 'Choose a staff member')}>
            {state.staff.map((m, i) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={selected === m.id}
                disabled={done}
                onClick={() => setSelected(m.id)}
                className={`min-h-[44px] rounded-md border px-1 py-2 text-left text-[11px] ${selected === m.id ? 'border-amber-300 bg-stone-700' : 'border-stone-600 bg-stone-800'} text-stone-200`}
              >
                <span className="flex items-center gap-1 font-bold">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: STAFF_COLORS[i] }} />{m.name}
                </span>
                <span className="block text-stone-400">{tc('mg.SessionScrambleGame.stats_line', 'T {{t}} · H {{h}} · P {{p}}', { t: m.tech.toFixed(1), h: m.hands.toFixed(1), p: m.people.toFixed(1) })}</span>
                <span className="block text-stone-400">{tc('mg.SessionScrambleGame.pace', 'Pace {{n}}', { n: m.pace.toFixed(1) })}</span>
              </button>
            ))}
          </div>

          <p className="text-xs text-stone-300">
            {tc('mg.SessionScrambleGame.pick_hint', 'Pick a person, then tap a job to send {{name}}. Seconds shown are how long {{name}} needs for the job itself.', { name: sel.name })}
          </p>
          <ul className="space-y-2">
            {state.jobs.map((job) => {
              const dur = workDurationMs(job, sel);
              const finished = job.doneAtMs !== null;
              const holder = state.staff.find((s) => s.jobId === job.id);
              return (
                <li key={job.id}>
                  <button
                    type="button"
                    disabled={done || finished || (!!holder && holder.id !== selected)}
                    onClick={() => give(job.id)}
                    className={`min-h-[48px] w-full rounded-md border px-3 py-2 text-left text-xs ${finished ? 'border-emerald-700 bg-emerald-950/40 text-emerald-200' : holder ? 'border-sky-500 bg-stone-800 text-stone-100' : 'border-stone-600 bg-stone-800 text-stone-200'} disabled:opacity-70`}
                  >
                    <span className="flex justify-between font-bold">
                      <span>{tc(`mg.SessionScrambleGame.job_${job.id}`, job.label)}</span>
                      <span className="text-stone-400">{statLabel(job.stat)} · {finished ? tc('mg.SessionScrambleGame.job_done', 'done') : seconds(dur)}</span>
                    </span>
                    <span className="block text-stone-400">
                      {tc(`mg.SessionScrambleGame.loc_${job.loc}`, LOCS[job.loc].label)}
                      {job.narrow && ` · ${tc('mg.SessionScrambleGame.flag_narrow', 'narrow corridor')}`}
                      {job.booth && ` · ${tc('mg.SessionScrambleGame.flag_booth', 'needs empty booth')}`}
                      {job.cabled && ` · ${tc('mg.SessionScrambleGame.flag_cable', 'cable on route')}`}
                    </span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded bg-stone-700" aria-hidden="true">
                      <span className="block h-full bg-emerald-400" style={{ width: `${Math.round(job.progress * 100)}%` }} />
                    </span>
                    <span className="mt-1 block text-[11px] text-amber-200">{jobStatus(job, state)}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {done && (
            <div className="rounded-lg border border-stone-600 bg-stone-900/70 p-3 text-center text-xs text-stone-200">
              <h4 className={`mb-1 font-bold ${allReady ? 'text-emerald-300' : 'text-amber-300'}`}>
                {allReady ? tc('mg.SessionScrambleGame.room_ready', 'Room ready') : tc('mg.SessionScrambleGame.half_built', 'The artist walked into a half-built room')}
              </h4>
              {result.tips.join(' ') || tc('mg.SessionScrambleGame.all_set', 'Everything was set before the artist walked in.')}
            </div>
          )}
        </CardContent>
      </Card>
      <DialogFooter className="gap-2 p-4 pt-0">
        {state.phase === 'plan' ? (
          <KenneyButton onClick={() => setState((s) => startSession(s))} variant="green">{tc('mg.SessionScrambleGame.start', 'Start the clock')}</KenneyButton>
        ) : running ? (
          <KenneyButton onClick={() => setState((s) => unassign(s, selected))} variant="blue">{tc('mg.SessionScrambleGame.stand_down', 'Stand {{name}} down', { name: sel.name })}</KenneyButton>
        ) : (
          <KenneyButton onClick={() => onComplete(result.total, allReady)} variant="green">{tc('mg.SessionScrambleGame.done_button', 'Done')}</KenneyButton>
        )}
      </DialogFooter>
    </MinigameChrome>
  );
};
