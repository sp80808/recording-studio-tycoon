using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.DataModels.Market;
using RecordingStudioTycoon.GameLogic;

namespace RecordingStudioTycoon.Utils
{
    public static class ChartsGenerator
    {
        // Sample artist names for chart generation
        private static readonly string[] _artistNames = new string[]
        {
            "The Midnight Rebels", "Luna Skywalker", "Electric Dreams", "Neon Nights",
            "Crystal Vision", "Urban Legends", "Digital Hearts", "Sonic Bloom",
            "Velvet Thunder", "Phoenix Rising", "Midnight Sun", "Stellar Groove",
            "Cosmic Echo", "Silver Lining", "Retro Future", "Bass Revolution",
            "Harmony Heights", "Voltage Drop", "Rhythm Factory", "Sound Wave",
            "Metro Pulse", "Night Drive", "Sunset Boulevard", "Frequency",
            "Audio Clash", "Beat Machine", "Synth City", "Reverb Station",
            "Echo Chamber", "Sound Barrier", "Wavelength", "Amplitude",
            "Decibel Dreams", "Sonic Boom", "Audio Wave", "Beat Drop"
        };

        private static readonly string[] _songTitles = new string[]
        {
            "Summer Nights", "Electric Love", "Midnight Highway", "Neon Dreams",
            "City Lights", "Dancing Shadows", "Digital Heart", "Crystal Rain",
            "Cosmic Journey", "Starlight Express", "Thunder Road", "Silver Sky",
            "Velvet Moon", "Golden Hour", "Infinite Loop", "Sound of Tomorrow",
            "Retro Vibes", "Urban Jungle", "Night Fever", "Electric Storm",
            "Sunset Drive", "Crystal Clear", "Midnight Express", "Neon Glow",
            "Digital Dreams", "Cosmic Love", "Thunder Strike", "Silver Dreams",
            "Velvet Touch", "Golden Light", "Infinite Sky", "Sound of Freedom"
        };

        public static readonly string[] AllMusicGenres = new string[]
        {
            "rock", "pop", "hip-hop", "electronic", "country", "alternative", "r&b", "jazz", "classical", "folk", "acoustic"
        };

        /// <summary>
        /// Generates a random AI Artist.
        /// </summary>
        /// <param name="genre">The primary genre of the artist.</param>
        /// <param name="minPopularity">Minimum initial popularity.</param>
        /// <param name="maxPopularity">Maximum initial popularity.</param>
        /// <returns>A new Artist object.</returns>
        public static Artist GenerateAIArtist(string genre, int minPopularity = 1, int maxPopularity = 100)
        {
            System.Random rand = new System.Random();
            string name = _artistNames[rand.Next(0, _artistNames.Length)];
            int popularity = rand.Next(minPopularity, maxPopularity + 1);
            
            return new Artist
            {
                Id = Guid.NewGuid().ToString(),
                Name = name,
                Popularity = popularity,
                Genre = genre,
                Reputation = rand.Next(1, 101),
                IsPlayerOwned = false
            };
        }

        /// <summary>
        /// Generates a random AI Song.
        /// </summary>
        /// <param name="artist">The artist associated with the song.</param>
        /// <param name="minQuality">Minimum quality score for the song.</param>
        /// <param name="maxQuality">Maximum quality score for the song.</param>
        /// <returns>A new Song object.</returns>
        public static Song GenerateAISong(Artist artist, int minQuality = 60, int maxQuality = 100)
        {
            System.Random rand = new System.Random();
            string title = _songTitles[rand.Next(0, _songTitles.Length)];
            
            return new Song
            {
                Id = Guid.NewGuid().ToString(),
                Title = title,
                Genre = artist.Genre,
                Artist = artist,
                AssociatedBandId = artist.Id,
                QualityScore = rand.Next(minQuality, maxQuality + 1),
                InitialBuzz = rand.Next(1, 51),
                IsReleased = true,
                ReleaseDate = 0,
                PlayerProduced = false
            };
        }

