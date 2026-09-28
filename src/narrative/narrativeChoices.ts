import { GameState } from '@/types/game';
import { PlaystyleFocus } from '@/types/character';

export interface NarrativeChoiceOption {
  id: string;
  label: string;
  flavorText: string;
  playstyleFit: PlaystyleFocus | 'universal';
  consequences: {
    moneyDelta: number;
    repDelta: number;
    creativeCapitalDelta?: number;
    clientLoyaltyDelta?: number;
    storyFlag?: string;
    outcomeNarrative: string;
  };
}

export interface NarrativeDilemma {
  id: string;
  title: string;
  kicker: string;
  context: string;
  source: string;
  triggerCondition?: (gameState: GameState) => boolean;
  minDay: number;
  options: readonly NarrativeChoiceOption[];
}

export const NARRATIVE_DILEMMAS: readonly NarrativeDilemma[] = [
  {
    id: 'the-leaked-master',
    title: 'The Leaked Rough Mix',
    kicker: 'SECURITY BREACH // CONTROL ROOM',
    context: 'An unmastered rough mix of your client’s lead single has leaked on internet forums. The audio is raw and compressed, but fans are already dissecting every vocal breath. How do you respond?',
    source: 'Anonymous Forum Post',
    minDay: 3,
    options: [
      {
        id: 'leak-acoustic-cut',
        label: 'Embrace Authenticity: Drop Raw Acoustic Cut',
        flavorText: 'Double down on analog honesty. Announce that the raw vulnerability is intentional and issue an exclusive unmastered session take.',
        playstyleFit: 'purist',
        consequences: {
          moneyDelta: 300,
          repDelta: 8,
          clientLoyaltyDelta: 15,
          storyFlag: 'embraced_leak_authenticity',
          outcomeNarrative: 'Critics hail your raw production as a bold artistic statement. The client trusts your leadership implicitly.',
        },
      },
      {
        id: 'leak-rush-stream',
        label: 'Capitalize on Hype: Rush Release to Digital',
        flavorText: 'Strike while attention is peaked. Push an expedited final master onto streaming platforms within 24 hours to monetize the viral wave.',
        playstyleFit: 'hit-maker',
        consequences: {
          moneyDelta: 2400,
          repDelta: -3,
          clientLoyaltyDelta: -5,
          storyFlag: 'monetized_leak_wave',
          outcomeNarrative: 'The single enters the streaming daily top-50, generating swift royalties despite the client feeling slightly rushed.',
        },
      },
      {
        id: 'leak-remix-contest',
        label: 'Underground Stems: Launch Free Remix Contest',
        flavorText: 'Release the multitrack stems to the bedroom producer community. Turn a leak into a grassroots subculture movement.',
        playstyleFit: 'underground',
        consequences: {
          moneyDelta: 0,
          repDelta: 12,
          clientLoyaltyDelta: 10,
          storyFlag: 'remix_contest_viral',
          outcomeNarrative: 'Over 500 bedroom producers download your stems. Your studio becomes an underground legend overnight.',
        },
      },
    ],
  },
  {
    id: 'ghost-production-temptation',
    title: 'The Ghost in the Credits',
    kicker: 'LABEL CONTRACT // CONFIDENTIAL',
    context: 'A prominent major-label manager slips into your lounge with an unlabelled USB drive. A platinum-selling pop star has writer’s block. They offer $8,000 cash for you to finish and produce the track—on condition of zero producer credits.',
    source: 'Executive A&R Scout',
    minDay: 6,
    options: [
      {
        id: 'ghost-take-cash',
        label: 'Take the Bag: $8,000 Cash, No Questions',
        flavorText: 'Cash is runway. You finish the track in a midnight session, collect the check, and sign the ironclad NDA.',
        playstyleFit: 'hit-maker',
        consequences: {
          moneyDelta: 8000,
          repDelta: -6,
          storyFlag: 'secret_ghost_producer',
          outcomeNarrative: 'Your bank balance surges. The song goes on to chart at #3, but you can never publicly claim the audio.',
        },
      },
      {
        id: 'ghost-reject-dignity',
        label: 'Reject the Offer: "My Name Stays on the Fader"',
        flavorText: 'Politely show the manager the exit door. You refuse to let your craft be stripped of authorship.',
        playstyleFit: 'purist',
        consequences: {
          moneyDelta: 0,
          repDelta: 14,
          clientLoyaltyDelta: 20,
          storyFlag: 'refused_ghost_buyout',
          outcomeNarrative: 'Word of your uncompromising integrity spreads among authentic artists. Serious songwriters seek your room.',
        },
      },
      {
        id: 'ghost-engineer-split',
        label: 'Counter-Negotiate: Tech & Mastering Royalty Only',
        flavorText: 'Surrender songwriting claims, but demand back-end technical sound-design points in exchange for audio wizardry.',
        playstyleFit: 'sound-lab',
        consequences: {
          moneyDelta: 3200,
          repDelta: 4,
          storyFlag: 'negotiated_tech_points',
          outcomeNarrative: 'The label agrees to acoustic consulting points. You earn a healthy fee and maintain self-respect.',
        },
      },
    ],
  },
  {
    id: 'broken-tape-78',
    title: 'Snap on the 24-Track',
    kicker: 'EQUIPMENT CRISIS // TAPE DECK',
    context: 'During an archival session of a rare 1978 master reel, brittle magnetic tape catches on the tension roller and snaps cleanly between the vocal hook and guitar solo. The client gasps in horror.',
    source: 'Vintage Tape Console',
    minDay: 8,
    options: [
      {
        id: 'tape-precision-splice',
        label: 'Perform Precision Razor Surgery',
        flavorText: 'Break out the aluminum splicing block, specialized adhesive tape, and magnifying glass. Steady hands only.',
        playstyleFit: 'sound-lab',
        consequences: {
          moneyDelta: -100,
          repDelta: 10,
          clientLoyaltyDelta: 25,
          storyFlag: 'master_tape_splicer',
          outcomeNarrative: 'A flawless mechanical splice. When the tape plays back without a single flutter, the room erupts in applause.',
        },
      },
      {
        id: 'tape-re-record-session',
        label: 'Hire Session Musician for Live Re-take',
        flavorText: 'Admit the physical loss honestly, hire an experienced session musician on the spot, and track an authentic live replacement.',
        playstyleFit: 'purist',
        consequences: {
          moneyDelta: -650,
          repDelta: 6,
          clientLoyaltyDelta: 12,
          storyFlag: 'live_retake_hero',
          outcomeNarrative: 'The fresh take carries raw emotional energy that ends up surpassing the aged 1978 cut.',
        },
      },
      {
        id: 'tape-glitch-loop',
        label: 'Sample the Snap as a Lo-Fi Hook',
        flavorText: 'Digitize the broken fragment, pitch it down, and turn the mechanical click into a rhythmic beat stutter.',
        playstyleFit: 'underground',
        consequences: {
          moneyDelta: 0,
          repDelta: 8,
          clientLoyaltyDelta: 15,
          storyFlag: 'glitch_turned_feature',
          outcomeNarrative: 'The glitch stutter gives the record a distinctive haunting character that modern listeners obsess over.',
        },
      },
    ],
  },
  {
    id: 'payola-radio-pitch',
    title: 'The Midnight Radio Plugger',
    kicker: 'INDUSTRY SHADOWS // PROMOTION',
    context: 'A well-tailored radio promotion broker sits at your studio bar. "I control morning drive time in three metropolitan markets. $2,000 under the table, and your next release gets 50 guaranteed spins a week."',
    source: 'Independent Radio Plugger',
    minDay: 12,
    options: [
      {
        id: 'payola-accept',
        label: 'Pay for Guaranteed Airplay',
        flavorText: 'Hand over the promo budget. Radio remains the undisputed king of daytime commercial exposure.',
        playstyleFit: 'hit-maker',
        consequences: {
          moneyDelta: -2000,
          repDelta: 10,
          storyFlag: 'paid_radio_plugger',
          outcomeNarrative: 'The single enters heavy rotation on two regional commercial stations, quickly driving streaming momentum.',
        },
      },
      {
        id: 'payola-refuse',
        label: 'Slam the Door: "Our Music Earns Its Spins"',
        flavorText: 'Refuse the bribe on principle. Rely on pirate stations, college radio, and organic community support.',
        playstyleFit: 'purist',
        consequences: {
          moneyDelta: 0,
          repDelta: 5,
          clientLoyaltyDelta: 10,
          storyFlag: 'rejected_payola_syndicate',
          outcomeNarrative: 'College radio DJs rally behind your studio as one of the last genuine independent strongholds.',
        },
      },
      {
        id: 'payola-expose',
        label: 'Expose the Syndicate to Underground Press',
        flavorText: 'Secretly record the interaction and send the transcript to independent investigative music journalists.',
        playstyleFit: 'underground',
        consequences: {
          moneyDelta: 0,
          repDelta: 18,
          clientLoyaltyDelta: 15,
          storyFlag: 'whistleblower_producer',
          outcomeNarrative: 'The exposé sends shockwaves through the indie scene. Your studio becomes an icon of rebel counter-culture.',
        },
      },
    ],
  },
  {
    id: 'vintage-console-salvage',
    title: 'The Abandoned Warehouse Console',
    kicker: 'BARGAIN HUNTER // BARN FIND',
    context: 'A demolition crew clearing an old theater finds a dusty 1974 discrete 32-channel analog desk. They will sell it for scrap metal price ($1,500), but half the channel strips are dead and power supplies are suspect.',
    source: 'Demolition Contractor',
    minDay: 15,
    options: [
      {
        id: 'salvage-restore',
        label: 'Buy & Fully Restore the Legendary Board',
        flavorText: 'Spend days recapping capacitors and scrubbing faders with deoxidizer to return it to pristine acoustic glory.',
        playstyleFit: 'sound-lab',
        consequences: {
          moneyDelta: -1500,
          repDelta: 15,
          storyFlag: 'legendary_console_restored',
          outcomeNarrative: 'The discrete British preamps sound magnificent. The console becomes the centerpiece attraction of your studio.',
        },
      },
      {
        id: 'salvage-flip-parts',
        label: 'Strip Transformer Modules & Flip for Cash',
        flavorText: 'Extract the coveted vintage transformers and discrete op-amps, selling them individually to boutique collectors.',
        playstyleFit: 'hit-maker',
        consequences: {
          moneyDelta: 3800,
          repDelta: -2,
          storyFlag: 'stripped_console_for_profit',
          outcomeNarrative: 'A tidy profit pocketed within three days, though purist historians groan at the cannibalized vintage desk.',
        },
      },
    ],
  },
] as const;

