/**
 * Industry-history subplots.
 *
 * Each one dramatises a real turning point in recording history — the payola scandals, gated reverb, the drum-machine
 * panic, the loudness war, pitch-correction, the short-video revival of forgotten records — and nods to pop
 * culture only by allusion: no real people, bands, brands or quotes, just the situation a fan would recognise.
 *
 * Design rules (from tycoon-genre practice): every option is a real trade-off with a cost or a risk, no option is
 * strictly best, humour is dry rather than jokey, and each subplot leaves a flag later beats can answer.
 * Same shape as `ERA_SUBPLOTS`; merged into `EMERGENT_SUBPLOTS` by the storyline engine.
 */
import type { EmergentSubplot } from './branchingStorylineEngine';

type Opt = readonly [id: string, label: string, flavor: string, flag: string, money: number, rep: number, outcome: string];

const beat = (n: 1 | 2, title: string, context: string, options: readonly [Opt, Opt]) => ({
  stageNumber: n,
  title,
  context,
  options: options.map(([id, label, flavorText, storyFlag, moneyDelta, repDelta, narrativeOutcome]) => ({
    id,
    label,
    flavorText,
    storyFlag,
    consequences: { moneyDelta, repDelta, narrativeOutcome },
  })),
});

type Beat = [title: string, context: string, options: readonly [Opt, Opt]];

const sub = (
  s: Omit<EmergentSubplot, 'stages'> & { s1: Beat; s2: Beat },
): EmergentSubplot => {
  const { s1, s2, ...rest } = s;
  return { ...rest, stages: [beat(1, ...s1), beat(2, ...s2)] };
};

