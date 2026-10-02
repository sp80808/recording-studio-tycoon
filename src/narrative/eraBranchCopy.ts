/**
 * Era-aware copy for campaign branch dilemmas.
 *
 * The Act I / Act II crossroads keep the same option ids and target nodes (save-safe),
 * but the framing shifts with the era: tape culture in the 60s, gated reverb in the 80s,
 * downloads in the 2000s, playlists in the 2020s.
 */
import { toGameEraId } from './rivalCast';

type OptionCopy = {
  label: string;
  flavorText: string;
  consequences: {
    moneyDelta: number;
    repDelta: number;
    narrativeOutcome: string;
  };
};

export type EraBranchDilemmaCopy = {
  kicker: string;
  context: string;
  options: {
    /** Maps to opt_path_purist / opt_purist_legend / opt_commercial_monopoly depending on dilemma. */
    pathA: OptionCopy;
    /** Maps to opt_path_commercial / opt_purist_alchemy / opt_commercial_rebel. */
    pathB: OptionCopy;
  };
};

const ACT1_BY_ERA: Record<string, EraBranchDilemmaCopy> = {
  analog60s: {
    kicker: 'CAMPAIGN CROSSROAD // TAPE OR THROUGHPUT',
    context:
      'Your first reels have drawn both the folk clubs and a regional label. Protect the live-room craft, or hire hands and chase radio rotation?',
    options: {
      pathA: {
        label: 'Double down on acoustic craft & heritage',
        flavorText: 'Rebuild the baffles, trust the tape, refuse the rush release.',
        consequences: {
          moneyDelta: 0,
          repDelta: 10,
          narrativeOutcome: 'Session players start asking for your room by name.',
        },
      },
      pathB: {
        label: 'Scale the diary for radio hits',
        flavorText: 'More engineers, shorter sessions, choruses that survive AM.',
        consequences: {
          moneyDelta: 2500,
          repDelta: 2,
          narrativeOutcome: 'Program directors learn your studio’s number.',
        },
      },
    },
  },
  digital80s: {
    kicker: 'CAMPAIGN CROSSROAD // GLOSS OR GRIT',
    context:
      'MTV wants a look; the live room still wants a band. Chase the gated-snare spectacle, or keep the takes honest and slightly dangerous?',
    options: {
      pathA: {
        label: 'Defend the honest live take',
        flavorText: 'Less gloss, more air. Let the room breathe on tape.',
        consequences: {
          moneyDelta: 0,
          repDelta: 10,
          narrativeOutcome: 'Audiophiles notice; the video team shrugs.',
        },
      },
      pathB: {
        label: 'Build a hit factory for the charts',
        flavorText: 'More tracks, brighter choruses, engineers who never sleep.',
        consequences: {
          moneyDelta: 2500,
          repDelta: 2,
          narrativeOutcome: 'The first video edit books before the master is dry.',
        },
      },
    },
  },
  internet2000s: {
    kicker: 'CAMPAIGN CROSSROAD // DOWNLOAD OR DIY',
    context:
      'File-sharing eats singles while blogs crown underground rooms. Harden into a commercial pipeline, or stay the scene’s quiet ally?',
    options: {
      pathA: {
        label: 'Protect craft over click-count',
        flavorText: 'Master for speakers, not for a 128kbps preview.',
        consequences: {
          moneyDelta: 0,
          repDelta: 10,
          narrativeOutcome: 'Serious artists book you because the forums said so.',
        },
      },
      pathB: {
        label: 'Optimise for the download era',
        flavorText: 'Faster turnarounds, louder masters, sync-friendly stems.',
        consequences: {
          moneyDelta: 2500,
          repDelta: 2,
          narrativeOutcome: 'A ringtone deal pays the quarter’s rent.',
        },
      },
    },
  },
  streaming2020s: {
    kicker: 'CAMPAIGN CROSSROAD // PLAYLIST OR PRINCIPLE',
    context:
      'Playlist curators and indie collectives both want a piece of your next release. Chase the algorithm, or build a room artists still trust?',
    options: {
      pathA: {
        label: 'Double down on craft & artist trust',
        flavorText: 'Refuse playlist shortcuts. Make records that age past a swipe.',
        consequences: {
          moneyDelta: 0,
          repDelta: 10,
          narrativeOutcome: 'Artists praise your uncompromising sonic integrity.',
        },
      },
      pathB: {
        label: 'Scale for streaming throughput',
        flavorText: 'Expand staff, ship hooks on schedule, monetise every spike.',
        consequences: {
          moneyDelta: 2500,
          repDelta: 2,
          narrativeOutcome: 'Streaming revenue starts to flow into the studio accounts.',
        },
      },
    },
  },
};

