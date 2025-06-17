using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;

namespace RecordingStudioTycoon.Systems.Minigame
{
    public class HybridMixingGame : BaseMinigame
    {
        [System.Serializable]
        public class ChannelState
        {
            public float volume;
            public float pan;
            public bool isMuted;
            public bool isSolo;
            public float analogSaturation;
            public float digitalCompression;
            public float eqLow;
            public float eqMid;
            public float eqHigh;
        }

        [System.Serializable]
        public class MasterBus
        {
            public float analogSaturation;
            public float digitalLimiter;
            public float stereoWidth;
            public float finalCompression;
        }

        [SerializeField] private int channelCount = 8;
        [SerializeField] private float targetVolume = 0.8f;
        [SerializeField] private float volumeTolerance = 0.1f;
        [SerializeField] private float panTolerance = 0.1f;
        [SerializeField] private float saturationTolerance = 0.1f;
        [SerializeField] private float compressionTolerance = 0.1f;
        [SerializeField] private float eqTolerance = 0.1f;

        private Dictionary<int, ChannelState> channels;
        private Dictionary<int, ChannelState> targetSettings;
        private MasterBus masterBus;
        private MasterBus targetMasterBus;
        private int currentChannel;
        private string selectedPreset;

        private void Awake()
        {
            currentType = "hybridMixing";
            channels = new Dictionary<int, ChannelState>();
            targetSettings = new Dictionary<int, ChannelState>();
            masterBus = new MasterBus();
            targetMasterBus = new MasterBus();
        }

        public override void Initialize(int difficulty)
        {
            base.Initialize(difficulty);
            GenerateTargetSettings();
            ResetChannels();
            InitializeMasterBus();
        }

        private void GenerateTargetSettings()
        {
            targetSettings.Clear();
            for (int i = 0; i < channelCount; i++)
            {
                targetSettings[i] = new ChannelState
                {
                    volume = Random.Range(0.5f, 1.0f),
                    pan = Random.Range(-1.0f, 1.0f),
                    isMuted = Random.value > 0.8f,
                    isSolo = Random.value > 0.9f,
                    analogSaturation = Random.Range(0f, 1f),
                    digitalCompression = Random.Range(0f, 1f),
                    eqLow = Random.Range(-12f, 12f),
                    eqMid = Random.Range(-12f, 12f),
                    eqHigh = Random.Range(-12f, 12f)
                };
            }

            targetMasterBus = new MasterBus
            {
                analogSaturation = Random.Range(0f, 1f),
                digitalLimiter = Random.Range(0f, 1f),
                stereoWidth = Random.Range(0f, 1f),
                finalCompression = Random.Range(0f, 1f)
            };
        }

        private void ResetChannels()
        {
            channels.Clear();
            for (int i = 0; i < channelCount; i++)
            {
                channels[i] = new ChannelState
                {
                    volume = 0f,
                    pan = 0f,
                    isMuted = false,
                    isSolo = false,
                    analogSaturation = 0f,
                    digitalCompression = 0f,
                    eqLow = 0f,
                    eqMid = 0f,
                    eqHigh = 0f
                };
            }
            currentChannel = 0;
        }

        private void InitializeMasterBus()
        {
            masterBus = new MasterBus
            {
                analogSaturation = 0f,
                digitalLimiter = 0f,
                stereoWidth = 0f,
                finalCompression = 0f
            };
        }