        /// <summary>
        /// Generates chart entries for a specific chart.
        /// </summary>
        /// <param name="count">Number of entries to generate.</param>
        /// <param name="chartGenre">Optional: Filter entries by a specific genre.</param>
        /// <param name="currentDay">The current game day for setting release dates.</param>
        /// <returns>A list of ChartEntry objects.</returns>
        private static List<ChartEntry> GenerateChartEntries(int count, string chartGenre = null, long currentDay = 0)
        {
            List<ChartEntry> entries = new List<ChartEntry>();
            System.Random rand = new System.Random();

            for (int i = 0; i < count; i++)
            {
                string genre = chartGenre ?? AllMusicGenres[rand.Next(0, AllMusicGenres.Length)];
                Artist artist = GenerateAIArtist(genre);
                Song song = GenerateAISong(artist);
                song.ReleaseDate = currentDay > 0 ? currentDay - rand.Next(0, 30) : 0;

                int positionChange = rand.Next(-5, 6);
                
                string movement = "steady";
                if (positionChange > 0) movement = "up";
                else if (positionChange < 0) movement = "down";
                else if (i > count * 0.8) movement = "new";

                entries.Add(new ChartEntry
                {
                    Position = i + 1,
                    Song = song,
                    Trend = movement,
                    PositionChange = positionChange,
                    WeeksOnChart = rand.Next(1, 21),
                    PeakPosition = rand.Next(1, i + 2),
                    LastPosition = (i + 1) - positionChange > 0 ? (i + 1) - positionChange : 0
                });
            }
            return entries;
        }

        /// <summary>
        /// Generates the initial set of charts for the game.
        /// </summary>
        /// <param name="playerLevel">Current player level.</param>
        /// <param name="currentEra">Current game era.</param>
        /// <returns>A list of Chart objects.</returns>
        public static List<Chart> GenerateCharts(int playerLevel, string currentEra)
        {
            List<Chart> charts = new List<Chart>();
            string[] availableGenres = AllMusicGenres;

            // Main Hot 100 Chart (available from level 1)
            charts.Add(new Chart("hot100", "Hot 100", "The biggest hits across all genres", 1)
            {
                Entries = GenerateChartEntries(40, null, GameManager.Instance?.GameState?.currentDay ?? 0)
            });

            // Local Charts (available from level 1)
            charts.Add(new Chart("local", "Local Hits", "Popular songs in your local area", 1)
            {
                Entries = GenerateChartEntries(20, null, GameManager.Instance?.GameState?.currentDay ?? 0)
            });

            // Genre-specific charts (unlock as player progresses)
            if (playerLevel >= 3 && availableGenres.Contains("rock"))
            {
                charts.Add(new Chart("rock", "Rock Charts", "The hottest rock tracks", 3)
                {
                    Entries = GenerateChartEntries(25, "rock", GameManager.Instance?.GameState?.currentDay ?? 0)
                });
            }

            if (playerLevel >= 4 && availableGenres.Contains("pop"))
            {
                charts.Add(new Chart("pop", "Pop Charts", "Mainstream pop hits", 4)
                {
                    Entries = GenerateChartEntries(25, "pop", GameManager.Instance?.GameState?.currentDay ?? 0)
                });
            }

            if (playerLevel >= 5 && availableGenres.Contains("hip-hop"))
            {
                charts.Add(new Chart("hiphop", "Hip-Hop Charts", "Urban and hip-hop tracks", 5)
                {
                    Entries = GenerateChartEntries(25, "hip-hop", GameManager.Instance?.GameState?.currentDay ?? 0)
                });
            }

            if (playerLevel >= 6 && availableGenres.Contains("electronic"))
            {
                charts.Add(new Chart("electronic", "Electronic Charts", "Electronic and dance music", 6)
                {
                    Entries = GenerateChartEntries(25, "electronic", GameManager.Instance?.GameState?.currentDay ?? 0)
                });
            }

            if (playerLevel >= 7 && availableGenres.Contains("jazz"))
            {
                charts.Add(new Chart("jazz", "Jazz Fusion Top 20", "The best in contemporary and classic jazz fusion.", 7)
                {
                    Entries = GenerateChartEntries(20, "jazz", GameManager.Instance?.GameState?.currentDay ?? 0)
                });
            }

            if (playerLevel >= 8 && availableGenres.Contains("classical"))
            {
                charts.Add(new Chart("classical", "Classical Crossover", "Orchestral and classical pieces with a modern twist.", 8)
                {
                    Entries = GenerateChartEntries(15, "classical", GameManager.Instance?.GameState?.currentDay ?? 0)
                });
            }

            if (playerLevel >= 2 && availableGenres.Contains("acoustic"))
            {
                charts.Add(new Chart("acoustic", "Acoustic & Folk Hits", "Unplugged and heartfelt tracks.", 2)
                {
                    Entries = GenerateChartEntries(20, "acoustic", GameManager.Instance?.GameState?.currentDay ?? 0)
                });
            }

            return charts;
        }

