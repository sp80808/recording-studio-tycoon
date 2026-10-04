import type { GameState, ProjectReport } from '@/types/game';
import { applyReportToState } from '@/game-mechanics/ProjectService';
import { DEPOSIT_RATE, ROOM_HOUR_COST, REVISION_ALLOWANCE, REVISION_ROUND_FEE, SYNERGY_DAYS } from '@/rpg/serviceQuote';
import { FILLER_PAY_FACTOR, FILLER_MAX } from '@/rpg/fillerJobs';
import {
  BALANCE_VERSION, SIMULATION_VERSION, TRACE_SCHEMA_VERSION, fnv1a,
  type GameplayTelemetryEvent,
} from './gameplayEvents';
import type { GameplayTelemetry } from './sink';

/** Authoritative actions a trace can replay headlessly. Presentation-only events are never replayed. */
export type TraceAction = { kind: 'settle'; day: number; report: ProjectReport; expectedHash: string };

export interface GameplayTrace {
  schemaVersion: number;
  runId: string;
  seed?: string;
  simulationVersion: string;
  balanceVersion: string;
  balanceHash: string;
  scenarioId: string;
  initialHash: string;
  events: GameplayTelemetryEvent[];
  /** Replayable authoritative actions. Live play records events only (state also changes outside this list). */
  actions: TraceAction[];
}

/** Hash of the balance numbers a trace was produced under, so a drifted constant shows up in comparisons. */
export const balanceHash = (): string => fnv1a(JSON.stringify({
  DEPOSIT_RATE, ROOM_HOUR_COST, REVISION_ALLOWANCE, REVISION_ROUND_FEE, SYNERGY_DAYS, FILLER_PAY_FACTOR, FILLER_MAX,
}));

/** Fingerprint of the authoritative settlement-owned state. Presentation and ids are excluded. */
export const hashState = (s: GameState): string => fnv1a(JSON.stringify({
  money: s.money,
  reputation: s.reputation,
  influence: s.influence,
  income: s.financials?.income,
  reports: (s.financials?.reports ?? []).map((r) => r.projectId),
  ledger: (s.ledger?.entries ?? []).map((e) => [e.category, e.sourceId ?? null, e.amount]),
  serviceLog: (s.serviceLog ?? []).map((r) => [r.projectId, r.service, r.revenue]),
  clients: Object.entries(s.clientRelationships ?? {}).sort(([a], [b]) => a.localeCompare(b)).map(([k, c]) => [k, c.sessionsCompleted, c.relationshipXp]),
}));

export interface ReplayResult {
  ok: boolean;
  finalHash: string;
  /** First action whose resulting state differed from the trace. */
  divergence?: { index: number; kind: string; expected: string; actual: string };
}

export const replayGameplayTrace = (initialState: GameState, trace: GameplayTrace): ReplayResult => {
  if (trace.schemaVersion !== TRACE_SCHEMA_VERSION) {
    return { ok: false, finalHash: hashState(initialState), divergence: { index: -1, kind: 'schema', expected: String(TRACE_SCHEMA_VERSION), actual: String(trace.schemaVersion) } };
  }
  const startHash = hashState(initialState);
  if (startHash !== trace.initialHash) {
    return { ok: false, finalHash: startHash, divergence: { index: -1, kind: 'initial-state', expected: trace.initialHash, actual: startHash } };
  }
  let state = initialState;
  for (let i = 0; i < trace.actions.length; i++) {
    const a = trace.actions[i];
    if (a.kind === 'settle') state = applyReportToState({ ...state, currentDay: a.day }, a.report);
    const actual = hashState(state);
    if (actual !== a.expectedHash) return { ok: false, finalHash: actual, divergence: { index: i, kind: a.kind, expected: a.expectedHash, actual } };
  }
  return { ok: true, finalHash: hashState(state) };
};

/** Run the actions from an initial state and record the resulting hashes, producing a replayable trace. */
export const buildScenarioTrace = (
  scenarioId: string,
  initialState: GameState,
  actions: Array<Omit<TraceAction, 'expectedHash'>>,
  meta: { runId?: string; seed?: string } = {},
): GameplayTrace => {
  let state = initialState;
  const sealed: TraceAction[] = actions.map((a) => {
    state = applyReportToState({ ...state, currentDay: a.day }, a.report);
    return { ...a, expectedHash: hashState(state) };
  });
  return {
    schemaVersion: TRACE_SCHEMA_VERSION,
    runId: meta.runId ?? `scenario-${scenarioId}`,
    ...(meta.seed ? { seed: meta.seed } : {}),
    simulationVersion: SIMULATION_VERSION,
    balanceVersion: BALANCE_VERSION,
    balanceHash: balanceHash(),
    scenarioId,
    initialHash: hashState(initialState),
    events: [],
    actions: sealed,
  };
};

/** Export the live buffer as a trace. No identity, no notes: a playtest note refers to `runId` from outside. */
export const exportLiveTrace = (t: GameplayTelemetry, scenarioId = 'live'): GameplayTrace => ({
  schemaVersion: TRACE_SCHEMA_VERSION,
  runId: t.currentRunId(),
  ...(t.currentSeed() ? { seed: t.currentSeed() } : {}),
  simulationVersion: SIMULATION_VERSION,
  balanceVersion: BALANCE_VERSION,
  balanceHash: balanceHash(),
  scenarioId,
  initialHash: '',
  events: t.buffer.snapshot(),
  actions: [],
});
