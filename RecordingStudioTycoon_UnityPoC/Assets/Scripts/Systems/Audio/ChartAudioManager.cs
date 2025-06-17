using UnityEngine;
using System;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels; // For ChartEntry, Song, Artist, MusicGenre
using RecordingStudioTycoon.GameLogic; // For GameState

namespace RecordingStudioTycoon.Systems.Audio
{
    public class ChartAudioManager : MonoBehaviour
    {
        public static ChartAudioManager Instance { get; private set; }

        private AudioSource chartAudioSource;
        private string currentlyPlayingTrackId = null;
        private Dictionary<string, float> playbackProgress = new Dictionary<string, float>(); // Track progress for each clip

        // Dictionary to map genres to audio clip paths (relative to Resources folder)
        // In a real game, these would likely be ScriptableObjects or Addressables
        private Dictionary<MusicGenre, List<string>> audioClipPathsMap = new Dictionary<MusicGenre, List<string>>();

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

            if (chartAudioSource == null)
            {
                chartAudioSource = gameObject.AddComponent<AudioSource>();
            }

            InitializeAudioClipPaths();
        }

        private void InitializeAudioClipPaths()
        {
            // Populate the map with paths to your audio clips in Resources/Audio/ChartClips/
            // Example: Resources.Load("Audio/ChartClips/60s-chart-track5")
            audioClipPathsMap[MusicGenre.Rock] = new List<string> { "60s-chart-track5", "80s-Power-Chord1", "80s-Power-Chord2", "00sAlt-Rock-Energy1", "00sNu-Metal-Vibe2" };
            audioClipPathsMap[MusicGenre.Pop] = new List<string> { "60s-Pop2", "80schart-anthem1", "00sStreaming-Ready1", "80s-Power-Chord1", "00s-rnb2" };
            audioClipPathsMap[MusicGenre.Electronic] = new List<string> { "80s-Synthesizer1", "2000s-Electronic1", "00sElectronic-Hybrid2", "80schart-anthem1", "00sNu-Metal-Vibe2" };
            audioClipPathsMap[MusicGenre.HipHop] = new List<string> { "80s-Power-Chord2", "00sNu-Metal-Vibe2", "00sElectronic-Hybrid2", "00s-rnb3", "2000s-Electronic1" };
            audioClipPathsMap[MusicGenre.R_n_B] = new List<string> { "00s-rnb1", "00s-rnb2", "00s-rnb3", "60s-Pop2", "80schart-anthem1" };
            audioClipPathsMap[MusicGenre.Country] = new List<string> { "2000s-Country3", "60s-chart-track5", "80s-Power-Chord1", "00sAlt-Rock-Energy1" };
            audioClipPathsMap[MusicGenre.Jazz] = new List<string> { "60s-chart-track5", "00s-rnb1", "00s-rnb2" };
            audioClipPathsMap[MusicGenre.Alternative] = new List<string> { "00sNu-Metal-Vibe2", "00sAlt-Rock-Energy1", "80s-Power-Chord2", "00sElectronic-Hybrid2" };
            audioClipPathsMap[MusicGenre.Metal] = new List<string> { "00sNu-Metal-Vibe2", "80s-Power-Chord2", "80s-Power-Chord1" };
            audioClipPathsMap[MusicGenre.Punk] = new List<string> { "80s-Power-Chord2", "00sAlt-Rock-Energy1", "00sNu-Metal-Vibe2" };
            audioClipPathsMap[MusicGenre.Dance] = new List<string> { "80s-Synthesizer1", "2000s-Electronic1", "00sElectronic-Hybrid2", "80schart-anthem1" };
            audioClipPathsMap[MusicGenre.Funk] = new List<string> { "00s-rnb2", "80s-Power-Chord1", "00s-rnb3" };
            audioClipPathsMap[MusicGenre.Soul] = new List<string> { "00s-rnb1", "00s-rnb3", "60s-Pop2" };
            audioClipPathsMap[MusicGenre.Blues] = new List<string> { "60s-chart-track5", "80s-Power-Chord1", "00s-rnb1" };
            audioClipPathsMap[MusicGenre.Folk] = new List<string> { "60s-chart-track5", "2000s-Country3", "60s-Pop2" };
            audioClipPathsMap[MusicGenre.Reggae] = new List<string> { "00s-rnb2", "80s-Power-Chord1", "60s-Pop2" };
            // Add fallback mappings for genres not directly listed
            audioClipPathsMap[MusicGenre.Classical] = audioClipPathsMap[MusicGenre.Jazz];
            audioClipPathsMap[MusicGenre.Acoustic] = audioClipPathsMap[MusicGenre.Folk];
            audioClipPathsMap[MusicGenre.Indie] = audioClipPathsMap[MusicGenre.Alternative];
        }

