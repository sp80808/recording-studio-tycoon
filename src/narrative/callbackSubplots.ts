/**
 * Callback subplots — the story remembers.
 *
 * Each entry is a two-beat subplot that can only spawn once the player has left a specific story flag behind
 * in an earlier subplot, so a past choice comes back with interest. Two studios that answered the same
 * dilemma differently are offered different follow-ups, which is what makes the branches feel consequential.
 *
 * Same shape as `ERA_SUBPLOTS`; merged into `EMERGENT_SUBPLOTS` by the storyline engine.
 * See docs/narrative/STORY_ARC_EXPANSION.md for the full branch map.
 */
import type { EmergentSubplot } from './branchingStorylineEngine';
import type { GameState } from '@/types/game';

const hasFlag =
  (...flags: string[]) =>
  (state: GameState): boolean =>
    flags.some((f) => Boolean(state.storylineState?.storyFlags?.[f]));

export const CALLBACK_SUBPLOTS: readonly EmergentSubplot[] = [
  // ───────────── Labour & crew ─────────────
  {
    id: 'subplot_union_reckoning',
    title: 'The Union Remembers',
    kicker: 'LABOUR // SCALE OR STALL',
    eras: ['analog60s'],
    minDay: 28,
    daysBetweenStages: 5,
    triggerCondition: (state) => hasFlag('signed_union_scale', 'stalled_union')(state) && state.reputation >= 15,
    becauseOf: {
      signed_union_scale: 'signed the union scale',
      stalled_union: 'stalled the union',
    },
    stages: [
      {
        stageNumber: 1,
        title: 'The Delegate Returns',
        context:
          'The union delegate is back with a clipboard. Studios that signed scale are being asked to vouch for the agreement; studios that stalled are being asked to explain themselves in front of the local.',
        options: [
          {
            id: 'reckoning_vouch',
            label: 'Stand up at the local and vouch for scale',
            flavorText: 'Put your name on the record, whichever way you went before.',
            storyFlag: 'vouched_for_scale',
            consequences: { moneyDelta: -200, repDelta: 9, narrativeOutcome: 'The room applauds. Players start asking for your studio by name.' },
          },
          {
            id: 'reckoning_keep_head_down',
            label: 'Send your apologies and stay out of it',
            flavorText: 'Politics is bad for bookings.',
            storyFlag: 'skipped_union_meeting',
            consequences: { moneyDelta: 150, repDelta: -2, narrativeOutcome: 'Nobody notices your absence — until they do.' },
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'Who Plays on Friday',
        context: 'Friday night is your biggest session of the month. Whether the horn section shows up depends on how the union feels about you.',
        options: [
          {
            id: 'reckoning_pay_premium',
            label: 'Pay a premium to guarantee the band',
            flavorText: 'Buy the goodwill back if you have to.',
            storyFlag: 'paid_union_premium',
            consequences: { moneyDelta: -400, repDelta: 6, narrativeOutcome: 'The session runs like clockwork. The premium is forgotten; the take is not.' },
          },
          {
            id: 'reckoning_use_juniors',
            label: 'Fill the chairs with eager juniors',
            flavorText: 'Everybody starts somewhere.',
            storyFlag: 'used_junior_players',
            consequences: { moneyDelta: 300, repDelta: 3, narrativeOutcome: 'Rough edges, real energy. A couple of the juniors become regulars.' },
          },
        ],
      },
    ],
  },
  {
    id: 'subplot_crew_exodus',
    title: 'The Crew Gets an Offer',
    kicker: 'CREW // LOYALTY IS EARNED',
    minDay: 30,
    daysBetweenStages: 5,
    triggerCondition: (state) =>
      hasFlag('pushed_the_crew', 'kept_status_quo', 'gave_crew_time_off', 'offered_profit_share')(state) &&
      (state.hiredStaff?.length ?? 0) >= 1,
    becauseOf: {
      pushed_the_crew: 'pushed the crew through a deadline',
      kept_status_quo: 'kept things as they were for the crew',
      gave_crew_time_off: 'sent a burnt-out engineer home',
      offered_profit_share: 'offered the crew a profit-share',
    },
    stages: [
      {
        stageNumber: 1,
        title: 'A Rival’s Business Card',
        context:
          'A rival studio has been sniffing around your crew with better hours and a signing bonus. How your staff answers depends on how you have treated them so far.',
        options: [
          {
            id: 'exodus_counter_offer',
            label: 'Counter-offer before they decide',
            flavorText: 'A raise, a title, and a proper thank-you.',
            storyFlag: 'countered_poach_offer',
            consequences: { moneyDelta: -700, repDelta: 7, narrativeOutcome: 'They stay, and they tell everyone why.' },
          },
          {
            id: 'exodus_let_them_choose',
            label: 'Let them choose for themselves',
            flavorText: 'You trust the room you built.',
            storyFlag: 'trusted_crew_choice',
            consequences: { moneyDelta: 0, repDelta: 4, narrativeOutcome: 'Some stay. One leaves on good terms and promises to send work your way.' },
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'The Morning After',
        context: 'The dust settles. The studio feels different, in a way only the people who work here can explain.',
        options: [
          {
            id: 'exodus_team_dinner',
            label: 'Close the studio for a team dinner',
            flavorText: 'A night off, on the house.',
            storyFlag: 'held_team_dinner',
            consequences: { moneyDelta: -250, repDelta: 8, narrativeOutcome: 'The best ideas for next month’s sessions come from that dinner table.' },
          },
          {
            id: 'exodus_back_to_work',
            label: 'Get straight back to work',
            flavorText: 'Bookings do not wait.',
            storyFlag: 'skipped_team_dinner',
            consequences: { moneyDelta: 400, repDelta: 0, narrativeOutcome: 'The diary stays full. The mood stays careful.' },
          },
        ],
      },
    ],
  },

  // ───────────── Technology & craft ─────────────
  {
    id: 'subplot_format_war_payoff',
    title: 'The Format Comes Due',
    kicker: 'TECHNOLOGY // THE BILL ARRIVES',
    eras: ['analog60s', 'digital80s'],
    minDay: 34,
    daysBetweenStages: 5,
    triggerCondition: (state) => hasFlag('went_stereo', 'defended_mono', 'went_big_eighties', 'kept_it_raw')(state),
    becauseOf: {
      went_stereo: 'rewired for stereo',
      defended_mono: 'defended the mono mix',
      went_big_eighties: 'went big on eighties production',
      kept_it_raw: 'kept the sound raw',
    },
    stages: [
      {
        stageNumber: 1,
        title: 'A Client Notices Your Signature Sound',
        context:
          'A producer you have never met says your records sound like nobody else’s — and wants to know whether that was a choice or an accident.',
        options: [
          {
            id: 'format_own_it',
            label: 'Own it: “That is the room.”',
            flavorText: 'Sell the signature, not the gear list.',
            storyFlag: 'owned_signature_sound',
            consequences: { moneyDelta: 0, repDelta: 10, narrativeOutcome: 'A reputation for a sound is worth more than a reputation for a price.' },
          },
          {
            id: 'format_offer_both',
            label: 'Offer both the vintage and the modern mix',
            flavorText: 'Let the client pick their poison.',
            storyFlag: 'offered_both_mixes',
            consequences: { moneyDelta: 450, repDelta: 3, narrativeOutcome: 'Double the mixing work, and double the invoice.' },
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'The Retrospective',
        context: 'A magazine wants to write about the studio’s approach. How you answer will be quoted for years.',
        options: [
          {
            id: 'format_honest_interview',
            label: 'Give them the honest, messy version',
            flavorText: 'Mistakes included.',
            storyFlag: 'honest_retrospective',
            consequences: { moneyDelta: 0, repDelta: 12, narrativeOutcome: 'Readers trust the studio that admits what it got wrong.' },
          },
          {
            id: 'format_polished_interview',
            label: 'Give them the polished legend',
            flavorText: 'Every studio needs a good origin story.',
            storyFlag: 'polished_retrospective',
            consequences: { moneyDelta: 350, repDelta: 5, narrativeOutcome: 'The origin story sells itself, and so do you.' },
          },
        ],
      },
    ],
  },

  // ───────────── Money & legal ─────────────
  {
    id: 'subplot_sample_aftershock',
    title: 'The Sample Comes Back',
    kicker: 'LEGAL // THE PAPER TRAIL',
    eras: ['digital80s', 'internet2000s'],
    minDay: 34,
    daysBetweenStages: 5,
    triggerCondition: (state) =>
      hasFlag('settled_sample_claim', 'fought_sample_claim', 'replayed_the_sample', 'weaponised_the_lawsuit')(state),
    becauseOf: {
      settled_sample_claim: 'settled a sample claim',
      fought_sample_claim: 'fought a sample claim',
      replayed_the_sample: 'replayed the sample',
      weaponised_the_lawsuit: 'weaponised a lawsuit',
    },
    stages: [
      {
        stageNumber: 1,
        title: 'A Letter With Your Name On It',
        context:
          'Clearing house paperwork lands on your desk. Depending on how you handled the last claim, the studio is either a model citizen, a known quantity, or a cautionary tale.',
        options: [
          {
            id: 'aftershock_clearance_desk',
            label: 'Set up an in-house clearance desk',
            flavorText: 'Turn a legal headache into a service.',
            storyFlag: 'built_clearance_desk',
            consequences: { moneyDelta: -500, repDelta: 8, narrativeOutcome: 'Labels start routing their sample-heavy records to you.' },
          },
          {
            id: 'aftershock_hire_lawyer',
            label: 'Keep a lawyer on retainer and move on',
            flavorText: 'Insurance, basically.',
            storyFlag: 'retained_lawyer',
            consequences: { moneyDelta: -150, repDelta: 3, narrativeOutcome: 'Quiet peace of mind, at a small monthly price.' },
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'A Clean Room',
        context: 'An artist asks whether your studio can guarantee a record is legally clean before it ships.',
        options: [
          {
            id: 'aftershock_guarantee',
            label: 'Put the guarantee in writing',
            flavorText: 'Stake the studio’s name on it.',
            storyFlag: 'guaranteed_clean_master',
            consequences: { moneyDelta: 300, repDelta: 11, narrativeOutcome: 'Your studio becomes the safe pair of hands for risky records.' },
          },
          {
            id: 'aftershock_no_promises',
            label: 'Refuse to promise anything',
            flavorText: 'You make records, not legal guarantees.',
            storyFlag: 'refused_guarantee',
            consequences: { moneyDelta: 0, repDelta: 2, narrativeOutcome: 'The artist shrugs and finds someone bolder.' },
          },
        ],
      },
    ],
  },
  {
    id: 'subplot_leak_dividend',
    title: 'The Leak Has a Legacy',
    kicker: 'INDUSTRY // GIVEN AWAY, PAID BACK',
    eras: ['internet2000s', 'streaming2020s'],
    minDay: 34,
    daysBetweenStages: 5,
    triggerCondition: (state) => hasFlag('embraced_the_leak', 'chased_the_leak', 'locked_down_studio')(state),
    becauseOf: {
      embraced_the_leak: 'embraced the leak',
      chased_the_leak: 'chased the leak',
      locked_down_studio: 'locked down the studio',
    },
    stages: [
      {
        stageNumber: 1,
        title: 'The Fans Kept the File',
        context:
          'Years on, an old leaked session is still circulating. Fans have built a forum around it, and some of them want to finance an “official” deluxe edition.',
        options: [
          {
            id: 'leak_fan_edition',
            label: 'Co-release a fan-funded deluxe edition',
            flavorText: 'Let the people who kept it alive pay for it.',
            storyFlag: 'released_fan_edition',
            consequences: { moneyDelta: 600, repDelta: 8, narrativeOutcome: 'The pre-orders cover the pressing in a weekend.' },
          },
          {
            id: 'leak_take_down',
            label: 'Issue a polite take-down',
            flavorText: 'Some things stay in the vault.',
            storyFlag: 'took_down_old_leak',
            consequences: { moneyDelta: 0, repDelta: -1, narrativeOutcome: 'The forum grumbles, then quietly moves on.' },
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'The Reunion Request',
        context: 'The band from the leaked session wants a reunion recording — provided the studio is willing to make it a proper event.',
        options: [
          {
            id: 'leak_livestream_reunion',
            label: 'Livestream the reunion session',
            flavorText: 'Open the doors and the cameras.',
            storyFlag: 'livestreamed_reunion',
            consequences: { moneyDelta: -300, repDelta: 13, narrativeOutcome: 'Half a million people watch a band remember why they started.' },
          },
          {
            id: 'leak_private_reunion',
            label: 'Keep it private and tape-only',
            flavorText: 'Some moments belong to the room.',
            storyFlag: 'private_reunion',
            consequences: { moneyDelta: 200, repDelta: 6, narrativeOutcome: 'The tapes become the most talked-about record nobody has heard.' },
          },
        ],
      },
    ],
  },

  // ───────────── Integrity & industry ─────────────
  {
    id: 'subplot_clean_record',
    title: 'The Clean Record',
    kicker: 'REPUTATION // WHAT YOU REFUSED',
    eras: ['internet2000s', 'streaming2020s'],
    minDay: 36,
    daysBetweenStages: 5,
    triggerCondition: (state) =>
      hasFlag('declined_payola', 'refused_voice_clone', 'published_voice_policy', 'published_case_study')(state),
    becauseOf: {
      declined_payola: 'declined payola',
      refused_voice_clone: 'refused a voice clone',
      published_voice_policy: 'published a voice policy',
      published_case_study: 'published a case study',
    },
    stages: [
      {
        stageNumber: 1,
        title: 'The Trade Body Calls',
        context:
          'An independent-studio trade body noticed that you turned down shortcuts others took. They want you on a panel, and on the record.',
        options: [
          {
            id: 'clean_join_panel',
            label: 'Join the panel and name names… carefully',
            flavorText: 'Stand for something in public.',
            storyFlag: 'joined_ethics_panel',
            consequences: { moneyDelta: -150, repDelta: 11, narrativeOutcome: 'The panel goes viral in all the right circles.' },
          },
          {
            id: 'clean_decline_panel',
            label: 'Decline and let the work speak',
            flavorText: 'Less talking, more tape.',
            storyFlag: 'declined_ethics_panel',
            consequences: { moneyDelta: 250, repDelta: 4, narrativeOutcome: 'More hours in the studio, fewer in meetings.' },
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'Temptation, Reprised',
        context: 'The shortcut you turned down is offered again — bigger this time, and with a name attached that is hard to refuse.',
        options: [
          {
            id: 'clean_hold_the_line',
            label: 'Hold the line',
            flavorText: 'You already know what kind of studio this is.',
            storyFlag: 'held_the_line',
            consequences: { moneyDelta: 0, repDelta: 14, narrativeOutcome: 'Word gets around: this studio cannot be bought.' },
          },
          {
            id: 'clean_take_the_deal',
            label: 'Take the deal, this once',
            flavorText: 'Nobody has to know.',
            storyFlag: 'took_the_second_offer',
            consequences: { moneyDelta: 1800, repDelta: -6, narrativeOutcome: 'The money is real. So is the crack in the story you used to tell.' },
          },
        ],
      },
    ],
  },
  {
    id: 'subplot_compromise_tab',
    title: 'The Favours Come Due',
    kicker: 'INDUSTRY // NOTHING IS FREE',
    minDay: 36,
    daysBetweenStages: 5,
    triggerCondition: (state) =>
      hasFlag('major_label_syndicate', 'ghost_producer_contract', 'partnered_with_bootlegger', 'paid_the_curator', 'doubled_down_payola', 'made_voice_clone')(
        state,
      ),
    becauseOf: {
      major_label_syndicate: 'joined a major-label syndicate',
      ghost_producer_contract: 'signed a ghost-producer contract',
      partnered_with_bootlegger: 'partnered with a bootlegger',
      paid_the_curator: 'paid a playlist curator',
      doubled_down_payola: 'doubled down on payola',
      made_voice_clone: 'made a voice clone',
    },
    stages: [
      {
        stageNumber: 1,
        title: 'A Friendly Reminder',
        context:
          'Someone you did a deal with has a favour to call in: nothing illegal, just awkward. A credit that is not yours to give, a quiet word in the right ear.',
        options: [
          {
            id: 'tab_pay_it',
            label: 'Pay the favour in full',
            flavorText: 'Clear the debt and move on.',
            storyFlag: 'paid_the_favour',
            consequences: { moneyDelta: -800, repDelta: 2, narrativeOutcome: 'The slate is clean. Your bank account is not.' },
          },
          {
            id: 'tab_renegotiate',
            label: 'Renegotiate on your own terms',
            flavorText: 'You are not the same studio you were.',
            storyFlag: 'renegotiated_favour',
            consequences: { moneyDelta: -200, repDelta: 5, narrativeOutcome: 'A tense meeting, a handshake, and a smaller bill.' },
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'Coming Clean',
        context: 'A journalist has been asking questions about the old deal. You can get ahead of the story, or hope it stays buried.',
        options: [
          {
            id: 'tab_confess',
            label: 'Get ahead of the story and own it',
            flavorText: 'A mistake confessed is half forgiven.',
            storyFlag: 'confessed_old_deal',
            consequences: { moneyDelta: -100, repDelta: 9, narrativeOutcome: 'The apology lands. The studio is trusted a little more than before.' },
          },
          {
            id: 'tab_stonewall',
            label: 'Say nothing and hope it fades',
            flavorText: 'News cycles are short.',
            storyFlag: 'stonewalled_journalist',
            consequences: { moneyDelta: 300, repDelta: -5, narrativeOutcome: 'It fades — but not entirely, and not for everybody.' },
          },
        ],
      },
    ],
  },

  // ───────────── Legacy ─────────────
  {
    id: 'subplot_hero_legacy',
    title: 'The Star Looks Back',
    kicker: 'LEGACY // FULL CIRCLE',
    minDay: 38,
    daysBetweenStages: 6,
    triggerCondition: (state) =>
      hasFlag('gave_hero_secret_session', 'took_hero_shoutout', 'hung_hero_plaque', 'charged_hero_full_rate')(state) &&
      state.reputation >= 45,
    becauseOf: {
      gave_hero_secret_session: 'kept the star’s secret session',
      took_hero_shoutout: 'took the star’s shout-out',
      hung_hero_plaque: 'hung the star’s plaque',
      charged_hero_full_rate: 'charged the star full rate',
    },
    stages: [
      {
        stageNumber: 1,
        title: 'The Documentary Crew',
        context:
          'A documentary about the star’s early days wants to film in your control room. What they find there depends on how the two of you left things.',
        options: [
          {
            id: 'legacy_open_doors',
            label: 'Open the doors and the archives',
            flavorText: 'Every demo tape, every scribbled track sheet.',
            storyFlag: 'opened_archives',
            consequences: { moneyDelta: -200, repDelta: 12, narrativeOutcome: 'Your control room becomes a location in somebody else’s legend.' },
          },
          {
            id: 'legacy_licence_footage',
            label: 'Licence the footage for a fee',
            flavorText: 'History has a price.',
            storyFlag: 'licensed_footage',
            consequences: { moneyDelta: 900, repDelta: 3, narrativeOutcome: 'The cheque clears; the film gets made without your fingerprints.' },
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'The Premiere',
        context: 'There is a seat with your name on it in the front row — and a question afterwards from a room full of cameras.',
        options: [
          {
            id: 'legacy_credit_crew',
            label: 'Credit the whole crew by name',
            flavorText: 'Nobody makes a record alone.',
            storyFlag: 'credited_the_crew',
            consequences: { moneyDelta: 0, repDelta: 13, narrativeOutcome: 'Your crew watch the credits roll with new pride.' },
          },
          {
            id: 'legacy_take_the_credit',
            label: 'Take the spotlight yourself',
            flavorText: 'You earned this moment.',
            storyFlag: 'took_the_spotlight',
            consequences: { moneyDelta: 400, repDelta: 7, narrativeOutcome: 'Bigger bookings, and a few whispers in the control room.' },
          },
        ],
      },
    ],
  },

  // ───────────── Campaign titles ─────────────
  {
    id: 'subplot_title_reputation',
    title: 'The Title Gets Noticed',
    kicker: 'CAMPAIGN // A NAME THAT TRAVELS',
    minDay: 30,
    daysBetweenStages: 5,
    triggerCondition: hasFlag('Studio Trailblazer', 'Tone Connoisseur', 'Commercial Machine'),
    becauseOf: {
      'Studio Trailblazer': 'earned the title Studio Trailblazer',
      'Tone Connoisseur': 'earned the title Tone Connoisseur',
      'Commercial Machine': 'earned the title Commercial Machine',
    },
    stages: [
      {
        stageNumber: 1,
        title: 'The Title on the Door',
        context:
          'A trade paper has picked up the title your studio earned on the campaign trail and wants a profile. The angle they choose will follow you.',
        options: [
          {
            id: 'title_lean_in',
            label: 'Lean into the title for the profile',
            flavorText: 'Let the label do some of the talking.',
            storyFlag: 'leaned_into_title',
            consequences: { moneyDelta: 0, repDelta: 9, narrativeOutcome: 'The profile runs with your name and your title above it.' },
          },
          {
            id: 'title_play_down',
            label: 'Play it down and talk about the people instead',
            flavorText: 'Titles fade. Crews last.',
            storyFlag: 'played_down_title',
            consequences: { moneyDelta: 0, repDelta: 6, narrativeOutcome: 'The piece is warmer than expected, and your crew are mentioned by name.' },
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'Living Up to It',
        context: 'A big client books the studio because of the title. They expect the title to show up in the room, not just in print.',
        options: [
          {
            id: 'title_overdeliver',
            label: 'Clear the diary and over-deliver',
            flavorText: 'Earn it again, this time in front of a client.',
            storyFlag: 'lived_up_to_title',
            consequences: { moneyDelta: -300, repDelta: 12, narrativeOutcome: 'The client leaves a testimonial that quotes the title back at you.' },
          },
          {
            id: 'title_standard_job',
            label: 'Deliver a solid, standard job',
            flavorText: 'A good record is a good record.',
            storyFlag: 'coasted_on_title',
            consequences: { moneyDelta: 500, repDelta: 2, narrativeOutcome: 'Paid, pleased, and quietly unimpressed.' },
          },
        ],
      },
    ],
  },
];