        /// <summary>
        /// Adds a player-produced song to relevant charts and re-sorts them.
        /// </summary>
        /// <param name="charts">The current list of charts.</param>
        /// <param name="playerSong">The player's song to add.</param>
        /// <param name="currentDay">Current game day.</param>
        /// <param name="bandReputation">Reputation of the player's band.</param>
        /// <param name="studioSpecializations">Player's studio specializations.</param>
        /// <param name="industryPrestige">Player's industry prestige levels.</param>
        /// <returns>Updated list of charts.</returns>
        public static List<Chart> AddPlayerSongToCharts(List<Chart> charts, Song playerSong, long currentDay, int bandReputation, SerializableDictionary<MusicGenre, DataModels.Progression.StudioSpecialization> studioSpecializations, SerializableDictionary<string, DataModels.Progression.IndustryPrestige> industryPrestige)
        {
            float initialPopularity = CalculateSongPopularity(playerSong, GameManager.Instance?.GameState?.playerBands ?? new List<Band>(), GameManager.Instance?.GameState?.currentMarketTrends ?? new List<MarketTrend>(), studioSpecializations, industryPrestige);
            initialPopularity = Mathf.Min(100f, Mathf.Max(1f, initialPopularity));
            int initialPosition = Mathf.Max(1, 40 - Mathf.FloorToInt(initialPopularity / 2.5f));

            ChartEntry playerSongChartEntry = new ChartEntry
            {
                Position = initialPosition,
                Song = playerSong,
                Trend = "new",
                PositionChange = 0,
                WeeksOnChart = 0,
                PeakPosition = initialPosition,
                LastPosition = 0
            };

            return charts.Select(chart =>
            {
                if (chart.Genre == playerSong.Genre || chart.Id == "hot100")
                {
                    List<ChartEntry> updatedEntries = new List<ChartEntry>(chart.Entries);
                    if (!updatedEntries.Any(e => e.Song.Id == playerSong.Id))
                    {
                        updatedEntries.Add(playerSongChartEntry);
                    }

                    updatedEntries.Sort((a, b) =>
                    {
                        float aPopularity = CalculateSongPopularity(a.Song, GameManager.Instance?.GameState?.playerBands ?? new List<Band>(), GameManager.Instance?.GameState?.currentMarketTrends ?? new List<MarketTrend>(), studioSpecializations, industryPrestige);
                        float bPopularity = CalculateSongPopularity(b.Song, GameManager.Instance?.GameState?.playerBands ?? new List<Band>(), GameManager.Instance?.GameState?.currentMarketTrends ?? new List<MarketTrend>(), studioSpecializations, industryPrestige);
                        return bPopularity.CompareTo(aPopularity);
                    });

                    List<ChartEntry> finalEntries = new List<ChartEntry>();
                    int maxChartSize = chart.Id == "hot100" ? 40 : 25;

                    foreach (var entry in updatedEntries)
                    {
                        int newPosition = finalEntries.Count + 1;
                        if (newPosition > maxChartSize) break;

                        string movement = "steady";
                        int positionChange = 0;

                        ChartEntry oldEntry = chart.Entries.FirstOrDefault(e => e.Song.Id == entry.Song.Id);
                        int oldPosition = oldEntry != null ? oldEntry.Position : 0;

                        if (entry.Song.Id == playerSong.Id && oldEntry == null)
                        {
                            movement = "new";
                            positionChange = 0;
                        }
                        else if (oldEntry != null)
                        {
                            positionChange = oldPosition - newPosition;
                            if (positionChange > 0) movement = "up";
                            else if (positionChange < 0) movement = "down";
                            else movement = "steady";
                        }
                        else
                        {
                            movement = "new";
                        }

                        finalEntries.Add(new ChartEntry
                        {
                            Id = entry.Id,
                            Song = entry.Song,
                            Position = newPosition,
                            PeakPosition = oldEntry != null ? Mathf.Min(oldEntry.PeakPosition, newPosition) : newPosition,
                            WeeksOnChart = oldEntry != null ? oldEntry.WeeksOnChart + 1 : 1,
                            LastPosition = oldPosition,
                            Trend = movement,
                            PositionChange = positionChange,
                            AudioClipName = entry.AudioClipName,
                            AudioPlaybackSegment = entry.AudioPlaybackSegment
                        });
                    }

                    return new Chart
                    {
                        Id = chart.Id,
                        Name = chart.Name,
                        Description = chart.Description,
                        MinLevelToAccess = chart.MinLevelToAccess,
                        Entries = finalEntries,
                        LastUpdatedDay = currentDay
                    };
                }
                return chart;
            }).ToList();
        }

