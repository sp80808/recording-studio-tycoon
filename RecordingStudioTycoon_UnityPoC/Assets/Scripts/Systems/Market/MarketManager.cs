using UnityEngine;
using System;
using System.Collections.Generic;
using System.Linq;
using RecordingStudioTycoon.GameLogic; // For GameManager and GameState
using RecordingStudioTycoon.DataModels; // For MarketTrend, TrendEvent, Chart, ChartEntry, MusicGenre, TrendDirection
using RecordingStudioTycoon.DataModels.Projects; // For Project
using RecordingStudioTycoon.DataModels.Songs; // For Song
using RecordingStudioTycoon.DataModels.Characters; // For Artist

namespace RecordingStudioTycoon.Systems.Market
{
    public class MarketManager : MonoBehaviour
    {
        public static MarketManager Instance { get; private set; }

        [SerializeField] private MarketTrendData marketTrendData; // Assign ScriptableObject in Inspector
        [SerializeField] private ChartsData chartsData; // Assign ScriptableObject in Inspector

        private List<MarketTrend> currentMarketTrends;
        private List<Chart> currentCharts;

        public event Action OnMarketTrendsUpdated;
        public event Action OnChartsUpdated;

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
            InitializeCharts();
        }

        private void OnDestroy()
        {
            // Unsubscribe from events to prevent memory leaks
        }

        private void InitializeMarketTrends()
        {
            if (marketTrendData != null && marketTrendData.initialTrends != null)
            {
                currentMarketTrends = new List<MarketTrend>(marketTrendData.initialTrends);
                Debug.Log("MarketManager: Initialized market trends from ScriptableObject.");
            }
            else
            {
                currentMarketTrends = GenerateInitialMarketTrends();
                Debug.LogWarning("MarketManager: MarketTrendData ScriptableObject not assigned or empty. Generating default trends.");
            }
        }

        private List<MarketTrend> GenerateInitialMarketTrends()
        {
            List<MarketTrend> trends = new List<MarketTrend>();
            MusicGenre[] genres = (MusicGenre[])Enum.GetValues(typeof(MusicGenre));
            TrendDirection[] directions = (TrendDirection[])Enum.GetValues(typeof(TrendDirection));

            foreach (MusicGenre genre in genres)
            {
                string subGenreId = null;

                float initialPopularity = UnityEngine.Random.Range(20f, 80f);
                float initialGrowthRate = UnityEngine.Random.Range(-3f, 3f);

                trends.Add(new MarketTrend
                {
                    id = $"trend-{genre}-{Guid.NewGuid()}",
                    genreId = genre,
                    subGenreId = subGenreId,
                    popularity = initialPopularity,
                    trendDirection = directions[UnityEngine.Random.Range(0, directions.Length)],
                    growthRate = initialGrowthRate,
                    lastUpdatedDay = 1,
                    growth = Mathf.RoundToInt(initialGrowthRate * 10),
                    duration = 90,
                    startDay = 1,
                    projectedDuration = 90,
                    seasonality = Enumerable.Repeat(1.0f, 12).ToList()
                });
            }
            return trends;
        }

        private void InitializeCharts()
        {
            if (chartsData != null && chartsData.initialCharts != null)
            {
                currentCharts = new List<Chart>(chartsData.initialCharts);
                Debug.Log("MarketManager: Initialized charts from ScriptableObject.");
            }
            else
            {
                currentCharts = GenerateInitialCharts();
                Debug.LogWarning("MarketManager: ChartsData ScriptableObject not assigned or empty. Generating default charts.");
            }
        }

        private List<Chart> GenerateInitialCharts()
        {
            List<Chart> charts = new List<Chart>();
            charts.Add(new Chart
            {
                id = "hot100",
                name = "Hot 100",
                description = "The most popular songs across all genres.",
                minLevelToAccess = 1,
                entries = new List<ChartEntry>(),
                primaryGenre = MusicGenre.Pop
            });
            return charts;
        }

        public void UpdateMarketAndCharts(List<Project> completedPlayerProjects, List<TrendEvent> globalEvents)
        {
            Debug.Log($"MarketManager: Updating market and charts for game day {GameManager.Instance.CurrentGameState.currentDay}");
            UpdateAllMarketTrends(completedPlayerProjects, globalEvents);
            UpdateAllCharts(GameManager.Instance.CurrentGameState.playerData.level, GameManager.Instance.CurrentGameState.currentEra);
            OnMarketTrendsUpdated?.Invoke();
            OnChartsUpdated?.Invoke();
        }

