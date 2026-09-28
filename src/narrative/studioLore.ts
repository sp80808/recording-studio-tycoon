/**
 * Studio Lore & Worldbuilding Codex.
 * Defines the Console Laws, Rival Studios, Historic Venues, and Industry Lore.
 */

export interface ConsoleLaw {
  id: string;
  number: number;
  title: string;
  quote: string;
  lore: string;
  gameplayPrinciple: string;
}

export interface RivalStudio {
  id: string;
  name: string;
  headProducer: string;
  epithet: string;
  philosophy: string;
  primaryPlaystyle: 'purist' | 'hit-maker' | 'underground' | 'sound-lab';
  preferredEra: string;
  signatureGenres: string[];
  threatLevel: 'Rookie' | 'Contender' | 'Titan' | 'Iconic Nemesis';
  catchphrase: string;
  rivalryBonus: string;
}

export interface HistoricStudio {
  id: string;
  name: string;
  city: string;
  establishedYear: number;
  claimToFame: string;
  acousticSecret: string;
  legendaryRecord: string;
}

export const CONSOLE_LAWS: readonly ConsoleLaw[] = [
  {
    id: 'law-red-light',
    number: 1,
    title: 'Law of the Red Light',
    quote: 'What happens inside the booth stays inside the booth.',
    lore: 'When the record tally light illuminates, outside drama ceases to exist. Vulnerability in vocal takes is holy.',
    gameplayPrinciple: 'Trusting artists yields +15% creativity on emotional or intimate tracks.',
  },
  {
    id: 'law-phase-cancellation',
    number: 2,
    title: 'Law of Phase Cancellation',
    quote: 'Two clashing egos cancel the low end.',
    lore: 'Just as two mic signals out of phase hollow out the bass guitar, two competing band leaders destroy track momentum.',
    gameplayPrinciple: 'Staff and client role friction reduces work speed unless mediated by Producer diplomacy.',
  },
  {
    id: 'law-master-tape',
    number: 3,
    title: 'Law of the Master Tape',
    quote: 'You can fix it in the mix, but your soul pays the interest.',
    lore: 'Relying on post-processing to rescue lazy tracking creates hollow records. The microphone must taste the truth.',
    gameplayPrinciple: 'High initial tracking stage completion prevents mastering penalties later.',
  },
  {
    id: 'law-first-take',
    number: 4,
    title: 'Law of the First Take',
    quote: 'The magic lives before the musician starts thinking.',
    lore: 'A singer on Take 1 has adrenaline and soul. By Take 14, they have muscle memory and regret.',
    gameplayPrinciple: 'Early session crits provide +25% XP; overworking tired musicians increases risk of sour takes.',
  },
  {
    id: 'law-3am-fader',
    number: 5,
    title: 'Law of the 3 AM Fader',
    quote: 'Never finalize a master after midnight without fresh ears.',
    lore: 'Ear fatigue is the thief of high frequencies. At 3 AM, every treble boost sounds brilliant until morning comes.',
    gameplayPrinciple: 'Working with zero energy imposes a -10 quality penalty unless Overdrive is specifically calibrated.',
  },
  {
    id: 'law-room-acoustic',
    number: 6,
    title: 'Law of the Room Acoustic',
    quote: 'You cannot EQ away a bad room; the room always wins.',
    lore: 'The walls, the ceiling wood, the standing waves. A legendary room turns mediocre instruments into symphonies.',
    gameplayPrinciple: 'Studio room upgrades provide permanent base quality floor boosts that cannot decay.',
  },
  {
    id: 'law-ground-loop',
    number: 7,
    title: 'Law of the Ground Loop',
    quote: 'A buzzing wire will find the quietest moment in a ballad.',
    lore: '60Hz hum respects neither fame nor talent. Clean power and shielded copper are the bedrock of sound.',
    gameplayPrinciple: 'Gear condition below 50% triggers subtle distortion and unexpected repair expenses.',
  },
  {
    id: 'law-royalty-split',
    number: 8,
    title: 'Law of the Royalty Split',
    quote: 'Friends write songs; business partners register publishing.',
    lore: 'The fastest band breakup happens at the mailbox when the first licensing check arrives.',
    gameplayPrinciple: 'Fair contracts foster Advocate client tiers; predatory contracts generate quick cash but burn bridges.',
  },
] as const;

