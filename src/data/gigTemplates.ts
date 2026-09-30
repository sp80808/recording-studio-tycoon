/**
 * Gig template catalog.
 *
 * Every era of the career gets its own working repertoire: the genres listed in
 * `ERA_DEFINITIONS[].availableGenres` all have at least one starter and one
 * advanced booking, so a 1980 studio is cutting New Wave and Hip-Hop rather than
 * an endless run of "Electronic" demos. A handful of "timeless" genres (Rock,
 * Jazz, Folk, Acoustic, Soul, Pop) stay on the board in every era at a lower
 * weight — they are off-trend (the genre market multiplier already prices that
 * in) but they keep origin perks such as the Tape Purist's relevant all game.
 *
 * Pure data + pure selection helpers — no RNG lives here. `generateNewProjects`
 * owns randomness so tests and the balance harness keep their seeded streams.
 */

export type GigTier = 'starter' | 'advanced';

export interface GigStageTemplate {
  stageName: string;
  workUnitsBase: number;
  focusAreas: string[];
}

export interface GigTemplate {
  id: string;
  titleTemplates: string[];
  genre: string;
  clientType: 'Independent' | 'Record Label' | 'Commercial' | 'Streaming';
  difficulty: number;
  tier: GigTier;
  /** Era ids this gig is native to. Empty = native wherever the era's genre list names its genre. */
  eras: string[];
  /** Also offered outside its native eras at reduced weight (off-trend, priced by the genre market). */
  timeless?: boolean;
  baseStages: GigStageTemplate[];
  basePayout: number;
  baseRep: number;
  baseDuration: number;
}

const stage = (stageName: string, workUnitsBase: number, ...focusAreas: string[]): GigStageTemplate => ({
  stageName,
  workUnitsBase,
  focusAreas,
});

const A = 'analog60s';
const D = 'digital80s';
const I = 'internet2000s';
const S = 'streaming2020s';

