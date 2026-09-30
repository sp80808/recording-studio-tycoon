/**
 * Campaign endings & epilogue.
 *
 * Four finales, each closed by the rival it was fought against. The rival's last line depends on how the studio
 * won: a clean record earns the "defeated" line, a compromised one earns grudging "respect". Subplot flags the
 * player left along the way add a closing paragraph, so two studios that reach the same finale still read differently.
 *
 * Pure text + state lookups.
 */
import type { GameState } from '@/types/game';
import { getRivalForNode, getRivalLines, initialsOf, getRivalAccent } from './rivalCast';
import { countUnlocked } from './achievements';

export interface CampaignEnding {
  id: string;
  finaleNodeId: string;
  title: string;
  epigraph: string;
  lines: string[];
  rivalName: string;
  rivalInitials: string;
  rivalAccent: string;
  rivalLine: string;
  compromised: boolean;
  legacyTitle: string;
  stats: Array<{ label: string; value: string }>;
}

interface FinaleCopy {
  title: string;
  epigraph: string;
  lines: string[];
  legacy: string;
}

const FINALES: Record<string, FinaleCopy> = {
  act3_golden_legend: {
    title: 'The Golden Reel',
    epigraph: 'Some records are made. A few are kept.',
    lines: [
      'The last master leaves the room at dawn, still warm from the tape machine. Nobody speaks. The needle drops, and the room hears itself.',
      'Word travels the way it always has: by people who were in the room. Engineers you have never met start describing the sound of your live room to each other.',
      'Years from now, someone will hold the lacquer to the light and ask who made it. The answer is written in the run-out groove.',
    ],
    legacy: 'Keeper of the Vacuum Tube',
  },
  act3_sonic_alchemy: {
    title: 'The Resonance',
    epigraph: 'Every circuit hides a song. You found the one worth hearing.',
    lines: [
      'The final take runs through a signal chain nobody else could have built: tubes, transformers and an idea that only makes sense at three in the morning.',
      'The frequency at the end of the record does something odd to the room. People stop talking without noticing. Then they ask for it again.',
      'Journals publish the schematic. The tone, oddly, cannot be copied.',
    ],
    legacy: 'Architect of Sound',
  },
  act3_billboard_monopoly: {
    title: 'The Platinum Cartel',
    epigraph: 'The numbers were never the point. They were the proof.',
    lines: [
      'Every screen in the building shows the same chart. Your record sits at the top, and this time the algorithm did not do it alone.',
      'Labels line up in the lobby. Playlists rearrange themselves around your release schedule. For one perfect week, the whole industry runs on your clock.',
      'Empires like this are built to last a season. You built yours to last a decade.',
    ],
    legacy: 'Head of the Platinum Cartel',
  },
  act3_rogue_factory: {
    title: 'The Open Stem',
    epigraph: 'The best record is the one everyone else gets to remix.',
    lines: [
      'You release the stems and step back. Within an hour there are forty versions of the song; within a week, four hundred.',
      'Bedroom producers in six countries credit your studio in their bios. None of them paid a fee. All of them will remember the room that trusted them first.',
      'The mainstream calls it chaos. The scene calls it a movement, and hands you the microphone.',
    ],
    legacy: 'Rebel Audio Kingpin',
  },
};

/** Flags that mark a decision the studio might not be proud of. */
const COMPROMISE_FLAGS = [
  'major_label_syndicate',
  'ghost_producer_contract',
  'partnered_with_bootlegger',
  'paid_the_curator',
  'doubled_down_payola',
  'made_voice_clone',
  'no_comment_voice_clone',
  'weaponised_the_lawsuit',
  'pushed_the_crew',
  'stalled_union',
  'licensed_the_hit',
  'charged_hero_full_rate',
] as const;

/** Flags that earn a line in the closing paragraph, keyed to what the studio is remembered for. */
const REMEMBERED_FOR: Record<string, string> = {
  refused_ghost_contract: 'refused to sell your name',
  seized_bootleg_wax: 'protected clients’ masters',
  declined_payola: 'never bought a playlist slot',
  refused_voice_clone: 'hired a real singer instead of a clone',
  published_voice_policy: 'drew a public line on synthetic voices',
  settled_sample_claim: 'paid the artists it sampled',
  signed_union_scale: 'paid session players scale',
  gave_crew_time_off: 'looked after its crew',
  offered_profit_share: 'shared profit with its staff',
  hosted_union_benefit: 'opened the room for a benefit night',
  gave_hero_secret_session: 'kept a friend’s secret session secret',
  embraced_the_leak: 'gave an album away and sold out the tour',
  made_scene_comp: 'put a whole scene on one compilation',
};

export const countCompromises = (state: GameState): number =>
  COMPROMISE_FLAGS.filter((f) => state.storylineState?.storyFlags?.[f]).length;

const rememberedFor = (state: GameState): string[] =>
  Object.keys(REMEMBERED_FOR)
    .filter((f) => state.storylineState?.storyFlags?.[f])
    .map((f) => REMEMBERED_FOR[f])
    .slice(0, 3);

const joinList = (items: string[]): string =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

export const getCampaignEnding = (state: GameState): CampaignEnding | null => {
  const story = state.storylineState;
  if (!story?.campaignCompleted) return null;
  const finaleNodeId = FINALES[story.activeCampaignNodeId] ? story.activeCampaignNodeId : 'act3_golden_legend';
  const copy = FINALES[finaleNodeId];
  const playstyle = state.playerData?.playstyle;
  const rival = getRivalForNode(finaleNodeId, playstyle);
  const rivalLines = getRivalLines(rival.id);
  const compromised = countCompromises(state) >= 2;

  const remembered = rememberedFor(state);
  const closing = compromised
    ? 'The record is flawless. The story behind it is a little more complicated — some of the shortcuts you took will follow the studio for years.'
    : remembered.length > 0
      ? `People will tell you the record was great. They will tell each other the rest: this was the studio that ${joinList(remembered)}.`
      : 'People will tell you the record was great. What they will remember is that you kept showing up.';

  const reports = state.financials?.reports ?? [];
  const best = reports.reduce((m, r) => Math.max(m, r.overallQualityScore ?? 0), 0);

  return {
    id: `ending_${finaleNodeId}${compromised ? '_compromised' : ''}`,
    finaleNodeId,
    title: copy.title,
    epigraph: copy.epigraph,
    lines: [...copy.lines, closing],
    rivalName: rival.headProducer,
    rivalInitials: initialsOf(rival.headProducer),
    rivalAccent: getRivalAccent(rival.id),
    rivalLine: compromised ? rivalLines.respect : rivalLines.defeated,
    compromised,
    legacyTitle: copy.legacy,
    stats: [
      { label: 'Days in business', value: String(state.currentDay ?? 0) },
      { label: 'Sessions delivered', value: String(reports.length) },
      { label: 'Best session', value: `Q${best}` },
      { label: 'Stories seen through', value: String(story.resolvedSubplotIds.length) },
      { label: 'Trophies', value: String(countUnlocked(state)) },
    ],
  };
};
