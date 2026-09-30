/**
 * End-of-day beat (immersion audit #8).
 *
 * When a day closes the director leaves one short line on the ledger: a remembered story beat coming back
 * ("Mara's thank-you note is still pinned by the console"), or a plain read of how the day went. The line is
 * chosen by the same seeded, cooldown-aware machinery as every other story beat and is stored, so a reload
 * shows the same line and it is never re-rolled.
 *
 * It is deliberately light: never a modal, never blocks input, one line, and it belongs to the day that just
 * closed — the UI hides it the moment the day changes again, so there is no second clock.
 */
import type { GameState } from '@/types/game';
import { getDirector, pickWeighted } from './eventDirector';

export type DayCloseTone = 'good' | 'neutral' | 'warn';

export interface DayCloseBeat {
  /** The day this beat is shown on (the new day). */
  day: number;
  lineId: string;
  text: string;
  tone: DayCloseTone;
}

/** Same line is not repeated within this many days. */
export const DAY_CLOSE_REPEAT_DAYS = 8;
/** Memories younger than this many days can be recalled. */
export const DAY_CLOSE_MEMORY_WINDOW = 4;
const LOG_LIMIT = 24;

interface Line {
  text: string;
  tone: DayCloseTone;
}

/** Authored lines keyed by memory key (client/staff/gear/studio scope all share the namespace). */
export const MEMORY_LINES: Readonly<Record<string, Line>> = {
  'rush-success': { text: 'The thank-you from the rush job is still pinned above the console.', tone: 'good' },
  'rush-poor': { text: 'Someone keeps glancing at the rushed master and sighing.', tone: 'warn' },
  'rush-respected': { text: 'A small note of thanks sits on the desk. No rush this time.', tone: 'good' },
  'referral-made': { text: 'A new name is pencilled into tomorrow’s diary, courtesy of a friend.', tone: 'good' },
  'scout-toured': { text: 'The label scout’s coffee cup is still on the tape machine.', tone: 'good' },
  'scout-declined': { text: 'The room is quiet. The clients’ secrets are safe.', tone: 'neutral' },
  'mediated-conflict': { text: 'The live room is calm. Both sides are still talking to each other.', tone: 'good' },
  'backed-by-boss': { text: 'Your engineer is humming as they wind up the cables.', tone: 'good' },
  'serviced-after-heat': { text: 'The desk runs cool tonight. It even smells clean.', tone: 'good' },
  'ran-hot-ignored': { text: 'The little fan is working hard. Something smells faintly warm.', tone: 'warn' },
  'prestige-credit': { text: 'Your name in the credits is still earning its keep.', tone: 'good' },
  signed_union_scale: { text: 'The horn section packs up on time, and on scale.', tone: 'good' },
  gave_crew_time_off: { text: 'The whole crew leaves on time. Nobody looks tired.', tone: 'good' },
  pushed_the_crew: { text: 'The crew shuffle out late, saying very little.', tone: 'warn' },
  gave_hero_secret_session: { text: 'A gold-record plaque hangs crooked above the door. Nobody fixes it.', tone: 'good' },
  held_the_dynamics: { text: 'Someone plays a quiet record on the big speakers. It sounds alive.', tone: 'good' },
  crushed_the_master: { text: 'Someone turns the monitors down. It was very loud today.', tone: 'neutral' },
  paid_the_audit_openly: { text: 'The books are open and nobody is worried.', tone: 'good' },
};

/** Lines that only read the day's numbers. */
const factLines = (moneyDelta: number, repDelta: number): Array<Line & { id: string; weight: number }> => {
  const out: Array<Line & { id: string; weight: number }> = [];
  if (moneyDelta > 0) out.push({ id: 'fact-busy', text: 'A busy day. The till is heavier than this morning.', tone: 'good', weight: 2 });
  if (moneyDelta < 0) out.push({ id: 'fact-lean', text: 'A lean day. The bills came in faster than the clients.', tone: 'warn', weight: 2 });
  if (repDelta > 0) out.push({ id: 'fact-word', text: 'Word is getting around. The phone rang twice after six.', tone: 'good', weight: 2 });
  out.push({ id: 'fact-quiet', text: 'A quiet close. The tape machine ticks as it cools.', tone: 'neutral', weight: 0.5 });
  return out;
};

const recentLog = (state: GameState) =>
  (getDirector(state).dayCloseLog ?? []).filter((e) => state.currentDay - e.day < DAY_CLOSE_REPEAT_DAYS);

/**
 * Choose the beat for the day that has just closed. `prev` is the state before the day advanced, `next` after.
 * Pure: same inputs, same line.
 */
export const pickDayCloseBeat = (prev: GameState, next: GameState): DayCloseBeat | null => {
  if (!next.storylineState) return null;
  const used = new Set(recentLog(next).map((e) => e.lineId));
  const director = getDirector(next);

  const memoryLines = director.memories
    .filter((m) => next.currentDay - m.createdDay <= DAY_CLOSE_MEMORY_WINDOW && MEMORY_LINES[m.key])
    .map((m) => ({ id: `mem-${m.key}`, weight: 3, ...MEMORY_LINES[m.key] }));
  const facts = factLines(next.money - prev.money, next.reputation - prev.reputation);

  const pool = [...memoryLines, ...facts].map((l) => ({ ...l, family: 'dayclose' })).filter((l) => !used.has(l.id));
  if (pool.length === 0) return null;
  const pick = pickWeighted(next, pool, `dayclose:${next.currentDay}`);
  if (!pick) return null;
  return { day: next.currentDay, lineId: pick.id, text: pick.text, tone: pick.tone };
};

/**
 * Attach the day-close beat to the state after `advanceDay`. Idempotent per day: if a beat already exists for
 * `next.currentDay` it is kept (so a reload or a second call never re-rolls).
 */
export const withDayCloseBeat = (prev: GameState, next: GameState): GameState => {
  const story = next.storylineState;
  if (!story) return next;
  const director = getDirector(next);
  if (director.dayClose?.day === next.currentDay) return next;
  const beat = pickDayCloseBeat(prev, next);
  if (!beat) return next;
  const log = [...(director.dayCloseLog ?? []), { day: beat.day, lineId: beat.lineId }].slice(-LOG_LIMIT);
  return {
    ...next,
    storylineState: { ...story, director: { ...director, dayClose: beat, dayCloseLog: log } },
  };
};

/** The beat to show right now, or null (only ever for the day it belongs to). */
export const getDayCloseBeat = (state: GameState): DayCloseBeat | null => {
  const beat = state.storylineState?.director?.dayClose;
  return beat && beat.day === state.currentDay ? beat : null;
};