        /// <summary>
        /// Updates existing charts based on song performance, market trends, etc.
        /// </summary>
        public static List<Chart> UpdateCharts(List<Chart> currentCharts, int playerLevel, long currentDay, List<Song> allSongs, List<Band> allBands, List<MarketTrend> currentMarketTrends, SerializableDictionary<MusicGenre, DataModels.Progression.StudioSpecialization> studioSpecializations, SerializableDictionary<string, DataModels.Progression.IndustryPrestige> industryPrestige)
        {
            return currentCharts.Select(chart =>
            {
                List<ChartEntry> updatedEntries = new List<ChartEntry>();
                System.Random rand = new System.Random();

                foreach (var entry in chart.Entries)
                {
                    Song song = allSongs.FirstOrDefault(s => s.Id == entry.Song.Id) ?? entry.Song;
                    
                    float currentPopularity = CalculateSongPopularity(song, allBands, currentMarketTrends, studioSpecializations, industryPrestige);
                    currentPopularity -= (entry.WeeksOnChart * 0.5f);
                    currentPopularity += ((float)rand.NextDouble() * 5f - 2.5f);
                    currentPopularity = Mathf.Clamp(currentPopularity, 1f, 100f);

                    if (currentPopularity > 10f || entry.Position <= 20)
                    {
                        Song updatedSong = new Song(song.Title, song.Genre, song.Artist, song.QualityScore)
                        {
                            Id = song.Id,
                            InitialBuzz = song.InitialBuzz,
                            AssociatedBandId = song.AssociatedBandId,
                            ReleaseDate = song.ReleaseDate,
                            IsReleased = song.IsReleased,
                            WeeksOnChart = entry.WeeksOnChart + 1,
                            CurrentChartPosition = entry.Position
                        };

                        updatedEntries.Add(new ChartEntry
                        {
                            Id = entry.Id,
                            Song = updatedSong,
                            Position = entry.Position,
                            PeakPosition = entry.PeakPosition,
                            WeeksOnChart = entry.WeeksOnChart + 1,
                            LastPosition = entry.Position,
                            Trend = entry.Trend,
                            PositionChange = entry.PositionChange,
                            AudioClipName = entry.AudioClipName,
                            AudioPlaybackSegment = entry.AudioPlaybackSegment
                        });
                    }
                }

                List<Song> newlyReleasedSongs = allSongs.Where(s =>
                    s.IsReleased &&
                    s.ReleaseDate == currentDay &&
                    !updatedEntries.Any(entry => entry.Song.Id == s.Id) &&
                    (chart.Genre == s.Genre || chart.Id == "hot100")
                ).ToList();

                foreach (var newSong in newlyReleasedSongs)
                {
                    float initialPopularity = CalculateSongPopularity(newSong, allBands, currentMarketTrends, studioSpecializations, industryPrestige);
                    int initialPosition = Mathf.Max(1, 40 - Mathf.FloorToInt(initialPopularity / 2.5f));

                    updatedEntries.Add(new ChartEntry
                    {
                        Position = initialPosition,
                        Song = newSong,
                        Trend = "new",
                        PositionChange = 0,
                        WeeksOnChart = 0,
                        PeakPosition = initialPosition,
                        LastPosition = 0
                    });
                }

                updatedEntries.Sort((a, b) =>
                {
                    float aPopularity = CalculateSongPopularity(a.Song, allBands, currentMarketTrends, studioSpecializations, industryPrestige);
                    float bPopularity = CalculateSongPopularity(b.Song, allBands, currentMarketTrends, studioSpecializations, industryPrestige);
                    return bPopularity.CompareTo(aPopularity);
                });

                List<ChartEntry> finalEntries = new List<ChartEntry>();
                int maxChartSize = chart.Id == "hot100" ? 40 : 25;

                for (int i = 0; i < updatedEntries.Count; i++)
                {
                    ChartEntry entry = updatedEntries[i];
                    int newPosition = i + 1;

                    if (newPosition > maxChartSize) break;

                    string movement = "steady";
                    int positionChange = 0;

                    if (entry.LastPosition > 0)
                    {
                        positionChange = entry.LastPosition - newPosition;
                        if (positionChange > 0) movement = "up";
                        else if (positionChange < 0) movement = "down";
                        else movement = "steady";
                    }
                    else if (entry.WeeksOnChart == 0)
                    {
                        movement = "new";
                    }
                    else
                    {
                        movement = "returning";
                    }

                    finalEntries.Add(new ChartEntry
                    {
                        Id = entry.Id,
                        Song = entry.Song,
                        Position = newPosition,
                        PeakPosition = Mathf.Min(entry.PeakPosition, newPosition),
                        WeeksOnChart = entry.WeeksOnChart,
                        LastPosition = entry.Position,
                        Trend = movement,
                        PositionChange = positionChange,
                        AudioClipName = entry.AudioClipName,
                        AudioPlaybackSegment = entry.AudioPlaybackSegment
                    });
                }

                return new Chart
                {
                    Id = chart.Id,
                    Name = chart.Name,
                    Description = chart.Description,
                    MinLevelToAccess = chart.MinLevelToAccess,
                    Entries = finalEntries,
                    LastUpdatedDay = currentDay
                };
            }).ToList();
        }

