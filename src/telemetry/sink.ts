import {
  BALANCE_VERSION, SIMULATION_VERSION, sanitizeProperties,
  type GameplayEventName, type GameplayEventSink, type GameplayTelemetryEvent,
} from './gameplayEvents';

export const BUFFER_LIMIT = 500;

/** Bounded in-memory sink. The oldest events roll off, so a long session cannot grow it without limit. */
export class BufferedSink implements GameplayEventSink {
  private events: GameplayTelemetryEvent[] = [];
  constructor(private readonly limit = BUFFER_LIMIT) {}
  capture(event: GameplayTelemetryEvent): void {
    this.events.push(event);
    if (this.events.length > this.limit) this.events.splice(0, this.events.length - this.limit);
  }
  snapshot(): GameplayTelemetryEvent[] { return this.events.slice(); }
  clear(): void { this.events = []; }
}

const newRunId = (): string => `run-${Date.now().toString(36)}-${Math.floor(Math.random() * 0x7fffffff).toString(36)}`;

/**
 * The one facade gameplay code uses. Capturing can never throw or block: every call is guarded, and a broken
 * sink is replaced by silence rather than an error in the game.
 */
export class GameplayTelemetry {
  readonly buffer = new BufferedSink();
  private sink: GameplayEventSink = this.buffer;
  private runId = newRunId();
  private seed: string | undefined;
  private seen = new Set<string>();

  /** Swap the sink (for tests or an opt-in remote adapter). The local buffer always keeps recording. */
  setSink(sink: GameplayEventSink | null): void { this.sink = sink ?? this.buffer; }

  /** Begin a new run (new game or loaded save). The id is random and carries no identity. */
  startRun(seed?: string | number): string {
    this.runId = newRunId();
    this.seed = seed === undefined ? undefined : String(seed);
    this.buffer.clear();
    this.seen.clear();
    return this.runId;
  }

  currentRunId(): string { return this.runId; }
  currentSeed(): string | undefined { return this.seed; }

  /**
   * `onceKey` makes a capture idempotent for the run (a state updater may run twice in strict mode, and a
   * reload-safe settlement must not look like two settlements).
   */
  capture(name: GameplayEventName, gameDay: number, properties?: Record<string, unknown>, onceKey?: string): void {
    try {
      if (onceKey) {
        const key = `${name}:${onceKey}`;
        if (this.seen.has(key)) return;
        this.seen.add(key);
      }
      const event: GameplayTelemetryEvent = {
        name,
        runId: this.runId,
        gameDay: Number.isFinite(gameDay) ? Math.round(gameDay) : 0,
        simulationVersion: SIMULATION_VERSION,
        balanceVersion: BALANCE_VERSION,
        ...(this.seed !== undefined ? { seed: this.seed } : {}),
        properties: sanitizeProperties(name, properties),
      };
      if (this.sink !== this.buffer) this.buffer.capture(event);
      this.sink.capture(event);
    } catch {
      this.sink = this.buffer; // never let a failing adapter break play
    }
  }
}

export const telemetry = new GameplayTelemetry();
