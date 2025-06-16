import { Song } from '@/types/songs';
import { GameState, StudioSkillType, StaffMember, Equipment } from '@/types/game';
import { MusicGenre } from '@/types/charts';
import { v4 as uuidv4 } from 'uuid';

/**
 * Calculates the initial quality and production value of a song.
 * Factors in player skills, studio equipment, and potentially staff skills.
 * @param gameState The current game state.
 * @param genre The genre of the song.
 * @param associatedBandId The ID of the band creating the song.
 * @returns An object containing calculated quality and production value.
 */
export const calculateSongAttributes = (
  gameState: GameState,
  genre: MusicGenre,
  associatedBandId: string
) => {
  const { playerData, studioSkills, ownedEquipment, hiredStaff } = gameState;

  // Base values
  let quality = 50;
  let productionValue = 50;

  // Player skills influence
  quality += playerData.skills.composition * 0.5;
  productionValue += playerData.skills.production * 0.5;
  productionValue += playerData.skills.soundDesign * 0.5;

  // Studio equipment influence
  ownedEquipment.forEach(equipment => {
    if (equipment.bonuses.qualityBonus) quality += equipment.bonuses.qualityBonus;
    if (equipment.bonuses.technicalBonus) productionValue += equipment.bonuses.technicalBonus;
    if (equipment.bonuses.creativityBonus) quality += equipment.bonuses.creativityBonus;
  });

  // Hired staff influence (simplified for now, can be expanded)
  hiredStaff.forEach(staff => {
    if (staff.role === 'Producer' || staff.role === 'Songwriter') {
      quality += staff.primaryStats.creativity * 0.2;
    }
    if (staff.role === 'Engineer' || staff.role === 'Mix Engineer' || staff.role === 'Mastering Engineer') {
      productionValue += staff.primaryStats.technical * 0.2;
    }
    // Consider genre affinity
    if (staff.genreAffinity && staff.genreAffinity.genre === genre) {
      quality += staff.genreAffinity.bonus * 0.1;
      productionValue += staff.genreAffinity.bonus * 0.1;
    }
  });

  // Clamp values
  quality = Math.max(0, Math.min(100, quality));
  productionValue = Math.max(0, Math.min(100, productionValue));

  return { quality, productionValue };
};

/**
 * Creates a new song and adds it to the game state.
 * @param gameState The current game state.
 * @param title The title of the song.
 * @param genre The genre of the song.
 * @param associatedBandId The ID of the band creating the song.
 * @returns The newly created song.
 */
export const createSong = (
  gameState: GameState,
  title: string,
  genre: MusicGenre,
  associatedBandId: string
): Song => {
  const { quality, productionValue } = calculateSongAttributes(gameState, genre, associatedBandId);

  const newSong: Song = {
    id: uuidv4(),
    title,
    genre,
    quality,
    productionValue,
    releaseDate: null,
    associatedBandId,
    initialBuzz: 0,
    chartEntryPotential: 0,
    totalSales: 0,
    currentChartPosition: null,
    performanceHistory: [],
    isReleased: false,
  };

  return newSong;
};

/**
 * Releases a song, calculating its initial buzz and chart entry potential.
 * @param song The song to be released.
 * @param currentDay The current game day.
 * @param gameState The current game state (for context like market trends, reputation).
 * @returns The updated song with release details.
 */
export const releaseSong = (
  song: Song,
  currentDay: number,
  gameState: GameState
): Song => {
  let initialBuzz = (song.quality + song.productionValue) / 2;
  let chartEntryPotential = initialBuzz * 0.5; // Base on average quality/production

  // Influence from band fame/reputation
  const associatedBand = gameState.bands.find(band => band.id === song.associatedBandId) ||
                         gameState.playerBands.find(band => band.id === song.associatedBandId);
  if (associatedBand) {
    initialBuzz += associatedBand.fame * 0.1;
    chartEntryPotential += associatedBand.reputation * 0.05;
  }

  // Influence from market trends (simplified)
  const genreTrend = gameState.marketTrends.currentTrends.find(
    trend => trend.genreId === song.genre
  );
  if (genreTrend) {
    initialBuzz *= (1 + (genreTrend.popularity / 100));
    chartEntryPotential *= (1 + (genreTrend.popularity / 100));
  }

  // Clamp values
  initialBuzz = Math.max(1, Math.min(100, initialBuzz));
  chartEntryPotential = Math.max(0, Math.min(100, chartEntryPotential));

  return {
    ...song,
    releaseDate: currentDay,
    initialBuzz,
    chartEntryPotential,
    isReleased: true,
    // Initial sales can be calculated here or in a separate daily update logic
    totalSales: 0,
    currentChartPosition: null, // Will be determined by chart updates
    performanceHistory: [{ day: currentDay, sales: 0, chartPosition: null }],
  };
};