        // Helper methods
        public static bool IsArtistContactable(ChartEntry chartEntry, int playerLevel, int playerReputation)
        {
            if (chartEntry.Position <= 10 && playerLevel < 8) return false;
            if (chartEntry.Position <= 25 && playerLevel < 5) return false;
            
            int minReputation = Mathf.Max(0, (50 - chartEntry.Position) * 10);
            if (playerReputation < minReputation) return false;
            
            return true;
        }

        public static int CalculateContactCost(int chartPosition, int artistPopularity, int playerReputation)
        {
            const int baseCost = 1000;
            float positionMultiplier = Mathf.Max(0.5f, 2f - (chartPosition / 50f));
            float popularityMultiplier = artistPopularity / 100f;
            float reputationDiscount = Mathf.Max(0.7f, 1f - (playerReputation / 500f));
            
            return Mathf.FloorToInt(baseCost * positionMultiplier * popularityMultiplier * reputationDiscount);
        }

        public static float CalculateContactSuccess(int chartPosition, int artistPopularity, int playerReputation, int offerAmount)
        {
            const float baseSuccess = 0.3f;
            
            float positionFactor = Mathf.Max(0.1f, 1f - (chartPosition / 100f));
            float reputationFactor = Mathf.Min(2f, 1f + (playerReputation / 200f));
            
            float expectedOffer = CalculateContactCost(chartPosition, artistPopularity, playerReputation);
            float offerFactor = Mathf.Min(2f, offerAmount / expectedOffer);
            
            return Mathf.Min(0.95f, baseSuccess * positionFactor * reputationFactor * offerFactor);
        }

        /// <summary>
        /// Calculates a song's overall popularity based on its attributes, associated band's reputation,
        /// and current market trends for its genre.
        /// </summary>
        private static float CalculateSongPopularity(Song song, List<Band> allBands, List<MarketTrend> currentMarketTrends, SerializableDictionary<MusicGenre, DataModels.Progression.StudioSpecialization> studioSpecializations = null, SerializableDictionary<string, DataModels.Progression.IndustryPrestige> industryPrestige = null)
        {
            float popularity = song.QualityScore * 0.6f + song.InitialBuzz * 0.2f;

            Band band = allBands.FirstOrDefault(b => b.Id == song.AssociatedBandId);
            if (band != null)
            {
                popularity += band.Reputation * 0.2f;
            }

            MarketTrend genreTrend = currentMarketTrends.FirstOrDefault(t => t.GenreId == song.Genre);
            if (genreTrend != null)
            {
                popularity += (genreTrend.Popularity - 50f) * 0.1f;
            }

            // Apply Studio Specialization bonus if available
            if (studioSpecializations != null && Enum.TryParse<MusicGenre>(song.Genre, out MusicGenre genre))
            {
                if (studioSpecializations.TryGetValue(genre, out DataModels.Progression.StudioSpecialization specialization))
                {
                    popularity *= specialization.BonusMultiplier;
                }
            }

            // Apply Industry Prestige bonus if available
            if (industryPrestige != null)
            {
                if (industryPrestige.TryGetValue("general", out DataModels.Progression.IndustryPrestige generalPrestige))
                {
                    popularity *= generalPrestige.BonusMultiplier;
                }
                
                string genrePrestigeKey = song.Genre.ToLowerInvariant() + "_industry";
                if (industryPrestige.TryGetValue(genrePrestigeKey, out DataModels.Progression.IndustryPrestige genrePrestige))
                {
                    popularity *= genrePrestige.BonusMultiplier;
                }
            }

            return Mathf.Clamp(popularity, 1f, 100f);
        }
    }
}
