/**
 * Gear reliability facts for the session forecast (#62, forecast slice).
 *
 * Reads the condition, bench and fault state the used-gear module already keeps and turns it
 * into plain statements. No new state and no hidden rolls: the same gear in, the same facts out.
 */
import type { Equipment, GameState } from '@/types/game';
import { conditionBand, isGearAvailable, isMaintainable } from '@/features/usedGear/condition';

export interface GearFact {
  key: string;
  label: string;
  impact: 'small' | 'medium' | 'large';
  hint?: string;
  /** Negative for a risk, positive for a comfort. */
  points: number;
}

const unavailableUntil = (item: Equipment): number | undefined =>
  item.maintenance ? item.maintenance.readyDay : item.fault ? item.fault.readyDay : undefined;

export const gearReliabilityFacts = (
  state: Pick<GameState, 'ownedEquipment' | 'currentDay'>,
  seated: Equipment[],
): GearFact[] => {
  const owned = state.ownedEquipment ?? [];
  const facts: GearFact[] = [];
  const seatedIds = new Set(seated.map((e) => e.id));

  // Gear that would normally help but is out of action: on the bench or in a fault.
  for (const item of owned) {
    if (!isMaintainable(item) || isGearAvailable(item, state.currentDay)) continue;
    const back = unavailableUntil(item);
    const spare = owned.some((o) => o.id !== item.id && o.category === item.category && isGearAvailable(o, state.currentDay));
    facts.push({
      key: `gear-down-${item.id}`,
      label: `${item.name} is out of action${back !== undefined ? ` until day ${back}` : ''}${spare ? ', but a spare is ready' : ''}`,
      impact: spare ? 'small' : 'medium',
      points: spare ? -1 : -3,
      ...(spare ? {} : { hint: `Wait until day ${back ?? state.currentDay + 1} or book another room.` }),
    });
  }

  // Poor gear in the room: say which one, and that the risk is an interruption, not a disaster.
  const poor = seated
    .filter((e) => isMaintainable(e) && e.condition < 40)
    .sort((a, b) => a.condition - b.condition || a.id.localeCompare(b.id))[0];
  if (poor) {
    const backup = owned.some((o) => o.id !== poor.id && o.category === poor.category && o.condition >= 60 && isGearAvailable(o, state.currentDay) && !seatedIds.has(o.id));
    facts.push({
      key: `gear-poor-${poor.id}`,
      label: `${poor.name} is in ${conditionBand(poor.condition).toLowerCase()} condition: elevated risk of a short interruption`,
      impact: poor.condition < 20 ? 'large' : 'medium',
      points: poor.condition < 20 ? -5 : -3,
      hint: backup ? 'Seat the spare, or service it in a quiet slot.' : 'Service it in a quiet slot before the session.',
    });
  }

  // A healthy chain with a spare is a real comfort worth naming.
  const healthy = seated.filter((e) => isMaintainable(e) && e.condition >= 80);
  const spareCategory = healthy.find((e) => owned.some((o) => o.id !== e.id && o.category === e.category && isGearAvailable(o, state.currentDay) && o.condition >= 60));
  if (!poor && spareCategory && facts.length === 0) {
    facts.push({ key: 'gear-spare', label: `${spareCategory.name} is in top shape and a backup ${spareCategory.category} is on the shelf`, impact: 'small', points: 1 });
  }
  return facts;
};
