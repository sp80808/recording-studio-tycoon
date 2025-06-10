// Historical events system for Recording Studio Tycoon
import { GameState } from '@/types/game';

export interface HistoricalEvent {
  id: string;
  title: string;
  description: string;
  era: string;
  triggerDay: number; // Day within the era when this event triggers
  type: 'technology' | 'cultural' | 'business' | 'legal' | 'social';
  impact: {
    genrePopularityChanges?: Record<string, number>; // +/- popularity points
    equipmentDemandChanges?: Record<string, number>; // +/- demand multipliers
    marketChanges?: {
      payoutMultiplier?: number;
      reputationMultiplier?: number;
    };
  };
  year: number; // Real world year this event occurred
  educationalInfo?: string; // Additional context for players
}

export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  // 1960s Events
  {
    id: 'beatles_debut',
    title: '🎸 The Beatles Release "Please Please Me"',
    description: 'British rock band The Beatles release their debut album, sparking "Beatlemania" and the British Invasion of American music.',
    era: 'analog60s',
    triggerDay: 30,
    type: 'cultural',
    year: 1963,
    impact: {
      genrePopularityChanges: {
        'Rock': +15,
        'Folk': -5
      }
    },
    educationalInfo: 'The Beatles revolutionized popular music with their innovative songwriting and studio techniques, influencing countless artists and changing the music industry forever.'
  },
  {
    id: 'woodstock_festival',
    title: '🎪 Woodstock Festival Changes Music History',
    description: 'The legendary Woodstock Music & Art Fair showcases the power of live music and counterculture, elevating festival recordings.',
    era: 'analog60s',
    triggerDay: 120,
    type: 'cultural',
    year: 1969,
    impact: {
      genrePopularityChanges: {
        'Rock': +10,
        'Folk': +15,
        'Jazz': +5
      },
      marketChanges: {
        payoutMultiplier: 1.2
      }
    },
    educationalInfo: 'Woodstock demonstrated the cultural power of music festivals and live recording, with many artists gaining fame through their performances there.'
  },
  {
    id: 'multitrack_recording',
    title: '🎛️ 8-Track Recording Technology Emerges',
    description: 'Advanced multitrack recording equipment becomes available, allowing for more complex arrangements and overdubbing.',
    era: 'analog60s',
    triggerDay: 80,
    type: 'technology',
    year: 1967,
    impact: {
      equipmentDemandChanges: {
        'analog_console': 1.5,
        'tape_machine': 1.3
      },
      marketChanges: {
        payoutMultiplier: 1.1
      }
    },
    educationalInfo: 'Multitrack recording allowed artists like The Beatles to create complex layered recordings that were impossible with earlier technology.'
  },

  // 1980s Events
  {
    id: 'mtv_launch',
    title: '📺 MTV Launches: "Video Killed the Radio Star"',
    description: 'Music Television begins broadcasting, creating a new visual dimension to music and changing how artists promote their work.',
    era: 'digital80s',
    triggerDay: 20,
    type: 'business',
    year: 1981,
    impact: {
      genrePopularityChanges: {
        'New Wave': +20,
        'Hair Metal': +15,
        'Electronic': +10
      },
      marketChanges: {
        payoutMultiplier: 1.3,
        reputationMultiplier: 1.2
      }
    },
    educationalInfo: 'MTV revolutionized the music industry by making visual presentation as important as the music itself, launching the careers of many artists.'
  },
  {
    id: 'cd_format_introduced',
    title: '💿 Compact Disc Format Revolutionizes Audio',
    description: 'Sony and Philips launch the CD format, promising perfect digital sound and changing how music is consumed.',
    era: 'digital80s',
    triggerDay: 45,
    type: 'technology',
    year: 1982,
    impact: {
      equipmentDemandChanges: {
        'digital_recorder': 1.8,
        'cd_mastering': 2.0
      },
      marketChanges: {
        payoutMultiplier: 1.4
      }
    },
    educationalInfo: 'The CD format offered better sound quality and durability than vinyl or cassettes, eventually becoming the dominant music format of the 1980s and 1990s.'
  },
  {
    id: 'sampling_revolution',
    title: '🎵 Sampling Technology Transforms Hip-Hop',
    description: 'Affordable sampling equipment enables hip-hop producers to create beats from existing recordings, sparking creativity and legal debates.',
    era: 'digital80s',
    triggerDay: 90,
    type: 'technology',
    year: 1987,
    impact: {
      genrePopularityChanges: {
        'Hip-Hop': +25,
        'Electronic': +10
      },
      equipmentDemandChanges: {
        'sampler': 2.5,
        'drum_machine': 1.8
      }
    },
    educationalInfo: 'Sampling allowed producers to incorporate pieces of existing songs into new tracks, creating a new form of musical creativity while raising copyright questions.'
  },

  // 2000s Events
  {
    id: 'napster_launch',
    title: '💻 Napster Disrupts the Music Industry',
    description: 'Peer-to-peer file sharing service Napster launches, allowing free music downloads and challenging traditional sales models.',
    era: 'internet2000s',
    triggerDay: 15,
    type: 'business',
    year: 1999,
    impact: {
      marketChanges: {
        payoutMultiplier: 0.7, // Decreased revenue due to piracy
        reputationMultiplier: 0.9
      },
      genrePopularityChanges: {
        'Digital': +15,
        'Electronic': +10
      }
    },
    educationalInfo: 'Napster forced the music industry to confront digital distribution, ultimately leading to legal streaming services and new business models.'
  },
  {
    id: 'itunes_store_launch',
    title: '🍎 iTunes Store Creates Legal Digital Market',
    description: 'Apple launches the iTunes Store, offering legal music downloads for 99 cents per song and providing a new revenue model.',
    era: 'internet2000s',
    triggerDay: 60,
    type: 'business',
    year: 2003,
    impact: {
      marketChanges: {
        payoutMultiplier: 1.2,
        reputationMultiplier: 1.1
      },
      genrePopularityChanges: {
        'Digital': +20,
        'Pop-punk': +10,
        'Electronic': +15
      }
    },
    educationalInfo: 'iTunes Store proved that consumers would pay for legal digital music when it was convenient and reasonably priced, saving the industry from complete collapse.'
  },
  {
    id: 'social_media_music',
    title: '📱 MySpace Becomes Music Discovery Platform',
    description: 'Social media platforms become crucial for music discovery and artist promotion, changing how new acts gain attention.',
    era: 'internet2000s',
    triggerDay: 100,
    type: 'social',
    year: 2005,
    impact: {
      genrePopularityChanges: {
        'Emo': +20,
        'Indie': +15,
        'Pop-punk': +10
      },
      marketChanges: {
        reputationMultiplier: 1.3
      }
    },
    educationalInfo: 'MySpace allowed unsigned artists to reach audiences directly, democratizing music promotion and changing how record labels discovered new talent.'
  },

  // 2020s Events
  {
    id: 'spotify_dominance',
    title: '🎧 Streaming Reaches 80% of Music Revenue',
    description: 'Streaming services officially dominate music consumption, fundamentally changing how artists earn money from their music.',
    era: 'streaming2020s',
    triggerDay: 10,
    type: 'business',
    year: 2020,
    impact: {
      marketChanges: {
        payoutMultiplier: 0.8, // Lower per-stream payouts
        reputationMultiplier: 1.4 // But easier to build audience
      },
      genrePopularityChanges: {
        'Lo-fi': +20,
        'Trap': +15,
        'Indie Pop': +10
      }
    },
    educationalInfo: 'Streaming changed music consumption from ownership to access, requiring artists to focus on playlist placement and constant content creation.'
  },
  {
    id: 'tiktok_music_discovery',
    title: '🎵 TikTok Becomes Primary Music Discovery Platform',
    description: 'Short-form video app TikTok drives music trends, with 15-second clips determining hit songs and changing music structure.',
    era: 'streaming2020s',
    triggerDay: 40,
    type: 'social',
    year: 2021,
    impact: {
      genrePopularityChanges: {
        'TikTok Pop': +30,
        'EDM': +15,
        'Trap': +10
      },
      marketChanges: {
        reputationMultiplier: 1.5
      }
    },
    educationalInfo: 'TikTok\'s algorithm-driven discovery changed how songs are structured, with artists focusing on creating "hook moments" that work in short clips.'
  },
  {
    id: 'ai_music_tools',
    title: '🤖 AI Music Production Tools Go Mainstream',
    description: 'Artificial intelligence tools for composition, mixing, and mastering become widely available, democratizing music production.',
    era: 'streaming2020s',
    triggerDay: 80,
    type: 'technology',
    year: 2023,
    impact: {
      equipmentDemandChanges: {
        'ai_tools': 3.0,
        'cloud_daw': 2.0
      },
      marketChanges: {
        payoutMultiplier: 1.1
      }
    },
    educationalInfo: 'AI tools made professional-quality music production accessible to anyone, while also raising questions about creativity and the future of human musicians.'
  }
];

