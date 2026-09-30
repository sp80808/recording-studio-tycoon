/**
 * Payload builders for the story cinematics: the act-opening title card and the campaign epilogue.
 * Pure: turns campaign data into the shape CinematicStoryCutscene renders.
 */
import type { StorylineNode } from './branchingStorylineEngine';
import type { CampaignEnding } from './endings';
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
