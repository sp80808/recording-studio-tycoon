/** Content registry (#64): projects the live authored content into plain data the schemas can check. */
import { STUDIO_SYNERGIES } from '@/data/synergies';
import { DIRECTOR_EVENTS } from '@/narrative/directorEvents';
import type { StudioEventDefinition } from '@/narrative/eventDirector';
import {
  DEFAULT_DIRECTIONS, GENRE_DIRECTIONS, PRIORITIES, PRODUCTION_APPROACHES, SERVICES, SERVICE_ROLE, SERVICE_ROOM,
} from '@/rpg/projectBrief';
import type { BriefTemplateContent, EventContent, SynergyContent } from './schemas';

export interface ContentRegistry {
  synergies: SynergyContent[];
  events: EventContent[];
  briefs: BriefTemplateContent;
}

const strip = <T extends object>(o: T): T => JSON.parse(JSON.stringify(o));

/** Events are mostly data; their function-valued parts are recorded as flags only. */
export const eventToContent = (e: StudioEventDefinition): EventContent => strip({
  id: e.id,
  family: e.family,
  baseWeight: e.baseWeight,
  cooldownDays: e.cooldownDays,
  maxOccurrences: e.maxOccurrences,
  requiredMemories: e.requiredMemories ? [...e.requiredMemories] : undefined,
  blockedMemories: e.blockedMemories ? [...e.blockedMemories] : undefined,
  memoryWeights: e.memoryWeights ? { ...e.memoryWeights } : undefined,
  narrativeKey: e.narrativeKey,
  kicker: e.kicker,
  title: e.title,
  options: e.options.map((o) => ({
    id: o.id, label: o.label, flavorText: o.flavorText, effects: [...o.effects],
    memories: o.memories ? [...o.memories] : undefined, outcome: o.outcome,
  })),
  delegable: e.delegable,
  defaultOptionId: e.defaultOptionId,
  hasSubjectPicker: Boolean(e.pickSubject),
  hasEligibility: Boolean(e.eligible),
});

export const briefTemplates = (): BriefTemplateContent => strip({
  services: SERVICES.map((service) => ({ service, room: SERVICE_ROOM[service], role: SERVICE_ROLE[service] })),
  priorities: [...PRIORITIES],
  genreDirections: GENRE_DIRECTIONS,
  defaultDirections: [...DEFAULT_DIRECTIONS],
  approaches: PRODUCTION_APPROACHES,
});

export const liveRegistry = (): ContentRegistry => ({
  synergies: strip([...STUDIO_SYNERGIES]) as SynergyContent[],
  events: DIRECTOR_EVENTS.map(eventToContent),
  briefs: briefTemplates(),
});