// Function to get events that should trigger for current game state
export const getTriggeredEvents = (gameState: GameState): HistoricalEvent[] => {
  const currentEra = gameState.currentEra;
  const currentDay = gameState.currentDay;
  
  // Get events for current era that should have triggered by now
  return HISTORICAL_EVENTS.filter(event => 
    event.era === currentEra && 
    event.triggerDay <= currentDay
  );
};

// Function to get the next upcoming event for anticipation
export const getNextEvent = (gameState: GameState): HistoricalEvent | null => {
  const currentEra = gameState.currentEra;
  const currentDay = gameState.currentDay;
  
  const upcomingEvents = HISTORICAL_EVENTS
    .filter(event => event.era === currentEra && event.triggerDay > currentDay)
    .sort((a, b) => a.triggerDay - b.triggerDay);
  
  return upcomingEvents[0] || null;
};

// Function to apply event effects to game state
export const applyEventEffects = (event: HistoricalEvent, gameState: GameState): GameState => {
  const newGameState = { ...gameState };
  
  // Apply market changes
  if (event.impact.marketChanges) {
    // These effects would typically be applied to future projects and transactions
    // For now, we'll store them in a way that other systems can use
    console.log(`Applying market effects for event: ${event.title}`);
  }
  
  // Add notification
  const notification = {
    id: `historical-${event.id}-${Date.now()}`,
    type: 'historical' as const,
    title: event.title,
    message: event.description,
    timestamp: Date.now(),
    priority: 'medium' as const
  };
  
  newGameState.notifications = [...newGameState.notifications, notification];
  
  return newGameState;
};

// Function to check if any new events should trigger
export const checkForNewEvents = (gameState: GameState, lastCheckedDay: number): HistoricalEvent[] => {
  const currentEra = gameState.currentEra;
  const currentDay = gameState.currentDay;
  
  return HISTORICAL_EVENTS.filter(event => 
    event.era === currentEra && 
    event.triggerDay > lastCheckedDay && 
    event.triggerDay <= currentDay
  );
};
