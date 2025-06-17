using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;

namespace RecordingStudioTycoon.Systems.Minigame
{
    public class AudioEditingGame : BaseMinigame
    {
        [System.Serializable]
        public class AudioRegion
        {
            public float startTime;
            public float endTime;
            public float volume;
            public float fadeIn;
            public float fadeOut;
            public bool isMuted;
            public bool isReversed;
        }

        [System.Serializable]
        public class AudioTrack
        {
            public List<AudioRegion> regions;
            public float pan;
            public float volume;
            public bool isMuted;
            public bool isSolo;
        }

        [SerializeField] private int trackCount = 4;
        [SerializeField] private float timelineLength = 60f;
        [SerializeField] private float timingTolerance = 0.1f;
        [SerializeField] private float volumeTolerance = 0.1f;
        [SerializeField] private float fadeTolerance = 0.1f;
        [SerializeField] private float panTolerance = 0.1f;

        private List<AudioTrack> currentTracks;
        private List<AudioTrack> targetTracks;
        private int currentTrack;
        private float currentTime;
        private string selectedTool;

        private readonly string[] availableTools = { "cut", "split", "fade", "reverse", "mute" };

        private void Awake()
        {
            currentType = "audioEditing";
            currentTracks = new List<AudioTrack>();
            targetTracks = new List<AudioTrack>();
        }

        public override void Initialize(int difficulty)
        {
            base.Initialize(difficulty);
            GenerateTargetTracks();
            ResetTracks();
        }

        private void GenerateTargetTracks()
        {
            targetTracks.Clear();
            for (int i = 0; i < trackCount; i++)
            {
                var track = new AudioTrack
                {
                    regions = GenerateAudioRegions(3),
                    pan = Random.Range(-1f, 1f),
                    volume = Random.Range(0.5f, 1f),
                    isMuted = Random.value > 0.8f,
                    isSolo = Random.value > 0.9f
                };
                targetTracks.Add(track);
            }
        }

        private List<AudioRegion> GenerateAudioRegions(int count)
        {
            var regions = new List<AudioRegion>();
            for (int i = 0; i < count; i++)
            {
                float startTime = Random.Range(0f, timelineLength - 10f);
                regions.Add(new AudioRegion
                {
                    startTime = startTime,
                    endTime = startTime + Random.Range(5f, 15f),
                    volume = Random.Range(0.5f, 1f),
                    fadeIn = Random.Range(0f, 1f),
                    fadeOut = Random.Range(0f, 1f),
                    isMuted = Random.value > 0.8f,
                    isReversed = Random.value > 0.9f
                });
            }
            return regions;
        }

        private void ResetTracks()
        {
            currentTracks.Clear();
            for (int i = 0; i < trackCount; i++)
            {
                var track = new AudioTrack
                {
                    regions = new List<AudioRegion>(),
                    pan = 0f,
                    volume = 1f,
                    isMuted = false,
                    isSolo = false
                };
                currentTracks.Add(track);
            }
            currentTrack = 0;
            currentTime = 0f;
            selectedTool = "cut";
        }

        public override void ProcessInput()
        {
            // Track selection
            if (Input.GetKeyDown(KeyCode.Tab))
            {
                currentTrack = (currentTrack + 1) % trackCount;
            }

            // Tool selection
            if (Input.GetKeyDown(KeyCode.Alpha1)) selectedTool = "cut";
            if (Input.GetKeyDown(KeyCode.Alpha2)) selectedTool = "split";
            if (Input.GetKeyDown(KeyCode.Alpha3)) selectedTool = "fade";
            if (Input.GetKeyDown(KeyCode.Alpha4)) selectedTool = "reverse";
            if (Input.GetKeyDown(KeyCode.Alpha5)) selectedTool = "mute";

            // Timeline navigation
            if (Input.GetKey(KeyCode.LeftArrow))
            {
                currentTime = Mathf.Max(0f, currentTime - Time.deltaTime * 10f);
            }
            if (Input.GetKey(KeyCode.RightArrow))
            {
                currentTime = Mathf.Min(timelineLength, currentTime + Time.deltaTime * 10f);
            }

            // Track controls
            if (currentTrack >= 0 && currentTrack < trackCount)
            {
                var track = currentTracks[currentTrack];

                // Pan control
                if (Input.GetKey(KeyCode.Q))
                {
                    track.pan = Mathf.Clamp(track.pan - Time.deltaTime, -1f, 1f);
                }
                if (Input.GetKey(KeyCode.W))
                {
                    track.pan = Mathf.Clamp(track.pan + Time.deltaTime, -1f, 1f);
                }

                // Volume control
                if (Input.GetKey(KeyCode.A))
                {
                    track.volume = Mathf.Clamp01(track.volume - Time.deltaTime);
                }
                if (Input.GetKey(KeyCode.S))
                {
                    track.volume = Mathf.Clamp01(track.volume + Time.deltaTime);
                }

                // Mute/solo
                if (Input.GetKeyDown(KeyCode.M))
                {
                    track.isMuted = !track.isMuted;
                }
                if (Input.GetKeyDown(KeyCode.Space))
                {
                    track.isSolo = !track.isSolo;
                }

                // Region manipulation
                if (Input.GetKeyDown(KeyCode.Return))
                {
                    ApplySelectedTool();
                }
            }

            UpdateProgress();
        }

