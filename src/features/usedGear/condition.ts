import type { Equipment, EquipmentCategory } from '@/types/game';

export const clampCondition = (condition: number): number =>
  Math.max(0, Math.min(100, Number.isFinite(condition) ? condition : 100));

export const conditionBand = (condition: number): 'Excellent' | 'Good' | 'Worn' | 'Poor' | 'Critical' => {
  const value = clampCondition(condition);
  return value >= 80 ? 'Excellent' : value >= 60 ? 'Good' : value >= 40 ? 'Worn' : value >= 20 ? 'Poor' : 'Critical';
};

export const maintenanceCategories: readonly EquipmentCategory[] = ['interface', 'microphone', 'mixer', 'outboard'];
export const isMaintainable = (item: Equipment): boolean => maintenanceCategories.includes(item.category);
export const isGearAvailable = (item: Equipment, day?: number): boolean =>
  !item.maintenance && (!item.fault || (day !== undefined && day >= item.fault.readyDay));

export const wearPerSession = (item: Equipment, familiarity = 0): number => {
  if (!isMaintainable(item)) return 0;
  const base = item.category === 'microphone' ? 0.25 : item.category === 'interface' ? 0.3 : 0.4;
  return base * (item.quirks?.length ? 1.25 : 1) * (1 - Math.min(5, Math.max(0, familiarity)) * 0.04);
};

export const reliabilityDescription = (item: Equipment, day: number): string => {
  if (item.maintenance) return item.maintenance.status === 'calibrating'
    ? `Unavailable: resume calibration; then ${item.maintenance.kind === 'service' ? 1 : 2} day(s) on the bench.`
    : `Unavailable: ${item.maintenance.kind} completes on day ${item.maintenance.readyDay}.`;
  if (!isGearAvailable(item, day)) return `Noisy contact: unavailable until day ${item.fault!.readyDay}; maintenance improves reliability.`;
  const condition = clampCondition(item.condition);
  if (condition < 40) return `${conditionBand(condition)} reliability: elevated interruption risk (one day; no destruction).`;
  if (!isMaintainable(item)) return `${conditionBand(condition)} condition; no wear in this slice.`;
  return `${conditionBand(condition)} reliability. Service recommended in ~${Math.max(1, Math.ceil((condition - 60) / wearPerSession(item)))} sessions.`;
};