export const RIVAL_STUDIOS: readonly RivalStudio[] = [
  {
    id: 'black-wax-vault',
    name: 'Black Wax Vault',
    headProducer: 'Silas Vance',
    epithet: 'The Analog High Priest',
    philosophy: 'Digital audio is a sterile illusion. If it didn’t pass through magnetised iron particles, it’s not music.',
    primaryPlaystyle: 'purist',
    preferredEra: 'vintage-warmth',
    signatureGenres: ['Rock', 'Jazz', 'Blues', 'Folk'],
    threatLevel: 'Iconic Nemesis',
    catchphrase: 'Feel the tape hiss. That is the sound of truth breathing.',
    rivalryBonus: 'Beating Black Wax Vault in Golden Reels awards grants +15 Permanent Reputation with purist labels.',
  },
  {
    id: 'apex-velocity',
    name: 'Apex Velocity Sound',
    headProducer: 'Chad Sterling',
    epithet: 'The Billboard Algorithm',
    philosophy: 'Hooks every 7 seconds, autotuned perfection, and brand integration. Music is high-frequency commerce.',
    primaryPlaystyle: 'hit-maker',
    preferredEra: 'modern-digital',
    signatureGenres: ['Pop', 'Electronic', 'Hip Hop', 'RnB'],
    threatLevel: 'Titan',
    catchphrase: 'If it doesn’t trend on day one, delete the stems.',
    rivalryBonus: 'Out-selling Apex Velocity on weekly charts unlocks exclusive corporate brand sponsorship contracts.',
  },
  {
    id: 'distortion-cellar',
    name: 'The Distortion Cellar',
    headProducer: 'Roxy Riot',
    epithet: 'The Sonic Saboteur',
    philosophy: 'Clean production is cowardice. Crank the preamps until the red lights burn out.',
    primaryPlaystyle: 'underground',
    preferredEra: 'retro-glam',
    signatureGenres: ['Punk', 'Garage Rock', 'Grunge', 'Alternative'],
    threatLevel: 'Contender',
    catchphrase: 'Turn it up until the landlord calls the cops.',
    rivalryBonus: 'Collaborating or rivaling Roxy unlocks rare Lo-Fi pedal mod blueprints and underground cult referrals.',
  },
  {
    id: 'silicon-harmonics',
    name: 'Silicon Harmonics Labs',
    headProducer: 'Dr. Aris Thorne',
    epithet: 'The Frequency Architect',
    philosophy: 'Sound is mathematical vibration. With correct modular routing and DSP, emotion can be synthesized.',
    primaryPlaystyle: 'sound-lab',
    preferredEra: 'digital-revolution',
    signatureGenres: ['Synthwave', 'Ambient', 'Techno', 'Electronic'],
    threatLevel: 'Contender',
    catchphrase: 'Everything is an oscillator if you push enough voltage through it.',
    rivalryBonus: 'Solving Dr. Thorne’s frequency riddles grants unique circuit mod components and synergy discoveries.',
  },
] as const;

export const HISTORIC_STUDIOS: readonly HistoricStudio[] = [
  {
    id: 'the-ditch',
    name: 'The Ditch Sound City',
    city: 'Mojave Desert, CA',
    establishedYear: 1969,
    claimToFame: 'Custom discrete Neve-style custom console and concrete live room that birthed heavy rock drum sounds.',
    acousticSecret: 'Raw unsealed concrete floor that creates thunderous 35ms natural slapback reflections.',
    legendaryRecord: 'Thunderhead Highway (1973)',
  },
  {
    id: 'abbey-imperial',
    name: 'Imperial Abbey Sound',
    city: 'London, UK',
    establishedYear: 1931,
    claimToFame: 'The cradle of four-track tape experimentation, plate reverbs, and orchestral rock grandeur.',
    acousticSecret: 'Subterranean brick echo chambers that preserve natural room tails without digital clutter.',
    legendaryRecord: 'Sgt. Fader’s Lonely Hearts Session (1967)',
  },
  {
    id: 'hitsville-electric',
    name: 'Hitsville Electric House',
    city: 'Detroit, MI',
    establishedYear: 1959,
    claimToFame: 'The studio that never slept: rhythm sections recorded in morning, horns at lunch, vocals by midnight.',
    acousticSecret: 'Attic studio floor with direct-injection DI boxes that punched basslines straight onto acetate.',
    legendaryRecord: 'Ain’t No Fader High Enough (1968)',
  },
] as const;

/** Retrieve all console laws */
export const getConsoleLaws = (): readonly ConsoleLaw[] => CONSOLE_LAWS;

/** Retrieve rival studios by playstyle alignment */
export const getRivalsByPlaystyle = (playstyle: string): RivalStudio[] =>
  RIVAL_STUDIOS.filter(r => r.primaryPlaystyle === playstyle);

/** Retrieve a specific rival studio by ID */
export const getRivalStudio = (id: string): RivalStudio | undefined =>
  RIVAL_STUDIOS.find(r => r.id === id);
