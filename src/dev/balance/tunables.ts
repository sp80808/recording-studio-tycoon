/**
 * Balance Lab tunables (#57): the numeric knobs a developer may move, with safe ranges and the reason each one exists.
 * The typed `BalanceConfig` stays the source of truth. The lab only ever builds an in-memory override object on top
 * of it; nothing here writes source files, and clearing the overrides restores the repository baseline exactly.
 */
import { DEFAULT_BALANCE_CONFIG, resolveConfig, type BalanceConfig } from './config';

export type TunableGroup = 'Economy' | 'Enquiries' | 'Sessions' | 'Outcomes';

export interface Tunable {
  /** Dotted path into BalanceConfig, e.g. `dailyCost` or `play.minigamePoints`. */
  path: string;
  group: TunableGroup;
  label: string;
  min: number;
  max: number;
  step: number;
  /** Why this parameter exists and what moving it changes. */
  why: string;
}

export const TUNABLES: Tunable[] = [
  { path: 'startingCash', group: 'Economy', label: 'Starting cash', min: 0, max: 50000, step: 100, why: 'Runway before the first fee lands; the main lever on early bankruptcy.' },
  { path: 'dailyCost', group: 'Economy', label: 'Daily upkeep', min: 0, max: 1000, step: 5, why: 'Rent and wages stand-in; sets how much income a day must clear.' },
  { path: 'firstUpgradeCost', group: 'Economy', label: 'First upgrade cost', min: 500, max: 10000, step: 100, why: 'Cash that counts as the first meaningful upgrade; sets time to first expansion.' },
  { path: 'gemCashValue', group: 'Economy', label: 'Gem cash value', min: 5, max: 60, step: 1, why: 'How much a gem is worth in cash terms when judging reward share.' },
  { path: 'lootResaleFactor', group: 'Economy', label: 'Loot resale factor', min: 0.1, max: 1, step: 0.05, why: 'Share of a loot item\'s value realised when sold on.' },
  { path: 'projectsPerDay', group: 'Enquiries', label: 'Enquiries per day', min: 1, max: 8, step: 1, why: 'How much work is on offer each day; capacity pressure starts when this outruns the rooms.' },
  { path: 'startingReputation', group: 'Outcomes', label: 'Starting reputation', min: 0, max: 600, step: 5, why: 'Where the studio begins on the reputation curve; unlocks better enquiries.' },
  { path: 'repPerLevel', group: 'Outcomes', label: 'Reputation per level', min: 5, max: 100, step: 1, why: 'Reputation needed per player level; sets progression pace.' },
  { path: 'startingSkillLevel', group: 'Sessions', label: 'Starting skill level', min: 1, max: 20, step: 1, why: 'Every skill starts here; drives session quality.' },
  { path: 'studioLevel', group: 'Sessions', label: 'Studio tier', min: 1, max: 5, step: 1, why: 'Console tier; feeds ambient income and the room quality assumption.' },
  { path: 'equipmentQuality', group: 'Sessions', label: 'Equipment quality', min: 0, max: 100, step: 1, why: 'Stand-in for gear quality fed to settlement.' },
  { path: 'minigameRate', group: 'Sessions', label: 'Mini-game rate', min: 0, max: 1, step: 0.05, why: 'Chance a settled session also plays a rewarded mini-game (intervention uptake).' },
  { path: 'play.minigamePoints', group: 'Outcomes', label: 'Mini-game quality points', min: 0, max: 10, step: 1, why: 'Quality points an attended player earns from the mini-game bonus.' },
  { path: 'play.ambientTicksPerDay', group: 'Economy', label: 'Ambient ticks per day', min: 0, max: 60, step: 1, why: 'Ambient earning input; the limit says ambient should stay a quiet side income.' },
];

export type Overrides = Record<string, number>;

const read = (config: BalanceConfig, path: string): number => {
  const [a, b] = path.split('.');
  const v = b ? (config as never as Record<string, Record<string, number>>)[a][b] : (config as never as Record<string, number>)[a];
  return v;
};

export const baselineValue = (path: string): number => read(DEFAULT_BALANCE_CONFIG, path);

/** Clamp a value into the tunable's safe range and snap it to its step. Unknown paths are refused. */
export const clampTunable = (path: string, value: number): number => {
  const t = TUNABLES.find((x) => x.path === path);
  if (!t) throw new Error(`Unknown tunable: ${path}`);
  const v = Number.isFinite(value) ? value : baselineValue(path);
  const snapped = Math.round(v / t.step) * t.step;
  return Math.round(Math.max(t.min, Math.min(t.max, snapped)) * 1e6) / 1e6;
};

/** Set one override; a value equal to the baseline removes it, so "no overrides" always means the repository config. */
export const setOverride = (overrides: Overrides, path: string, value: number): Overrides => {
  const v = clampTunable(path, value);
  const next = { ...overrides };
  if (v === baselineValue(path)) delete next[path];
  else next[path] = v;
  return next;
};

export const resetGroup = (overrides: Overrides, group: TunableGroup): Overrides => {
  const next = { ...overrides };
  for (const t of TUNABLES) if (t.group === group) delete next[t.path];
  return next;
};

/** Turn flat overrides into the partial config the sweep takes. */
export const toConfigOverrides = (overrides: Overrides): Partial<BalanceConfig> => {
  const out: Record<string, unknown> = {};
  const play: Record<string, number> = {};
  for (const [path, raw] of Object.entries(overrides)) {
    const v = clampTunable(path, raw);
    const [a, b] = path.split('.');
    if (b === undefined) out[a] = v;
    else play[b] = v;
  }
  if (Object.keys(play).length) out.play = play;
  return out as Partial<BalanceConfig>;
};

export interface DiffLine { path: string; label: string; baseline: number; value: number }

/** What differs from the repository baseline, for the "diff against baseline" view and the promote-in-a-commit workflow. */
export const diffAgainstBaseline = (overrides: Overrides): DiffLine[] =>
  TUNABLES.filter((t) => t.path in overrides && overrides[t.path] !== baselineValue(t.path))
    .map((t) => ({ path: t.path, label: t.label, baseline: baselineValue(t.path), value: overrides[t.path] }));

/** The effective config for a scenario plus overrides (what a fresh simulation runs with). */
export const effectiveConfig = (scenarioConfig: Partial<BalanceConfig>, overrides: Overrides): BalanceConfig => {
  const o = toConfigOverrides(overrides);
  return resolveConfig({ ...scenarioConfig, ...o, play: { ...(scenarioConfig.play ?? {}), ...(o.play ?? {}) } as BalanceConfig['play'] });
};