export const GIG_TEMPLATES: readonly GigTemplate[] = [
  // ───────────────────────── Timeless staples (offered in every era) ─────────────────────────
  {
    id: 'timeless-rock-demo',
    titleTemplates: ['Local Band Demo', 'Garage Band Recording', 'Indie Demo Session'],
    genre: 'Rock', clientType: 'Independent', difficulty: 2, tier: 'starter', eras: [A], timeless: true,
    baseStages: [stage('Setup & Recording', 8, 'soundCapture', 'performance'), stage('Basic Mixing', 10, 'layering', 'soundCapture'), stage('Demo Master', 6, 'performance', 'layering')],
    basePayout: 900, baseRep: 3, baseDuration: 4,
  },
  {
    id: 'timeless-rock-anthem',
    titleTemplates: ['Rock Anthem', 'Power Ballad', 'Stadium Rocker'],
    genre: 'Rock', clientType: 'Record Label', difficulty: 4, tier: 'advanced', eras: [], timeless: true,
    baseStages: [stage('Songwriting & Arrangement', 10, 'performance', 'soundCapture'), stage('Tracking & Recording', 14, 'soundCapture', 'layering'), stage('Mixing & Production', 12, 'layering', 'performance'), stage('Mastering & Polish', 8, 'soundCapture', 'layering')],
    basePayout: 1700, baseRep: 6, baseDuration: 8,
  },
  {
    id: 'timeless-acoustic',
    titleTemplates: ['Coffee Shop Sessions', 'Acoustic Evening', 'Songwriter Demo'],
    genre: 'Acoustic', clientType: 'Independent', difficulty: 1, tier: 'starter', eras: [], timeless: true,
    baseStages: [stage('Live Recording', 6, 'soundCapture', 'performance'), stage('Light Production', 8, 'layering', 'soundCapture')],
    basePayout: 750, baseRep: 2, baseDuration: 3,
  },
  {
    id: 'timeless-folk',
    titleTemplates: ['Folk Harmony Sessions', 'Front-Porch Field Recording', 'Songwriter Circle Live'],
    genre: 'Folk', clientType: 'Independent', difficulty: 2, tier: 'starter', eras: [A], timeless: true,
    baseStages: [stage('Acoustic Setup', 7, 'performance', 'soundCapture'), stage('Multi-Vocal Recording', 9, 'layering', 'performance'), stage('Traditional Mix', 5, 'soundCapture', 'layering')],
    basePayout: 850, baseRep: 3, baseDuration: 4,
  },
  {
    id: 'timeless-jazz',
    titleTemplates: ['Jazz Session Recording', 'Big Band Live Session', 'Trumpet & Piano Duo'],
    genre: 'Jazz', clientType: 'Independent', difficulty: 3, tier: 'starter', eras: [A], timeless: true,
    baseStages: [stage('Live Setup & Mic Placement', 9, 'soundCapture', 'performance'), stage('Live Recording Session', 11, 'performance', 'soundCapture'), stage('Analog Mix & Press', 7, 'soundCapture', 'layering')],
    basePayout: 950, baseRep: 3, baseDuration: 4,
  },
  {
    id: 'timeless-soul',
    titleTemplates: ['Soul Vocal Session', 'Late-Night Rhythm & Blues', 'Gospel Choir Overdubs'],
    genre: 'Soul', clientType: 'Independent', difficulty: 3, tier: 'starter', eras: [A], timeless: true,
    baseStages: [stage('Rhythm Section Setup', 10, 'soundCapture', 'performance'), stage('Lead Vocal Recording', 12, 'performance', 'soundCapture'), stage('Horn Section Overdubs', 8, 'layering', 'performance')],
    basePayout: 1000, baseRep: 4, baseDuration: 5,
  },
  {
    id: 'timeless-pop-commercial',
    titleTemplates: ['Corporate Harmony', 'Brand Anthem', 'Commercial Melody'],
    genre: 'Pop', clientType: 'Commercial', difficulty: 4, tier: 'advanced', eras: [], timeless: true,
    baseStages: [stage('Client Consultation & Concept', 8, 'performance', 'soundCapture'), stage('Multiple Variations & Testing', 12, 'layering', 'performance'), stage('Final Production & Delivery', 10, 'soundCapture', 'layering')],
    basePayout: 1500, baseRep: 6, baseDuration: 6,
  },

  // ───────────────────────── 1960s — analog ─────────────────────────
  {
    id: 'a-motown-single',
    titleTemplates: ['Hitsville Rhythm Section', 'Three-Minute Soul Single', 'Girl-Group Harmony Take'],
    genre: 'Motown', clientType: 'Record Label', difficulty: 3, tier: 'starter', eras: [A],
    baseStages: [stage('Rhythm Section Live Take', 9, 'performance', 'soundCapture'), stage('Tambourine & Handclap Layers', 7, 'layering', 'performance'), stage('Lead & Backing Vocals', 10, 'performance', 'layering')],
    basePayout: 1000, baseRep: 4, baseDuration: 5,
  },
  {
    id: 'a-country-ballad',
    titleTemplates: ['Nashville Weeper', 'Pedal-Steel Ballad', 'Honky-Tonk Two-Step'],
    genre: 'Country', clientType: 'Independent', difficulty: 2, tier: 'starter', eras: [A],
    baseStages: [stage('Band Tracking Live', 8, 'soundCapture', 'performance'), stage('Pedal Steel & Fiddle Overdubs', 8, 'layering', 'performance'), stage('Vocal Double & Mix', 6, 'performance', 'soundCapture')],
    basePayout: 850, baseRep: 3, baseDuration: 4,
  },
  {
    id: 'a-rock-45',
    titleTemplates: ['Surf-Rock 45', 'British Invasion B-Side', 'Fuzz-Box Garage Single'],
    genre: 'Rock', clientType: 'Record Label', difficulty: 3, tier: 'starter', eras: [A], timeless: true,
    baseStages: [stage('Amp Mic-Up & Tracking', 8, 'soundCapture', 'performance'), stage('Fuzz & Spring Reverb Overdubs', 8, 'layering', 'soundCapture'), stage('Mono Mix for Radio', 6, 'layering', 'performance')],
    basePayout: 950, baseRep: 4, baseDuration: 4,
  },
  {
    id: 'a-motown-showcase',
    titleTemplates: ['Revue Night Headliner', 'Chart-Topper Follow-Up', 'Studio-A Marathon'],
    genre: 'Motown', clientType: 'Record Label', difficulty: 5, tier: 'advanced', eras: [A],
    baseStages: [stage('Charts & Arrangement', 10, 'performance', 'soundCapture'), stage('Full Band Live Take', 14, 'soundCapture', 'performance'), stage('Strings & Horn Overdubs', 12, 'layering', 'performance'), stage('Mono Mastering Cut', 8, 'soundCapture', 'layering')],
    basePayout: 1900, baseRep: 8, baseDuration: 8,
  },
  {
    id: 'a-jazz-concept',
    titleTemplates: ['Modal Suite in Two Parts', 'Blue-Room Live Album', 'Quartet at Midnight'],
    genre: 'Jazz', clientType: 'Record Label', difficulty: 5, tier: 'advanced', eras: [A], timeless: true,
    baseStages: [stage('Room Tuning & Mic Placement', 10, 'soundCapture', 'performance'), stage('One-Take Live Session', 14, 'performance', 'soundCapture'), stage('Analog Mix', 10, 'soundCapture', 'layering')],
    basePayout: 1800, baseRep: 7, baseDuration: 7,
  },
  {
    id: 'a-blues-house',
    titleTemplates: ['Delta Slide Session', 'Chicago Harp & Amp', 'Juke-Joint Two-Track'],
    genre: 'Blues', clientType: 'Independent', difficulty: 2, tier: 'starter', eras: [A],
    baseStages: [stage('Amp & Harp Mic-Up', 7, 'soundCapture', 'performance'), stage('Live Take', 9, 'performance', 'soundCapture'), stage('Raw Mix', 5, 'soundCapture', 'layering')],
    basePayout: 800, baseRep: 3, baseDuration: 3,
  },

  // ───────────────────────── 1980s — digital ─────────────────────────
  {
    id: 'd-newwave-single',
    titleTemplates: ['Drum-Machine Love Song', 'Skinny-Tie Single', 'Post-Punk Synth Hook'],
    genre: 'New Wave', clientType: 'Record Label', difficulty: 3, tier: 'starter', eras: [D],
    baseStages: [stage('Drum Machine Programming', 8, 'layering', 'performance'), stage('Synth Hook Layers', 9, 'layering', 'soundCapture'), stage('Gated Reverb Mix', 7, 'soundCapture', 'layering')],
    basePayout: 950, baseRep: 3, baseDuration: 4,
  },
  {
    id: 'd-hiphop-breaks',
    titleTemplates: ['Block-Party Breakbeat', 'Cut & Scratch Cassette', 'Cipher Demo Tape'],
    genre: 'Hip-Hop', clientType: 'Independent', difficulty: 2, tier: 'starter', eras: [D, I, S],
    baseStages: [stage('Beat Digging & Sampling', 7, 'layering', 'performance'), stage('Verse Tracking', 8, 'performance', 'soundCapture'), stage('Hard-Panned Mix', 6, 'soundCapture', 'layering')],
    basePayout: 700, baseRep: 3, baseDuration: 4,
  },
  {
    id: 'd-hairmetal-riff',
    titleTemplates: ['Sunset-Strip Power Chords', 'Spandex Stadium Chorus', 'Shred Solo Overdubs'],
    genre: 'Hair Metal', clientType: 'Record Label', difficulty: 4, tier: 'starter', eras: [D],
    baseStages: [stage('Wall-of-Guitars Tracking', 10, 'soundCapture', 'performance'), stage('Gang Vocal Stack', 9, 'layering', 'performance'), stage('Big Snare Mix', 8, 'layering', 'soundCapture')],
    basePayout: 1150, baseRep: 5, baseDuration: 5,
  },
  {
    id: 'd-punk-7inch',
    titleTemplates: ['Basement 7-Inch', 'Two-Minute Fury', 'Squat Show Live Tape'],
    genre: 'Punk', clientType: 'Independent', difficulty: 1, tier: 'starter', eras: [D],
    baseStages: [stage('Live-to-Two-Track', 5, 'performance', 'soundCapture'), stage('Loud Mix', 5, 'soundCapture', 'layering')],
    basePayout: 450, baseRep: 2, baseDuration: 2,
  },
  {
    id: 'd-disco-floor',
    titleTemplates: ['Twelve-Inch Extended Mix', 'Mirror-Ball Floor Filler', 'Strings & Four-on-the-Floor'],
    genre: 'Disco', clientType: 'Record Label', difficulty: 3, tier: 'starter', eras: [D],
    baseStages: [stage('Rhythm Section Groove', 9, 'performance', 'soundCapture'), stage('String & Horn Stabs', 8, 'layering', 'performance'), stage('Club Mix', 8, 'layering', 'soundCapture')],
    basePayout: 950, baseRep: 3, baseDuration: 4,
  },
  {
    id: 'd-electronic-synthwave',
    titleTemplates: ['Bedroom Beat Session', 'First Synth Single', 'Club Demo'],
    genre: 'Electronic', clientType: 'Independent', difficulty: 2, tier: 'starter', eras: [D, I],
    baseStages: [stage('Beat Programming', 7, 'layering', 'performance'), stage('Synth Tracking', 8, 'soundCapture', 'layering'), stage('Rough Mix', 6, 'layering', 'soundCapture')],
    basePayout: 320, baseRep: 3, baseDuration: 4,
  },
  {
    id: 'd-newwave-video',
    titleTemplates: ['Video-Ready Chart Hit', 'MTV Rotation Single', 'Neon-Suit Comeback'],
    genre: 'New Wave', clientType: 'Record Label', difficulty: 6, tier: 'advanced', eras: [D],
    baseStages: [stage('Sequencer Arrangement', 12, 'layering', 'performance'), stage('Polysynth Layers', 14, 'layering', 'soundCapture'), stage('Vocal Comping', 10, 'performance', 'layering'), stage('Radio Mix & Edit', 10, 'soundCapture', 'layering')],
    basePayout: 2100, baseRep: 9, baseDuration: 9,
  },
  {
    id: 'd-hiphop-album',
    titleTemplates: ['Crate-Digger Debut LP', 'Golden-Age Posse Cut', 'Turntable Suite'],
    genre: 'Hip-Hop', clientType: 'Record Label', difficulty: 5, tier: 'advanced', eras: [D, I, S],
    baseStages: [stage('Sample Clearance & Chops', 12, 'layering', 'performance'), stage('Multi-Verse Tracking', 14, 'performance', 'soundCapture'), stage('Full-Length Mix', 12, 'soundCapture', 'layering')],
    basePayout: 1900, baseRep: 8, baseDuration: 8,
  },
  {
    id: 'd-hairmetal-album',
    titleTemplates: ['Platinum-Bound Power Ballad', 'Arena Tour Album', 'Video Vixen Anthem'],
    genre: 'Hair Metal', clientType: 'Record Label', difficulty: 6, tier: 'advanced', eras: [D],
    baseStages: [stage('Pre-Production Rehearsal', 10, 'performance', 'soundCapture'), stage('Bed Track Tracking', 14, 'soundCapture', 'performance'), stage('Harmony Guitar Stacks', 12, 'layering', 'performance'), stage('Slick Mix', 10, 'layering', 'soundCapture')],
    basePayout: 2200, baseRep: 9, baseDuration: 9,
  },

  // ───────────────────────── 2000s — internet ─────────────────────────
  {
    id: 'i-poppunk-single',
    titleTemplates: ['Skate-Park Singalong', 'Mall-Punk Radio Edit', 'Suburban Anthem'],
    genre: 'Pop-punk', clientType: 'Record Label', difficulty: 3, tier: 'starter', eras: [I],
    baseStages: [stage('Power-Chord Tracking', 8, 'soundCapture', 'performance'), stage('Gang-Vocal Hooks', 8, 'layering', 'performance'), stage('Loud Radio Mix', 7, 'layering', 'soundCapture')],
    basePayout: 950, baseRep: 4, baseDuration: 4,
  },
  {
    id: 'i-emo-ep',
    titleTemplates: ['Diary Entry EP', 'Screamo Split 7-Inch', 'Midnight Burned CD'],
    genre: 'Emo', clientType: 'Independent', difficulty: 3, tier: 'starter', eras: [I],
    baseStages: [stage('Dynamic Guitar Tracking', 8, 'soundCapture', 'performance'), stage('Confessional Vocal Takes', 10, 'performance', 'soundCapture'), stage('Emotional Mix', 7, 'layering', 'soundCapture')],
    basePayout: 850, baseRep: 3, baseDuration: 4,
  },
  {
    id: 'i-indie-mp3',
    titleTemplates: ['MySpace Lo-Fi Single', 'Blog-Buzz Debut', 'Dorm-Room Four-Track'],
    genre: 'Indie', clientType: 'Independent', difficulty: 2, tier: 'starter', eras: [I],
    baseStages: [stage('DIY Tracking', 7, 'soundCapture', 'performance'), stage('Layer the Hook', 8, 'layering', 'performance'), stage('Web-Ready Master', 5, 'soundCapture', 'layering')],
    basePayout: 700, baseRep: 3, baseDuration: 3,
  },
  {
    id: 'i-digital-ringtone',
    titleTemplates: ['Polyphonic Ringtone Pack', 'CD-Burn Compilation', 'Digital Single Launch'],
    genre: 'Digital', clientType: 'Commercial', difficulty: 2, tier: 'starter', eras: [I],
    baseStages: [stage('Hook Sequencing', 6, 'layering', 'performance'), stage('Loudness Master', 6, 'soundCapture', 'layering')],
    basePayout: 500, baseRep: 2, baseDuration: 3,
  },
  {
    id: 'i-poppunk-album',
    titleTemplates: ['Warped-Tour Debut LP', 'Platinum Teen Anthem', 'Arena Singalong LP'],
    genre: 'Pop-punk', clientType: 'Record Label', difficulty: 5, tier: 'advanced', eras: [I],
    baseStages: [stage('Pre-Production', 8, 'performance', 'soundCapture'), stage('Full Tracking', 14, 'soundCapture', 'performance'), stage('Vocal Stack', 10, 'layering', 'performance'), stage('Radio Mix & Master', 10, 'layering', 'soundCapture')],
    basePayout: 1900, baseRep: 8, baseDuration: 8,
  },
  {
    id: 'i-electronic-club',
    titleTemplates: ['Festival Banger', 'Electronic Anthem', 'Bass Drop Empire'],
    genre: 'Electronic', clientType: 'Commercial', difficulty: 6, tier: 'advanced', eras: [D, I],
    baseStages: [stage('Beat Programming & Sound Design', 14, 'layering', 'performance'), stage('Arrangement & Build-ups', 16, 'performance', 'layering'), stage('Mixing & Master', 12, 'layering', 'soundCapture')],
    basePayout: 1800, baseRep: 8, baseDuration: 8,
  },
  {
    id: 'i-indie-breakout',
    titleTemplates: ['Pitchfork-Bound LP', 'Blog Darling Full-Length', 'Cult Record Reissue'],
    genre: 'Indie', clientType: 'Record Label', difficulty: 5, tier: 'advanced', eras: [I],
    baseStages: [stage('Concept & Tracking', 12, 'soundCapture', 'performance'), stage('Layered Textures', 14, 'layering', 'soundCapture'), stage('Analog-Digital Hybrid Mix', 12, 'soundCapture', 'layering')],
    basePayout: 1600, baseRep: 7, baseDuration: 7,
  },

  {
    id: 'di-electronic-symphony',
    titleTemplates: ['Symphony of Code', 'Digital Orchestra', 'Cyber Symphony'],
    genre: 'Electronic', clientType: 'Commercial', difficulty: 8, tier: 'advanced', eras: [D, I],
    baseStages: [stage('Thematic Composition', 16, 'performance', 'layering'), stage('Orchestration & Programming', 20, 'layering', 'soundCapture'), stage('Interactive Implementation', 18, 'performance', 'layering'), stage('Final Mix & Mastering', 14, 'layering', 'soundCapture')],
    basePayout: 3200, baseRep: 12, baseDuration: 12,
  },
  {
    id: 'di-electronic-neon',
    titleTemplates: ['Neon Dreams', 'Synthwave Journey', 'Retro Future'],
    genre: 'Electronic', clientType: 'Streaming', difficulty: 5, tier: 'advanced', eras: [D, I],
    baseStages: [stage('Concept & Sound Design', 12, 'layering', 'performance'), stage('Recording & Layering', 16, 'soundCapture', 'layering'), stage('Mixing & Mastering', 14, 'layering', 'performance')],
    basePayout: 1600, baseRep: 7, baseDuration: 7,
  },

  // ───────────────────────── 2020s — streaming ─────────────────────────
  {
    id: 's-edm-drop',
    titleTemplates: ['Festival Mainstage Drop', 'Sidechain Anthem', 'Sunrise Set Closer'],
    genre: 'EDM', clientType: 'Streaming', difficulty: 3, tier: 'starter', eras: [S],
    baseStages: [stage('Sound Design', 8, 'layering', 'performance'), stage('Build & Drop Arrangement', 9, 'performance', 'layering'), stage('Loud Master', 6, 'soundCapture', 'layering')],
    basePayout: 900, baseRep: 3, baseDuration: 4,
  },
  {
    id: 's-trap-beats',
    titleTemplates: ['808 Slide Cut', 'Hi-Hat Roll Single', 'Bedroom Trap Tape'],
    genre: 'Trap', clientType: 'Streaming', difficulty: 2, tier: 'starter', eras: [S],
    baseStages: [stage('808 & Hi-Hat Programming', 6, 'layering', 'performance'), stage('Vocal Tracking & Ad-libs', 8, 'performance', 'soundCapture'), stage('Sub-Heavy Mix', 6, 'soundCapture', 'layering')],
    basePayout: 650, baseRep: 3, baseDuration: 3,
  },
  {
    id: 's-indiepop',
    titleTemplates: ['Bedroom Pop Single', 'Indie Chorus Session', 'First Release'],
    genre: 'Indie Pop', clientType: 'Independent', difficulty: 2, tier: 'starter', eras: [S],
    baseStages: [stage('Vocal & Guitar Takes', 7, 'performance', 'soundCapture'), stage('Layer the Hook', 8, 'layering', 'performance'), stage('Streaming Master', 6, 'soundCapture', 'layering')],
    basePayout: 330, baseRep: 3, baseDuration: 4,
  },
  {
    id: 's-lofi',
    titleTemplates: ['Late Night Lo-fi', 'Study Beats EP', 'Tape Hiss Sessions'],
    genre: 'Lo-fi', clientType: 'Independent', difficulty: 1, tier: 'starter', eras: [S],
    baseStages: [stage('Sample & Texture', 6, 'layering', 'performance'), stage('Warm Mix', 7, 'soundCapture', 'layering')],
    basePayout: 260, baseRep: 2, baseDuration: 3,
  },
  {
    id: 's-tiktokpop',
    titleTemplates: ['Fifteen-Second Hook', 'Dance-Challenge Chorus', 'Viral Snippet Single'],
    genre: 'TikTok Pop', clientType: 'Streaming', difficulty: 3, tier: 'starter', eras: [S],
    baseStages: [stage('Hook Engineering', 7, 'performance', 'layering'), stage('Vocal Chop Layers', 8, 'layering', 'performance'), stage('Loudness-Normalised Master', 6, 'soundCapture', 'layering')],
    basePayout: 900, baseRep: 3, baseDuration: 3,
  },
  {
    id: 's-edm-collab',
    titleTemplates: ['Mainstage Residency Single', 'Festival Headliner Collab', 'Stadium Drop Suite'],
    genre: 'EDM', clientType: 'Commercial', difficulty: 7, tier: 'advanced', eras: [S],
    baseStages: [stage('Thematic Composition', 16, 'performance', 'layering'), stage('Orchestration & Programming', 20, 'layering', 'soundCapture'), stage('Interactive Implementation', 18, 'performance', 'layering'), stage('Final Mix & Mastering', 14, 'layering', 'soundCapture')],
    basePayout: 2600, baseRep: 12, baseDuration: 12,
  },
  {
    id: 's-trap-album',
    titleTemplates: ['Platinum Streaming Run', 'Playlist-Heavy Mixtape', 'Autotune Collective LP'],
    genre: 'Trap', clientType: 'Record Label', difficulty: 5, tier: 'advanced', eras: [S],
    baseStages: [stage('Beat Selection & Sound Design', 12, 'layering', 'performance'), stage('Multi-Song Vocal Tracking', 14, 'performance', 'soundCapture'), stage('Album Mix & Master', 12, 'soundCapture', 'layering')],
    basePayout: 1800, baseRep: 8, baseDuration: 8,
  },
  {
    id: 's-tiktokpop-viral',
    titleTemplates: ['Algorithm Darling', 'Playlist Bait', 'Sound-On Sensation'],
    genre: 'TikTok Pop', clientType: 'Streaming', difficulty: 5, tier: 'advanced', eras: [S],
    baseStages: [stage('Concept & Sound Design', 12, 'layering', 'performance'), stage('Recording & Layering', 16, 'soundCapture', 'layering'), stage('Mixing & Mastering', 14, 'layering', 'performance')],
    basePayout: 1700, baseRep: 7, baseDuration: 7,
  },
];

