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
  'took_the_second_offer',
  'stonewalled_journalist',
  'skipped_union_meeting',
  'skipped_team_dinner',
  'took_the_spotlight',
  'bent_the_creed',
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
  held_the_line: 'turned down the same shortcut twice',
  confessed_old_deal: 'owned up to its old deals before anyone asked',
  credited_the_crew: 'put the whole crew in the credits',
  vouched_for_scale: 'stood up for session players in public',
  owned_signature_sound: 'built a signature sound on purpose',
  guaranteed_clean_master: 'guaranteed its masters clean',
  held_the_creed: 'kept the studio creed when it cost money',
  published_studio_creed: 'wrote the studio creed on the door',
  delivered_path_promise: 'delivered exactly what its campaign path promised',
};

/**
 * A rival's closing line can pick up one extra sentence from a choice the studio made along the way, so the
 * finale answers how the studio actually played rather than only whether it was compromised.
 * Each rival has lines in their own voice for the choices that touch their world; the first flag in a rival's
 * list that the player set wins, and `GENERIC_CODA` covers everything else.
 */
type Coda = ReadonlyArray<readonly [flag: string, line: string]>;

const GENERIC_CODA: Coda = [
  ['took_the_second_offer', 'I heard you were offered the same shortcut twice. I know which answer cost more.'],
  ['held_the_line', 'They offered you the easy road twice. You said no twice. I did not expect that.'],
  ['stonewalled_journalist', 'Funny how a story you never told still found its way to me.'],
  ['confessed_old_deal', 'You told the story before anyone else could. That takes more nerve than winning.'],
  ['took_the_spotlight', 'Enjoy the front row. Ask your crew who built it.'],
  ['credited_the_crew', 'You put your whole crew in the credits. Nobody in my building would have.'],
];

const RIVAL_CODA: Record<string, Coda> = {
  'black-wax-vault': [
    ['owned_signature_sound', 'You told them the sound was the room. Good. It always is.'],
    ['defended_mono', 'You defended a single speaker against the whole industry. I felt that one in the lacquer.'],
    ['honest_retrospective', 'You told the magazine about the mistakes. I never once printed mine.'],
    ['polished_retrospective', 'A polished legend. I taught you that, did I not?'],
    ['vouched_for_scale', 'You stood up for the players. The tape notices who was paid.'],
    ['skipped_union_meeting', 'You stayed home when the players met. The tape notices that too.'],
    ['held_the_creed', 'You held the creed when I tested it. I will remember that.'],
    ['bent_the_creed', 'You bent the creed for a booking. Charts forget. Tape does not.'],
    ['creed_protect_the_take', 'Protect the take. At least you said it once where I could hear.'],
  ],
  'apex-velocity': [
    ['paid_the_curator', 'Pay-to-play works. Nobody says it in public. You did it quietly. Good.'],
    ['doubled_down_payola', 'Twice the payola. Now you are speaking my language.'],
    ['declined_payola', 'You refused a playlist slot and still landed here. I am going to need that in a slide.'],
    ['took_the_second_offer', 'You took the second offer. Everyone does. I just did not expect it to be you.'],
    ['held_the_line', 'Two offers, two refusals. Do you have any idea what that does to my forecast?'],
    ['made_voice_clone', 'A synthetic singer. Scalable. I might steal it.'],
  ],
  'distortion-cellar': [
    ['embraced_the_leak', 'You gave the record away and filled the venue. That is the whole manifesto.'],
    ['made_scene_comp', 'One compilation, a whole scene. You did what I only shouted about.'],
    ['claimed_scene_credit', 'You put your name on the scene’s record. The scene is going to have words.'],
    ['locked_down_studio', 'You locked the doors. Since when did the cellar have locks?'],
    ['credited_the_crew', 'Everybody in the credits. That is the only acceptable way to do it.'],
    ['took_the_spotlight', 'All the spotlight and none of the crew. I have seen that band before. It broke up.'],
  ],
  'silicon-harmonics': [
    ['owned_signature_sound', 'You owned the sound on purpose. Reproducible intent. I respect that.'],
    ['refused_voice_clone', 'You refused the clone. Noise is a feature; you understood that.'],
    ['published_voice_policy', 'You wrote the policy down. I had never seen anyone put a signal path in writing.'],
    ['made_voice_clone', 'You cloned the voice. The waveform was flawless. I am not sure what it was.'],
    ['confessed_old_deal', 'You published your own error bars. That is rarer than a good record.'],
    ['stonewalled_journalist', 'You buried the result. A result unpublished is a result unmeasured.'],
  ],
};

const rivalCoda = (state: GameState, rivalId: string): string => {
  const flags = state.storylineState?.storyFlags;
  const hit = [...(RIVAL_CODA[rivalId] ?? []), ...GENERIC_CODA].find(([flag]) => flags?.[flag]);
  return hit ? ` ${hit[1]}` : '';
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
    rivalLine: (compromised ? rivalLines.respect : rivalLines.defeated) + rivalCoda(state, rival.id),
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
