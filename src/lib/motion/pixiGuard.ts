/**
 * Runtime enforcement of the GPU-exclusivity invariant from qualification.ts:
 * only the living-studio Pixi Application may own a WebGL viewport during play.
 * Any other owner (e.g. the legacy project-cards bridge in src/pixi-ui) must not
 * create a second Application while the studio floor holds the claim.
 */
export const STUDIO_FLOOR_OWNER = 'studio-floor';

const claims = new Map<string, number>();

export class PixiExclusivityError extends Error {
  constructor(requester: string, holder: string) {
    super(`Pixi Application "${requester}" refused: "${holder}" already owns the GPU viewport (single-renderer invariant).`);
    this.name = 'PixiExclusivityError';
  }
}

/**
 * Claim the right to create a Pixi Application. Re-claims by the same owner are
 * allowed (async teardown / StrictMode remounts overlap); a different owner throws.
 * Returns an idempotent release function.
 */
export function claimPixiApplication(owner: string): () => void {
  for (const [holder, count] of claims) {
    if (holder !== owner && count > 0) throw new PixiExclusivityError(owner, holder);
  }
  claims.set(owner, (claims.get(owner) ?? 0) + 1);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const next = (claims.get(owner) ?? 1) - 1;
    if (next <= 0) claims.delete(owner);
    else claims.set(owner, next);
  };
}

export function activePixiOwners(): string[] {
  return [...claims.keys()];
}
