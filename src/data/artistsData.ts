import { Artist, MusicGenre } from '@/types/charts';
import { generateBandName } from '../utils/bandUtils';

// Basic structure for the artist database
export const artistsDatabase: Artist[] = [
  // Initial set of artists (can be expanded later)
  {
    id: 'artist_1',
    name: generateBandName(),
    genre: 'rock',
    popularity: 75,
    reputation: 60,
    collaborationHistory: [],
    lastActive: new Date(),
    demandLevel: 70,
    priceRange: { min: 7500, max: 15000 },
    specialties: ['rock', 'alternative'],
    socialMediaFollowers: 500000,
    description: 'A popular rock band known for their energetic live shows.',
    availability: { status: 'available', responseTime: 3 }
  },
  {
    id: 'artist_2',
    name: generateBandName(),
    genre: 'pop',
    popularity: 90,
    reputation: 85,
    collaborationHistory: [],
    lastActive: new Date(),
    demandLevel: 95,
    priceRange: { min: 15000, max: 30000 },
    specialties: ['pop', 'r&b'],
    socialMediaFollowers: 2000000,
    description: 'A chart-topping pop sensation.',
    availability: { status: 'available', responseTime: 1 }
  },
  {
    id: 'artist_3',
    name: generateBandName(),
    genre: 'hip-hop',
    popularity: 80,
    reputation: 70,
    collaborationHistory: [],
    lastActive: new Date(),
    demandLevel: 85,
    priceRange: { min: 10000, max: 20000 },
    specialties: ['hip-hop', 'trap'],
    socialMediaFollowers: 1000000,
    description: 'An influential figure in the hip-hop scene.',
    availability: { status: 'available', responseTime: 2 }
  },
  {
    id: 'artist_4',
    name: generateBandName(),
    genre: 'electronic',
    popularity: 65,
    reputation: 50,
    collaborationHistory: [],
    lastActive: new Date(),
    demandLevel: 60,
    priceRange: { min: 5000, max: 10000 },
    specialties: ['electronic', 'house'],
    socialMediaFollowers: 300000,
    description: 'An electronic music producer known for their unique sound.',
    availability: { status: 'available', responseTime: 4 }
  },
  {
    id: 'artist_5',
    name: generateBandName(),
    genre: 'country',
    popularity: 70,
    reputation: 65,
    collaborationHistory: [],
    lastActive: new Date(),
    demandLevel: 75,
    priceRange: { min: 6000, max: 12000 },
    specialties: ['country', 'folk'],
    socialMediaFollowers: 400000,
    description: 'A rising star in the country music scene.',
    availability: { status: 'available', responseTime: 3 }
  },
];

// Function to get an artist by ID
export const getArtistById = (id: string): Artist | undefined => {
  return artistsDatabase.find(artist => artist.id === id);
};

// Function to get artists by genre
export const getArtistsByGenre = (genre: MusicGenre): Artist[] => {
  return artistsDatabase.filter(artist => artist.genre === genre);
};

// Function to get all available artists
export const getAvailableArtists = (): Artist[] => {
  return artistsDatabase.filter(artist => artist.availability.status === 'available');
};

// Function to update an artist's availability status
export const updateArtistAvailability = (artistId: string, status: 'available' | 'busy' | 'on-tour' | 'in-studio', responseTime?: number) => {
  const artistIndex = artistsDatabase.findIndex(artist => artist.id === artistId);
  if (artistIndex !== -1) {
    artistsDatabase[artistIndex].availability.status = status;
    if (responseTime !== undefined) {
      artistsDatabase[artistIndex].availability.responseTime = responseTime;
    }
    console.log(`Updated availability for artist ${artistId} to ${status}`);
  } else {
    console.warn(`Artist with ID ${artistId} not found in database.`);
  }
};

// TODO: Add functions to update artist popularity, reputation, etc.
