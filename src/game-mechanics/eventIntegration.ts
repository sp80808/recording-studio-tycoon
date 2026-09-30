import { GameState } from '../types/game';
import { spend } from '../economy/ledger';
import { EventEffect, EventImpactTarget, RandomEvent, RandomEventService } from './random-events';
import { SAMPLE_RANDOM_EVENTS } from './sample-data';

/**
 * Random-event wiring for the daily tick (bead ruc.3).
 *
 * Previously `RandomEventService` was constructed inside useGameLogic but
 * never evaluated, and its `applyEventEffects` body was commented-out stubs
 * referencing a *different* GameState shape (`studioReputation`,
 * `completedProjects`) that does not exist on the real one. This module is
 * the live bridge: it rolls events on the daily tick and folds their effects
 * into the real GameState immutably.
 *
 * Design notes
 * - Effects are applied as one-shot deltas when an event fires. Timed
 *   (`duration > 0`) re-application/reversal is not modelled yet — the
 *   duration is surfaced to the player as narrative instead.
 * - `GenrePopularity` / `ContractValue` / `MarketDemand` have no GameState
 *   field yet, so they are reported as narrative only. Payout market
 *   sensitivity currently reads the static era table
 *   (eraProgression.getGenreMarketMultiplier), not runtime trend data.
 */

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/** How many condition points 1 unit of EquipmentEfficiency is worth. */
const EQUIPMENT_CONDITION_PER_EFFICIENCY = 1 / 5;

let serviceSingleton: RandomEventService | null = null;

/**
 * Module-level singleton so trigger cooldowns and history survive React
 * re-renders (recreating the service every render would reset them).
 *
 * Events that present `playerChoices` are excluded until an event-choice
 * dialog exists (bead ruc.4) — otherwise the player would get a decision
 * event that silently resolves itself.
 */
export function getRandomEventService(): RandomEventService {
  if (!serviceSingleton) {
    const autoResolvable = SAMPLE_RANDOM_EVENTS.filter(event => !event.playerChoices);
    serviceSingleton = new RandomEventService(autoResolvable);
  }
  return serviceSingleton;
}

/** Test/debug helper: clears cooldown + trigger history. */
export function resetRandomEventService(): void {
  serviceSingleton = null;
}

export interface AppliedEffect {
  target: EventImpactTarget;
  description: string;
  magnitude: number;
  /** Human-readable delta, e.g. "+12 reputation". */
  summary: string;
}

export interface EventApplication {
  /** New state; the input is never mutated. */
  state: GameState;
  /** Effects that actually changed GameState. */
  applied: AppliedEffect[];
  /** Effects with no GameState field yet — narrative only. */
  narrative: string[];
}

/**
 * Folds a single event's effects into GameState.
 *
 * Sign conventions
 * - StudioReputation: added to reputation (clamped 0-100).
 * - StaffMood: added to every hired staff member's mood (clamped 0-100).
 * - EquipmentEfficiency: magnitude/5 added to every owned item's condition.
 * - OperatingCosts: positive magnitude = costs rose (cash out, expenses up);
 *   negative = savings/refund (cash in, expenses down).
 */
export function applyEventToState(state: GameState, event: RandomEvent): EventApplication {
  const applied: AppliedEffect[] = [];
  const narrative: string[] = [];
  let next: GameState = state;

  const record = (effect: EventEffect, summary: string) =>
    applied.push({ target: effect.target, description: effect.description, magnitude: effect.magnitude, summary });

  const asNarrative = (effect: EventEffect) =>
    narrative.push(effect.description || `${effect.target} ${effect.magnitude >= 0 ? '+' : ''}${effect.magnitude}`);

  event.effects.forEach(effect => {
    switch (effect.target) {
      case 'StudioReputation': {
        const before = state.reputation;
        const reputation = clamp(before + effect.magnitude, 0, 100);
        next = { ...next, reputation };
        const delta = reputation - before;
        record(effect, `${delta >= 0 ? '+' : ''}${delta} reputation`);
        break;
      }
      case 'StaffMood': {
        if (next.hiredStaff.length === 0) { asNarrative(effect); break; }
        const lowestBefore = Math.min(...next.hiredStaff.map(s => s.mood));
        next = {
          ...next,
          hiredStaff: next.hiredStaff.map(s => ({ ...s, mood: clamp(s.mood + effect.magnitude, 0, 100) })),
        };
        const delta = Math.min(...next.hiredStaff.map(s => s.mood)) - lowestBefore;
        record(effect, `${delta >= 0 ? '+' : ''}${delta} crew mood`);
        break;
      }
      case 'EquipmentEfficiency': {
        if (next.ownedEquipment.length === 0) { asNarrative(effect); break; }
        const delta = Math.round(effect.magnitude * EQUIPMENT_CONDITION_PER_EFFICIENCY);
        next = {
          ...next,
          ownedEquipment: next.ownedEquipment.map(eq => ({
            ...eq,
            condition: clamp((eq.condition ?? 100) + delta, 0, 100),
          })),
        };
        record(effect, `${delta >= 0 ? '+' : ''}${delta} equipment condition`);
        break;
      }
      case 'OperatingCosts': {
        const expenses = next.financials.expenses + effect.magnitude;
        next = {
          ...spend(next, effect.magnitude, { category: 'event-cost', memo: 'Operating costs event' }),
          financials: { ...next.financials, expenses, profit: next.financials.income - expenses },
        };
        record(effect, `${effect.magnitude >= 0 ? '-' : '+'}$${Math.abs(effect.magnitude)} operating costs`);
        break;
      }
      default:
        // GenrePopularity / ContractValue / MarketDemand have no GameState
        // field yet — report as narrative only.
        asNarrative(effect);
        break;
    }
  });

  return { state: next, applied, narrative };
}

/** Rolls the daily event check. Pure — does not mutate `state`. */
export function rollDailyEvents(state: GameState): RandomEvent[] {
  return getRandomEventService().evaluateEvents(state, state.currentDay);
}

/** Applies a batch of already-rolled events onto state immutably. */
export function applyEventsToState(
  state: GameState,
  events: RandomEvent[]
): { state: GameState; results: EventApplication[] } {
  const results: EventApplication[] = [];
  let current = state;
  for (const event of events) {
    const outcome = applyEventToState(current, event);
    current = outcome.state;
    results.push(outcome);
  }
  return { state: current, results };
}


