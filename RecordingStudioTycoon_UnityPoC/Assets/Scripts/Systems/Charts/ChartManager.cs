using UnityEngine;
using System;
using System.Collections.Generic;
using System.Linq;
using RecordingStudioTycoon.DataModels.Charts;
using RecordingStudioTycoon.DataModels.Game;
using RecordingStudioTycoon.DataModels.Market;
using RecordingStudioTycoon.ScriptableObjects;
using RecordingStudioTycoon.Utils; // For ChartsGenerator

namespace RecordingStudioTycoon.Systems.Charts
{
    public class ChartManager : MonoBehaviour
    {
        public static ChartManager Instance { get; private set; }

        [SerializeField] private ChartsDataSO chartsData;
        [SerializeField] private GameStateSO gameStateSO;
        [SerializeField] private MarketManager marketManager; // Dependency on MarketManager

        // Events for UI updates
        public event Action OnChartsUpdated;
        public event Action<ChartEntry> OnChartAudioClipPlayed;

        private List<Chart> _availableChartDefinitions;
        private Dictionary<string, List<ChartEntry>> _currentCharts; // ChartId -> List of ChartEntry

        private AudioSource _audioSource;
        private string _currentlyPlayingClipId; // SongId-Position
        private Coroutine _playbackCoroutine;

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
            _audioSource = gameObject.AddComponent<AudioSource>();
            InitializeCharts();
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
            if (_playbackCoroutine != null)
            {
                StopCoroutine(_playbackCoroutine);
            }
            if (_audioSource != null)
            {
                _audioSource.Stop();
            }
        }

        private void InitializeCharts()
        {
            if (chartsData == null)
            {
                Debug.LogError("ChartsDataSO is not assigned to ChartManager.");
                _availableChartDefinitions = new List<Chart>();
                _currentCharts = new Dictionary<string, List<ChartEntry>>();
                return;
            }

            _availableChartDefinitions = new List<Chart>(chartsData.AvailableCharts);
            _currentCharts = new Dictionary<string, List<ChartEntry>>();

            // Initialize charts with some mock data or based on initial game state
            // For now, generate a mock Hot 100 chart
            if (gameStateSO != null)
            {
                _currentCharts["hot100"] = ChartsGenerator.GenerateHot100Chart(gameStateSO.GameState);
                // Update GameStateSO with initial chart data
                if (gameStateSO.GameState.MarketTrends == null)
                {
                    gameStateSO.GameState.MarketTrends = new MarketState();
                }
                gameStateSO.GameState.MarketTrends.CurrentHot100Chart = new List<ChartEntry>(_currentCharts["hot100"]);
            }
            else
            {
                Debug.LogError("GameStateSO is not assigned to ChartManager.");
            }

            OnChartsUpdated?.Invoke();
        }

        // This method should be called by GameManager on a periodic basis (e.g., weekly)
        public void UpdateAllCharts(int currentDay)
        {
            Debug.Log($"ChartManager: Updating all charts for game day: {currentDay}");

            // Example: Update Hot 100 chart
            // This is a simplified update. Real logic would involve:
            // - Player song performance
            // - AI song performance
            // - Market trends influence
            // - Song aging and dropping off charts
            List<ChartEntry> newHot100 = new List<ChartEntry>();
            
            // For demonstration, just re-generate mock data for now
            if (gameStateSO != null)
            {
                newHot100 = ChartsGenerator.GenerateHot100Chart(gameStateSO.GameState);
            }
            
            _currentCharts["hot100"] = newHot100;

            // Update GameStateSO
            if (gameStateSO != null)
            {
                gameStateSO.GameState.MarketTrends.CurrentHot100Chart = new List<ChartEntry>(_currentCharts["hot100"]);
            }

            OnChartsUpdated?.Invoke();
            Debug.Log("ChartManager: Charts updated.");
        }

        public List<Chart> GetAvailableCharts(int playerLevel)
        {
            return _availableChartDefinitions.FindAll(chart => chart.MinLevelToAccess <= playerLevel);
        }

        public List<ChartEntry> GetChartEntries(string chartId)
        {
            if (_currentCharts.TryGetValue(chartId, out List<ChartEntry> entries))
            {
                return new List<ChartEntry>(entries);
            }
            return new List<ChartEntry>();
        }

