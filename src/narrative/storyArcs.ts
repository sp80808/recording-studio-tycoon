import { GameState } from '@/types/game';
import { PlaystyleFocus } from '@/types/character';

export interface StoryChapter {
  chapterNumber: number;
  title: string;
  loreBrief: string;
  objectiveDescription: string;
  checkCompletion: (gameState: GameState, flags?: Record<string, any>) => boolean;
  reward: {
    money: number;
    reputation: number;
    xp: number;
    unlockedPerkOrTitle: string;
  };
}

export interface StoryArc {
  id: string;
  title: string;
  playstyle: PlaystyleFocus;
  synopsis: string;
  primaryRivalId: string;
  chapters: readonly StoryChapter[];
}

export const STORY_ARCS: readonly StoryArc[] = [
  {
    id: 'arc-golden-tape',
    title: 'The Lost Acetates of Abbey Road',
    playstyle: 'purist',
    synopsis: 'Silas Vance of Black Wax Vault claims modern studios cannot capture true analog depth. Prove him wrong by restoring heritage analog techniques and winning the Golden Reels award.',
    primaryRivalId: 'black-wax-vault',
    chapters: [
      {
        chapterNumber: 1,
        title: 'Act I: The Acoustic Foundation',
        loreBrief: 'Silas Vance mocks your digital preamps in an industry interview. You need to prove your room sounds timeless.',
        objectiveDescription: 'Complete at least 3 Rock, Jazz, or Acoustic sessions with Quality >= 75.',
        checkCompletion: (state) => {
          const completedCount = state.financials?.reports?.filter(
            h => (['Rock', 'Jazz', 'Acoustic', 'Folk'].includes(h.genre || '')) && h.overallQualityScore >= 75
          ).length ?? 0;
          return completedCount >= 3;
        },
        reward: {
          money: 1500,
          reputation: 15,
          xp: 350,
          unlockedPerkOrTitle: 'Analog Apprentice',
        },
      },
      {
        chapterNumber: 2,
        title: 'Act II: The Heritage Rebuild',
        loreBrief: 'An opportunity arises to purchase and install dedicated acoustic room treatment and tube gear.',
        objectiveDescription: 'Own at least 2 Studio Rooms and reach Producer Level 4.',
        checkCompletion: (state) => {
          const unlockedRooms = state.studioRooms?.filter(r => r.unlocked).length ?? 0;
          return unlockedRooms >= 2 && state.playerData.level >= 4;
        },
        reward: {
          money: 2800,
          reputation: 25,
          xp: 600,
          unlockedPerkOrTitle: 'Tone Connoisseur',
        },
      },
      {
        chapterNumber: 3,
        title: 'Act III: Silas Vance’s Challenge',
        loreBrief: 'Silas challenges you to an analog duel at the Golden Reels ceremony. Only a pristine master will dethrone him.',
        objectiveDescription: 'Produce an S-Rank session (Quality >= 90) in an organic genre.',
        checkCompletion: (state) => {
          return state.financials?.reports?.some(h => h.overallQualityScore >= 90) ?? false;
        },
        reward: {
          money: 7500,
          reputation: 50,
          xp: 1500,
          unlockedPerkOrTitle: 'Master of the Vacuum Tube',
        },
      },
    ],
  },
  {
    id: 'arc-hit-syndicate',
    title: 'The Billboard Algorithm',
    playstyle: 'hit-maker',
    synopsis: 'Chad Sterling of Apex Velocity claims art is obsolete and only algorithmic hooks matter. Out-earn his corporate empire on the charts.',
    primaryRivalId: 'apex-velocity',
    chapters: [
      {
        chapterNumber: 1,
        title: 'Act I: High-Rotation Fuel',
        loreBrief: 'Prove you can generate consistent commercial revenue faster than any independent room in the city.',
        objectiveDescription: 'Earn at least $10,000 in studio revenues and reach Day 10.',
        checkCompletion: (state) => {
          return state.money >= 10000 && state.currentDay >= 10;
        },
        reward: {
          money: 2000,
          reputation: 20,
          xp: 400,
          unlockedPerkOrTitle: 'Commercial Hitmaker',
        },
      },
      {
        chapterNumber: 2,
        title: 'Act II: The Crew Expansion',
        loreBrief: 'A single producer cannot run a factory. Hire and train commercial specialists to scale throughput.',
        objectiveDescription: 'Hire at least 2 staff members and have 3 client relationships at Regular tier or higher.',
        checkCompletion: (state) => {
          const staffCount = state.hiredStaff?.length ?? 0;
          const relationships = Object.values(state.clientRelationships || {});
          const loyalCount = relationships.filter(r => ['Regular', 'Loyal', 'Advocate'].includes(r.tier)).length;
          return staffCount >= 2 && loyalCount >= 3;
        },
        reward: {
          money: 4000,
          reputation: 30,
          xp: 800,
          unlockedPerkOrTitle: 'Studio Executive',
        },
      },
      {
        chapterNumber: 3,
        title: 'Act III: Top-40 Crown',
        loreBrief: 'Apex Velocity tries to sign your flagship client behind your back. Secure your position as the #1 hit producer.',
        objectiveDescription: 'Achieve Producer Level 8 and accumulate $25,000 in cash reserves.',
        checkCompletion: (state) => {
          return state.playerData.level >= 8 && state.money >= 25000;
        },
        reward: {
          money: 10000,
          reputation: 60,
          xp: 2000,
          unlockedPerkOrTitle: 'Mogul of the Airwaves',
        },
      },
    ],
  },
  {
    id: 'arc-underground-rebellion',
    title: 'Low-End Resistance',
    playstyle: 'underground',
    synopsis: 'Major label conglomerates are squeezing independent artists with 0.003-cent streaming rates. Unite the underground with Roxy Riot.',
    primaryRivalId: 'distortion-cellar',
    chapters: [
      {
        chapterNumber: 1,
        title: 'Act I: Cassette Tape Rebellion',
        loreBrief: 'Start a DIY cassette tape label and record local rebel bands at maximum volume.',
        objectiveDescription: 'Complete 3 Punk, Grunge, or Hip-Hop sessions without borrowing money.',
        checkCompletion: (state) => {
          const completed = state.financials?.reports?.filter(
            h => ['Punk', 'Grunge', 'Hip Hop', 'Alternative'].includes(h.genre || '')
          ).length ?? 0;
          return completed >= 3 && state.money >= 0;
        },
        reward: {
          money: 1200,
          reputation: 25,
          xp: 400,
          unlockedPerkOrTitle: 'DIY Pioneer',
        },
      },
      {
        chapterNumber: 2,
        title: 'Act II: The Underground Network',
        loreBrief: 'Roxy Riot’s Distortion Cellar proposes a joint grassroots festival showcase to prove indie superiority.',
        objectiveDescription: 'Reach 100 Reputation and cultivate at least 2 Advocate-tier artists.',
        checkCompletion: (state) => {
          const advocates = Object.values(state.clientRelationships || {}).filter(r => r.tier === 'Advocate').length;
          return state.reputation >= 100 && advocates >= 2;
        },
        reward: {
          money: 3000,
          reputation: 40,
          xp: 900,
          unlockedPerkOrTitle: 'Subculture Hero',
        },
      },
      {
        chapterNumber: 3,
        title: 'Act III: The DIY Megafestival',
        loreBrief: 'Roxy Riot rallies hundreds of independent musicians for an unpermitted warehouse festival. Put on the performance of a generation to permanently fund the underground movement.',
        objectiveDescription: 'Reach 150 Reputation and produce a high-caliber session (Quality >= 85) in an underground genre.',
        checkCompletion: (state) => {
          const completedHighQuality = state.financials?.reports?.some(
            h => ['Punk', 'Grunge', 'Hip Hop', 'Alternative'].includes(h.genre || '') && h.overallQualityScore >= 85
          ) ?? false;
          return state.reputation >= 150 && completedHighQuality;
        },
        reward: {
          money: 8000,
          reputation: 60,
          xp: 1800,
          unlockedPerkOrTitle: 'Icon of the Counter-Culture',
        },
      },
    ],
  },
  {
    id: 'arc-ghost-in-console',
    title: 'The Resonant Frequency',
    playstyle: 'sound-lab',
    synopsis: 'Dr. Aris Thorne discovered an acoustic harmonic feedback pattern in modified vacuum tube circuitry that hypnotizes listeners.',
    primaryRivalId: 'silicon-harmonics',
    chapters: [
      {
        chapterNumber: 1,
        title: 'Act I: Circuit Surgery',
        loreBrief: 'Begin experimenting with hardware equipment modifications and custom signal chains.',
        objectiveDescription: 'Own at least 3 pieces of studio equipment and reach Level 3.',
        checkCompletion: (state) => {
          return (state.ownedEquipment?.length ?? 0) >= 3 && state.playerData.level >= 3;
        },
        reward: {
          money: 1600,
          reputation: 15,
          xp: 450,
          unlockedPerkOrTitle: 'Circuit Hacker',
        },
      },
      {
        chapterNumber: 2,
        title: 'Act II: The Synergy Codex',
        loreBrief: 'Combine equipment, room acoustic treatment, and staff expertise to unlock documented studio synergies.',
        objectiveDescription: 'Discover at least 4 Studio Synergy recipes in your Codex.',
        checkCompletion: (state) => {
          return (state.discoveredSynergies?.length ?? 0) >= 4;
        },
        reward: {
          money: 3500,
          reputation: 35,
          xp: 1000,
          unlockedPerkOrTitle: 'Harmonic Alchemist',
        },
      },
      {
        chapterNumber: 3,
        title: 'Act III: The Resonance Breakthrough',
        loreBrief: 'Dr. Aris Thorne challenges you to construct an ultra-low-noise acoustic signal chain that creates the theoretical Golden Resonance frequency.',
        objectiveDescription: 'Discover at least 6 Studio Synergies and reach Producer Level 8.',
        checkCompletion: (state) => {
          return (state.discoveredSynergies?.length ?? 0) >= 6 && state.playerData.level >= 8;
        },
        reward: {
          money: 10000,
          reputation: 50,
          xp: 2000,
          unlockedPerkOrTitle: 'Grand Master of Frequencies',
        },
      },
    ],
  },
] as const;

/** Retrieve all authored story arcs */
export const getStoryArcs = (): readonly StoryArc[] => STORY_ARCS;

/** Get a story arc by playstyle */
export const getStoryArcByPlaystyle = (playstyle: PlaystyleFocus): StoryArc => {
  const arc = STORY_ARCS.find(a => a.playstyle === playstyle);
  return arc ?? STORY_ARCS[0];
};

/** Get a story arc by ID */
export const getStoryArcById = (arcId: string): StoryArc | undefined => {
  return STORY_ARCS.find(a => a.id === arcId);
};