const ACT2_PURIST_BY_ERA: Record<string, EraBranchDilemmaCopy> = {
  analog60s: {
    kicker: 'HERITAGE SPLIT // THE MASTERING DUEL',
    context: 'A historic master reel needs a philosophy: pure lacquer, or a careful hybrid that keeps the soul and adds options?',
    options: {
      pathA: {
        label: 'The Golden Reel: pure analog master',
        flavorText: 'Live lacquer cut. No digital safety net.',
        consequences: {
          moneyDelta: 500,
          repDelta: 15,
          narrativeOutcome: 'Audiophiles treat the release as a fidelity benchmark.',
        },
      },
      pathB: {
        label: 'The Sonic Alchemist: hybrid innovation',
        flavorText: 'Tubes up front, careful processing at the end.',
        consequences: {
          moneyDelta: 1200,
          repDelta: 12,
          narrativeOutcome: 'Engineering journals ask for your schematic.',
        },
      },
    },
  },
  digital80s: {
    kicker: 'HERITAGE SPLIT // THE MASTERING DUEL',
    context: 'A heritage tape wants to survive the loudness wars. Cut it pure, or invent a hybrid path that still sounds like a room?',
    options: {
      pathA: {
        label: 'The Golden Reel: pure analog master',
        flavorText: 'Refuse the squash. Keep the dynamics.',
        consequences: {
          moneyDelta: 500,
          repDelta: 15,
          narrativeOutcome: 'Radio complains; the vinyl presses sell out.',
        },
      },
      pathB: {
        label: 'The Sonic Alchemist: hybrid innovation',
        flavorText: 'Gate where it helps, leave space where it matters.',
        consequences: {
          moneyDelta: 1200,
          repDelta: 12,
          narrativeOutcome: 'Your hybrid chain becomes a quiet industry standard.',
        },
      },
    },
  },
  internet2000s: {
    kicker: 'HERITAGE SPLIT // THE MASTERING DUEL',
    context: 'A classic album is being remastered for a new century. Preserve the original intent, or prove digital can still feel human?',
    options: {
      pathA: {
        label: 'The Golden Reel: archival purity',
        flavorText: 'Transfer once, touch little, document everything.',
        consequences: {
          moneyDelta: 500,
          repDelta: 15,
          narrativeOutcome: 'Collectors call it the definitive edition.',
        },
      },
      pathB: {
        label: 'The Sonic Alchemist: modern hybrid',
        flavorText: 'Restore with tools, finish with ears.',
        consequences: {
          moneyDelta: 1200,
          repDelta: 12,
          narrativeOutcome: 'The remaster wins awards without sounding sterile.',
        },
      },
    },
  },
  streaming2020s: {
    kicker: 'HERITAGE SPLIT // THE MASTERING DUEL',
    context: 'A historic master needs a definitive philosophy before it hits high-res streaming and vinyl at once.',
    options: {
      pathA: {
        label: 'The Golden Reel Legend: pure analog master',
        flavorText: 'Live lacquer cut without digital compression.',
        consequences: {
          moneyDelta: 500,
          repDelta: 15,
          narrativeOutcome: 'Audiophiles hail the release as a benchmark of fidelity.',
        },
      },
      pathB: {
        label: 'The Sonic Alchemist: hybrid acoustic innovation',
        flavorText: 'Fuse vacuum tubes with modular DSP enhancement.',
        consequences: {
          moneyDelta: 1200,
          repDelta: 12,
          narrativeOutcome: 'Engineering journals feature your custom acoustic circuit.',
        },
      },
    },
  },
};