        private void ApplySelectedTool()
        {
            if (currentTrack < 0 || currentTrack >= currentTracks.Count) return;

            var track = currentTracks[currentTrack];
            var region = new AudioRegion
            {
                startTime = currentTime,
                endTime = currentTime + 5f,
                volume = 1f,
                fadeIn = 0f,
                fadeOut = 0f,
                isMuted = false,
                isReversed = false
            };

            switch (selectedTool)
            {
                case "cut":
                    // Remove overlapping regions
                    track.regions.RemoveAll(r => r.startTime < region.endTime && r.endTime > region.startTime);
                    break;
                case "split":
                    // Split overlapping regions
                    var regionsToSplit = track.regions.FindAll(r => r.startTime < region.endTime && r.endTime > region.startTime);
                    foreach (var r in regionsToSplit)
                    {
                        if (r.startTime < region.startTime)
                        {
                            var newRegion = new AudioRegion
                            {
                                startTime = r.startTime,
                                endTime = region.startTime,
                                volume = r.volume,
                                fadeIn = r.fadeIn,
                                fadeOut = 0f,
                                isMuted = r.isMuted,
                                isReversed = r.isReversed
                            };
                            track.regions.Add(newRegion);
                        }
                        if (r.endTime > region.endTime)
                        {
                            var newRegion = new AudioRegion
                            {
                                startTime = region.endTime,
                                endTime = r.endTime,
                                volume = r.volume,
                                fadeIn = 0f,
                                fadeOut = r.fadeOut,
                                isMuted = r.isMuted,
                                isReversed = r.isReversed
                            };
                            track.regions.Add(newRegion);
                        }
                        track.regions.Remove(r);
                    }
                    break;
                case "fade":
                    region.fadeIn = 0.5f;
                    region.fadeOut = 0.5f;
                    track.regions.Add(region);
                    break;
                case "reverse":
                    region.isReversed = true;
                    track.regions.Add(region);
                    break;
                case "mute":
                    region.isMuted = true;
                    track.regions.Add(region);
                    break;
            }
        }

        private void UpdateProgress()
        {
            float trackProgress = 0f;
            for (int i = 0; i < trackCount; i++)
            {
                var currentTrack = currentTracks[i];
                var targetTrack = targetTracks[i];

                float progress = 0f;
                progress += Mathf.Abs(currentTrack.pan - targetTrack.pan) < panTolerance ? 1f : 0f;
                progress += Mathf.Abs(currentTrack.volume - targetTrack.volume) < volumeTolerance ? 1f : 0f;
                progress += currentTrack.isMuted == targetTrack.isMuted ? 1f : 0f;
                progress += currentTrack.isSolo == targetTrack.isSolo ? 1f : 0f;

                float regionProgress = 0f;
                if (currentTrack.regions.Count > 0 && targetTrack.regions.Count > 0)
                {
                    for (int j = 0; j < Mathf.Min(currentTrack.regions.Count, targetTrack.regions.Count); j++)
                    {
                        var currentRegion = currentTrack.regions[j];
                        var targetRegion = targetTrack.regions[j];

                        regionProgress += Mathf.Abs(currentRegion.startTime - targetRegion.startTime) < timingTolerance ? 1f : 0f;
                        regionProgress += Mathf.Abs(currentRegion.endTime - targetRegion.endTime) < timingTolerance ? 1f : 0f;
                        regionProgress += Mathf.Abs(currentRegion.volume - targetRegion.volume) < volumeTolerance ? 1f : 0f;
                        regionProgress += Mathf.Abs(currentRegion.fadeIn - targetRegion.fadeIn) < fadeTolerance ? 1f : 0f;
                        regionProgress += Mathf.Abs(currentRegion.fadeOut - targetRegion.fadeOut) < fadeTolerance ? 1f : 0f;
                        regionProgress += currentRegion.isMuted == targetRegion.isMuted ? 1f : 0f;
                        regionProgress += currentRegion.isReversed == targetRegion.isReversed ? 1f : 0f;
                    }
                    regionProgress /= Mathf.Min(currentTrack.regions.Count, targetTrack.regions.Count) * 7f;
                }

                trackProgress += (progress / 4f + regionProgress) / 2f;
            }

            progress = trackProgress / trackCount;
        }

        public override void CalculateScore()
        {
            score = Mathf.RoundToInt(progress * 1000 * scoreMultiplier);
            if (timeRemaining > 0)
            {
                score += Mathf.RoundToInt(timeRemaining * timeBonus);
            }
        }

        public override void SaveProgress()
        {
            // Save progress to game state or other persistence system
            Debug.Log($"Audio Editing Game completed with score: {score}");
        }
    }
} 