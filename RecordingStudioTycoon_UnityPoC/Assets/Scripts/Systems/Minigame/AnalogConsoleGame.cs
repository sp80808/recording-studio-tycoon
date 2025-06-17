using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;

namespace RecordingStudioTycoon.Systems.Minigame
{
    public class AnalogConsoleGame : BaseMinigame
    {
        [System.Serializable]
        public class ChannelState
        {
            public float volume;
            public float pan;
            public bool isMuted;
            public bool isSolo;
            public float eqLow;
            public float eqMid;
            public float eqHigh;
            public float compression;
        }

        [SerializeField] private int channelCount = 8;
        [SerializeField] private float targetVolume = 0.8f;
        [SerializeField] private float volumeTolerance = 0.1f;
        [SerializeField] private float panTolerance = 0.1f;
        [SerializeField] private float eqTolerance = 0.1f;
        [SerializeField] private float compressionTolerance = 0.1f;

        private Dictionary<int, ChannelState> channels;
        private Dictionary<int, ChannelState> targetSettings;
        private int currentChannel;

        private void Awake()
        {
            currentType = "analogConsole";
            channels = new Dictionary<int, ChannelState>();
            targetSettings = new Dictionary<int, ChannelState>();
        }

        public override void Initialize(int difficulty)
        {
            base.Initialize(difficulty);
            GenerateTargetSettings();
            ResetChannels();
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
                    eqLow = Random.Range(-12f, 12f),
                    eqMid = Random.Range(-12f, 12f),
                    eqHigh = Random.Range(-12f, 12f),
                    compression = Random.Range(0f, 1f)
                };
            }
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
                    eqLow = 0f,
                    eqMid = 0f,
                    eqHigh = 0f,
                    compression = 0f
                };
            }
            currentChannel = 0;
        }

        public override void ProcessInput()
        {
            // Handle channel selection
            if (Input.GetKeyDown(KeyCode.Tab))
            {
                currentChannel = (currentChannel + 1) % channelCount;
            }

            // Handle volume control
            float volumeInput = Input.GetAxis("Vertical");
            if (Mathf.Abs(volumeInput) > 0.1f)
            {
                channels[currentChannel].volume = Mathf.Clamp01(channels[currentChannel].volume + volumeInput * Time.deltaTime);
            }

            // Handle pan control
            float panInput = Input.GetAxis("Horizontal");
            if (Mathf.Abs(panInput) > 0.1f)
            {
                channels[currentChannel].pan = Mathf.Clamp(channels[currentChannel].pan + panInput * Time.deltaTime, -1f, 1f);
            }

            // Handle EQ controls
            if (Input.GetKey(KeyCode.Q)) channels[currentChannel].eqLow += Time.deltaTime * 10f;
            if (Input.GetKey(KeyCode.W)) channels[currentChannel].eqLow -= Time.deltaTime * 10f;
            if (Input.GetKey(KeyCode.A)) channels[currentChannel].eqMid += Time.deltaTime * 10f;
            if (Input.GetKey(KeyCode.S)) channels[currentChannel].eqMid -= Time.deltaTime * 10f;
            if (Input.GetKey(KeyCode.Z)) channels[currentChannel].eqHigh += Time.deltaTime * 10f;
            if (Input.GetKey(KeyCode.X)) channels[currentChannel].eqHigh -= Time.deltaTime * 10f;

            // Handle compression
            if (Input.GetKey(KeyCode.C))
            {
                channels[currentChannel].compression = Mathf.Clamp01(channels[currentChannel].compression + Time.deltaTime);
            }
            if (Input.GetKey(KeyCode.V))
            {
                channels[currentChannel].compression = Mathf.Clamp01(channels[currentChannel].compression - Time.deltaTime);
            }

            // Handle mute/solo
            if (Input.GetKeyDown(KeyCode.M))
            {
                channels[currentChannel].isMuted = !channels[currentChannel].isMuted;
            }
            if (Input.GetKeyDown(KeyCode.Space))
            {
                channels[currentChannel].isSolo = !channels[currentChannel].isSolo;
            }

            UpdateProgress();
        }

        private void UpdateProgress()
        {
            float totalProgress = 0f;
            foreach (var channel in channels)
            {
                var target = targetSettings[channel.Key];
                var current = channel.Value;

                float channelProgress = 0f;
                channelProgress += Mathf.Abs(current.volume - target.volume) < volumeTolerance ? 1f : 0f;
                channelProgress += Mathf.Abs(current.pan - target.pan) < panTolerance ? 1f : 0f;
                channelProgress += current.isMuted == target.isMuted ? 1f : 0f;
                channelProgress += current.isSolo == target.isSolo ? 1f : 0f;
                channelProgress += Mathf.Abs(current.eqLow - target.eqLow) < eqTolerance ? 1f : 0f;
                channelProgress += Mathf.Abs(current.eqMid - target.eqMid) < eqTolerance ? 1f : 0f;
                channelProgress += Mathf.Abs(current.eqHigh - target.eqHigh) < eqTolerance ? 1f : 0f;
                channelProgress += Mathf.Abs(current.compression - target.compression) < compressionTolerance ? 1f : 0f;

                totalProgress += channelProgress / 8f; // 8 parameters per channel
            }

            progress = totalProgress / channelCount;
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
            Debug.Log($"Analog Console Game completed with score: {score}");
        }
    }
} 