export const INDUSTRY_SUBPLOTS: readonly EmergentSubplot[] = [
  // ───────────── 1960s ─────────────
  sub({
    id: 'subplot_dj_envelope',
    title: 'The Disc Jockey’s Envelope',
    kicker: 'RADIO // A FRIENDLY ENVELOPE',
    eras: ['analog60s'],
    minDay: 20,
    daysBetweenStages: 5,
    triggerCondition: (s) => s.reputation >= 12,
    s1: ['A Favour for the Airwaves', 'A local disc jockey hints that a record plays more often when the studio’s thank-you comes in a plain envelope. Everybody does it. Nobody says so.', [
      ['dj_pay', 'Slip him the envelope', 'It is only a few dollars and a great deal of airtime.', 'paid_the_dj', -400, 9, 'The record spins all week and climbs the regional chart. Somebody writes your name down.'],
      ['dj_refuse', 'Politely decline', 'Let the record make its own way.', 'refused_the_dj', 0, 5, 'The record dies quietly at number 40. The engineers hear about the refusal anyway.'],
    ]],
    s2: ['A Congressional Letter', 'A hearing into “promotional practices” is on the radio. Your name is not on any list, but someone has started making one.', [
      ['dj_testify', 'Offer to speak to the inquiry', 'Tell them how it really works.', 'testified_on_payola', -450, 10, 'The room goes silent, then applauds. Half the dial stops returning your calls.'],
      ['dj_lawyer_up', 'Say nothing and hire a lawyer', 'Nobody ever won a hearing by talking.', 'lawyered_up_payola', -100, 0, 'The letter is filed and forgotten. So, slightly, are you.'],
    ]],
  }),
  sub({
    id: 'subplot_echo_chamber',
    title: 'The Echo Chamber',
    kicker: 'CRAFT // A WALL OF SOUND',
    eras: ['analog60s'],
    minDay: 24,
    daysBetweenStages: 5,
    triggerCondition: (s) => s.money >= 1200,
    s1: ['More Reverb, Obviously', 'A young producer with an enormous ego and an enormous idea wants every instrument on the same take, through a single basement echo chamber, at a volume the landlord will hear.', [
      ['echo_go_huge', 'Let him build the wall', 'Twelve guitars, three pianos, one headache.', 'built_the_wall', -700, 9, 'The take is overwhelming. It is either a masterpiece or a mistake.'],
      ['echo_keep_room', 'Keep the arrangement clean', 'Let the room breathe.', 'kept_room_breathing', 0, 4, 'The producer storms out. The record sounds like a room, which is the point.'],
    ]],
    s2: ['The Test Pressing', 'The test pressing arrives. On a small radio, it sounds like a storm in a shoebox.', [
      ['echo_embrace_storm', 'Release it exactly as mixed', 'Some records are meant to overwhelm.', 'released_the_storm', 0, 11, 'The record is talked about in the way only strange records are.'],
      ['echo_rebalance', 'Pull it back for small speakers', 'Radio is what pays the rent.', 'rebalanced_for_radio', 250, 5, 'The compromise plays everywhere, and thrills nobody in particular.'],
    ]],
  }),

  sub({
    id: 'subplot_open_ended_session',
    title: 'The Record With No Singles',
    kicker: 'CRAFT // THE STUDIO AS AN INSTRUMENT',
    eras: ['analog60s'],
    minDay: 30,
    daysBetweenStages: 6,
    triggerCondition: (s) => s.reputation >= 20,
    s1: ['“We’ll Know When It’s Done”', 'A four-piece band has been on the road for three years and is sick of recording a song an hour. They want your room for as long as it takes, with no singles, no deadline, and a string quartet they cannot yet afford.', [
      ['open_book_weeks', 'Block out six weeks of the diary', 'Let them treat the studio like an instrument.', 'booked_open_ended_weeks', -800, 10, 'Every day brings a new idea. Some of them are even good.'],
      ['open_cap_at_two', 'Offer two weeks and a firm end date', 'Art expands to fill the budget.', 'capped_the_open_session', 0, 4, 'The band grumbles, then delivers the tightest thing they have ever made.'],
    ]],
    s2: ['The Label Wants a Single', 'The record is finished and does not contain a hit. The label would like to know what they are supposed to sell.', [
      ['open_defend_album', 'Defend it as one piece of work', 'Some records only make sense start to finish.', 'defended_the_album', -150, 12, 'Critics call it a turning point. The label calls it a headache.'],
      ['open_cut_single', 'Cut a radio edit from the best section', 'Give the label its three minutes.', 'cut_a_radio_edit', 450, 2, 'The edit is a hit. The album version is what people quietly prefer.'],
    ]],
  }),

  // ───────────── 1980s ─────────────
  sub({
    id: 'subplot_gated_drum',
    title: 'The Happy Accident',
    kicker: 'CRAFT // A TALKBACK MIC LEFT ON',
    eras: ['digital80s'],
    minDay: 18,
    daysBetweenStages: 4,
    triggerCondition: (s) => s.reputation >= 15,
    s1: ['Someone Left the Talkback On', 'A drummer is warming up in a stone corridor while the talkback mic is open. Through the compressor, the drum sounds like a slammed door in a cathedral. Your engineer’s eyebrows have left the building.', [
      ['gate_steal', 'Build the whole session around it', 'A sound nobody has heard yet.', 'built_gated_sound', -300, 8, 'The drum sound spreads. Everyone else spends six months working out how.'],
      ['gate_shelve', 'Note it and keep recording', 'One happy accident is not a sound.', 'shelved_the_accident', 0, 2, 'You record a solid album. Another studio sells the trick to the world.'],
    ]],
    s2: ['Everyone Wants That Snare', 'Every A&R man in town wants “that drum sound” on their next record. A rival claims it was theirs first.', [
      ['gate_tell_story', 'Tell the true story in the trades', 'Honesty makes a good legend.', 'told_gated_story', 0, 9, 'The story is repeated at parties for decades.'],
      ['gate_license', 'Sell sessions by the day', 'The trick is billable.', 'sold_the_sound', 700, 3, 'Your diary fills. Your signature gets thinner.'],
    ]],
  }),
  sub({
    id: 'subplot_drum_machine_panic',
    title: 'The Machine in the Corner',
    kicker: 'LABOUR // THE DRUMMERS ARE WORRIED',
    eras: ['digital80s'],
    minDay: 26,
    daysBetweenStages: 5,
    triggerCondition: (s) => s.money >= 1500,
    s1: ['It Never Misses a Beat', 'A salesman delivers a programmable drum computer and a demo reel. Your regular session drummer watches the demonstration in silence, then asks what happens to him.', [
      ['machine_buy', 'Buy the machine and keep the drummer', 'Use both. Pay both.', 'used_both_drum_sources', -900, 6, 'The hybrid sound is unmistakable, and the drummer is very smug about it.'],
      ['machine_pass', 'Pass on the machine', 'Some things need a human wobble.', 'passed_on_machine', 0, 3, 'You are the last analog-drum room in town. Purists pay a premium.'],
    ]],
    s2: ['The First Number One', 'One of your rivals scores a chart-topper built entirely on the machine. The drummers’ union sends a politely furious telegram.', [
      ['machine_union_talks', 'Meet the drummers half way', 'A fee for every programmed track.', 'paid_drummers_fee', -300, 10, 'A precedent nobody expected a studio to set.'],
      ['machine_full_steam', 'Go fully electronic', 'The future does not wait.', 'went_fully_electronic', 500, 2, 'You are early to a sound the next decade will live inside.'],
    ]],
  }),
  sub({
    id: 'subplot_global_jukebox',
    title: 'The Global Jukebox',
    kicker: 'EVENT // EVERYONE ON ONE STAGE',
    eras: ['digital80s'],
    minDay: 32,
    daysBetweenStages: 6,
    triggerCondition: (s) => s.reputation >= 30,
    s1: ['A Charity Record, Fast', 'A famous promoter wants every big name in the country on one charity single, recorded in a single night. Yours is the only room available. Egos are assembling in the car park.', [
      ['jukebox_donate_room', 'Donate the room and the crew', 'The cause is bigger than the invoice.', 'donated_the_room', -600, 12, 'Forty famous people argue about a chorus for six hours. The record is magic.'],
      ['jukebox_charge_cost', 'Charge at cost', 'A charity can still pay the electricity.', 'charged_cost_for_charity', 0, 6, 'Nobody complains. Nobody remembers who made the tea.'],
    ]],
    s2: ['The Credits Argument', 'The record is a worldwide hit. A row breaks out over whose name goes where on the sleeve.', [
      ['jukebox_credit_all', 'List the whole crew, tea-maker included', 'Everyone in the room gets a line.', 'credited_everyone_charity', 0, 11, 'The sleeve is seven inches of tiny type, and the crew have it framed.'],
      ['jukebox_credit_stars', 'Put the famous names up front', 'The record is for the stars.', 'credited_only_stars', 300, 2, 'The record sells. The crew mutter into their tea.'],
    ]],
  }),

  // ───────────── 2000s ─────────────
  sub({
    id: 'subplot_loudness_war',
    title: 'The Loudness War',
    kicker: 'CRAFT // TURN IT UP',
    eras: ['internet2000s'],
    minDay: 18,
    daysBetweenStages: 5,
    triggerCondition: (s) => s.reputation >= 15,
    s1: ['“Can You Make It Louder?”', 'A label head holds up a rival’s record and asks why yours sounds quieter. The waveform on your monitor looks like a brick.', [
      ['loud_crush', 'Crush it to match', 'Loud is the only thing the radio hears.', 'crushed_the_master', 300, 4, 'The record wins the radio comparison. The dynamic range quietly files a complaint.'],
      ['loud_hold', 'Hold your ground', 'Dynamics are the music.', 'held_the_dynamics', 0, 6, 'The label sighs. The record sounds alive on good speakers.'],
    ]],
    s2: ['The Listener Fatigue Letter', 'A reviewer notes that the record is exhausting to hear all the way through, or that it is the best-sounding record of the year. It depends on what you did.', [
      ['loud_remaster_reissue', 'Offer a dynamic “reference” edition', 'Give listeners the choice.', 'released_dynamic_edition', -350, 11, 'The dynamic edition becomes the one audiophiles pass around.'],
      ['loud_double_down', 'Stay the course', 'The numbers are the numbers.', 'doubled_down_loudness', 250, 0, 'The record keeps selling, and nobody writes about it fondly.'],
    ]],
  }),
  sub({
    id: 'subplot_pitch_correction',
    title: 'The Perfect Voice',
    kicker: 'TECHNOLOGY // A ROBOT IN THE CHORUS',
    eras: ['internet2000s'],
    minDay: 26,
    daysBetweenStages: 5,
    triggerCondition: (s) => s.money >= 1500,
    s1: ['Tuned to the Nines', 'A plug-in can snap any vocal dead on pitch. Set the speed to zero and it stops sounding like a singer and starts sounding like a synthesiser. A client is asking for exactly that.', [
      ['pitch_effect', 'Use it as a deliberate effect', 'The robot is the hook.', 'used_tuning_as_effect', -250, 6, 'The record has a sound nobody is sure they like, which is how hits start.'],
      ['pitch_natural', 'Use it only invisibly', 'Fix the notes, keep the human.', 'used_tuning_invisibly', 0, 4, 'Nobody notices, which is the point and the problem.'],
    ]],
    s2: ['The Live Show', 'The track is a hit. Now the singer has to perform it live, on pitch, without the plug-in.', [
      ['pitch_rehearse', 'Book extra rehearsals', 'Let the singer earn the song.', 'rehearsed_the_singer', -300, 10, 'The live version is wobbly, human and oddly better.'],
      ['pitch_backing_track', 'Run the tuned vocal as a backing track', 'Audiences mostly want the record.', 'used_backing_vocal', 350, 0, 'The show is flawless. Somebody posts a video of the mouth not moving.'],
    ]],
  }),
  sub({
    id: 'subplot_talent_show',
    title: 'The Talent Show Winner',
    kicker: 'MEDIA // FIFTEEN MILLION VOTES',
    eras: ['internet2000s'],
    minDay: 34,
    daysBetweenStages: 6,
    triggerCondition: (s) => s.reputation >= 25,
    s1: ['The Winner Needs a Record by Friday', 'A televised talent contest has a new winner, a contract, and a release date in nine days. The label wants a producer who will say yes to everything.', [
      ['show_yes', 'Say yes and deliver on the deadline', 'Nine days is plenty if you never sleep.', 'rushed_the_winner_record', 800, 2, 'The record ships on time and sounds exactly like nine days.'],
      ['show_push_back', 'Insist on another two weeks', 'A rushed debut is a forgotten debut.', 'pushed_back_on_winner', -200, 8, 'The label huffs, then sees the pre-orders and relents.'],
    ]],
    s2: ['After the Confetti', 'Six months later the winner is off the charts and back in your control room, asking for a song they wrote themselves.', [
      ['show_back_them', 'Back the songwriter', 'Give them the room and the time.', 'backed_the_songwriter', -400, 12, 'The record is raw and real, and the critics who ignored the first one take notice.'],
      ['show_steer_safe', 'Steer them towards a safe follow-up', 'Safe sells.', 'steered_to_safe_follow_up', 450, 0, 'It sells. It sounds like the first record with the serial numbers filed off.'],
    ]],
  }),

  // ───────────── 2020s ─────────────
  sub({
    id: 'subplot_lofi_stream',
    title: 'The Girl Who Studies Forever',
    kicker: 'STREAMING // BEATS TO RELAX TO',
    eras: ['streaming2020s'],
    minDay: 20,
    daysBetweenStages: 5,
    triggerCondition: (s) => s.reputation >= 15,
    s1: ['An Endless Stream', 'An anonymous channel has been looping a cartoon student at a desk for years. A hundred thousand people are listening at any hour, and the tracks are coming from bedrooms around the world. Someone has asked whether your studio would like to send some.', [
      ['lofi_submit', 'Submit a batch of calm instrumentals', 'Let the quiet tracks do the work.', 'submitted_lofi_tracks', -150, 7, 'The streams arrive slowly and never stop.'],
      ['lofi_own_label', 'Start your own calm-beats channel', 'Own the stream, not the slot.', 'started_own_lofi_channel', -500, 12, 'A small, strange business with no overheads and endless patience.'],
    ]],
    s2: ['Nobody Knows Who You Are', 'The tracks are everywhere. Nobody connects them to the studio. Some artists are fine with that; some are not.', [
      ['lofi_credit_out', 'Put the studio name in every description', 'Build a brand in the small print.', 'branded_the_lofi_streams', 0, 10, 'A small, stubborn audience follows the name back to you.'],
      ['lofi_stay_anonymous', 'Stay anonymous and collect royalties', 'Quiet money is still money.', 'stayed_anonymous_lofi', 400, 0, 'The royalties arrive, and so does a slightly eerie peace.'],
    ]],
  }),
  sub({
    id: 'subplot_fifteen_second_hook',
    title: 'The Fifteen-Second Hook',
    kicker: 'VIRAL // A SONG FROM 1985 IS TRENDING',
    eras: ['streaming2020s'],
    minDay: 28,
    daysBetweenStages: 5,
    triggerCondition: (s) => s.reputation >= 20,
    s1: ['The Old Record Wakes Up', 'A short-video trend has resurrected a forgotten album from your back catalogue. Teenagers are dancing to a bridge you cut for time. The original artist has just discovered they are famous again.', [
      ['hook_reissue', 'Rush out an official reissue', 'Strike while the algorithm is hot.', 'rushed_viral_reissue', -450, 8, 'The reissue ships before the trend dies. The bridge is finally long enough.'],
      ['hook_contact_artist', 'Call the artist first and plan it properly', 'Nobody should learn about their own hit from a comment section.', 'called_artist_first', -700, 10, 'Slower, kinder, and the artist is on the record sleeve this time.'],
    ]],
    s2: ['The Trend Moves On', 'Three weeks later the internet moves on. What is left is an audience, a catalogue and a choice.', [
      ['hook_tour', 'Help the artist mount a comeback tour', 'The second act might be the real one.', 'backed_comeback_tour', -500, 13, 'The shows sell out in their hometown and a few places they never expected.'],
      ['hook_licence_sync', 'License the track to every advertiser that calls', 'Milk it while it lasts.', 'licensed_viral_track', 900, -2, 'The cheques are huge. The track is now in a car advert.'],
    ]],
  }),
  sub({
    id: 'subplot_vinyl_revival',
    title: 'The Pressing Plant Waiting List',
    kicker: 'CRAFT // BACK TO WAX',
    eras: ['streaming2020s'],
    minDay: 34,
    daysBetweenStages: 6,
    triggerCondition: (s) => s.money >= 2500,
    s1: ['Vinyl Is Back, and So Is the Queue', 'Collectors want wax, and there are only a handful of pressing plants left. The wait is over a year. Somebody suggests the studio cut its own lacquers.', [
      ['wax_buy_lathe', 'Buy a used lathe and cut in-house', 'Own the whole chain, tape to groove.', 'bought_a_lathe', -1400, 9, 'The first cut is terrible. The fiftieth is beautiful.'],
      ['wax_partner_plant', 'Partner with a small plant', 'Share the queue, split the margin.', 'partnered_with_plant', -300, 5, 'Slower, cheaper, and someone else’s problem when it jams.'],
    ]],
    s2: ['The Test Pressing', 'The first run arrives. Every pop and crackle is exactly where it should not be.', [
      ['wax_redo', 'Scrap the run and redo it properly', 'A bad record is a public record.', 'scrapped_bad_pressing', -600, 10, 'The second run is gorgeous. Collectors notice, and talk.'],
      ['wax_sell_flawed', 'Sell the flawed run as “rare”', 'A crackle is character.', 'sold_flawed_pressing', 500, -4, 'Sold out, and a forum thread about the “mistake” begins immediately.'],
    ]],
  }),
];
