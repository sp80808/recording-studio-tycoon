using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;

namespace RecordingStudioTycoon.Systems.Minigame
{
    public class MasteringGame : BaseMinigame
    {
        [System.Serializable]
        public class MasteringChain
        {
            public float eqLow;
            public float eqMid;
            public float eqHigh;
            public float compression;
            public float limiting;
            public float stereoWidth;
            public float saturation;
            public float finalGain;
        }

        [SerializeField] private float targetLoudness = -14f; // LUFS
        [SerializeField] private float targetDynamicRange = 8f; // dB
        [SerializeField] private float targetStereoWidth = 1.2f;
        [SerializeField] private float eqTolerance = 0.1f;
        [SerializeField] private float compressionTolerance = 0.1f;
        [SerializeField] private float limitingTolerance = 0.1f;
        [SerializeField] private float widthTolerance = 0.1f;
        [SerializeField] private float saturationTolerance = 0.1f;
        [SerializeField] private float gainTolerance = 0.1f;

        private MasteringChain currentChain;
        private MasteringChain targetChain;
        private float currentLoudness;
        private float currentDynamicRange;
        private string selectedPreset;

        private void Awake()
        {
            currentType = "mastering";
            currentChain = new MasteringChain();
            targetChain = new MasteringChain();
        }

        public override void Initialize(int difficulty)
        {
            base.Initialize(difficulty);
            GenerateTargetSettings();
            ResetChain();
        }

        private void GenerateTargetSettings()
        {
            targetChain = new MasteringChain
            {
                eqLow = Random.Range(-3f, 3f),
                eqMid = Random.Range(-3f, 3f),
                eqHigh = Random.Range(-3f, 3f),
                compression = Random.Range(0f, 1f),
                limiting = Random.Range(0f, 1f),
                stereoWidth = Random.Range(1f, 1.5f),
                saturation = Random.Range(0f, 1f),
                finalGain = Random.Range(-3f, 3f)
            };
        }

        private void ResetChain()
        {
            currentChain = new MasteringChain
            {
                eqLow = 0f,
                eqMid = 0f,
                eqHigh = 0f,
                compression = 0f,
                limiting = 0f,
                stereoWidth = 1f,
                saturation = 0f,
                finalGain = 0f
            };
            currentLoudness = -60f;
            currentDynamicRange = 20f;
        }

        public override void ProcessInput()
        {
            // EQ controls
            if (Input.GetKey(KeyCode.Q)) currentChain.eqLow += Time.deltaTime * 10f;
            if (Input.GetKey(KeyCode.W)) currentChain.eqLow -= Time.deltaTime * 10f;
            if (Input.GetKey(KeyCode.A)) currentChain.eqMid += Time.deltaTime * 10f;
            if (Input.GetKey(KeyCode.S)) currentChain.eqMid -= Time.deltaTime * 10f;
            if (Input.GetKey(KeyCode.Z)) currentChain.eqHigh += Time.deltaTime * 10f;
            if (Input.GetKey(KeyCode.X)) currentChain.eqHigh -= Time.deltaTime * 10f;

            // Compression and limiting
            if (Input.GetKey(KeyCode.C))
            {
                currentChain.compression = Mathf.Clamp01(currentChain.compression + Time.deltaTime);
            }
            if (Input.GetKey(KeyCode.V))
            {
                currentChain.limiting = Mathf.Clamp01(currentChain.limiting + Time.deltaTime);
            }

            // Stereo width
            if (Input.GetKey(KeyCode.D))
            {
                currentChain.stereoWidth = Mathf.Clamp(currentChain.stereoWidth + Time.deltaTime, 0.5f, 2f);
            }
            if (Input.GetKey(KeyCode.F))
            {
                currentChain.stereoWidth = Mathf.Clamp(currentChain.stereoWidth - Time.deltaTime, 0.5f, 2f);
            }

            // Saturation
            if (Input.GetKey(KeyCode.G))
            {
                currentChain.saturation = Mathf.Clamp01(currentChain.saturation + Time.deltaTime);
            }
            if (Input.GetKey(KeyCode.H))
            {
                currentChain.saturation = Mathf.Clamp01(currentChain.saturation - Time.deltaTime);
            }

            // Final gain
            if (Input.GetKey(KeyCode.T))
            {
                currentChain.finalGain += Time.deltaTime * 10f;
            }
            if (Input.GetKey(KeyCode.Y))
            {
                currentChain.finalGain -= Time.deltaTime * 10f;
            }

            UpdateAudioMetrics();
            UpdateProgress();
        }

        private void UpdateAudioMetrics()
        {
            // Simulate audio metrics based on chain settings
            currentLoudness = -14f + (currentChain.finalGain * 2f);
            currentDynamicRange = 20f - (currentChain.compression * 10f) - (currentChain.limiting * 5f);
        }

        private void UpdateProgress()
        {
            float chainProgress = 0f;
            chainProgress += Mathf.Abs(currentChain.eqLow - targetChain.eqLow) < eqTolerance ? 1f : 0f;
            chainProgress += Mathf.Abs(currentChain.eqMid - targetChain.eqMid) < eqTolerance ? 1f : 0f;
            chainProgress += Mathf.Abs(currentChain.eqHigh - targetChain.eqHigh) < eqTolerance ? 1f : 0f;
            chainProgress += Mathf.Abs(currentChain.compression - targetChain.compression) < compressionTolerance ? 1f : 0f;
            chainProgress += Mathf.Abs(currentChain.limiting - targetChain.limiting) < limitingTolerance ? 1f : 0f;
            chainProgress += Mathf.Abs(currentChain.stereoWidth - targetChain.stereoWidth) < widthTolerance ? 1f : 0f;
            chainProgress += Mathf.Abs(currentChain.saturation - targetChain.saturation) < saturationTolerance ? 1f : 0f;
            chainProgress += Mathf.Abs(currentChain.finalGain - targetChain.finalGain) < gainTolerance ? 1f : 0f;

            float metricsProgress = 0f;
            metricsProgress += Mathf.Abs(currentLoudness - targetLoudness) < 1f ? 1f : 0f;
            metricsProgress += Mathf.Abs(currentDynamicRange - targetDynamicRange) < 1f ? 1f : 0f;
            metricsProgress += Mathf.Abs(currentChain.stereoWidth - targetStereoWidth) < widthTolerance ? 1f : 0f;

            progress = (chainProgress / 8f + metricsProgress / 3f) / 2f;
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
            Debug.Log($"Mastering Game completed with score: {score}");
        }
    }
} 