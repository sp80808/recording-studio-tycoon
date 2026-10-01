import type { Equipment, GameState } from '@/types/game';
import { INVENTORY_SLOT_ID } from '@/types/equipmentSlots';
import { availableEquipment, getEraAdjustedPrice } from '@/data/eraEquipment';
import { grantSkillXp } from '@/utils/skillUtils';
import { clampCondition, isMaintainable } from './condition';
import {
  generateCrateGear,
  generateDailyClassifieds,
  generateRetailGear,
  materializeCaseFind,
  resaleValue,
  type CaseFind,
} from './generation';
import type { EquipmentInstance, GearMaintenance } from './types';

export const asEquipmentInstance = (item: Equipment): EquipmentInstance => ({
  ...item,
  instanceId: item.instanceId ?? item.id,
  templateId: item.templateId ?? item.id,
  condition: clampCondition(item.condition),
  rarity: item.rarity ?? 'standard',
  traits: item.traits ?? [], quirks: item.quirks ?? [],
  restorationState: item.restorationState ?? 'serviced', origin: item.origin ?? 'retail',
  resaleValueMultiplier: item.resaleValueMultiplier ?? 1, provenanceSeed: item.provenanceSeed ?? 0,
});

/** Idempotent at the game-day boundary; opening a panel never generates stock. */
export const refreshGearForDay = (state: GameState): GameState => {
  let changed = false;
  const ownedEquipment = state.ownedEquipment.map(item => {
    const job = item.maintenance;
    if (job?.status === 'scheduled' && state.currentDay >= job.readyDay) {
      changed = true;
      return { ...item, condition: clampCondition(job.conditionAfter), maintenance: null, fault: null,
        quirks: job.clearsQuirks ? [] : item.quirks, restorationState: 'serviced' as const, lastServiceDay: state.currentDay };
    }
    if (item.fault && state.currentDay >= item.fault.readyDay) {
      changed = true;
      return { ...item, fault: null };
    }
    return item;
  });
  const stockIsCurrent = state.dailyClassifieds?.day === state.currentDay;
  if (!changed && stockIsCurrent) return state;
  return { ...state, ownedEquipment,
    dailyClassifieds: stockIsCurrent ? state.dailyClassifieds : { day: state.currentDay, listings: generateDailyClassifieds(state) } };
};

export interface MaintenanceQuote {
  cost: number;
  conditionAfter: number;
  improvement: number;
  downtimeDays: number;
  energyCost: number;
  clearsQuirks: boolean;
}
export const maintenanceQuote = (item: Equipment, kind: GearMaintenance['kind'], mode: GearMaintenance['mode'] = 'outsource'): MaintenanceQuote => {
  const condition = clampCondition(item.condition);
  const conditionAfter = Math.max(condition, Math.min(90, condition + (kind === 'service' ? 15 : 45)));
  const improvementValue = resaleValue({ ...item, condition: conditionAfter }) - resaleValue(item);
  const price = Math.max(0, Number.isFinite(item.price) ? item.price : 0);
  // Parts exceed the entire resale gain. Calibration saves labour, costs energy.
  const parts = Math.max(5, improvementValue + 1, Math.ceil(price * (kind === 'service' ? 0.08 : 0.23)));
  const cost = parts + (mode === 'hands-on' ? 0 : kind === 'service' ? 8 : 20);
  return { cost, conditionAfter, improvement: conditionAfter - condition, downtimeDays: kind === 'service' ? 1 : 2, energyCost: mode === 'hands-on' ? 1 : 0, clearsQuirks: true };
};

export type GearAction =
  | { type: 'buy'; listingId: string }
  | { type: 'buyRetail'; templateId: string }
  | { type: 'inspect'; equipmentId: string }
  | { type: 'maintain'; equipmentId: string; kind: GearMaintenance['kind']; mode?: GearMaintenance['mode'] }
  | { type: 'calibrate'; equipmentId: string; jobId: string; success: boolean }
  | { type: 'sell'; equipmentId: string }
  | { type: 'claim'; crateId: string; disposition: 'keep' | 'sell' }
  | { type: 'claimFind'; findId: string; disposition: 'keep' | 'sell' }
  | { type: 'acquireFind'; find: CaseFind; disposition: 'keep' | 'sell' | 'stash' };
export interface GearActionResult { state: GameState; ok: boolean; message: string }

