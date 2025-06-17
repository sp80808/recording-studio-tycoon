using UnityEngine;
using System;
using RecordingStudioTycoon.GameLogic;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.ScriptableObjects;
using System.Collections.Generic;
using System.Linq; // For .ToList() and other LINQ operations

namespace RecordingStudioTycoon.Systems.Market
{
    public class MarketManager : MonoBehaviour
    {
        public static MarketManager Instance { get; private set; }

        // Use ScriptableObject for initial/static market trend definitions
        [SerializeField] private MarketTrendData[] initialMarketTrendDefinitions; 

        // Runtime market trends, managed by this manager
        private List<MarketTrend> _currentMarketTrends;

        public event Action OnMarketTrendsUpdated; // Event to notify UI/other systems

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
            }
            else
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                // Ensure AudioSource is present for ChartAudioManager if it's on the same GameObject
                if (GetComponent<AudioSource>() == null)
                {
                    gameObject.AddComponent<AudioSource>();
                }
            }
        }

        private void Start()
        {
            InitializeMarketTrends();
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnDayAdvanced += OnDayAdvanced;
            }
            // Initialize charts data in GameState if it's empty
            if (GameManager.Instance.GameState.chartsData == null || GameManager.Instance.GameState.chartsData.AllCharts == null || GameManager.Instance.GameState.chartsData.AllCharts.Count == 0)
            {
                GameManager.Instance.GameState.chartsData = new ChartsData
                {
                    AllCharts = ChartsGenerator.GenerateCharts(GameManager.Instance.GameState.playerData.level, GameManager.Instance.GameState.currentEra)
                };
            }
        }

        private void OnDestroy()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnDayAdvanced -= OnDayAdvanced;
            }
        }

        private void OnDayAdvanced(long currentDay)
        {
            // Trigger market update periodically, e.g., weekly (every 7 game days)
            if (currentDay % 7 == 0 && currentDay != 0)
            {
                Debug.Log($"MarketManager: Triggering weekly market update for day {currentDay}");
                // Pass completed projects and global events from GameState
                UpdateMarketTrends(GameManager.Instance.GameState.completedProjects, new List<TrendEvent>()); 
                UpdateSongCharts(currentDay);
            }
        }

        private void InitializeMarketTrends()
        {
            _currentMarketTrends = new List<MarketTrend>();
            if (initialMarketTrendDefinitions != null && initialMarketTrendDefinitions.Length > 0)
            {
                foreach (var definition in initialMarketTrendDefinitions)
                {
                    // Create runtime MarketTrend objects from ScriptableObject definitions
                    // This is a simplified conversion. You might need more complex logic
                    // to fully replicate the TS initializeMockData's random generation.
                    _currentMarketTrends.Add(new MarketTrend(
                        definition.Id, // Using definition ID as genreId for simplicity, adjust as needed
                        null, // SubGenreId, if applicable
                        50f, // Initial popularity
                        TrendDirection.Stable, // Initial direction
                        0f, // Initial growth rate
                        GameManager.Instance.GameState.currentDay // Current game day
                    ));
                }
            }
            else
            {
                // Fallback: Initialize with default genres if no ScriptableObjects are assigned
                string[] genres = { "pop", "rock", "hip-hop", "electronic", "country", "jazz", "r&b", "folk", "classical", "alternative", "acoustic" };
                System.Random rand = new System.Random();
                foreach (var genre in genres)
                {
                    float initialPopularity = rand.Next(20, 81); // 20-80
                    float initialGrowthRate = (float)rand.NextDouble() * 6 - 3; // -3 to +3
                    TrendDirection initialDirection = (TrendDirection)rand.Next(0, Enum.GetNames(typeof(TrendDirection)).Length);

                    _currentMarketTrends.Add(new MarketTrend(
                        genre,
                        null, // SubGenreId
                        initialPopularity,
                        initialDirection,
                        initialGrowthRate,
                        GameManager.Instance.GameState.currentDay
                    ));
                }
            }
            Debug.Log($"MarketManager: Initialized {_currentMarketTrends.Count} market trends.");
            // Update GameState with initial trends
            GameManager.Instance.GameState.currentMarketTrends = _currentMarketTrends;
        }

        /// <summary>
        /// Simulates market trends and genre popularity.
        /// </summary>
        public void UpdateMarketTrends(List<Project> playerProjectsCompletedSinceLastUpdate, List<TrendEvent> globalEventsHappenedSinceLastUpdate)
        {
            Debug.Log("MarketManager: Updating market trends...");

            const float MAX_POPULARITY = 100f;
            const float MIN_POPULARITY = 5f;
            const float MAX_GROWTH_RATE = 7.5f;
            const float MIN_GROWTH_RATE = -7.5f;

            System.Random rand = new System.Random();

            foreach (var trend in _currentMarketTrends)
            {
                float newPopularity = trend.Popularity;
                float newGrowthRate = trend.GrowthRate;

                // 1. Apply current growth rate to popularity
                newPopularity += newGrowthRate;

                // 2. Adjust growth rate (inertia + small random fluctuation + regression to mean)
                newGrowthRate += ((float)rand.NextDouble() * 1f - 0.5f); // -0.5 to +0.5
                newGrowthRate *= 0.95f; // Dampening factor

                // 3. Impact of player's successful releases
                foreach (var project in playerProjectsCompletedSinceLastUpdate)
                {
                    // Assuming Project has a 'Genre' property and 'QualityScore'
                    if (project.Genre == trend.GenreId && project.QualityScore > 70)
                    {
                        float qualityImpact = project.QualityScore / 100f;
                        newPopularity += qualityImpact * 5f;
                        newGrowthRate += qualityImpact * 0.5f;
                        Debug.Log($"Player project '{project.Title}' (Quality: {project.QualityScore}) boosted {trend.GenreId}");
                    }
                }

                // 4. Impact of global events
                foreach (var ev in globalEventsHappenedSinceLastUpdate)
                {
                    if (ev.AffectedGenres.Contains(trend.GenreId))
                    {
                        newPopularity += ev.Impact * 0.2f;
                        newGrowthRate += ev.Impact * 0.05f;
                        Debug.Log($"Global event '{ev.Name}' impacted {trend.GenreId}");
                    }
                }

                // 5. Clamp popularity and growthRate
                newPopularity = Mathf.Clamp(newPopularity, MIN_POPULARITY, MAX_POPULARITY);
                newGrowthRate = Mathf.Clamp(newGrowthRate, MIN_GROWTH_RATE, MAX_GROWTH_RATE);

                // 6. Determine new trendDirection based on current state
                TrendDirection newTrendDirection = TrendDirection.Stable;
                if (newGrowthRate > 1.5f && newPopularity < 90f) newTrendDirection = TrendDirection.Rising;
                else if (newGrowthRate < -1.5f && newPopularity > 10f) newTrendDirection = TrendDirection.Falling;
                else if (newPopularity < 25f && newGrowthRate > 0.5f) newTrendDirection = TrendDirection.Emerging;
                else if (newPopularity < 15f && newGrowthRate <= 0f) newTrendDirection = TrendDirection.Fading;
                else if (newPopularity >= 85f) newTrendDirection = TrendDirection.Stable; // Peaked

                trend.Popularity = Mathf.Round(newPopularity);
                trend.GrowthRate = (float)Math.Round(newGrowthRate, 2);
                trend.Direction = newTrendDirection;
                trend.LastUpdatedDay = GameManager.Instance.GameState.currentDay;
                trend.Growth = (int)Math.Round(newGrowthRate * 10);
            }

            // TODO: Logic for new trends emerging or old ones dying out completely.
            // TODO: Consider sub-genre specific evolution linked to parent genre.

            Debug.Log("MarketManager: Market trends updated.");
            OnMarketTrendsUpdated?.Invoke(); // Notify subscribers
            GameManager.Instance.GameState.currentMarketTrends = _currentMarketTrends; // Update GameState
        }

        /// <summary>
        /// Updates song chart positions based on song quality, genre trends, and other factors.
        /// </summary>
        private void UpdateSongCharts(long currentDay)
        {
            Debug.Log("MarketManager: Updating song charts...");
            // Get all songs and bands from GameManager (or a dedicated Song/Band Manager)
            List<Song> allSongs = GameManager.Instance.GameState.playerBands.SelectMany(b => b.Songs).ToList(); // Assuming playerBands hold songs
            // TODO: Add AI-generated songs to allSongs list
            List<Band> allBands = GameManager.Instance.GameState.playerBands; // Assuming playerBands are the only bands for now
            // TODO: Add AI bands to allBands list

            // Update existing charts
            GameManager.Instance.GameState.chartsData.AllCharts = ChartsGenerator.UpdateCharts(
                GameManager.Instance.GameState.chartsData.AllCharts,
                GameManager.Instance.GameState.playerData.level,
                currentDay,
                allSongs,
                allBands,
                _currentMarketTrends
            );

            // Add newly released player songs to charts (this might be redundant if UpdateCharts handles it)
            // This part can be optimized or removed if UpdateCharts already correctly adds new songs.
            // For now, keeping it separate for clarity based on TS logic.
            List<Song> newlyReleasedPlayerSongs = allSongs.Where(s =>
                s.IsReleased &&
                s.PlayerProduced && // Assuming a PlayerProduced flag on Song
                s.ReleaseDate == currentDay &&
                !GameManager.Instance.GameState.chartsData.AllCharts.Any(chart => chart.Entries.Any(entry => entry.Song.Id == s.Id))
            ).ToList();

            foreach (var newSong in newlyReleasedPlayerSongs)
            {
                Band band = allBands.FirstOrDefault(b => b.Id == newSong.AssociatedBandId);
                GameManager.Instance.GameState.chartsData.AllCharts = ChartsGenerator.AddPlayerSongToCharts(
                    GameManager.Instance.GameState.chartsData.AllCharts,
                    newSong,
                    currentDay,
                    band?.Reputation ?? 0 // Use band reputation if available
                );
            }

            Debug.Log("MarketManager: Song charts updated.");
        }

        // Public methods for other systems to query market data
        public List<MarketTrend> GetAllMarketTrends()
        {
            return _currentMarketTrends;
        }

        public MarketTrend GetTrendForGenre(string genreId, string subGenreId = null)
        {
            MarketTrend relevantTrend = null;
            if (!string.IsNullOrEmpty(subGenreId))
            {
                relevantTrend = _currentMarketTrends.Find(t => t.GenreId == genreId && t.SubGenreId == subGenreId);
            }
            if (relevantTrend == null)
            {
                relevantTrend = _currentMarketTrends.Find(t => t.GenreId == genreId && string.IsNullOrEmpty(t.SubGenreId));
            }
            return relevantTrend;
        }

        public float GetCurrentPopularity(string genreId, string subGenreId = null)
        {
            MarketTrend trend = GetTrendForGenre(genreId, subGenreId);
            return trend?.Popularity ?? 50f; // Default if no specific trend found
        }

        public ChartsData GetCurrentCharts()
        {
            // Return current chart data from GameState
            return GameManager.Instance.GameState.chartsData;
        }
    }
}