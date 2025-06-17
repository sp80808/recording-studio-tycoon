using UnityEngine;
using System;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.GameLogic; // For GameManager and GameState

namespace RecordingStudioTycoon.Systems.Market
{
    public class ChartAudioManager : MonoBehaviour
    {
        public static ChartAudioManager Instance { get; private set; }

        private AudioSource _audioSource;
        private string _currentlyPlayingClipId; // Combination of song ID and position
        private Dictionary<string, float> _playbackProgress = new Dictionary<string, float>();

        // Map genres to audio clip names (assuming clips are in Resources/Audio/ChartClips/)
        // This can be made into a ScriptableObject for easier management later.
        private Dictionary<string, List<string>> _audioClipMap = new Dictionary<string, List<string>>()
        {
            { "rock", new List<string> { "60s-chart-track5", "80s-Power-Chord1", "80s-Power-Chord2", "00sAlt-Rock-Energy1", "00sNu-Metal-Vibe2" } },
            { "pop", new List<string> { "60s-Pop2", "80schart-anthem1", "00sStreaming-Ready1", "80s-Power-Chord1", "00s-rnb2" } },
            { "electronic", new List<string> { "80s-Synthesizer1", "2000s-Electronic1", "00sElectronic-Hybrid2", "80schart-anthem1", "00sNu-Metal-Vibe2" } },
            { "hip-hop", new List<string> { "80s-Power-Chord2", "00sNu-Metal-Vibe2", "00sElectronic-Hybrid2", "00s-rnb3", "2000s-Electronic1" } },
            { "r&b", new List<string> { "00s-rnb1", "00s-rnb2", "00s-rnb3", "60s-Pop2", "80schart-anthem1" } },
            { "country", new List<string> { "2000s-Country3", "60s-chart-track5", "80s-Power-Chord1", "00sAlt-Rock-Energy1" } },
            { "jazz", new List<string> { "60s-chart-track5", "00s-rnb1", "00s-rnb2" } },
            { "indie", new List<string> { "00sAlt-Rock-Energy1", "80s-Synthesizer1", "60s-Pop2", "60s-chart-track5" } },
            { "alternative", new List<string> { "00sNu-Metal-Vibe2", "00sAlt-Rock-Energy1", "80s-Power-Chord2", "00sElectronic-Hybrid2" } },
            { "metal", new List<string> { "00sNu-Metal-Vibe2", "80s-Power-Chord2", "80s-Power-Chord1" } },
            { "punk", new List<string> { "80s-Power-Chord2", "00sAlt-Rock-Energy1", "00sNu-Metal-Vibe2" } },
            { "dance", new List<string> { "80s-Synthesizer1", "2000s-Electronic1", "00sElectronic-Hybrid2", "80schart-anthem1" } },
            { "funk", new List<string> { "00s-rnb2", "80s-Power-Chord1", "00s-rnb3" } },
            { "soul", new List<string> { "00s-rnb1", "00s-rnb3", "60s-Pop2" } },
            { "blues", new List<string> { "60s-chart-track5", "80s-Power-Chord1", "00s-rnb1" } },
            { "folk", new List<string> { "60s-chart-track5", "2000s-Country3", "60s-Pop2" } },
            { "reggae", new List<string> { "00s-rnb2", "80s-Power-Chord1", "60s-Pop2" } }
        };