const transactMoney = (state: GameState, delta: number): GameState => {
  const income = state.financials.income + Math.max(0, delta);
  const expenses = state.financials.expenses + Math.max(0, -delta);
  return { ...state, money: state.money + delta, financials: { ...state.financials, income, expenses, profit: income - expenses } };
};
const addGear = (state: GameState, item: Equipment): GameState => ({
  ...state, ownedEquipment: [...state.ownedEquipment, item],
  equipmentPlacements: [...(state.equipmentPlacements ?? []), { equipmentId: item.id, slotId: INVENTORY_SLOT_ID }],
});

const ownsTemplate = (state: GameState, templateId: string): boolean =>
  state.ownedEquipment.some(item => (item.templateId ?? item.id) === templateId);

/** All guards and mutations share the latest state updater; callers supply ids only. */
export const applyGearAction = (state: GameState, action: GearAction): GearActionResult => {
  const reject = (message: string): GearActionResult => ({ state, ok: false, message });
  const accept = (next: GameState, message: string): GearActionResult => ({ state: next, ok: true, message });
  if (!Number.isFinite(state.money) || !Number.isFinite(state.currentDay)) return reject('Invalid economy state.');

  if (action.type === 'buyRetail') {
    const template = availableEquipment.find(item => item.id === action.templateId);
    if (!template || template.price <= 0) return reject('Equipment not found.');
    if (ownsTemplate(state, template.id)) return reject('Already owned');
    const price = Math.max(1, getEraAdjustedPrice(template, state.currentYear || 2024, state.equipmentMultiplier || 1));
    if (state.money < price) return reject('Insufficient funds.');
    const gear = { ...generateRetailGear(template, state), price };
    return accept(addGear(transactMoney(state, -price), gear), `${gear.name} added to inventory.`);
  }

  if (action.type === 'acquireFind') {
    const find = action.find;
    if (!find?.id) return reject('Invalid find.');
    if (action.disposition === 'stash') {
      if ((state.caseFinds ?? []).some(item => item.id === find.id)) return reject('Already stashed.');
      return accept({ ...state, caseFinds: [...(state.caseFinds ?? []), find] }, `${find.name} stashed for later.`);
    }
    const gear = materializeCaseFind(state, find);
    if (!gear) return reject('Could not materialize find.');
    if (action.disposition === 'sell') {
      const value = Math.max(0, Math.floor(find.baseValue || resaleValue(gear)));
      return accept(transactMoney(state, value), `Sold ${find.name} for $${value}.`);
    }
    if (state.ownedEquipment.some(item => item.id === gear.id)) return reject('Already in inventory.');
    return accept(addGear(state, gear), `${gear.name} added to inventory.`);
  }

  if (action.type === 'claimFind') {
    const find = state.caseFinds?.find(item => item.id === action.findId);
    if (!find) return reject('Find already claimed or unavailable.');
    const gear = materializeCaseFind(state, find);
    if (!gear) return reject('Could not materialize find.');
    const next: GameState = { ...state, caseFinds: (state.caseFinds ?? []).filter(item => item.id !== find.id) };
    if (action.disposition === 'sell') {
      const value = Math.max(0, Math.floor(find.baseValue || resaleValue(gear)));
      return accept(transactMoney(next, value), `Sold ${find.name} for $${value}.`);
    }
    if (next.ownedEquipment.some(item => item.id === gear.id)) return reject('Already in inventory.');
    return accept(addGear(next, gear), `${gear.name} added to inventory.`);
  }

  if (action.type === 'buy') {
    if (state.dailyClassifieds?.day !== state.currentDay) return reject('This listing has expired.');
    const listing = state.dailyClassifieds.listings.find(item => item.id === action.listingId);
    if (!listing || listing.purchased || state.ownedEquipment.some(item => item.id === listing.equipment.id)) return reject('Already purchased or unavailable.');
    if (!Number.isFinite(listing.askingPrice) || listing.askingPrice < 1 || !Number.isFinite(listing.equipment.price) || listing.equipment.price < 0) return reject('Invalid asking price.');
    if (state.money < listing.askingPrice) return reject('Insufficient funds.');
    const next = addGear(transactMoney(state, -listing.askingPrice), asEquipmentInstance(listing.equipment));
    return accept({ ...next, dailyClassifieds: { ...state.dailyClassifieds, listings: state.dailyClassifieds.listings.map(item => item.id === listing.id ? { ...item, purchased: true } : item) } }, `${listing.equipment.name} added to inventory.`);
  }
  if (action.type === 'claim') {
    const crate = state.pendingCrates?.find(item => item.id === action.crateId);
    if (!crate) return reject('Crate already claimed or unavailable.');
    const gear = generateCrateGear(state, crate);
    if (!gear || state.ownedEquipment.some(item => item.id === gear.id)) return reject('Crate unavailable.');
    let next: GameState = { ...state, pendingCrates: state.pendingCrates!.filter(item => item.id !== crate.id) };
    next = action.disposition === 'sell' ? transactMoney(next, resaleValue(gear)) : addGear(next, gear);
    return accept(next, action.disposition === 'sell' ? `Sold ${gear.name} for $${resaleValue(gear)}.` : `${gear.name} added to inventory.`);
  }
  const item = state.ownedEquipment.find(equipment => equipment.id === action.equipmentId);
  if (!item) return reject('Equipment no longer owned.');
  const replace = (equipment: Equipment, base = state): GameState => ({ ...base, ownedEquipment: base.ownedEquipment.map(existing => existing.id === item.id ? equipment : existing) });
  if (action.type === 'inspect') return accept(replace({ ...asEquipmentInstance(item), inspected: true }), 'Inspected: condition, character and maintenance estimate confirmed.');
  if (action.type === 'sell') {
    if (item.maintenance) return reject('Finish maintenance before selling.');
    if (!Number.isFinite(item.price) || item.price < 0) return reject('Invalid equipment value.');
    const value = resaleValue(item);
    return accept({ ...transactMoney(state, value), ownedEquipment: state.ownedEquipment.filter(existing => existing.id !== item.id), equipmentPlacements: state.equipmentPlacements?.filter(placement => placement.equipmentId !== item.id) }, `Sold ${item.name} for $${value}.`);
  }
  if (action.type === 'calibrate') {
    const job = item.maintenance;
    if (!job || job.id !== action.jobId || job.mode !== 'hands-on' || job.status !== 'calibrating') return reject('Calibration already collected or unavailable.');
    const tracking = state.playerData.skills.tracking;
    const playerData = action.success ? { ...state.playerData, xp: state.playerData.xp + 35, skills: { ...state.playerData.skills, tracking: grantSkillXp(tracking, 35).updatedSkill } } : state.playerData;
    return accept(replace({ ...item, maintenance: { ...job, status: 'scheduled', readyDay: state.currentDay + (job.kind === 'service' ? 1 : 2), conditionAfter: action.success ? job.conditionAfter : item.condition, clearsQuirks: action.success } }, { ...state, playerData }), action.success ? 'Calibration passed: +35 producer and tracking XP; bench downtime begins.' : 'Calibration missed: parts spent; no condition gain. Bench downtime begins.');
  }
  if (!isMaintainable(item)) return reject('Maintenance supports microphones, interfaces, mixers and outboard.');
  if (item.maintenance) return reject('Maintenance already in progress.');
  if (!Number.isFinite(item.price) || item.price < 0) return reject('Invalid equipment value.');
  const mode = action.mode ?? 'outsource';
  const quote = maintenanceQuote(item, action.kind, mode);
  if (quote.improvement === 0 && !item.quirks?.length && !item.fault) return reject('This gear does not need maintenance.');
  if (state.money < quote.cost) return reject('Insufficient funds.');
  if (state.playerData.dailyWorkCapacity < quote.energyCost) return reject('Insufficient energy for hands-on work.');
  const maintenance: GearMaintenance = {
    id: `${item.id}:bench:${state.currentDay}:${item.usageSessions ?? 0}:${action.kind}`, kind: action.kind, mode,
    status: mode === 'hands-on' ? 'calibrating' : 'scheduled', startedDay: state.currentDay,
    readyDay: state.currentDay + quote.downtimeDays, conditionAfter: quote.conditionAfter,
    costPaid: quote.cost, clearsQuirks: quote.clearsQuirks,
  };
  const next = transactMoney(state, -quote.cost);
  return accept(replace({ ...asEquipmentInstance(item), maintenance }, { ...next, playerData: { ...next.playerData, dailyWorkCapacity: next.playerData.dailyWorkCapacity - quote.energyCost } }), `${item.name}: $${quote.cost}, +${quote.improvement.toFixed(1)} condition, ${quote.downtimeDays} day(s) unavailable${mode === 'hands-on' ? ' after successful calibration' : ''}.`);
};
