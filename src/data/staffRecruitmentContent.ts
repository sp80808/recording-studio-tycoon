/**
 * Era-aware pools for deterministic staff names, traits, and CV copy.
 * Changing a pool changes seed output — treat edits like appearance versions.
 */
import type { NpcEra } from '@/features/sprites/spriteTypes';

export type StaffJobRole = 'Engineer' | 'Producer' | 'Songwriter';

export interface EraNamePool {
  first: readonly string[];
  last: readonly string[];
}

export const ERA_NAME_POOLS: Record<NpcEra, EraNamePool> = {
  '1960s': {
    first: ['Buddy', 'Carole', 'Dusty', 'Aretha', 'Otis', 'Joni', 'Brian', 'Diana', 'Smokey', 'Phil', 'Martha', 'Leon', 'Gladys', 'Booker', 'Nico', 'Al'],
    last: ['Spector', 'King', 'Franklin', 'Redding', 'Mitchell', 'Wilson', 'Ross', 'Robinson', 'Holland', 'Gaye', 'Mayfield', 'Cooke', 'Springfield', 'Doe'],
  },
  '1970s': {
    first: ['Stevie', 'Donna', 'Nile', 'Chaka', 'David', 'Patti', 'Bob', 'Grace', 'Curtis', 'Ann', 'Marvin', 'Debbie', 'Todd', 'Sly', 'Kate', 'Giorgio'],
    last: ['Wonder', 'Summer', 'Rodgers', 'Khan', 'Bowie', 'Smith', 'Marley', 'Jones', 'Mayfield', 'Wilson', 'Gaye', 'Harry', 'Rundgren', 'Stone', 'Bush', 'Moroder'],
  },
  '1980s': {
    first: ['Trevor', 'Annie', 'Prince', 'Cyndi', 'Quincy', 'Madonna', 'Rick', 'Whitney', 'Thomas', 'Janet', 'Midge', 'Tina', 'Jimmy', 'Pat', 'Kim', 'Luther'],
    last: ['Horn', 'Lennox', 'Nelson', 'Lauper', 'Jones', 'Ciccone', 'Rubin', 'Houston', 'Dolby', 'Jackson', 'Ure', 'Turner', 'Jam', 'Benatar', 'Wilde', 'Vandross'],
  },
  '1990s': {
    first: ['Dr', 'Lauryn', 'Trent', 'Bjork', 'Timbaland', 'Missy', 'Butch', 'Alanis', 'Pharrell', 'DAngelo', 'Shirley', 'Moby', 'Tricky', 'Erykah', 'DJ', 'Fiona'],
    last: ['Dre', 'Hill', 'Reznor', 'Gudmundsdottir', 'Mosley', 'Elliott', 'Vig', 'Morissette', 'Williams', 'Archer', 'Manson', 'Hall', 'Badu', 'Shadow', 'Apple', 'Yorke'],
  },
  '2000s': {
    first: ['Kanye', 'Amy', 'Danger', 'Rihanna', 'Mark', 'MIA', 'Diplo', 'Adele', 'Pharrell', 'Florence', 'Skrillex', 'Lorde', 'James', 'Solange', 'T', 'Grimes'],
    last: ['West', 'Winehouse', 'Mouse', 'Fenty', 'Ronson', 'Arulpragasam', 'Pentz', 'Adkins', 'Williams', 'Welch', 'Moore', 'Yelich', 'Blake', 'Knowles', 'Pain', 'Boucher'],
  },
  modern: {
    first: ['Billie', 'Tyler', 'Olivia', 'Fred', 'SZA', 'Finneas', 'Doja', 'Harry', 'Rosalia', 'The', 'Ice', 'Phoebe', 'Kaytranada', 'Arlo', 'Rema', 'PinkPantheress'],
    last: ['Eilish', 'Okazaki', 'Rodrigo', 'Again', 'Rowiye', 'OConnell', 'Cat', 'Styles', 'Vila', 'Weeknd', 'Spice', 'Bridgers', 'Rouamba', 'Parks', 'Eileraas', 'Mazy'],
  },
};

