/**
 * Era-aware emergent subplots.
 *
 * Every entry is a two-beat story: an opening dilemma the moment it triggers, and a consequence beat a few
 * days later. Options carry honest costs — a negative `moneyDelta` disables the choice when the studio
 * can't afford it — and every subplot leaves a story flag behind so later beats can reference it.
 *
 * `eras` uses progression era ids (analog60s / digital80s / internet2000s / streaming2020s); an entry with no
 * `eras` can happen in any era.
 */
import type { EmergentSubplot } from './branchingStorylineEngine';

const staffCount = (n: number) => (state: { hiredStaff?: unknown[] }) => (state.hiredStaff?.length ?? 0) >= n;

export const ERA_SUBPLOTS: readonly EmergentSubplot[] = [
  // ───────────── 1960s ─────────────
  {
    id: 'subplot_session_union',
    title: 'The Session Union Walkout',
    kicker: 'LABOUR // THE MUSICIANS’ UNION',
    eras: ['analog60s'],
    minDay: 12,
    daysBetweenStages: 4,
    triggerCondition: (state) => state.reputation >= 10,
    stages: [
      {
        stageNumber: 1,
        title: 'A Delegate at the Control-Room Door',
        context:
          'The local musicians’ union has noticed your busy schedule. A delegate wants a scale rate for every horn and rhythm player who walks through your door.',
        options: [
          {
            id: 'union_sign',
            label: 'Sign the scale agreement',
            flavorText: 'Session players get paid properly — and show up prepared.',
            storyFlag: 'signed_union_scale',
            consequences: { moneyDelta: -600, repDelta: 8, narrativeOutcome: 'Word spreads: your studio treats players right.' },
          },
          {
            id: 'union_stall',
            label: 'Stall until a bigger session pays for it',
            flavorText: 'Every dollar counts this year.',
            storyFlag: 'stalled_union',
            consequences: { moneyDelta: 0, repDelta: -3, narrativeOutcome: 'The delegate leaves a card and a warning.' },
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'The Picket Line',
        context: 'Whatever you chose, the union’s answer arrives on a Saturday: a handful of players with signs outside — or a thank-you note.',
        options: [
          {
            id: 'union_host_benefit',
            label: 'Host a benefit session',
            flavorText: 'Open the room, let the whole crew jam on the house.',
            storyFlag: 'hosted_union_benefit',
            consequences: { moneyDelta: -250, repDelta: 12, narrativeOutcome: 'The benefit night becomes a legend in the local scene.' },
          },
          {
            id: 'union_quiet_deal',
            label: 'Cut a quiet side-deal',
            flavorText: 'Pay the delegate’s favourites a little extra, off the books.',
            storyFlag: 'quiet_union_deal',
            consequences: { moneyDelta: 400, repDelta: 0, narrativeOutcome: 'No pickets, no headlines — and a dependable horn section.' },
          },
        ],
      },
    ],
  },
  {
    id: 'subplot_stereo_panic',
    title: 'The Stereo Question',
    kicker: 'TECHNOLOGY // MONO VS STEREO',
    eras: ['analog60s'],
    minDay: 18,
    daysBetweenStages: 5,
    triggerCondition: (state) => state.money >= 800,
    stages: [
      {
        stageNumber: 1,
        title: 'The Label Wants Two Speakers',
        context: 'A regional label is releasing its first stereo LPs. Mix in stereo, or defend the punch of a great mono mix?',
        options: [
          {
            id: 'stereo_invest',
            label: 'Rewire for stereo',
            flavorText: 'A second monitor and a panning matrix. Costly, but the future.',
            storyFlag: 'went_stereo',
            consequences: { moneyDelta: -1100, repDelta: 7, narrativeOutcome: 'Hard-panned drums delight the label.' },
          },
          {
            id: 'stereo_defend_mono',
            label: 'Defend the mono mix',
            flavorText: 'One speaker, one truth. The radio is mono anyway.',
            storyFlag: 'defended_mono',
            consequences: { moneyDelta: 300, repDelta: 3, narrativeOutcome: 'Purists cheer; the label shrugs.' },
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'What the Radio Said',
        context: 'The first release goes out. Program directors weigh in.',
        options: [
          {
            id: 'stereo_press_release',
            label: 'Boast about the mix in the trades',
            flavorText: 'Sell the story of your room’s sound.',
            storyFlag: 'boasted_mix',
            consequences: { moneyDelta: 500, repDelta: 6, narrativeOutcome: 'The trades pick up the story; bookings rise.' },
          },
          {
            id: 'stereo_stay_humble',
            label: 'Let the record speak for itself',
            flavorText: 'No press. Just great records.',
            storyFlag: 'stayed_humble',
            consequences: { moneyDelta: 0, repDelta: 10, narrativeOutcome: 'Musicians whisper that yours is the room that “just sounds right”.' },
          },
        ],
      },
    ],
  },

  // ───────────── 1980s ─────────────
  {
    id: 'subplot_mtv_budget',
    title: 'The Video Budget',
    kicker: 'MEDIA // MTV IS WATCHING',
    eras: ['digital80s'],
    minDay: 12,
    daysBetweenStages: 4,
    triggerCondition: (state) => state.reputation >= 15,
    stages: [
      {
        stageNumber: 1,
        title: 'Make It Look Like It Sounds',
        context: 'A band on your books has a video shoot in three weeks. Their manager wants the single to “pop off the screen”.',
        options: [
          {
            id: 'mtv_gated_reverb',
            label: 'Go all-in on gated reverb and synth stabs',
            flavorText: 'Big drums, bigger hair. Pure 1985.',
            storyFlag: 'went_big_eighties',
            consequences: { moneyDelta: -700, repDelta: 9, narrativeOutcome: 'The snare alone gets a fan letter.' },
          },
          {
            id: 'mtv_keep_it_raw',
            label: 'Keep it raw and let the video carry it',
            flavorText: 'Less gloss, more grit.',
            storyFlag: 'kept_it_raw',
            consequences: { moneyDelta: 200, repDelta: 3, narrativeOutcome: 'The band shrugs — and the video turns out fine.' },
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'Heavy Rotation',
        context: 'The video is on air. The phones start ringing.',
        options: [
          {
            id: 'mtv_licence_sync',
            label: 'License the track to a movie trailer',
            flavorText: 'A quick payday and a wider audience.',
            storyFlag: 'licensed_the_hit',
            consequences: { moneyDelta: 1400, repDelta: -2, narrativeOutcome: 'The cheque clears; purist friends raise an eyebrow.' },
          },
          {
            id: 'mtv_album_pitch',
            label: 'Pitch the band a full album deal in your room',
            flavorText: 'Bet on longevity over a quick win.',
            storyFlag: 'pitched_album_deal',
            consequences: { moneyDelta: 300, repDelta: 12, narrativeOutcome: 'The album is booked — and everyone knows whose room made the single.' },
          },
        ],
      },
    ],
  },
  {
    id: 'subplot_sampler_lawsuit',
    title: 'The Uncleared Sample',
    kicker: 'LEGAL // SAMPLE CLEARANCE',
    eras: ['digital80s', 'internet2000s'],
    minDay: 16,
    daysBetweenStages: 5,
    triggerCondition: (state) => state.reputation >= 20 && state.money >= 1200,
    stages: [
      {
        stageNumber: 1,
        title: 'A Letter From a Lawyer',
        context: 'A record you produced borrowed four seconds of an old soul record. The original artist’s lawyers want to talk.',
        options: [
          {
            id: 'sample_settle',
            label: 'Settle and credit the original artist',
            flavorText: 'Make it right — and tell everyone.',
            storyFlag: 'settled_sample_claim',
            consequences: { moneyDelta: -1200, repDelta: 10, narrativeOutcome: 'The original artist appears on the remix. Classy.' },
          },
          {
            id: 'sample_fight',
            label: 'Fight it in court',
            flavorText: 'It was transformative. Probably.',
            storyFlag: 'fought_sample_claim',
            consequences: { moneyDelta: -300, repDelta: -4, narrativeOutcome: 'Legal fees mount. The clock ticks.' },
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'The Verdict',
        context: 'A judge — or a mediator — weighs in.',
        options: [
          {
            id: 'sample_replay',
            label: 'Replace the sample with a live-played replay',
            flavorText: 'Hire players; re-record the part clean.',
            storyFlag: 'replayed_the_sample',
            consequences: { moneyDelta: -500, repDelta: 8, narrativeOutcome: 'The record is cleaner than ever — and legally airtight.' },
          },
          {
            id: 'sample_publicity',
            label: 'Turn the dispute into publicity',
            flavorText: 'Every headline is a headline.',
            storyFlag: 'weaponised_the_lawsuit',
            consequences: { moneyDelta: 900, repDelta: -3, narrativeOutcome: 'Notoriety sells. So does controversy.' },
          },
        ],
      },
    ],
  },

  // ───────────── 2000s ─────────────
  {
    id: 'subplot_napster_leak',
    title: 'The Album That Leaked',
    kicker: 'INTERNET // THE LEAK',
    eras: ['internet2000s'],
    minDay: 14,
    daysBetweenStages: 4,
    triggerCondition: (state) => state.reputation >= 25,
    stages: [
      {
        stageNumber: 1,
        title: 'Uploaded at 3 A.M.',
        context: 'A client’s unreleased album is on every file-sharing network. Somebody at the studio has a lot of explaining to do.',
        options: [
          {
            id: 'leak_lawyers',
            label: 'Send takedown notices to everyone',
            flavorText: 'Fight fire with paperwork.',
            storyFlag: 'chased_the_leak',
            consequences: { moneyDelta: -400, repDelta: 6, narrativeOutcome: 'Most copies vanish. The band is relieved.' },
          },
          {
            id: 'leak_embrace',
            label: 'Embrace it: release the album free for a week',
            flavorText: 'If they’re listening anyway, let them pay with attention.',
            storyFlag: 'embraced_the_leak',
            consequences: { moneyDelta: 0, repDelta: 11, narrativeOutcome: 'The download counter spins and the tour sells out.' },
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'Who Held the Hard Drive?',
        context: 'Your security is in question. So is your trust in the interns.',
        options: [
          {
            id: 'leak_lock_down',
            label: 'Lock down the studio: badges, logs, NDAs',
            flavorText: 'Professional. A little paranoid.',
            storyFlag: 'locked_down_studio',
            consequences: { moneyDelta: -350, repDelta: 7, narrativeOutcome: 'Labels notice your tight ship.' },
          },
          {
            id: 'leak_trust_crew',
            label: 'Keep it human: trust the crew',
            flavorText: 'Nobody here would do this on purpose.',
            storyFlag: 'trusted_the_crew',
            consequences: { moneyDelta: 200, repDelta: 3, narrativeOutcome: 'Morale climbs; the culprit quietly apologises.' },
          },
        ],
      },
    ],
  },
  {
    id: 'subplot_myspace_scene',
    title: 'The Profile Page Scene',
    kicker: 'SCENE // ONLINE BUZZ',
    eras: ['internet2000s'],
    minDay: 10,
    daysBetweenStages: 3,
    triggerCondition: () => true,
    stages: [
      {
        stageNumber: 1,
        title: 'A Thousand Friends, Zero Money',
        context: 'Half a dozen bedroom bands have found you online and want a record — for exposure. You can’t pay the rent in exposure.',
        options: [
          {
            id: 'scene_comp_album',
            label: 'Produce a local-scene compilation',
            flavorText: 'One weekend, twelve bands, one CD.',
            storyFlag: 'made_scene_comp',
            consequences: { moneyDelta: -300, repDelta: 10, narrativeOutcome: 'The comp gets local radio play and a lot of goodwill.' },
          },
          {
            id: 'scene_paid_only',
            label: 'Paid sessions only',
            flavorText: 'Business is business.',
            storyFlag: 'paid_sessions_only',
            consequences: { moneyDelta: 300, repDelta: 0, narrativeOutcome: 'A few bands walk; the rest pay up.' },
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'Breakout Band',
        context: 'One of those bedroom bands is suddenly on a big blog.',
        options: [
          {
            id: 'scene_claim_credit',
            label: 'Put your studio name on the record',
            flavorText: 'Be the room they remember.',
            storyFlag: 'claimed_scene_credit',
            consequences: { moneyDelta: 0, repDelta: 9, narrativeOutcome: 'Producers ask who made that record. You did.' },
          },
          {
            id: 'scene_offer_deal',
            label: 'Offer them a production deal',
            flavorText: 'Lock in the future before somebody else does.',
            storyFlag: 'signed_breakout_band',
            consequences: { moneyDelta: -400, repDelta: 5, narrativeOutcome: 'They sign — and you’ve got first refusal on the follow-up.' },
          },
        ],
      },
    ],
  },

  // ───────────── 2020s ─────────────
  {
    id: 'subplot_playlist_payola',
    title: 'The Playlist Curator’s Offer',
    kicker: 'STREAMING // PAY-TO-PLAY',
    eras: ['streaming2020s'],
    minDay: 12,
    daysBetweenStages: 4,
    triggerCondition: (state) => state.reputation >= 15,
    stages: [
      {
        stageNumber: 1,
        title: 'A DM From a Curator',
        context: 'A playlist curator with a million followers offers to feature your client — for a “promotional fee”.',
        options: [
          {
            id: 'payola_pay',
            label: 'Pay the fee',
            flavorText: 'Streams are streams.',
            storyFlag: 'paid_the_curator',
            consequences: { moneyDelta: -900, repDelta: -2, narrativeOutcome: 'The track spikes; the algorithm loves it.' },
          },
          {
            id: 'payola_decline',
            label: 'Decline and pitch organically',
            flavorText: 'You don’t buy love.',
            storyFlag: 'declined_payola',
            consequences: { moneyDelta: 0, repDelta: 7, narrativeOutcome: 'Slower, but your client trusts you more.' },
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'The Algorithm’s Verdict',
        context: 'A week later, the numbers are in.',
        options: [
          {
            id: 'payola_case_study',
            label: 'Publish a transparent case study',
            flavorText: 'Show the receipts, whatever they say.',
            storyFlag: 'published_case_study',
            consequences: { moneyDelta: 400, repDelta: 8, narrativeOutcome: 'Industry blogs cite your honesty.' },
          },
          {
            id: 'payola_double_down',
            label: 'Book the curator’s other clients',
            flavorText: 'Volume beats principles, occasionally.',
            storyFlag: 'doubled_down_payola',
            consequences: { moneyDelta: 1100, repDelta: -4, narrativeOutcome: 'A busy week and a mild ethical hangover.' },
          },
        ],
      },
    ],
  },
  {
    id: 'subplot_ai_voice_clone',
    title: 'The Voice Clone Request',
    kicker: 'TECHNOLOGY // SYNTHETIC VOCALS',
    eras: ['streaming2020s'],
    minDay: 16,
    daysBetweenStages: 5,
    triggerCondition: (state) => state.reputation >= 20,
    stages: [
      {
        stageNumber: 1,
        title: 'A Perfect Fake',
        context: 'A client wants a demo sung in a famous vocalist’s cloned voice. The cheque is generous; the ethics are murky.',
        options: [
          {
            id: 'clone_accept',
            label: 'Take the job',
            flavorText: 'It’s a demo. Nobody will ever hear it.',
            storyFlag: 'made_voice_clone',
            consequences: { moneyDelta: 1600, repDelta: -6, narrativeOutcome: 'The cheque clears. The demo escapes.' },
          },
          {
            id: 'clone_refuse',
            label: 'Refuse and offer a real session singer',
            flavorText: 'Hire a person instead.',
            storyFlag: 'refused_voice_clone',
            consequences: { moneyDelta: -200, repDelta: 9, narrativeOutcome: 'A working singer gets the gig — and you get the story.' },
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'The Demo That Got Out',
        context: 'Somewhere on the internet, a fake is trending — or a hero story is.',
        options: [
          {
            id: 'clone_public_stance',
            label: 'Publish your studio’s policy on synthetic voices',
            flavorText: 'Draw a line, sign it, post it.',
            storyFlag: 'published_voice_policy',
            consequences: { moneyDelta: 0, repDelta: 12, narrativeOutcome: 'Artists cite your policy in their own contracts.' },
          },
          {
            id: 'clone_no_comment',
            label: 'No comment',
            flavorText: 'Let the news cycle move on.',
            storyFlag: 'no_comment_voice_clone',
            consequences: { moneyDelta: 500, repDelta: -2, narrativeOutcome: 'The story fades. So does some trust.' },
          },
        ],
      },
    ],
  },

  // ───────────── Any era ─────────────
  {
    id: 'subplot_hometown_hero',
    title: 'The Hometown Hero Returns',
    kicker: 'LEGACY // A FAMILIAR FACE',
    minDay: 20,
    daysBetweenStages: 5,
    triggerCondition: (state) => state.reputation >= 35,
    stages: [
      {
        stageNumber: 1,
        title: 'Someone From the Old Days',
        context: 'An artist from your first sessions turns up, famous now, asking for a favour: a secret rehearsal record, off the schedule.',
        options: [
          {
            id: 'hero_secret_session',
            label: 'Clear the calendar for a secret session',
            flavorText: 'Loyalty is a two-way street.',
            storyFlag: 'gave_hero_secret_session',
            consequences: { moneyDelta: -350, repDelta: 9, narrativeOutcome: 'The star never forgets who kept the secret.' },
          },
          {
            id: 'hero_standard_rate',
            label: 'Book them at your normal rate',
            flavorText: 'Business first. They can afford it.',
            storyFlag: 'charged_hero_full_rate',
            consequences: { moneyDelta: 900, repDelta: 0, narrativeOutcome: 'A smile, a signature, a handsome invoice.' },
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'The Thank-You',
        context: 'The record comes out. The credits are read carefully.',
        options: [
          {
            id: 'hero_shoutout',
            label: 'Accept the on-stage shout-out',
            flavorText: 'A packed arena hears your name.',
            storyFlag: 'took_hero_shoutout',
            consequences: { moneyDelta: 0, repDelta: 14, narrativeOutcome: 'Thousands of people now know your room exists.' },
          },
          {
            id: 'hero_gold_plaque',
            label: 'Ask for a gold plaque for the wall',
            flavorText: 'Something to hang above the console.',
            storyFlag: 'hung_hero_plaque',
            consequences: { moneyDelta: 200, repDelta: 8, narrativeOutcome: 'A brass plaque glows above the desk. Clients notice.' },
          },
        ],
      },
    ],
  },
  {
    id: 'subplot_burnt_out_engineer',
    title: 'The Burnt-Out Engineer',
    kicker: 'CREW // ONE BAD WEEK',
    minDay: 14,
    daysBetweenStages: 4,
    triggerCondition: staffCount(1),
    stages: [
      {
        stageNumber: 1,
        title: 'A Knock at 2 A.M.',
        context: 'One of your crew hasn’t slept in days and sits in the live room, staring at the tape machine. They need something to change.',
        options: [
          {
            id: 'crew_time_off',
            label: 'Send them home for a week, paid',
            flavorText: 'Health beats deadlines.',
            storyFlag: 'gave_crew_time_off',
            consequences: { moneyDelta: -450, repDelta: 6, narrativeOutcome: 'They return rested, focused, and loyal.' },
          },
          {
            id: 'crew_push_through',
            label: 'Ask them to push through the deadline',
            flavorText: 'One last push, then a break.',
            storyFlag: 'pushed_the_crew',
            consequences: { moneyDelta: 500, repDelta: -3, narrativeOutcome: 'The session ships. Morale does not.' },
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'Second Thoughts',
        context: 'The crew have opinions about how the studio treats people. They’re sharing them.',
        options: [
          {
            id: 'crew_profit_share',
            label: 'Offer a profit-share on weekend sessions',
            flavorText: 'A stake makes people care.',
            storyFlag: 'offered_profit_share',
            consequences: { moneyDelta: -300, repDelta: 10, narrativeOutcome: 'The whole crew is suddenly invested in the studio’s success.' },
          },
          {
            id: 'crew_status_quo',
            label: 'Keep things as they are',
            flavorText: 'Nobody’s quit yet.',
            storyFlag: 'kept_status_quo',
            consequences: { moneyDelta: 0, repDelta: 0, narrativeOutcome: 'Nothing changes. Nothing breaks. Yet.' },
          },
        ],
      },
    ],
  },
];
