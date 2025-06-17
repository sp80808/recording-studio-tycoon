using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;

namespace RecordingStudioTycoon.Systems.Minigame
{
    public class VocalProcessingGame : BaseMinigame
    {
        [System.Serializable]
        public class VocalChain
        {
            public float compression;
            public float deEssing;
            public float eqLow;
            public float eqMid;
            public float eqHigh;
            public float reverb;
            public float delay;
            public float pitchCorrection;
            public float saturation;
        }

        [SerializeField] private float targetClarity = 0.8f;
        [SerializeField] private float targetPresence = 0.7f;
        [SerializeField] private float targetWarmth = 0.6f;
        [SerializeField] private float compressionTolerance = 0.1f;
        [SerializeField] private float deEssingTolerance = 0.1f;
        [SerializeField] private float eqTolerance = 0.1f;
        [SerializeField] private float reverbTolerance = 0.1f;
        [SerializeField] private float delayTolerance = 0.1f;
        [SerializeField] private float pitchTolerance = 0.1f;
        [SerializeField] private float saturationTolerance = 0.1f;

        private VocalChain currentChain;
        private VocalChain targetChain;
        private float currentClarity;
        private float currentPresence;
        private float currentWarmth;
        private string selectedPreset;

        private void Awake()
        {
            currentType = "vocalProcessing";
            currentChain = new VocalChain();
            targetChain = new VocalChain();
        }

        public override void Initialize(int difficulty)
        {
            base.Initialize(difficulty);
            GenerateTargetSettings();
            ResetChain();
        }

        private void GenerateTargetSettings()
        {
            targetChain = new VocalChain
            {
                compression = Random.Range(0f, 1f),
                deEssing = Random.Range(0f, 1f),
                eqLow = Random.Range(-6f, 6f),
                eqMid = Random.Range(-6f, 6f),
                eqHigh = Random.Range(-6f, 6f),
                reverb = Random.Range(0f, 1f),
                delay = Random.Range(0f, 1f),
                pitchCorrection = Random.Range(0f, 1f),
                saturation = Random.Range(0f, 1f)
            };
        }

        private void ResetChain()
        {
            currentChain = new VocalChain
            {
                compression = 0f,
                deEssing = 0f,
                eqLow = 0f,
                eqMid = 0f,
                eqHigh = 0f,
                reverb = 0f,
                delay = 0f,
                pitchCorrection = 0f,
                saturation = 0f
            };
            currentClarity = 0f;
            currentPresence = 0f;
            currentWarmth = 0f;
        }

        public override void ProcessInput()
        {
            // Compression and de-essing
            if (Input.GetKey(KeyCode.Q))
            {
                currentChain.compression = Mathf.Clamp01(currentChain.compression + Time.deltaTime);
            }
            if (Input.GetKey(KeyCode.W))
            {
                currentChain.deEssing = Mathf.Clamp01(currentChain.deEssing + Time.deltaTime);
            }

            // EQ controls
            if (Input.GetKey(KeyCode.A)) currentChain.eqLow += Time.deltaTime * 10f;
            if (Input.GetKey(KeyCode.S)) currentChain.eqLow -= Time.deltaTime * 10f;
            if (Input.GetKey(KeyCode.D)) currentChain.eqMid += Time.deltaTime * 10f;
            if (Input.GetKey(KeyCode.F)) currentChain.eqMid -= Time.deltaTime * 10f;
            if (Input.GetKey(KeyCode.G)) currentChain.eqHigh += Time.deltaTime * 10f;
            if (Input.GetKey(KeyCode.H)) currentChain.eqHigh -= Time.deltaTime * 10f;

            // Reverb and delay
            if (Input.GetKey(KeyCode.Z))
            {
                currentChain.reverb = Mathf.Clamp01(currentChain.reverb + Time.deltaTime);
            }
            if (Input.GetKey(KeyCode.X))
            {
                currentChain.delay = Mathf.Clamp01(currentChain.delay + Time.deltaTime);
            }

            // Pitch correction
            if (Input.GetKey(KeyCode.C))
            {
                currentChain.pitchCorrection = Mathf.Clamp01(currentChain.pitchCorrection + Time.deltaTime);
            }
            if (Input.GetKey(KeyCode.V))
            {
                currentChain.pitchCorrection = Mathf.Clamp01(currentChain.pitchCorrection - Time.deltaTime);
            }

            // Saturation
            if (Input.GetKey(KeyCode.B))
            {
                currentChain.saturation = Mathf.Clamp01(currentChain.saturation + Time.deltaTime);
            }
            if (Input.GetKey(KeyCode.N))
            {
                currentChain.saturation = Mathf.Clamp01(currentChain.saturation - Time.deltaTime);
            }

            UpdateVocalMetrics();
            UpdateProgress();
        }

        private void UpdateVocalMetrics()
        {
            // Simulate vocal metrics based on chain settings
            currentClarity = 0.5f + (currentChain.deEssing * 0.3f) + (currentChain.eqHigh * 0.1f) - (currentChain.reverb * 0.2f);
            currentPresence = 0.5f + (currentChain.eqMid * 0.2f) + (currentChain.compression * 0.2f) - (currentChain.delay * 0.1f);
            currentWarmth = 0.5f + (currentChain.eqLow * 0.2f) + (currentChain.saturation * 0.3f) - (currentChain.pitchCorrection * 0.1f);
        }

        private void UpdateProgress()
        {
            float chainProgress = 0f;
            chainProgress += Mathf.Abs(currentChain.compression - targetChain.compression) < compressionTolerance ? 1f : 0f;
            chainProgress += Mathf.Abs(currentChain.deEssing - targetChain.deEssing) < deEssingTolerance ? 1f : 0f;
            chainProgress += Mathf.Abs(currentChain.eqLow - targetChain.eqLow) < eqTolerance ? 1f : 0f;
            chainProgress += Mathf.Abs(currentChain.eqMid - targetChain.eqMid) < eqTolerance ? 1f : 0f;
            chainProgress += Mathf.Abs(currentChain.eqHigh - targetChain.eqHigh) < eqTolerance ? 1f : 0f;
            chainProgress += Mathf.Abs(currentChain.reverb - targetChain.reverb) < reverbTolerance ? 1f : 0f;
            chainProgress += Mathf.Abs(currentChain.delay - targetChain.delay) < delayTolerance ? 1f : 0f;
            chainProgress += Mathf.Abs(currentChain.pitchCorrection - targetChain.pitchCorrection) < pitchTolerance ? 1f : 0f;
            chainProgress += Mathf.Abs(currentChain.saturation - targetChain.saturation) < saturationTolerance ? 1f : 0f;

            float metricsProgress = 0f;
            metricsProgress += Mathf.Abs(currentClarity - targetClarity) < 0.1f ? 1f : 0f;
            metricsProgress += Mathf.Abs(currentPresence - targetPresence) < 0.1f ? 1f : 0f;
            metricsProgress += Mathf.Abs(currentWarmth - targetWarmth) < 0.1f ? 1f : 0f;

            progress = (chainProgress / 9f + metricsProgress / 3f) / 2f;
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
            Debug.Log($"Vocal Processing Game completed with score: {score}");
        }
    }
} 