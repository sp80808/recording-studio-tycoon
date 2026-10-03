/** Structured diff of two JSON values (#64): one line per changed leaf, so exported content reads as a reviewable change. */
export interface DiffLine { path: string; kind: 'added' | 'removed' | 'changed'; before?: unknown; after?: unknown }

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function structuredDiff(before: unknown, after: unknown, path = ''): DiffLine[] {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  if (isObj(before) && isObj(after)) {
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
    return keys.flatMap((k) => {
      const p = path ? `${path}.${k}` : k;
      if (!(k in after) || after[k] === undefined) return before[k] === undefined ? [] : [{ path: p, kind: 'removed' as const, before: before[k] }];
      if (!(k in before) || before[k] === undefined) return [{ path: p, kind: 'added' as const, after: after[k] }];
      return structuredDiff(before[k], after[k], p);
    });
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    const out: DiffLine[] = [];
    for (let i = 0; i < Math.max(before.length, after.length); i++) {
      const p = `${path}[${i}]`;
      if (i >= after.length) out.push({ path: p, kind: 'removed', before: before[i] });
      else if (i >= before.length) out.push({ path: p, kind: 'added', after: after[i] });
      else out.push(...structuredDiff(before[i], after[i], p));
    }
    return out;
  }
  return [{ path: path || '(root)', kind: 'changed', before, after }];
}

export const diffToText = (lines: DiffLine[]): string =>
  lines.map((l) => (l.kind === 'added' ? `+ ${l.path}: ${JSON.stringify(l.after)}` : l.kind === 'removed' ? `- ${l.path}: ${JSON.stringify(l.before)}` : `~ ${l.path}: ${JSON.stringify(l.before)} → ${JSON.stringify(l.after)}`)).join('\n');