export interface WeightedGig {
  template: GigTemplate;
  weight: number;
}

/** Weight of an off-era "timeless" staple relative to a native era genre (1.0). */
export const TIMELESS_WEIGHT = 0.2;

const isNative = (template: GigTemplate, eraId: string, eraGenres: ReadonlySet<string>) =>
  template.eras.length > 0 ? template.eras.includes(eraId) : eraGenres.has(template.genre);

/**
 * Templates offered in an era for a given tier, weighted:
 *   native to the era        → 1.0
 *   timeless staple elsewhere → TIMELESS_WEIGHT (Rock/Jazz/Folk… stay bookable so origin perks never go dead)
 * Era-locked templates of another era never leak in (no 60s Motown showcase in 2020).
 * Always returns at least one entry.
 */
export const getEraGigPool = (
  eraId: string,
  tier: GigTier,
  eraGenres: readonly string[],
): WeightedGig[] => {
  const genreSet = new Set(eraGenres);
  const inTier = GIG_TEMPLATES.filter((t) => t.tier === tier);
  const pool: WeightedGig[] = [];
  for (const template of inTier) {
    if (isNative(template, eraId, genreSet)) pool.push({ template, weight: 1 });
    else if (template.timeless) pool.push({ template, weight: TIMELESS_WEIGHT });
  }
  return pool.length > 0 ? pool : inTier.map((template) => ({ template, weight: 1 }));
};

/** Deterministic weighted pick — `roll` is a caller-supplied number in [0, 1). */
export const pickWeightedGig = (pool: readonly WeightedGig[], roll: number): GigTemplate => {
  const total = pool.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.min(0.999999, Math.max(0, roll)) * total;
  for (const item of pool) {
    cursor -= item.weight;
    if (cursor < 0) return item.template;
  }
  return pool[pool.length - 1].template;
};
