using UnityEngine;
using System;
using System.Collections.Generic;
using System.Linq;
using RecordingStudioTycoon.DataModels.Market;
using RecordingStudioTycoon.DataModels.Projects;
using RecordingStudioTycoon.ScriptableObjects;
using RecordingStudioTycoon.GameLogic; // Assuming GameState and GameManager are here

namespace RecordingStudioTycoon.Systems.Market
{
    public class MarketManager : MonoBehaviour
    {
        public static MarketManager Instance { get; private set; }

        [SerializeField] private MarketTrendsDataSO marketTrendsData;
        [SerializeField] private GameStateSO gameStateSO; // Reference to the global GameState ScriptableObject

        private List<MarketTrend> currentMarketTrends;

        // Events for UI updates
        public event Action OnMarketTrendsUpdated;
        public event Action<MusicGenre, string, int> OnGenrePopularityChanged;

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
            }
        }

        private void Start()
        {
            InitializeMarketTrends();
            // Subscribe to game day advancement if GameManager provides such an event
            // GameManager.Instance.OnDayAdvanced += OnDayAdvanced; 
        }

        private void OnDestroy()
        {
            // Unsubscribe from events to prevent memory leaks
            // if (GameManager.Instance != null)
            // {
            //     GameManager.Instance.OnDayAdvanced -= OnDayAdvanced;
            // }
        }

        private void InitializeMarketTrends()
        {
            if (marketTrendsData == null)
            {
                Debug.LogError("MarketTrendsDataSO is not assigned to MarketManager.");
                currentMarketTrends = new List<MarketTrend>();
                return;
            }

            if (marketTrendsData.InitialMarketTrends != null && marketTrendsData.InitialMarketTrends.Any())
            {
                currentMarketTrends = new List<MarketTrend>(marketTrendsData.InitialMarketTrends);
            }
            else
            {
                // Fallback: Generate mock data if ScriptableObject is empty
                Debug.LogWarning("InitialMarketTrends in MarketTrendsDataSO is empty. Generating mock data.");
                GenerateMockMarketTrends();
            }

            // Ensure GameStateSO has market trends initialized
            if (gameStateSO != null)
            {
                if (gameStateSO.GameState.MarketTrends == null)
                {
                    gameStateSO.GameState.MarketTrends = new DataModels.Game.MarketState();
                }
                gameStateSO.GameState.MarketTrends.CurrentTrends = new List<MarketTrend>(currentMarketTrends);
                // You might want to add historical trends initialization here too
            }
            else
            {
                Debug.LogError("GameStateSO is not assigned to MarketManager.");
            }

            OnMarketTrendsUpdated?.Invoke();
        }

        private void GenerateMockMarketTrends()
        {
            currentMarketTrends = new List<MarketTrend>();
            MusicGenre[] genres = (MusicGenre[])Enum.GetValues(typeof(MusicGenre));
            TrendDirection[] directions = (TrendDirection[])Enum.GetValues(typeof(TrendDirection));
            
            System.Random rand = new System.Random();

            foreach (var genre in genres)
            {
                // For simplicity, not adding subgenres here initially, but the structure supports it.
                // You'd need a way to get relevant subgenres for each parent genre.
                // For now, we'll create a main trend for each genre.
                int initialPopularity = rand.Next(20, 81); // 20-80
                float initialGrowthRate = (float)rand.NextDouble() * 6f - 3f; // -3% to +3%

                currentMarketTrends.Add(new MarketTrend
                {
                    Id = $"trend-{genre}-{Guid.NewGuid()}",
                    GenreId = genre,
                    SubGenreId = "", // No subgenre for now
                    Popularity = initialPopularity,
                    TrendDirection = directions[rand.Next(directions.Length)],
                    GrowthRate = (float)Math.Round(initialGrowthRate, 2),
                    LastUpdatedDay = 1, // Assuming game starts on day 1
                    Growth = (int)Math.Round(initialGrowthRate * 10), // For compatibility
                    Events = new TrendEvent[0],
                    Duration = 90,
                    StartDay = 1,
                    ProjectedDuration = 90,
                    Seasonality = Enumerable.Repeat(1.0f, 12).ToArray() // Neutral seasonality
                });
            }
        }

        // This method should be called by GameManager on a periodic basis (e.g., daily, weekly)
        public void UpdateMarketTrends(List<Project> playerProjectsCompletedSinceLastUpdate, List<TrendEvent> globalEventsHappenedSinceLastUpdate, int currentDay)
        {
            Debug.Log($"MarketManager: Updating all market trends for game day: {currentDay}");

            const int MAX_POPULARITY = 100;
            const int MIN_POPULARITY = 5;
            const float MAX_GROWTH_RATE = 7.5f; // Max % change per update period
            const float MIN_GROWTH_RATE = -7.5f;

            System.Random rand = new System.Random();

            foreach (var trend in currentMarketTrends)
            {
                float newPopularity = trend.Popularity;
                float newGrowthRate = trend.GrowthRate;

                // 1. Apply current growth rate to popularity
                newPopularity += newGrowthRate;

                // 2. Adjust growth rate (inertia + small random fluctuation + regression to mean)
                newGrowthRate += ((float)rand.NextDouble() * 1f - 0.5f); // Smaller random change: -0.5 to +0.5
                newGrowthRate *= 0.95f; // Dampening factor

                // 3. Impact of player's successful releases
                foreach (var project in playerProjectsCompletedSinceLastUpdate)
                {
                    if (project.Genre == trend.GenreId && project.QualityScore.HasValue && project.QualityScore.Value > 70)
                    {
                        float qualityImpact = project.QualityScore.Value / 100f; // 0 to 1
                        newPopularity += qualityImpact * 5f; // Max +5 for a 100 quality score project
                        newGrowthRate += qualityImpact * 0.5f;  // Max +0.5 to growth rate
                        Debug.Log($"Player project '{project.Title}' (Quality: {project.QualityScore}) boosted {trend.GenreId}");
                    }
                }

                // 4. Impact of global events
                foreach (var ev in globalEventsHappenedSinceLastUpdate)
                {
                    if (ev.AffectedGenres.Contains(trend.GenreId))
                    {
                        newPopularity += ev.Impact * 0.2f; // Event impact spread (e.g. 20% of raw impact value)
                        newGrowthRate += ev.Impact * 0.05f; 
                        Debug.Log($"Global event '{ev.Name}' impacted {trend.GenreId}");
                    }
                }
                
                // 5. Clamp popularity and growthRate
                newPopularity = Mathf.Max(MIN_POPULARITY, Mathf.Min(MAX_POPULARITY, newPopularity));
                newGrowthRate = Mathf.Max(MIN_GROWTH_RATE, Mathf.Min(MAX_GROWTH_RATE, newGrowthRate));

                // 6. Determine new trendDirection based on current state
                TrendDirection newTrendDirection = TrendDirection.Stable;
                if (newGrowthRate > 1.5f && newPopularity < 90) newTrendDirection = TrendDirection.Rising;
                else if (newGrowthRate < -1.5f && newPopularity > 10) newTrendDirection = TrendDirection.Falling;
                else if (newPopularity < 25 && newGrowthRate > 0.5f) newTrendDirection = TrendDirection.Emerging;
                else if (newPopularity < 15 && newGrowthRate <= 0) newTrendDirection = TrendDirection.Fading;
                else if (newPopularity >= 85) newTrendDirection = TrendDirection.Stable; // Peaked
                
                trend.Popularity = Mathf.RoundToInt(newPopularity);
                trend.GrowthRate = (float)Math.Round(newGrowthRate, 2);
                trend.TrendDirection = newTrendDirection;
                trend.LastUpdatedDay = currentDay;
                trend.Growth = Mathf.RoundToInt(newGrowthRate * 10);
            }
            
            // Update GameStateSO
            if (gameStateSO != null)
            {
                gameStateSO.GameState.MarketTrends.CurrentTrends = new List<MarketTrend>(currentMarketTrends);
            }

            OnMarketTrendsUpdated?.Invoke();
            Debug.Log("MarketManager: Market trends updated.");
        }

        public int GetCurrentPopularity(MusicGenre genreId, string subGenreId = "")
        {
            MarketTrend relevantTrend = GetTrendForGenre(genreId, subGenreId);
            return relevantTrend?.Popularity ?? 50; // Default popularity
        }

        public MarketTrend GetTrendForGenre(MusicGenre genreId, string subGenreId = "")
        {
            MarketTrend relevantTrend = null;
            if (!string.IsNullOrEmpty(subGenreId))
            {
                relevantTrend = currentMarketTrends.Find(t => t.GenreId == genreId && t.SubGenreId == subGenreId);
            }
            if (relevantTrend == null)
            {
                relevantTrend = currentMarketTrends.Find(t => t.GenreId == genreId && string.IsNullOrEmpty(t.SubGenreId));
            }
            return relevantTrend;
        }

        public List<MarketTrend> GetAllTrends()
        {
            return new List<MarketTrend>(currentMarketTrends);
        }

        // Placeholder for subgenre data, will need to be loaded from ScriptableObject or similar
        public List<SubGenre> GetAllSubGenres()
        {
            if (marketTrendsData != null && marketTrendsData.AllSubGenres != null)
            {
                return new List<SubGenre>(marketTrendsData.AllSubGenres);
            }
            return new List<SubGenre>();
        }

        public SubGenre GetSubGenreById(string subGenreId)
        {
            return GetAllSubGenres().Find(sg => sg.Id == subGenreId);
        }
    }
}
