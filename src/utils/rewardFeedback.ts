import { xpForPlayerLevel } from './playerUtils';
type Snapshot = { money: number; xp: number; level: number; day: number };
export function rewardGains(before: Snapshot, after: Snapshot) {
  if (![...Object.values(before), ...Object.values(after)].every(Number.isFinite) ||
      after.day < before.day || after.level < before.level || after.level - before.level > 100) {
    return { money: 0, xp: 0 };
  }
  let xp = after.xp - before.xp;
  for (let level = before.level; level < after.level; level++) xp += xpForPlayerLevel(level);
  return { money: Math.max(0, after.money - before.money), xp: Math.max(0, xp) };
}