        public AudioClip GetAudioClip(ChartEntry entry)
        {
            MusicGenre genre = entry.song.genre;
            List<string> clipPaths;

            if (!audioClipPathsMap.TryGetValue(genre, out clipPaths) || clipPaths.Count == 0)
            {
                Debug.LogWarning($"No specific audio clips found for genre: {genre}. Falling back to Pop.");
                clipPaths = audioClipPathsMap[MusicGenre.Pop]; // Fallback to Pop
            }

            if (clipPaths != null && clipPaths.Count > 0)
            {
                int artistSeed = 0;
                foreach (char c in entry.song.artist.name) artistSeed += c;
                int titleSeed = 0;
                foreach (char c in entry.song.title) titleSeed += c;

                int complexSeed = entry.position + entry.song.artist.popularity + artistSeed + titleSeed + entry.weeksOnChart * 3;
                int clipIndex = complexSeed % clipPaths.Count;
                
                string clipName = clipPaths[clipIndex];
                // Load the audio clip from Resources folder
                AudioClip clip = Resources.Load<AudioClip>($"Audio/ChartClips/{clipName}");
                if (clip == null)
                {
                    Debug.LogError($"Failed to load audio clip: Audio/ChartClips/{clipName}");
                }
                return clip;
            }
            return null;
        }

        public (float startTime, float endTime, int segmentNumber, string displayTime) GetPlaybackSegment(ChartEntry entry)
        {
            int seed = entry.song.title[0] + entry.song.artist.name[0] + entry.position + entry.song.artist.popularity + entry.weeksOnChart;
            float segmentDuration = 25f;
            float overlapTime = 5f;
            int segmentNumber = (seed % 6) + 1;
            float startTime = (segmentNumber - 1) * overlapTime;
            float endTime = startTime + segmentDuration;

            string formatTime(float seconds)
            {
                int minutes = Mathf.FloorToInt(seconds / 60);
                int secs = Mathf.FloorToInt(seconds % 60);
                return $"{minutes:0}:{secs:00}";
            }
            return (startTime, endTime, segmentNumber, $"{formatTime(startTime)}-{formatTime(endTime)}");
        }

        public void PlayAudioClip(ChartEntry entry)
        {
            AudioClip clip = GetAudioClip(entry);
            if (clip == null) return;

            string trackId = $"{entry.song.id}-{entry.position}";

            if (chartAudioSource.isPlaying && currentlyPlayingTrackId == trackId)
            {
                chartAudioSource.Stop();
                currentlyPlayingTrackId = null;
                playbackProgress[trackId] = 0f;
                return;
            }

            chartAudioSource.Stop();
            chartAudioSource.clip = clip;
            currentlyPlayingTrackId = trackId;

            var segment = GetPlaybackSegment(entry);
            float safeStartTime = Mathf.Min(segment.startTime, clip.length - 25f);
            chartAudioSource.time = Mathf.Max(0f, safeStartTime);
            chartAudioSource.Play();

            // Reset progress for other tracks
            var keys = new List<string>(playbackProgress.Keys);
            foreach (var key in keys)
            {
                if (key != trackId)
                {
                    playbackProgress[key] = 0f;
                }
            }
            playbackProgress[trackId] = 0f; // Initialize current track progress

            // Update progress over time (can be done in Update or a Coroutine)
            // For simplicity, we'll just set it to 100% after a delay or when stopped
            // A more robust solution would use a Coroutine to update progress every frame
            // or a fixed interval.
            StartCoroutine(UpdatePlaybackProgress(trackId, segment.endTime));
        }

        private System.Collections.IEnumerator UpdatePlaybackProgress(string trackId, float endTime)
        {
            float playbackStartTime = chartAudioSource.time;
            while (chartAudioSource.isPlaying && currentlyPlayingTrackId == trackId)
            {
                float elapsed = chartAudioSource.time - playbackStartTime;
                float progress = Mathf.Min((elapsed / 25f) * 100f, 100f);
                playbackProgress[trackId] = progress;

                if (elapsed >= 25f || chartAudioSource.time >= endTime - 0.1f || chartAudioSource.time >= chartAudioSource.clip.length - 0.1f)
                {
                    chartAudioSource.Stop();
                    currentlyPlayingTrackId = null;
                    playbackProgress[trackId] = 0f;
                    break;
                }
                yield return null; // Wait for next frame
            }
        }

        public float GetPlaybackProgress(string trackId)
        {
            playbackProgress.TryGetValue(trackId, out float progress);
            return progress;
        }

        public string GetCurrentlyPlayingTrackId()
        {
            return currentlyPlayingTrackId;
        }
    }
}