        private Dictionary<string, string> _fallbackGenreMap = new Dictionary<string, string>()
        {
            { "classical", "jazz" }, { "ambient", "electronic" }, { "techno", "electronic" }, { "house", "electronic" },
            { "trap", "hip-hop" }, { "rap", "hip-hop" }, { "gospel", "r&b" }, { "ska", "punk" }, { "grunge", "alternative" },
            { "hardcore", "metal" }, { "new wave", "electronic" }, { "synthpop", "electronic" }, { "disco", "dance" }
        };


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
                _audioSource = GetComponent<AudioSource>();
                if (_audioSource == null)
                {
                    _audioSource = gameObject.AddComponent<AudioSource>();
                }
            }
        }

        private void Update()
        {
            if (_audioSource != null && _audioSource.isPlaying && !string.IsNullOrEmpty(_currentlyPlayingClipId))
            {
                // Update playback progress
                float elapsed = _audioSource.time - GetPlaybackSegment(_currentlyPlayingClipId).StartTime;
                float progress = Mathf.Min((elapsed / 25f) * 100f, 100f);
                _playbackProgress[_currentlyPlayingClipId] = progress;

                // Stop playback if segment ends or clip ends
                if (elapsed >= 25f || _audioSource.time >= GetPlaybackSegment(_currentlyPlayingClipId).EndTime - 0.1f || _audioSource.time >= _audioSource.clip.length - 0.1f)
                {
                    StopAudioClip();
                }
            }
        }

        /// <summary>
        /// Gets the audio clip name for a given chart entry based on its genre and other factors.
        /// </summary>
        /// <param name="entry">The ChartEntry to get the audio clip for.</param>
        /// <param name="gameState">Current GameState for context (e.g., current era).</param>
        /// <returns>The name of the audio clip file (without extension), or null if not found.</returns>
        public string GetAudioClipName(ChartEntry entry, GameState gameState)
        {
            string genre = entry.Song.Genre.ToLower();
            
            List<string> clips;
            if (!_audioClipMap.TryGetValue(genre, out clips) || clips.Count == 0)
            {
                string fallbackGenre;
                if (_fallbackGenreMap.TryGetValue(genre, out fallbackGenre))
                {
                    if (!_audioClipMap.TryGetValue(fallbackGenre, out clips) || clips.Count == 0)
                    {
                        clips = _audioClipMap["pop"]; // Default to pop if fallback also fails
                    }
                }
                else
                {
                    clips = _audioClipMap["pop"]; // Default to pop if no fallback
                }
            }

            if (clips != null && clips.Count > 0)
            {
                int artistSeed = entry.Song.Artist.Name.ToCharArray().Sum(c => (int)c);
                int titleSeed = entry.Song.Title.ToCharArray().Sum(c => (int)c);
                int complexSeed = entry.Position + entry.Song.Artist.Popularity + artistSeed + titleSeed + entry.WeeksOnChart * 3;
                int clipIndex = complexSeed % clips.Count;
                return clips[clipIndex];
            }
            return null;
        }

        /// <summary>
        /// Calculates the playback segment (start time, end time, etc.) for a chart entry.
        /// </summary>
        /// <param name="entry">The ChartEntry to calculate the segment for.</param>
        /// <returns>An AudioPlaybackSegment object.</returns>
        public AudioPlaybackSegment GetPlaybackSegment(ChartEntry entry)
        {
            int seed = entry.Song.Title.ToCharArray().Sum(c => (int)c) + entry.Song.Artist.Name.ToCharArray().Sum(c => (int)c) + entry.Position + entry.Song.Artist.Popularity + entry.WeeksOnChart;
            const float segmentDuration = 25f;
            const float overlapTime = 5f;
            int segmentNumber = (seed % 6) + 1;
            float startTime = (segmentNumber - 1) * overlapTime;
            float endTime = startTime + segmentDuration;
            
            string formatTime(float seconds)
            {
                int minutes = Mathf.FloorToInt(seconds / 60f);
                int remainingSeconds = Mathf.FloorToInt(seconds % 60f);
                return $"{minutes}:{remainingSeconds:00}";
            }

            return new AudioPlaybackSegment(startTime, endTime, segmentNumber, $"{formatTime(startTime)}-{formatTime(endTime)}");
        }

        /// <summary>
        /// Plays the audio clip for a given chart entry.
        /// </summary>
        /// <param name="entry">The ChartEntry to play audio for.</param>
        /// <param name="gameState">Current GameState.</param>
        public void PlayAudioClip(ChartEntry entry, GameState gameState)
        {
            string clipName = GetAudioClipName(entry, gameState);
            if (string.IsNullOrEmpty(clipName))
            {
                Debug.LogWarning($"ChartAudioManager: No audio clip found for genre {entry.Song.Genre}");
                return;
            }

            string trackId = $"{entry.Song.Id}-{entry.Position}";
            AudioPlaybackSegment segment = GetPlaybackSegment(entry);

            if (_audioSource.isPlaying)
            {
                StopAudioClip();
            }

            if (_currentlyPlayingClipId == trackId)
            {
                // If already playing this track, stop it (toggle behavior)
                _currentlyPlayingClipId = null;
                _playbackProgress[trackId] = 0f;
                return;
            }

            AudioClip clip = Resources.Load<AudioClip>($"Audio/ChartClips/{clipName}");
            if (clip == null)
            {
                Debug.LogError($"ChartAudioManager: Failed to load audio clip: Audio/ChartClips/{clipName}");
                return;
            }

            _audioSource.clip = clip;
            _audioSource.time = Mathf.Max(0f, Mathf.Min(segment.StartTime, clip.length - 0.1f)); // Ensure start time is within bounds
            _currentlyPlayingClipId = trackId;
            _playbackProgress[trackId] = 0f; // Reset progress for new playback
            _audioSource.Play();
            Debug.Log($"ChartAudioManager: Playing {clipName} from {segment.DisplayTime}");
        }

        /// <summary>
        /// Stops the currently playing audio clip.
        /// </summary>
        public void StopAudioClip()
        {
            if (_audioSource != null && _audioSource.isPlaying)
            {
                _audioSource.Stop();
                if (!string.IsNullOrEmpty(_currentlyPlayingClipId))
                {
                    _playbackProgress[_currentlyPlayingClipId] = 0f;
                }
                _currentlyPlayingClipId = null;
                Debug.Log("ChartAudioManager: Audio playback stopped.");
            }
        }

        /// <summary>
        /// Gets the current playback progress for a specific chart entry.
        /// </summary>
        /// <param name="entry">The ChartEntry to get progress for.</param>
        /// <returns>Playback progress (0-100), or 0 if not playing.</returns>
        public float GetPlaybackProgress(ChartEntry entry)
        {
            string trackId = $"{entry.Song.Id}-{entry.Position}";
            if (_playbackProgress.ContainsKey(trackId))
            {
                return _playbackProgress[trackId];
            }
            return 0f;
        }

        /// <summary>
        /// Returns the ID of the currently playing audio clip.
        /// </summary>
        public string GetCurrentlyPlayingClipId()
        {
            return _currentlyPlayingClipId;
        }
    }
}