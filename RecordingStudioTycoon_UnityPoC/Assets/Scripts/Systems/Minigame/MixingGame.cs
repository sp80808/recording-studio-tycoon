using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;

namespace RecordingStudioTycoon.Systems.Minigame
{
    public class MixingGame : BaseMinigame
    {
        [System.Serializable]
        public class Track
        {
            public string name;
            public float volume;
            public float pan;
            public float[] eqBands;
            public float[] compressorSettings;
            public bool isMuted;
            public bool isSolo;
            public int group;
        }

        [System.Serializable]
        public class Mix
        {
            public List<Track> tracks;
            public float masterVolume;
            public float masterPan;
            public float[] masterEqBands;
            public float[] masterCompressorSettings;
            public bool isMuted;
        }

        [SerializeField] private int trackCount = 8;
        [SerializeField] private int eqBandCount = 3;
        [SerializeField] private float volumeTolerance = 0.1f;
        [SerializeField] private float panTolerance = 0.1f;
        [SerializeField] private float eqTolerance = 0.1f;
        [SerializeField] private float compressorTolerance = 0.1f;

        private Mix currentMix;
        private Mix targetMix;
        private int currentTrack;
        private string selectedTool;

        private readonly string[] availableTools = { "volume", "pan", "eq", "compressor", "group" };
        private readonly string[] trackNames = {
            "Kick",
            "Snare",
            "Hi-Hat",
            "Bass",
            "Guitar",
            "Vocals",
            "Synth",
            "FX"
        };

        private void Awake()
        {
            currentType = "mixing";
            currentMix = new Mix();
            targetMix = new Mix();
        }

        public override void Initialize(int difficulty)
        {
            base.Initialize(difficulty);
            GenerateTargetMix();
            ResetMix();
        }

        private void GenerateTargetMix()
        {
            targetMix = new Mix
            {
                tracks = GenerateTracks(),
                masterVolume = Random.Range(0.5f, 1.5f),
                masterPan = Random.Range(-0.5f, 0.5f),
                masterEqBands = GenerateEqBands(),
                masterCompressorSettings = GenerateCompressorSettings(),
                isMuted = false
            };
        }

        private List<Track> GenerateTracks()
        {
            var tracks = new List<Track>();
            for (int i = 0; i < trackCount; i++)
            {
                tracks.Add(new Track
                {
                    name = trackNames[i],
                    volume = Random.Range(0.5f, 1.5f),
                    pan = Random.Range(-1f, 1f),
                    eqBands = GenerateEqBands(),
                    compressorSettings = GenerateCompressorSettings(),
                    isMuted = Random.value > 0.8f,
                    isSolo = Random.value > 0.9f,
                    group = Random.Range(0, 3)
                });
            }
            return tracks;
        }

        private float[] GenerateEqBands()
        {
            var bands = new float[eqBandCount];
            for (int i = 0; i < eqBandCount; i++)
            {
                bands[i] = Random.Range(-12f, 12f);
            }
            return bands;
        }

        private float[] GenerateCompressorSettings()
        {
            return new float[] {
                Random.Range(0f, 1f), // threshold
                Random.Range(0f, 1f), // ratio
                Random.Range(0f, 1f), // attack
                Random.Range(0f, 1f)  // release
            };
        }

        private void ResetMix()
        {
            currentMix = new Mix
            {
                tracks = new List<Track>(),
                masterVolume = 1f,
                masterPan = 0f,
                masterEqBands = new float[eqBandCount],
                masterCompressorSettings = new float[4],
                isMuted = false
            };

            for (int i = 0; i < trackCount; i++)
            {
                currentMix.tracks.Add(new Track
                {
                    name = trackNames[i],
                    volume = 1f,
                    pan = 0f,
                    eqBands = new float[eqBandCount],
                    compressorSettings = new float[4],
                    isMuted = false,
                    isSolo = false,
                    group = 0
                });
            }

            currentTrack = 0;
            selectedTool = "volume";
        }

