import { SubGenre, MusicGenre } from '@/types/charts';

export const subGenres: SubGenre[] = [
  // Pop Subgenres
  { id: 'synthPop', name: 'Synth Pop', parentGenre: 'pop', description: 'Characterized by prominent synthesizer use, often with a retro 80s feel.', typicalElements: ['Synthesizers', 'Drum Machines', 'Catchy Hooks', 'Reverb Vocals'] },
  { id: 'dancePop', name: 'Dance Pop', parentGenre: 'pop', description: 'Upbeat pop music designed for dancing, common in clubs.', typicalElements: ['Four-on-the-floor Beat', 'Strong Basslines', 'Repetitive Choruses'] },
  { id: 'indiePop', name: 'Indie Pop', parentGenre: 'pop', description: 'Pop music produced independently, often with a lo-fi or quirky aesthetic.', typicalElements: ['Jangly Guitars', 'Softer Vocals', 'Unconventional Song Structures'] },

  // Rock Subgenres
  { id: 'altRock90s', name: '90s Alt-Rock', parentGenre: 'rock', description: 'Alternative rock that gained mainstream popularity in the 1990s.', typicalElements: ['Distorted Guitars', 'Angsty Lyrics', 'Dynamic Shifts'] },
  { id: 'punkRock', name: 'Punk Rock', parentGenre: 'rock', description: 'Fast, aggressive rock music with a rebellious attitude.', typicalElements: ['Fast Tempos', 'Simple Chord Progressions', 'Anti-establishment Lyrics'] },
  { id: 'progRock', name: 'Progressive Rock', parentGenre: 'rock', description: 'Rock music with complex song structures, instrumentation, and lyrical themes.', typicalElements: ['Long Compositions', 'Unusual Time Signatures', 'Concept Albums'] },

  // Hip-Hop Subgenres
  { id: 'trapRap', name: 'Trap Rap', parentGenre: 'hip-hop', description: 'Hip-hop subgenre originating from the Southern US, known for its 808s and hi-hat patterns.', typicalElements: ['808 Bass', 'Roland TR-808 Hi-Hats', 'Layered Synths', 'Autotuned Vocals'] },
  { id: 'boomBap', name: 'Boom Bap', parentGenre: 'hip-hop', description: 'Classic East Coast hip-hop style, emphasizing hard drum beats.', typicalElements: ['Sample-based Beats', 'Acoustic Drum Sounds', 'Lyrical Dexterity'] },
  { id: 'consciousHipHop', name: 'Conscious Hip-Hop', parentGenre: 'hip-hop', description: 'Hip-hop with lyrics focused on social issues and awareness.', typicalElements: ['Thought-provoking Lyrics', 'Often Jazz/Soul Samples', 'Positive Messages'] },

  // Electronic Subgenres
  { id: 'house', name: 'House', parentGenre: 'electronic', description: 'Electronic dance music characterized by a repetitive four-on-the-floor beat.', typicalElements: ['4/4 Beat', 'Off-beat Hi-hats', 'Synth Basslines'] },
  { id: 'techno', name: 'Techno', parentGenre: 'electronic', description: 'Repetitive instrumental music, often used in clubs.', typicalElements: ['Repetitive Rhythms', 'Synthesized Sounds', 'Often Minimalistic'] },
  { id: 'ambient', name: 'Ambient', parentGenre: 'electronic', description: 'Atmospheric electronic music focusing on texture and soundscape.', typicalElements: ['Soundscapes', 'Slow Tempos', 'Lack of Traditional Structure'] },

  // Country Subgenres
  { id: 'bluegrass', name: 'Bluegrass', parentGenre: 'country', description: 'Traditional country music with acoustic instruments and intricate harmonies.', typicalElements: ['Banjo', 'Fiddle', 'Acoustic Guitar', 'Tight Harmonies'] },
  { id: 'countryPop', name: 'Country Pop', parentGenre: 'country', description: 'Country music with pop sensibilities and broader appeal.', typicalElements: ['Polished Production', 'Catchy Melodies', 'Crossover Appeal'] },
  
  // Jazz Subgenres
  { id: 'smoothJazz', name: 'Smooth Jazz', parentGenre: 'jazz', description: 'Accessible jazz style with melodic appeal and polished production.', typicalElements: ['Melodic Solos', 'Soft Rhythms', 'Contemporary Production'] },
  { id: 'fusion', name: 'Jazz Fusion', parentGenre: 'jazz', description: 'Jazz combined with rock, funk, and electronic elements.', typicalElements: ['Electric Instruments', 'Complex Rhythms', 'Technical Virtuosity'] },

  // R&B Subgenres
  { id: 'neoSoul', name: 'Neo Soul', parentGenre: 'r&b', description: 'Modern R&B with classic soul influences and contemporary production.', typicalElements: ['Organic Instruments', 'Live Drums', 'Conscious Lyrics'] },
  { id: 'contemporaryRB', name: 'Contemporary R&B', parentGenre: 'r&b', description: 'Modern R&B with electronic production and urban influences.', typicalElements: ['Programmed Beats', 'Synthesizers', 'Auto-tune'] },

  // Alternative Subgenres
  { id: 'grunge', name: 'Grunge', parentGenre: 'alternative', description: 'Raw, distorted alternative rock from the Pacific Northwest.', typicalElements: ['Heavy Distortion', 'Flannel Aesthetic', 'Anti-commercial Attitude'] },
  { id: 'shoegaze', name: 'Shoegaze', parentGenre: 'alternative', description: 'Ethereal alternative rock with layers of guitar effects.', typicalElements: ['Wall of Sound', 'Effects Pedals', 'Dreamy Vocals'] },

  // Classical Subgenres
  { id: 'baroque', name: 'Baroque', parentGenre: 'classical', description: 'Ornate classical music from the 17th-18th centuries.', typicalElements: ['Counterpoint', 'Harpsichord', 'Mathematical Precision'] },
  { id: 'romantic', name: 'Romantic', parentGenre: 'classical', description: 'Expressive classical music emphasizing emotion and individualism.', typicalElements: ['Emotional Expression', 'Large Orchestras', 'Program Music'] },

  // Folk Subgenres
  { id: 'indieFolk', name: 'Indie Folk', parentGenre: 'folk', description: 'Contemporary folk music with indie sensibilities.', typicalElements: ['Acoustic Instruments', 'Intimate Vocals', 'DIY Aesthetic'] },
  { id: 'folkRock', name: 'Folk Rock', parentGenre: 'folk', description: 'Folk music with rock instrumentation and attitude.', typicalElements: ['Electric Guitars', 'Folk Melodies', 'Social Commentary'] },
];

export const getSubGenresForGenre = (parentGenre: MusicGenre): SubGenre[] => {
  return subGenres.filter(sg => sg.parentGenre === parentGenre);
};

export const getSubGenreById = (id: string): SubGenre | undefined => {
  return subGenres.find(sg => sg.id === id);
};