        private void UpdateAllMarketTrends(List<Project> playerProjectsCompleted, List<TrendEvent> globalEvents)
        {
            const float MAX_POPULARITY = 100f;
            const float MIN_POPULARITY = 5f;
            const float MAX_GROWTH_RATE = 7.5f;
            const float MIN_GROWTH_RATE = -7.5f;

            foreach (var trend in currentMarketTrends)
            {
                float newPopularity = trend.popularity;
                float newGrowthRate = trend.growthRate;

                newPopularity += newGrowthRate;

                newGrowthRate += (UnityEngine.Random.value * 1f - 0.5f);
                newGrowthRate *= 0.95f;

                foreach (var project in playerProjectsCompleted)
                {
                    if (project.genre == trend.genreId && project.qualityScore > 70)
                    {
                        float qualityImpact = project.qualityScore.Value / 100f;
                        newPopularity += qualityImpact * 5f;
                        newGrowthRate += qualityImpact * 0.5f;
                        Debug.Log($"Player project '{project.title}' (Quality: {project.qualityScore}) boosted {trend.genreId}");
                    }
                }

                foreach (var evt in globalEvents)
                {
                    if (evt.affectedGenres.Contains(trend.genreId))
                    {
                        newPopularity += evt.impact * 0.2f;
                        newGrowthRate += evt.impact * 0.05f;
                        Debug.Log($"Global event '{evt.name}' impacted {trend.genreId}");
                    }
                }

                newPopularity = Mathf.Max(MIN_POPULARITY, Mathf.Min(MAX_POPULARITY, newPopularity));
                newGrowthRate = Mathf.Max(MIN_GROWTH_RATE, Mathf.Min(MAX_GROWTH_RATE, newGrowthRate));

                TrendDirection newTrendDirection = TrendDirection.Stable;
                if (newGrowthRate > 1.5f && newPopularity < 90f) newTrendDirection = TrendDirection.Rising;
                else if (newGrowthRate < -1.5f && newPopularity > 10f) newTrendDirection = TrendDirection.Falling;
                else if (newPopularity < 25f && newGrowthRate > 0.5f) newTrendDirection = TrendDirection.Emerging;
                else if (newPopularity < 15f && newGrowthRate <= 0f) newTrendDirection = TrendDirection.Fading;
                else if (newPopularity >= 85f) newTrendDirection = TrendDirection.Stable;

                trend.popularity = Mathf.Round(newPopularity);
                trend.growthRate = (float)Math.Round(newGrowthRate, 2);
                trend.trendDirection = newTrendDirection;
                trend.lastUpdatedDay = GameManager.Instance.CurrentGameState.currentDay;
                trend.growth = Mathf.RoundToInt(newGrowthRate * 10);
            }
            Debug.Log("Market trends updated.");
        }

        private void UpdateAllCharts(int playerLevel, string currentEra)
        {
            foreach (var chart in currentCharts)
            {
                if (chart.minLevelToAccess > playerLevel)
                {
                    chart.entries.Clear();
                    continue;
                }

                chart.entries.Clear();
                for (int i = 0; i < 10; i++)
                {
                    chart.entries.Add(new ChartEntry
                    {
                        id = $"mock-song-{i}-{Guid.NewGuid()}",
                        song = new Song { id = $"song-{i}", title = $"Hit Song {i+1}", artist = new Artist { name = $"Artist {i+1}", popularity = UnityEngine.Random.Range(10,100) }, genre = chart.primaryGenre },
                        position = i + 1,
                        lastPosition = i + 2,
                        peakPosition = i + 1,
                        weeksOnChart = UnityEngine.Random.Range(1, 10),
                        influenceScore = UnityEngine.Random.Range(0.1f, 1.0f)
                    });
                }
                chart.entries = chart.entries.OrderBy(e => e.position).ToList();
            }
            Debug.Log("Charts updated.");
        }

        public List<MarketTrend> GetAllMarketTrends()
        {
            return new List<MarketTrend>(currentMarketTrends);
        }

        public MarketTrend GetTrendForGenre(MusicGenre genre, string subGenreId = null)
        {
            MarketTrend relevantTrend = null;
            if (!string.IsNullOrEmpty(subGenreId))
            {
                relevantTrend = currentMarketTrends.Find(t => t.genreId == genre && t.subGenreId == subGenreId);
            }
            if (relevantTrend == null)
            {
                relevantTrend = currentMarketTrends.Find(t => t.genreId == genre && string.IsNullOrEmpty(t.subGenreId));
            }
            return relevantTrend;
        }

        public float GetCurrentPopularity(MusicGenre genre, string subGenreId = null)
        {
            return GetTrendForGenre(genre, subGenreId)?.popularity ?? 50f;
        }

        public List<Chart> GetAvailableCharts(int playerLevel)
        {
            return currentCharts.Where(c => c.minLevelToAccess <= playerLevel).ToList();
        }

        public Chart GetChartById(string chartId)
        {
            return currentCharts.Find(c => c.id == chartId);
        }
    }
}
