/**
 * Central toast admission control: dedupe identical messages, coalesce rapid-fire
 * spam, and shorten durations under reduced motion. Pure helpers so checks stay
 * DOM-free; the React/Sonner bridge lives in hooks/use-toast.ts.
 */

export type ToastPriority = 'critical' | 'important' | 'routine' | 'quiet';

/** Player preference: 'important' hides routine toasts, 'off' hides everything but critical failures. */
export type ToastLevel = 'all' | 'important' | 'off';

export type ToastAdmission = {
  allow: boolean;
  /** Stable id for Sonner coalesce updates when a duplicate is folded. */
  coalesceId?: string;
  durationMs?: number;
};

export type ToastGateInput = {
  title: string;
  description?: string;
  variant?: string;
  priority?: ToastPriority;
  duration?: number;
  now?: number;
};

export type ToastGateConfig = {
  /** Identical title+description within this window is dropped / coalesced. */
  dedupeWindowMs: number;
  /** Max non-critical toasts admitted per rolling window. */
  rateLimitCount: number;
  rateLimitWindowMs: number;
  defaultDurationMs: number;
  criticalDurationMs: number;
  routineDurationMs: number;
  reducedMotionDurationMs: number;
};

export const DEFAULT_TOAST_GATE_CONFIG: ToastGateConfig = {
  dedupeWindowMs: 2800,
  rateLimitCount: 3,
  rateLimitWindowMs: 4000,
  defaultDurationMs: 3200,
  criticalDurationMs: 5200,
  routineDurationMs: 2200,
  reducedMotionDurationMs: 1800,
};

type RecentEntry = { key: string; at: number; id: string };

export function fingerprintToast(title: string, description?: string): string {
  return `${String(title ?? '').trim()}::${String(description ?? '').trim()}`.toLowerCase();
}

export function resolveToastPriority(
  variant: string | undefined,
  explicit?: ToastPriority
): ToastPriority {
  if (explicit) return explicit;
  if (variant === 'destructive') return 'critical';
  return 'important';
}

export function prefersReducedMotion(
  matchMedia: ((query: string) => { matches: boolean }) | undefined = typeof window !== 'undefined'
    ? window.matchMedia.bind(window)
    : undefined
): boolean {
  try {
    return Boolean(matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  } catch {
    return false;
  }
}

export class ToastGate {
  private recent: RecentEntry[] = [];
  private admittedAt: number[] = [];
  private seq = 0;
  level: ToastLevel = 'all';

  constructor(private config: ToastGateConfig = DEFAULT_TOAST_GATE_CONFIG) {}

  reset(): void {
    this.recent = [];
    this.admittedAt = [];
    this.seq = 0;
  }

  /** Quiet priority never surfaces as a toast — callers may log instead. */
  admit(input: ToastGateInput): ToastAdmission {
    const now = input.now ?? Date.now();
    const priority = resolveToastPriority(input.variant, input.priority);

    if (priority === 'quiet') {
      return { allow: false };
    }
    if (priority !== 'critical' && (this.level === 'off' || (this.level === 'important' && priority === 'routine'))) {
      return { allow: false };
    }

    this.prune(now);
    const key = fingerprintToast(String(input.title ?? ''), input.description ? String(input.description) : undefined);
    const duplicate = this.recent.find((entry) => entry.key === key);

    if (duplicate) {
      // Critical failures still refresh the existing toast instead of stacking.
      if (priority === 'critical') {
        return {
          allow: true,
          coalesceId: duplicate.id,
          durationMs: this.durationFor(priority, input.duration),
        };
      }
      return { allow: false, coalesceId: duplicate.id };
    }

    if (priority !== 'critical') {
      const inWindow = this.admittedAt.filter((at) => now - at < this.config.rateLimitWindowMs);
      if (inWindow.length >= this.config.rateLimitCount) {
        return { allow: false };
      }
    }

    this.seq += 1;
    const id = `rst-toast-${this.seq}`;
    this.recent.push({ key, at: now, id });
    this.admittedAt.push(now);

    return {
      allow: true,
      coalesceId: id,
      durationMs: this.durationFor(priority, input.duration),
    };
  }

  private durationFor(priority: ToastPriority, explicit?: number): number {
    if (typeof explicit === 'number' && Number.isFinite(explicit)) {
      return prefersReducedMotion()
        ? Math.min(explicit, this.config.reducedMotionDurationMs)
        : explicit;
    }
    if (prefersReducedMotion()) return this.config.reducedMotionDurationMs;
    if (priority === 'critical') return this.config.criticalDurationMs;
    if (priority === 'routine') return this.config.routineDurationMs;
    return this.config.defaultDurationMs;
  }

  private prune(now: number): void {
    const keepMs = Math.max(this.config.dedupeWindowMs, this.config.rateLimitWindowMs);
    this.recent = this.recent.filter((entry) => now - entry.at < this.config.dedupeWindowMs);
    this.admittedAt = this.admittedAt.filter((at) => now - at < keepMs);
  }
}

/** Shared singleton used by the Sonner bridge. */
export const toastGate = new ToastGate();