        // --- Audio Playback Logic (Ported from useChartAudio.ts) ---

        public string GetAudioClipPath(ChartEntry entry)
        {
            // If a specific clip path is defined on the entry, use it.
            if (!string.IsNullOrEmpty(entry.AudioClipPath))
            {
                return entry.AudioClipPath;
            }
            // Otherwise, use the ChartsGenerator to get a generic clip based on genre.
            return ChartsGenerator.GetRandomAudioClipPath(entry.Song.Genre);
        }

        public (float startTime, float endTime, int segmentNumber, string displayTime) GetPlaybackSegment(ChartEntry entry)
        {
            // Ported logic from useChartAudio.ts
            int seed = entry.Song.Title.GetHashCode() + entry.Song.Artist.Name.GetHashCode() + entry.Position + entry.Song.Artist.Popularity + entry.WeeksOnChart;
            System.Random rand = new System.Random(seed); // Use seed for consistent segment
            const float segmentDuration = 25f;
            const float overlapTime = 5f;
            int segmentNumber = (rand.Next(0, 6)) + 1; // 1 to 6
            float startTime = (segmentNumber - 1) * overlapTime;
            float endTime = startTime + segmentDuration;

            string formatTime(float seconds)
            {
                int minutes = Mathf.FloorToInt(seconds / 60);
                int secs = Mathf.FloorToInt(seconds % 60);
                return $"{minutes}:{secs:00}";
            }
            string displayTime = $"{formatTime(startTime)}-{formatTime(endTime)}";

            return (startTime, endTime, segmentNumber, displayTime);
        }

        public void PlayAudioClip(ChartEntry entry)
        {
            string clipPath = GetAudioClipPath(entry);
            if (string.IsNullOrEmpty(clipPath))
            {
                Debug.LogWarning($"No audio clip found for chart entry: {entry.Song.Title}");
                return;
            }

            string trackId = $"{entry.Song.Id}-{entry.Position}";

            if (_currentlyPlayingClipId == trackId)
            {
                // If already playing, stop it
                StopAudioClip();
                return;
            }

            StopAudioClip(); // Stop any currently playing clip

            _currentlyPlayingClipId = trackId;
            
            // Load audio clip from Resources. This assumes audio files are in a Resources folder.
            // Example: "Assets/Resources/audio/chart_clips/00s-rnb1.mp3" would be loaded as "audio/chart_clips/00s-rnb1"
            AudioClip clip = Resources.Load<AudioClip>(clipPath.Replace("audio/", "").Replace(".mp3", ""));

            if (clip == null)
            {
                Debug.LogError($"Failed to load audio clip from Resources: {clipPath}");
                _currentlyPlayingClipId = null;
                return;
            }

            _audioSource.clip = clip;
            var segment = GetPlaybackSegment(entry);

            // Ensure start time is within clip duration
            float safeStartTime = Mathf.Min(segment.startTime, clip.length - segment.Item1);
            _audioSource.time = Mathf.Max(0, safeStartTime);
            _audioSource.Play();

            // Start coroutine to stop playback after segment duration
            _playbackCoroutine = StartCoroutine(StopPlaybackAfterDuration(segment.startTime, segment.endTime, trackId));
            OnChartAudioClipPlayed?.Invoke(entry);
        }

        private System.Collections.IEnumerator StopPlaybackAfterDuration(float startTime, float endTime, string trackId)
        {
            float duration = endTime - startTime;
            float timer = 0f;

            while (timer < duration && _audioSource.isPlaying && _currentlyPlayingClipId == trackId)
            {
                timer += Time.deltaTime;
                yield return null;
            }

            if (_currentlyPlayingClipId == trackId) // Only stop if it's still the same clip
            {
                StopAudioClip();
            }
        }

        public void StopAudioClip()
        {
            if (_audioSource != null && _audioSource.isPlaying)
            {
                _audioSource.Stop();
            }
            _currentlyPlayingClipId = null;
            if (_playbackCoroutine != null)
            {
                StopCoroutine(_playbackCoroutine);
                _playbackCoroutine = null;
            }
        }
    }
}