        public override void ProcessInput()
        {
            // Handle channel selection
            if (Input.GetKeyDown(KeyCode.Tab))
            {
                currentChannel = (currentChannel + 1) % channelCount;
            }

            // Handle channel controls
            if (currentChannel >= 0 && currentChannel < channelCount)
            {
                var channel = channels[currentChannel];

                // Volume control
                float volumeInput = Input.GetAxis("Vertical");
                if (Mathf.Abs(volumeInput) > 0.1f)
                {
                    channel.volume = Mathf.Clamp01(channel.volume + volumeInput * Time.deltaTime);
                }

                // Pan control
                float panInput = Input.GetAxis("Horizontal");
                if (Mathf.Abs(panInput) > 0.1f)
                {
                    channel.pan = Mathf.Clamp(channel.pan + panInput * Time.deltaTime, -1f, 1f);
                }

                // EQ controls
                if (Input.GetKey(KeyCode.Q)) channel.eqLow += Time.deltaTime * 10f;
                if (Input.GetKey(KeyCode.W)) channel.eqLow -= Time.deltaTime * 10f;
                if (Input.GetKey(KeyCode.A)) channel.eqMid += Time.deltaTime * 10f;
                if (Input.GetKey(KeyCode.S)) channel.eqMid -= Time.deltaTime * 10f;
                if (Input.GetKey(KeyCode.Z)) channel.eqHigh += Time.deltaTime * 10f;
                if (Input.GetKey(KeyCode.X)) channel.eqHigh -= Time.deltaTime * 10f;

                // Saturation and compression
                if (Input.GetKey(KeyCode.C))
                {
                    channel.analogSaturation = Mathf.Clamp01(channel.analogSaturation + Time.deltaTime);
                }
                if (Input.GetKey(KeyCode.V))
                {
                    channel.digitalCompression = Mathf.Clamp01(channel.digitalCompression + Time.deltaTime);
                }

                // Mute/solo
                if (Input.GetKeyDown(KeyCode.M))
                {
                    channel.isMuted = !channel.isMuted;
                }
                if (Input.GetKeyDown(KeyCode.Space))
                {
                    channel.isSolo = !channel.isSolo;
                }
            }

            // Master bus controls
            if (Input.GetKey(KeyCode.LeftControl))
            {
                if (Input.GetKey(KeyCode.Q)) masterBus.analogSaturation = Mathf.Clamp01(masterBus.analogSaturation + Time.deltaTime);
                if (Input.GetKey(KeyCode.W)) masterBus.digitalLimiter = Mathf.Clamp01(masterBus.digitalLimiter + Time.deltaTime);
                if (Input.GetKey(KeyCode.A)) masterBus.stereoWidth = Mathf.Clamp01(masterBus.stereoWidth + Time.deltaTime);
                if (Input.GetKey(KeyCode.S)) masterBus.finalCompression = Mathf.Clamp01(masterBus.finalCompression + Time.deltaTime);
            }

            UpdateProgress();
        }

        private void UpdateProgress()
        {
            float channelProgress = 0f;
            foreach (var channel in channels)
            {
                var target = targetSettings[channel.Key];
                var current = channel.Value;

                float progress = 0f;
                progress += Mathf.Abs(current.volume - target.volume) < volumeTolerance ? 1f : 0f;
                progress += Mathf.Abs(current.pan - target.pan) < panTolerance ? 1f : 0f;
                progress += current.isMuted == target.isMuted ? 1f : 0f;
                progress += current.isSolo == target.isSolo ? 1f : 0f;
                progress += Mathf.Abs(current.analogSaturation - target.analogSaturation) < saturationTolerance ? 1f : 0f;
                progress += Mathf.Abs(current.digitalCompression - target.digitalCompression) < compressionTolerance ? 1f : 0f;
                progress += Mathf.Abs(current.eqLow - target.eqLow) < eqTolerance ? 1f : 0f;
                progress += Mathf.Abs(current.eqMid - target.eqMid) < eqTolerance ? 1f : 0f;
                progress += Mathf.Abs(current.eqHigh - target.eqHigh) < eqTolerance ? 1f : 0f;

                channelProgress += progress / 9f; // 9 parameters per channel
            }

            float masterProgress = 0f;
            masterProgress += Mathf.Abs(masterBus.analogSaturation - targetMasterBus.analogSaturation) < saturationTolerance ? 1f : 0f;
            masterProgress += Mathf.Abs(masterBus.digitalLimiter - targetMasterBus.digitalLimiter) < compressionTolerance ? 1f : 0f;
            masterProgress += Mathf.Abs(masterBus.stereoWidth - targetMasterBus.stereoWidth) < saturationTolerance ? 1f : 0f;
            masterProgress += Mathf.Abs(masterBus.finalCompression - targetMasterBus.finalCompression) < compressionTolerance ? 1f : 0f;

            progress = (channelProgress + masterProgress / 4f) / 2f;
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
            Debug.Log($"Hybrid Mixing Game completed with score: {score}");
        }
    }
} 