        public override void ProcessInput()
        {
            // Track selection
            if (Input.GetKeyDown(KeyCode.Tab))
            {
                currentTrack = (currentTrack + 1) % (trackCount + 1);
            }

            // Tool selection
            if (Input.GetKeyDown(KeyCode.Alpha1)) selectedTool = "volume";
            if (Input.GetKeyDown(KeyCode.Alpha2)) selectedTool = "pan";
            if (Input.GetKeyDown(KeyCode.Alpha3)) selectedTool = "eq";
            if (Input.GetKeyDown(KeyCode.Alpha4)) selectedTool = "compressor";
            if (Input.GetKeyDown(KeyCode.Alpha5)) selectedTool = "group";

            if (currentTrack < trackCount)
            {
                var track = currentMix.tracks[currentTrack];

                switch (selectedTool)
                {
                    case "volume":
                        if (Input.GetKey(KeyCode.Q)) track.volume = Mathf.Clamp(track.volume - Time.deltaTime, 0f, 2f);
                        if (Input.GetKey(KeyCode.W)) track.volume = Mathf.Clamp(track.volume + Time.deltaTime, 0f, 2f);
                        break;
                    case "pan":
                        if (Input.GetKey(KeyCode.Q)) track.pan = Mathf.Clamp(track.pan - Time.deltaTime, -1f, 1f);
                        if (Input.GetKey(KeyCode.W)) track.pan = Mathf.Clamp(track.pan + Time.deltaTime, -1f, 1f);
                        break;
                    case "eq":
                        if (Input.GetKey(KeyCode.Q)) track.eqBands[0] = Mathf.Clamp(track.eqBands[0] - Time.deltaTime * 10f, -12f, 12f);
                        if (Input.GetKey(KeyCode.W)) track.eqBands[0] = Mathf.Clamp(track.eqBands[0] + Time.deltaTime * 10f, -12f, 12f);
                        if (Input.GetKey(KeyCode.A)) track.eqBands[1] = Mathf.Clamp(track.eqBands[1] - Time.deltaTime * 10f, -12f, 12f);
                        if (Input.GetKey(KeyCode.S)) track.eqBands[1] = Mathf.Clamp(track.eqBands[1] + Time.deltaTime * 10f, -12f, 12f);
                        if (Input.GetKey(KeyCode.D)) track.eqBands[2] = Mathf.Clamp(track.eqBands[2] - Time.deltaTime * 10f, -12f, 12f);
                        if (Input.GetKey(KeyCode.F)) track.eqBands[2] = Mathf.Clamp(track.eqBands[2] + Time.deltaTime * 10f, -12f, 12f);
                        break;
                    case "compressor":
                        if (Input.GetKey(KeyCode.Q)) track.compressorSettings[0] = Mathf.Clamp01(track.compressorSettings[0] - Time.deltaTime);
                        if (Input.GetKey(KeyCode.W)) track.compressorSettings[0] = Mathf.Clamp01(track.compressorSettings[0] + Time.deltaTime);
                        if (Input.GetKey(KeyCode.A)) track.compressorSettings[1] = Mathf.Clamp01(track.compressorSettings[1] - Time.deltaTime);
                        if (Input.GetKey(KeyCode.S)) track.compressorSettings[1] = Mathf.Clamp01(track.compressorSettings[1] + Time.deltaTime);
                        if (Input.GetKey(KeyCode.D)) track.compressorSettings[2] = Mathf.Clamp01(track.compressorSettings[2] - Time.deltaTime);
                        if (Input.GetKey(KeyCode.F)) track.compressorSettings[2] = Mathf.Clamp01(track.compressorSettings[2] + Time.deltaTime);
                        if (Input.GetKey(KeyCode.G)) track.compressorSettings[3] = Mathf.Clamp01(track.compressorSettings[3] - Time.deltaTime);
                        if (Input.GetKey(KeyCode.H)) track.compressorSettings[3] = Mathf.Clamp01(track.compressorSettings[3] + Time.deltaTime);
                        break;
                    case "group":
                        if (Input.GetKeyDown(KeyCode.Q)) track.group = (track.group + 1) % 3;
                        break;
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
            }
            else
            {
                // Master controls
                switch (selectedTool)
                {
                    case "volume":
                        if (Input.GetKey(KeyCode.Q)) currentMix.masterVolume = Mathf.Clamp(currentMix.masterVolume - Time.deltaTime, 0f, 2f);
                        if (Input.GetKey(KeyCode.W)) currentMix.masterVolume = Mathf.Clamp(currentMix.masterVolume + Time.deltaTime, 0f, 2f);
                        break;
                    case "pan":
                        if (Input.GetKey(KeyCode.Q)) currentMix.masterPan = Mathf.Clamp(currentMix.masterPan - Time.deltaTime, -1f, 1f);
                        if (Input.GetKey(KeyCode.W)) currentMix.masterPan = Mathf.Clamp(currentMix.masterPan + Time.deltaTime, -1f, 1f);
                        break;
                    case "eq":
                        if (Input.GetKey(KeyCode.Q)) currentMix.masterEqBands[0] = Mathf.Clamp(currentMix.masterEqBands[0] - Time.deltaTime * 10f, -12f, 12f);
                        if (Input.GetKey(KeyCode.W)) currentMix.masterEqBands[0] = Mathf.Clamp(currentMix.masterEqBands[0] + Time.deltaTime * 10f, -12f, 12f);
                        if (Input.GetKey(KeyCode.A)) currentMix.masterEqBands[1] = Mathf.Clamp(currentMix.masterEqBands[1] - Time.deltaTime * 10f, -12f, 12f);
                        if (Input.GetKey(KeyCode.S)) currentMix.masterEqBands[1] = Mathf.Clamp(currentMix.masterEqBands[1] + Time.deltaTime * 10f, -12f, 12f);
                        if (Input.GetKey(KeyCode.D)) currentMix.masterEqBands[2] = Mathf.Clamp(currentMix.masterEqBands[2] - Time.deltaTime * 10f, -12f, 12f);
                        if (Input.GetKey(KeyCode.F)) currentMix.masterEqBands[2] = Mathf.Clamp(currentMix.masterEqBands[2] + Time.deltaTime * 10f, -12f, 12f);
                        break;
                    case "compressor":
                        if (Input.GetKey(KeyCode.Q)) currentMix.masterCompressorSettings[0] = Mathf.Clamp01(currentMix.masterCompressorSettings[0] - Time.deltaTime);
                        if (Input.GetKey(KeyCode.W)) currentMix.masterCompressorSettings[0] = Mathf.Clamp01(currentMix.masterCompressorSettings[0] + Time.deltaTime);
                        if (Input.GetKey(KeyCode.A)) currentMix.masterCompressorSettings[1] = Mathf.Clamp01(currentMix.masterCompressorSettings[1] - Time.deltaTime);
                        if (Input.GetKey(KeyCode.S)) currentMix.masterCompressorSettings[1] = Mathf.Clamp01(currentMix.masterCompressorSettings[1] + Time.deltaTime);
                        if (Input.GetKey(KeyCode.D)) currentMix.masterCompressorSettings[2] = Mathf.Clamp01(currentMix.masterCompressorSettings[2] - Time.deltaTime);
                        if (Input.GetKey(KeyCode.F)) currentMix.masterCompressorSettings[2] = Mathf.Clamp01(currentMix.masterCompressorSettings[2] + Time.deltaTime);
                        if (Input.GetKey(KeyCode.G)) currentMix.masterCompressorSettings[3] = Mathf.Clamp01(currentMix.masterCompressorSettings[3] - Time.deltaTime);
                        if (Input.GetKey(KeyCode.H)) currentMix.masterCompressorSettings[3] = Mathf.Clamp01(currentMix.masterCompressorSettings[3] + Time.deltaTime);
                        break;
                }

                // Master mute
                if (Input.GetKeyDown(KeyCode.M))
                {
                    currentMix.isMuted = !currentMix.isMuted;
                }
            }

            UpdateProgress();
        }

        private void UpdateProgress()
        {
            float masterProgress = 0f;
            masterProgress += Mathf.Abs(currentMix.masterVolume - targetMix.masterVolume) < volumeTolerance ? 1f : 0f;
            masterProgress += Mathf.Abs(currentMix.masterPan - targetMix.masterPan) < panTolerance ? 1f : 0f;
            masterProgress += currentMix.isMuted == targetMix.isMuted ? 1f : 0f;

            for (int i = 0; i < eqBandCount; i++)
            {
                masterProgress += Mathf.Abs(currentMix.masterEqBands[i] - targetMix.masterEqBands[i]) < eqTolerance ? 1f : 0f;
            }

            for (int i = 0; i < 4; i++)
            {
                masterProgress += Mathf.Abs(currentMix.masterCompressorSettings[i] - targetMix.masterCompressorSettings[i]) < compressorTolerance ? 1f : 0f;
            }

            float trackProgress = 0f;
            for (int i = 0; i < trackCount; i++)
            {
                var currentTrack = currentMix.tracks[i];
                var targetTrack = targetMix.tracks[i];

                trackProgress += Mathf.Abs(currentTrack.volume - targetTrack.volume) < volumeTolerance ? 1f : 0f;
                trackProgress += Mathf.Abs(currentTrack.pan - targetTrack.pan) < panTolerance ? 1f : 0f;
                trackProgress += currentTrack.isMuted == targetTrack.isMuted ? 1f : 0f;
                trackProgress += currentTrack.isSolo == targetTrack.isSolo ? 1f : 0f;
                trackProgress += currentTrack.group == targetTrack.group ? 1f : 0f;

                for (int j = 0; j < eqBandCount; j++)
                {
                    trackProgress += Mathf.Abs(currentTrack.eqBands[j] - targetTrack.eqBands[j]) < eqTolerance ? 1f : 0f;
                }

                for (int j = 0; j < 4; j++)
                {
                    trackProgress += Mathf.Abs(currentTrack.compressorSettings[j] - targetTrack.compressorSettings[j]) < compressorTolerance ? 1f : 0f;
                }
            }

            progress = (masterProgress / (3f + eqBandCount + 4f) + trackProgress / (trackCount * (5f + eqBandCount + 4f))) / 2f;
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
            Debug.Log($"Mixing Game completed with score: {score}");
        }
    }
} 