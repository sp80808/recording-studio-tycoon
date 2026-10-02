import type { GameState, Project } from '@/types/game';
import { resolveSessionEquipment } from '@/utils/gameUtils';
import { createSeededRandom } from '@/simulation/seededRandom';
import { clampCondition, isMaintainable, reliabilityDescription, wearPerSession } from './condition';

const rounded = (value: number): number => Math.round(value * 1e6) / 1e6;

/** Fractional idle work accrues wear; fault draws happen only at stable usage milestones. */
export const recordGearUse = (state: GameState, project: Project, duration = 1, intensity = 1): { state: GameState; project: Project } => {
  if (!Number.isFinite(duration) || duration <= 0) return { state, project };
  const used = resolveSessionEquipment(state, project.bookingRoomId);
  const engineers = state.hiredStaff.filter(staff => staff.role === 'Engineer' && staff.status === 'Working' && staff.assignedProjectId === project.id && staff.energy > 0);
  let hiredStaff = state.hiredStaff;
  const notes = [...(project.gearNotes ?? [])];
  const note = (message: string) => { if (!notes.includes(message)) notes.push(message); };
  const ownedEquipment = state.ownedEquipment.map(item => {
    if (!used.some(gear => gear.id === item.id) || !isMaintainable(item)) return item;
    let next = { ...item, condition: clampCondition(item.condition), usageSessions: rounded(Math.max(0, item.usageSessions ?? 0)), fault: item.fault && state.currentDay < item.fault.readyDay ? item.fault : null };
    // ponytail: cap one call at 100 sessions; long catch-up belongs in the clock’s <=1-session slices.
    let remaining = Math.min(100, duration);
    note(`Used ${item.name}${item.traits?.length ? ' (Sweet spot: +2 equipment quality)' : ''}${item.quirks?.length ? ' (Dirty contacts: −2 equipment quality, +25% wear)' : ''}.`);
    if (item.lastServiceDay !== undefined) note(`${item.name} returned from maintenance on day ${item.lastServiceDay}.`);
    while (remaining > 0 && !next.fault) {
      const familiarity = Math.max(0, ...engineers.map(engineer => hiredStaff.find(staff => staff.id === engineer.id)?.equipmentFamiliarity?.[item.id] ?? 0));
      const milestone = Math.floor(next.usageSessions) + 1;
      const portion = Math.min(remaining, milestone - next.usageSessions);
      next.condition = rounded(clampCondition(next.condition - wearPerSession(next, familiarity) * Math.max(0.5, Math.min(2, intensity)) * portion));
      next.usageSessions = rounded(next.usageSessions + portion);
      remaining = rounded(remaining - portion);
      if (next.usageSessions >= milestone) {
        hiredStaff = hiredStaff.map(staff => engineers.some(engineer => engineer.id === staff.id)
          ? { ...staff, equipmentFamiliarity: { ...staff.equipmentFamiliarity, [item.id]: Math.min(5, (staff.equipmentFamiliarity?.[item.id] ?? 0) + 1) } } : staff);
        const probability = next.condition < 20 ? 0.25 : next.condition < 40 ? 0.1 : 0;
        if (probability > 0 && createSeededRandom(`${state.saveSeed ?? 4242}:${item.id}:contact-noise:${milestone}`)() < probability) {
          next = { ...next, fault: { family: 'contact-noise', startedDay: state.currentDay, readyDay: state.currentDay + 1, milestone } };
          note(`${item.name}: noisy contact after use; unavailable until day ${state.currentDay + 1}. No permanent damage.`);
        }
      }
    }
    return next;
  });
  return { state: { ...state, ownedEquipment, hiredStaff }, project: { ...project, gearNotes: notes.slice(-6) } };
};

/** Presentation/forecast hook: facts only; selection still belongs to the rack resolver. */
export const gearForecastReasons = (state: GameState, roomId?: string): string[] => {
  const eligible = new Set(resolveSessionEquipment(state, roomId).map(item => item.id));
  return state.ownedEquipment.filter(item => isMaintainable(item) && (eligible.has(item.id) || item.maintenance || item.fault))
    .map(item => `${item.name}: ${reliabilityDescription(item, state.currentDay)}`);
};

export const awardProjectCrate = (state: GameState, project: Project | undefined, quality: number): GameState => {
  if (!project || quality < 90 || !Number.isFinite(quality)) return state;
  const id = `crate:project:${project.id}`;
  if (state.pendingCrates?.some(crate => crate.id === id)) return state;
  const chance = project.stake === 'moonshot' ? 0.4 : 0.15;
  if (createSeededRandom(`${state.saveSeed ?? 4242}:${project.id}:gear-drop`)() >= chance) return state;
  return { ...state, pendingCrates: [...(state.pendingCrates ?? []), {
    id, era: state.selectedEra, source: 's_grade_take', tier: 'standard',
    generatedDay: state.currentDay, generatedYear: state.currentYear, generatedPriceMultiplier: state.equipmentMultiplier,
  }] };
};