/** Retrieve dilemmas currently eligible to trigger based on day and game state */
export const getEligibleDilemmas = (
  gameState: GameState,
  resolvedIds: readonly string[] = []
): NarrativeDilemma[] => {
  return NARRATIVE_DILEMMAS.filter(d => {
    if (resolvedIds.includes(d.id)) return false;
    if (gameState.currentDay < d.minDay) return false;
    if (d.triggerCondition && !d.triggerCondition(gameState)) return false;
    return true;
  });
};

/** Apply choice outcome deltas safely to GameState */
export const applyChoiceOutcome = (
  gameState: GameState,
  dilemmaId: string,
  choiceId: string
): { updatedState: GameState; outcomeText: string; storyFlag?: string } => {
  const dilemma = NARRATIVE_DILEMMAS.find(d => d.id === dilemmaId);
  if (!dilemma) {
    return { updatedState: gameState, outcomeText: 'Unknown dilemma resolved.' };
  }

  const choice = dilemma.options.find(c => c.id === choiceId);
  if (!choice) {
    return { updatedState: gameState, outcomeText: 'Default path chosen.' };
  }

  const { moneyDelta, repDelta, storyFlag, outcomeNarrative } = choice.consequences;

  const nextMoney = Math.max(0, gameState.money + moneyDelta);
  const nextRep = Math.max(0, gameState.reputation + repDelta);

  return {
    updatedState: {
      ...gameState,
      money: nextMoney,
      reputation: nextRep,
    },
    outcomeText: outcomeNarrative,
    storyFlag,
  };
};
