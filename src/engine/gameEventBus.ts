/**
 * gameEventBus.ts
 * Strongly typed, zero-overhead Pub/Sub event bus for Recording Studio Tycoon.
 * Decouples core simulation logic from audio triggers, cutscenes, notifications, and UI.
 */
import type { GameSettings } from '../contexts/settings-context-types';

export interface GameEventPayloads {
  'project:take_locked': {
    projectId: string;
    grade: 'Gold' | 'Silver' | 'Solid';
    energyBurned: number;
    score: number;
    takeNumber: number;
  };
  'project:stage_advance': {
    projectId: string;
    stageIndex: number;
    stageName: string;
  };
  'project:completed': {
    projectId: string;
    finalGrade: string;
    revenue: number;
    reputationGain: number;
  };
  'chart:placement': {
    chartName: string;
    title: string;
    position: number;
    previousPosition?: number;
  };
  'minigame:success': {
    minigameType?: string;
    score: number;
  };
  'studio:tier_upgraded': {
    oldTier: number;
    newTier: number;
  };
  'studio:era_transition': {
    fromEra: string;
    toEra: string;
  };
  'studio:day_advanced': {
    currentDay: number;
  };
  'audio:trigger_cue': {
    soundId: string;
    category?: 'sfx' | 'ui' | 'take';
    volume?: number;
  };
  'settings:changed': {
    changed: Partial<GameSettings>;
    all: GameSettings;
  };
  'graphics:resolution_changed': {
    scale: number;
    effectiveDpr: number;
  };
}

export type GameEventKey = keyof GameEventPayloads;
type EventHandler<T> = (payload: T) => void;

export class GameEventBus {
  private listeners: Map<string, Set<EventHandler<any>>> = new Map();

  public on<K extends GameEventKey>(
    event: K,
    handler: EventHandler<GameEventPayloads[K]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  public once<K extends GameEventKey>(
    event: K,
    handler: EventHandler<GameEventPayloads[K]>
  ): () => void {
    const wrapped: EventHandler<GameEventPayloads[K]> = (payload) => {
      this.off(event, wrapped);
      handler(payload);
    };
    return this.on(event, wrapped);
  }

  public off<K extends GameEventKey>(
    event: K,
    handler: EventHandler<GameEventPayloads[K]>
  ): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(handler);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  public emit<K extends GameEventKey>(event: K, payload: GameEventPayloads[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const handler of Array.from(set)) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[GameEventBus] Error in handler for event "${event}":`, err);
      }
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}

export const gameEvents = new GameEventBus();