export const ROLE_HEADLINES: Record<StaffJobRole, readonly string[]> = {
  Engineer: [
    'Tracking engineer who hears the room before the mic',
    'Console whisperer seeking a desk that still breathes',
    'Patchbay poet looking for honest signal chains',
  ],
  Producer: [
    'Producer shaping songs around the take, not the grid',
    'Arrangement-minded producer hunting sticky hooks',
    'Session captain who keeps artists brave and on time',
  ],
  Songwriter: [
    'Topline writer with a pocket full of unfinished choruses',
    'Lyricist chasing one true line per session',
    'Melody first, ego last — available for co-writes',
  ],
};

export const ERA_TRAITS: Record<NpcEra, readonly string[]> = {
  '1960s': ['tape-splicing instincts', 'mono-first ear', 'live-room calm', 'union hours respect', 'horn-section diplomacy'],
  '1970s': ['console folklore', 'disco pocket', 'late-night stamina', 'band whisperer', 'vinyl-preview taste'],
  '1980s': ['MIDI fluent', 'gated-reverb taste', 'video-ready polish', 'synth stacker', 'chart-conscious'],
  '1990s': ['DAW bilingual', 'sample clearance wary', 'grunge patience', 'R&B layering', 'indie thrift'],
  '2000s': ['laptop-rig tidy', 'blog-era hustle', 'plugin detective', 'tour-bus ready', 'myspace survivor'],
  modern: ['remote-session native', 'stem delivery obsessive', 'playlist fluent', 'content-safe credits', 'hybrid analog taste'],
};

export const ERA_STUDIOS: Record<NpcEra, readonly string[]> = {
  '1960s': ['Muscle Shoals overflow', 'Tin Pan basement', 'Motown night shift', 'Abbey Road runner desk'],
  '1970s': ['Sunset Sound assistant', 'Criteria night ops', 'Electric Lady runner', 'Sigma Sound junior'],
  '1980s': ['Power Station nights', 'Larrabee A2', 'Battery London runner', 'Hit Factory overtime'],
  '1990s': ['Sound City float', 'Electric Lady II', 'DARP Atlanta nights', 'Strongroom London'],
  '2000s': ['Chalice Hollywood', 'Metropolis London', 'Jungle City nights', 'Studio City freelance'],
  modern: ['Remote stem collective', 'Hybrid loft sessions', 'Playlist house desk', 'Tour rehearsal truck'],
};

export const ERA_CREDITS: Record<NpcEra, readonly string[]> = {
  '1960s': ['B-side that outsold the single', 'Live broadcast rescue mix', 'Gospel choir tracking day'],
  '1970s': ['Side-long fade that radio still plays', 'Disco edit that cleared the floor', 'Concept-album sequencing pass'],
  '1980s': ['MTV-ready 12" remix', 'Drum machine that finally locked', 'Ballad vocal that cracked the Top 40'],
  '1990s': ['Alt-radio breakthrough mix', 'Hip-hop sample flip cleared clean', 'Unplugged session that stuck'],
  '2000s': ['Blog-buzz EP that got shopped', 'Sync placement on a cable drama', 'Tour stems delivered overnight'],
  modern: ['Playlist pitch that actually stuck', 'Viral chorus demo', 'Hybrid live/session hybrid release'],
};

export const ERA_EDUCATION: Record<NpcEra, readonly string[]> = {
  '1960s': ['Apprenticed on night tape ops', 'Conservatory drop-out turned runner', 'Union hall radio op certificate'],
  '1970s': ['College radio board + gig circuit', 'Self-taught on a borrowed console', 'Trade-school electronics ticket'],
  '1980s': ['MIDI workshop certificate', 'Night classes in synthesis', 'Studio internship that stuck'],
  '1990s': ['Community college DAW lab', 'Bedroom 4-track diploma of bruises', 'Conservatory composition year'],
  '2000s': ['Audio engineering diploma', 'Online mastering cohort', 'Indie label internship'],
  modern: ['Remote production mentorship', 'University music-tech module', 'Content-creator audio bootcamp'],
};

export const LOOKING_FOR: Record<StaffJobRole, readonly string[]> = {
  Engineer: ['A room with honest monitors and a boss who trusts the take', 'Sessions that leave space to listen', 'Gear that fails gracefully'],
  Producer: ['Artists who argue productively', 'A diary with unfinished songs', 'A desk that still has personality'],
  Songwriter: ['Co-writes without ego tax', 'Reference tracks that surprise', 'A piano that stays in tune past midnight'],
};
