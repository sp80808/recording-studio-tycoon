import { LyricFocusTheme, LyricFocusKeyword } from '@/types/miniGame';
import { MusicGenre } from '@/types/charts'; // Assuming MusicGenre is the type for genre

const allKeywords: Record<string, Omit<LyricFocusKeyword, 'id'>> = {
  love: { text: 'Love', relevance: 'high' },
  heart: { text: 'Heart', relevance: 'high' },
  forever: { text: 'Forever', relevance: 'medium' },
  stars: { text: 'Stars', relevance: 'medium' },
  night: { text: 'Night', relevance: 'medium' },
  dream: { text: 'Dream', relevance: 'medium' },
  pain: { text: 'Pain', relevance: 'high' }, // Relevant for sad themes
  tears: { text: 'Tears', relevance: 'high' }, // Relevant for sad themes
  lost: { text: 'Lost', relevance: 'medium' },
  shadows: { text: 'Shadows', relevance: 'medium' },
  city: { text: 'City', relevance: 'medium' },
  streets: { text: 'Streets', relevance: 'medium' },
  rebel: { text: 'Rebel', relevance: 'high' }, // Relevant for rock/punk
  freedom: { text: 'Freedom', relevance: 'high' },
  road: { text: 'Road', relevance: 'medium' },
  journey: { text: 'Journey', relevance: 'medium' },
  sun: { text: 'Sun', relevance: 'medium' },
  summer: { text: 'Summer', relevance: 'high' }, // Relevant for upbeat/pop
  party: { text: 'Party', relevance: 'high' }, // Relevant for upbeat/pop
  dance: { text: 'Dance', relevance: 'high' }, // Relevant for upbeat/pop
  money: { text: 'Money', relevance: 'low' }, // Often a distractor unless specific theme
  car: { text: 'Car', relevance: 'low' },
  job: { text: 'Job', relevance: 'distractor' },
  computer: { text: 'Computer', relevance: 'distractor' },
  silence: { text: 'Silence', relevance: 'medium'},
  echo: { text: 'Echo', relevance: 'medium'},
  fire: { text: 'Fire', relevance: 'high'}, // Can be high for rock/intense themes
  rain: { text: 'Rain', relevance: 'medium'}, // Can be high for melancholic
  light: { text: 'Light', relevance: 'medium'},
  dark: { text: 'Dark', relevance: 'medium'},
  hope: { text: 'Hope', relevance: 'high'},
  broken: { text: 'Broken', relevance: 'high'},
};

const createKeyword = (key: string): LyricFocusKeyword => ({
  id: key,
  ...allKeywords[key],
});

export const lyricFocusThemes: LyricFocusTheme[] = [
  {
    id: 'popLoveAnthem',
    name: 'Pop Love Anthem',
    genre: 'pop' as MusicGenre,
    mood: 'Uplifting, Romantic',
    description: 'A feel-good song about finding true love and celebrating it.',
    coreConcepts: ['Unconditional Love', 'Joy', 'Celebration', 'Togetherness'],
    keywords: [
      createKeyword('love'), createKeyword('heart'), createKeyword('forever'), 
      createKeyword('stars'), createKeyword('night'), createKeyword('dream'),
      createKeyword('summer'), createKeyword('party'), createKeyword('dance'),
      createKeyword('light'), createKeyword('hope'),
      // Distractors or less relevant
      createKeyword('pain'), createKeyword('money'), createKeyword('job'), createKeyword('broken'),
    ].sort(() => 0.5 - Math.random()), // Shuffle them
  },
  {
    id: 'rockRebellion',
    name: 'Rock Rebellion Anthem',
    genre: 'rock' as MusicGenre,
    mood: 'Energetic, Defiant',
    description: 'A powerful track about breaking free and fighting for change.',
    coreConcepts: ['Freedom', 'Rebellion', 'Change', 'Power'],
    keywords: [
      createKeyword('rebel'), createKeyword('freedom'), createKeyword('fire'),
      createKeyword('streets'), createKeyword('night'), createKeyword('broken'), // Broken can fit rebellion
      createKeyword('city'), createKeyword('journey'), createKeyword('dark'),
      createKeyword('hope'), // Hope can fit rebellion
      // Distractors or less relevant
      createKeyword('love'), createKeyword('summer'), createKeyword('party'), createKeyword('computer'),
    ].sort(() => 0.5 - Math.random()),
  },
  {
    id: 'folkJourney',
    name: 'Folk Journey Ballad',
    genre: 'folk' as MusicGenre,
    mood: 'Reflective, Nostalgic',
    description: 'A story-telling song about a long journey and self-discovery.',
    coreConcepts: ['Travel', 'Reflection', 'Nature', 'Time'],
    keywords: [
      createKeyword('road'), createKeyword('journey'), createKeyword('stars'),
      createKeyword('night'), createKeyword('shadows'), createKeyword('echo'),
      createKeyword('rain'), createKeyword('lost'), createKeyword('silence'),
      createKeyword('sun'), createKeyword('light'),
      // Distractors or less relevant
      createKeyword('party'), createKeyword('money'), createKeyword('rebel'), createKeyword('fire'),
    ].sort(() => 0.5 - Math.random()),
  },
  // Add more themes for other genres and moods
];

// Function to get a theme, perhaps based on project genre/mood
export const getLyricFocusThemeForProject = (projectGenre: MusicGenre, projectMood?: string): LyricFocusTheme => {
  const suitableThemes = lyricFocusThemes.filter(theme => theme.genre === projectGenre);
  if (suitableThemes.length > 0) {
    // Could add mood matching logic here
    return suitableThemes[Math.floor(Math.random() * suitableThemes.length)];
  }
  // Fallback to a random theme if no genre match
  return lyricFocusThemes[Math.floor(Math.random() * lyricFocusThemes.length)];
};
