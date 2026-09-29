/**
 * engineLoop.ts
 * Decoupled authoritative simulation & render loop for Recording Studio Tycoon.
 * Implements a fixed-step simulation accumulator (default 20Hz / 50ms) decoupled
 * from the rendering frame rate, with delta clamping and background tab power-saving.
 */

export interface EngineTickEvent {
  deltaSec: number;
  totalTimeSec: number;
  isBackground: boolean;
}

export interface EngineLoopOptions {
  fixedStepSec?: number; // Default 0.05 (20Hz)
  maxDeltaSec?: number;  // Default 0.25 (250ms)
}

type TickCallback = (event: EngineTickEvent) => void;
type FixedTickCallback = (fixedDeltaSec: number) => void;

export class EngineLoop {
  private fixedStepSec: number;
  private maxDeltaSec: number;
  private running = false;
  private accumulatorSec = 0;
  private totalTimeSec = 0;
  private lastTimestampMs = 0;
  private rafId: number | null = null;
  private isBackground = false;

  private tickListeners: Set<TickCallback> = new Set();
  private fixedTickListeners: Set<FixedTickCallback> = new Set();

  constructor(options: EngineLoopOptions = {}) {
    this.fixedStepSec = options.fixedStepSec ?? 0.05;
    this.maxDeltaSec = options.maxDeltaSec ?? 0.25;

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.isBackground = document.hidden;
      });
    }
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTimestampMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.scheduleFrame();
  }

  public stop(): void {
    this.running = false;
    if (this.rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public isRunning(): boolean {
    return this.running;
  }

  public onTick(cb: TickCallback): () => void {
    this.tickListeners.add(cb);
    return () => this.tickListeners.delete(cb);
  }

  public onFixedTick(cb: FixedTickCallback): () => void {
    this.fixedTickListeners.add(cb);
    return () => this.fixedTickListeners.delete(cb);
  }

  public getAccumulatorSec(): number {
    return this.accumulatorSec;
  }

  public simulateStep(rawDeltaSec: number): void {
    const deltaSec = Math.min(rawDeltaSec, this.maxDeltaSec);
    this.totalTimeSec += deltaSec;
    this.accumulatorSec += deltaSec;

    while (this.accumulatorSec >= this.fixedStepSec) {
      for (const fixedCb of Array.from(this.fixedTickListeners)) {
        try {
          fixedCb(this.fixedStepSec);
        } catch (err) {
          console.error('[EngineLoop] Error in fixed tick callback:', err);
        }
      }
      this.accumulatorSec -= this.fixedStepSec;
    }

    const event: EngineTickEvent = {
      deltaSec,
      totalTimeSec: this.totalTimeSec,
      isBackground: this.isBackground,
    };

    for (const tickCb of Array.from(this.tickListeners)) {
      try {
        tickCb(event);
      } catch (err) {
        console.error('[EngineLoop] Error in render tick callback:', err);
      }
    }
  }

  private scheduleFrame(): void {
    if (!this.running || typeof requestAnimationFrame === 'undefined') return;

    this.rafId = requestAnimationFrame((timestampMs) => {
      const rawDeltaSec = (timestampMs - this.lastTimestampMs) / 1000;
      this.lastTimestampMs = timestampMs;
      this.simulateStep(rawDeltaSec);
      this.scheduleFrame();
    });
  }
}

export const engineLoop = new EngineLoop();
