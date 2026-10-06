/**
 * Payload builders for the story cinematics: the act-opening title card and the campaign epilogue.
 * Pure: turns campaign data into the shape CinematicStoryCutscene renders.
 */
import type { StorylineNode } from './branchingStorylineEngine';
import type { CampaignEnding } from './endings';
import { PREMISES_TIERS, type PremisesTier } from '@/rpg/premises';
import { buildMoveDayBeat } from '@/rpg/premisesAffordance';
import { getRivalAccent, getRivalForNode, initialsOf } from './rivalCast';

export interface CinematicPayload {
  title: string;
  chapter: string;
  kicker: string;
  location?: string;
  speaker: string;
  speakerTitle?: string;
  speakerInitials: string;
  accent: string;
  lines: string[];
  stats?: Array<{ label: string; value: string }>;
  /** Label for the last button when the cinematic has no choices. */
  finalLabel: string;
  choices?: never;
  /** Move-day relocation visual (#250): flight cases pack, the old room empties, the new one fills. */
  moveDay?: { cases: number; affordanceLabel: string; affordanceVerb: string };
}

const ROMAN = ['', 'I', 'II', 'III'] as const;

export const buildActIntroCutscene = (node: StorylineNode, playstyle?: string): CinematicPayload => {
  const rival = getRivalForNode(node.id, playstyle);
  return {
    title: node.title.replace(/^Act [IVX]+:\s*/, ''),
    chapter: `Act ${ROMAN[node.act]} · ${rival.name}`,
    kicker: 'A new act',
    speaker: rival.headProducer,
    speakerTitle: `${rival.epithet} · ${rival.name}`,
    speakerInitials: initialsOf(rival.headProducer),
    accent: getRivalAccent(rival.id),
    lines: [node.loreBrief, node.rivalDialogue, `Your objective — ${node.objectiveDescription}`],
    finalLabel: `Begin Act ${ROMAN[node.act]}`,
  };
};

export const buildEndingCutscene = (ending: CampaignEnding): CinematicPayload => ({
  title: ending.title,
  chapter: `Epilogue · ${ending.legacyTitle}`,
  kicker: ending.compromised ? 'A complicated legacy' : 'A clean record',
  speaker: ending.rivalName,
  speakerTitle: 'Your rival',
  speakerInitials: ending.rivalInitials,
  accent: ending.rivalAccent,
  lines: [ending.epigraph, ...ending.lines, ending.rivalLine],
  stats: ending.stats,
  finalLabel: 'Keep the studio open',
});

const MOVE_BEATS: Record<1 | 2 | 3, { chapter: string; kicker: string; speaker: string; speakerTitle: string; lines: string[] }> = {
  1: {
    chapter: 'Move day · Project Studio', kicker: 'Moving day', speaker: 'Dee Marlowe', speakerTitle: 'Landlord',
    lines: ['The borrowed corner goes into boxes: the desk, the tape machine, the mic stand with the cracked clip. Nothing gets left behind.', 'The new room has a proper door, a window that does not rattle, and space for a second chair. A vocal booth waits at the back.', 'Dee hands over the keys. "Keep it loud, but not before nine."'],
  },
  2: {
    chapter: 'Move day · Commercial Studio', kicker: 'Moving day', speaker: 'Priya Anand', speakerTitle: 'Letting agent',
    lines: ['A reception desk, a lounge for waiting clients and a live room with a ceiling high enough to hear itself think.', 'The crew carries the familiar gear in first, so the new place sounds like you before the paint is dry.', 'The agent smiles at the rent schedule. "A busy room pays for itself. An empty one does not."'],
  },
  3: {
    chapter: 'Move day · Multi-room Facility', kicker: 'Moving day', speaker: 'Marcus Webb', speakerTitle: 'Facility manager',
    lines: ['Two floors, a mix suite with proper monitoring and a lounge that looks like it already has a gold record on the wall.', 'Your seniors walk the corridors, claiming rooms. Somebody has already hung a sign on the door of the mix suite.', '"This is a lot of room," says Marcus. "Fill it with good work."'],
  },
};

export const buildMoveInCutscene = (
  tier: 1 | 2 | 3,
  studioName?: string,
  /** Optional save slice: adds the carried-over counts and the new affordance (#250). */
  ctx?: { premisesArchetype?: unknown; ownedEquipment?: unknown[]; hiredStaff?: unknown[] },
): CinematicPayload => {
  const beat = MOVE_BEATS[tier];
  const def = PREMISES_TIERS[tier as PremisesTier];
  const unlocks = def.grantsRoomId ? def.grantsRoomId.replace(/-/g, ' ') : 'new rooms';
  const move = ctx ? buildMoveDayBeat({ premisesTier: tier, ...ctx }) : null;
  return {
    title: def.name,
    chapter: beat.chapter,
    kicker: beat.kicker,
    location: studioName,
    speaker: beat.speaker,
    speakerTitle: beat.speakerTitle,
    speakerInitials: initialsOf(beat.speaker),
    accent: tier === 3 ? '#f4b942' : tier === 2 ? '#5db0ff' : '#7bd88f',
    lines: beat.lines,
    stats: [
      { label: 'Crew cap', value: String(def.staffCap) },
      { label: 'Rent', value: `$${def.dailyRent}/day` },
      { label: 'New room', value: unlocks },
      ...(move ? [
        { label: 'Carried over', value: `${move.gearCount} gear · ${move.crewCount} crew` },
        { label: 'New here', value: move.affordance.label },
      ] : []),
    ],
    ...(move ? { moveDay: { cases: move.cases, affordanceLabel: move.affordance.label, affordanceVerb: move.affordance.verb } } : {}),
    finalLabel: 'Walk in',
  };
};