const ACT2_COMMERCIAL_BY_ERA: Record<string, EraBranchDilemmaCopy> = {
  analog60s: {
    kicker: 'INDUSTRY FORK // DISTRIBUTION',
    context: 'A national distributor and a co-op of independent shops both want your next release. Sign the big deal, or keep the stems with the scene?',
    options: {
      pathA: {
        label: 'The Billboard Monopoly: sign the conglomerate',
        flavorText: 'Nationwide racks, radio favour, thicker advances.',
        consequences: {
          moneyDelta: 5000,
          repDelta: -5,
          narrativeOutcome: 'Commercial reach arrives; some purists stop calling.',
        },
      },
      pathB: {
        label: 'The Rogue Hit Factory: open-stem grassroots',
        flavorText: 'Share multitracks with remixers while keeping publishing.',
        consequences: {
          moneyDelta: 2000,
          repDelta: 20,
          narrativeOutcome: 'College DJs and pirate stations crown your room.',
        },
      },
    },
  },
  digital80s: {
    kicker: 'INDUSTRY FORK // GLOBAL DISTRIBUTION',
    context: 'A major wants exclusivity for the video era; an indie network wants open stems for club remixes.',
    options: {
      pathA: {
        label: 'The Billboard Monopoly: conglomerate buy-in',
        flavorText: 'Dominate the charts and the video slots.',
        consequences: {
          moneyDelta: 5000,
          repDelta: -5,
          narrativeOutcome: 'Unprecedented commercial reach at the cost of purist credibility.',
        },
      },
      pathB: {
        label: 'The Rogue Hit Factory: open-stem wave',
        flavorText: 'Publish stems for remixers; keep the publishing.',
        consequences: {
          moneyDelta: 2000,
          repDelta: 20,
          narrativeOutcome: 'Club remixes turn your B-sides into a movement.',
        },
      },
    },
  },
  internet2000s: {
    kicker: 'INDUSTRY FORK // GLOBAL DISTRIBUTION',
    context: 'A mega-label wants the download exclusives; a blog network wants Creative Commons stems.',
    options: {
      pathA: {
        label: 'The Billboard Monopoly: sign the mega-deal',
        flavorText: 'Own the storefronts and the ringtone rights.',
        consequences: {
          moneyDelta: 5000,
          repDelta: -5,
          narrativeOutcome: 'The numbers look incredible; the forums look sceptical.',
        },
      },
      pathB: {
        label: 'The Rogue Hit Factory: open-stem grassroots',
        flavorText: 'Let the blogs remix you into relevance.',
        consequences: {
          moneyDelta: 2000,
          repDelta: 20,
          narrativeOutcome: 'A thousand remixes later, your name is a scene password.',
        },
      },
    },
  },
  streaming2020s: {
    kicker: 'INDUSTRY FORK // GLOBAL DISTRIBUTION',
    context: 'Major distribution bids land on your desk — playlist empires on one side, open-stem scenes on the other.',
    options: {
      pathA: {
        label: 'The Billboard Monopoly: conglomerate buy-in',
        flavorText: 'Dominate playlist algorithms and take global royalty shares.',
        consequences: {
          moneyDelta: 5000,
          repDelta: -5,
          narrativeOutcome: 'Unprecedented commercial reach at the cost of purist credibility.',
        },
      },
      pathB: {
        label: 'The Rogue Hit Factory: open-stem grassroots wave',
        flavorText: 'Publish open stems for remixers while keeping full publishing.',
        consequences: {
          moneyDelta: 2000,
          repDelta: 20,
          narrativeOutcome: 'Viral short-form remixes crown your room.',
        },
      },
    },
  },
};

const fallbackEra = (eraId: string): string => {
  const id = toGameEraId(eraId);
  return ACT1_BY_ERA[id] ? id : 'streaming2020s';
};

export const getAct1DilemmaCopy = (eraId: string): EraBranchDilemmaCopy =>
  ACT1_BY_ERA[fallbackEra(eraId)];

export const getAct2PuristDilemmaCopy = (eraId: string): EraBranchDilemmaCopy =>
  ACT2_PURIST_BY_ERA[fallbackEra(eraId)];

export const getAct2CommercialDilemmaCopy = (eraId: string): EraBranchDilemmaCopy =>
  ACT2_COMMERCIAL_BY_ERA[fallbackEra(eraId)];
