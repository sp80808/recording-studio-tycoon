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
            public float inputGain;
            public float[] eqBands;
            public float[] multibandCompressor;
            public float[] stereoImager;
            public float[] limiter;
            public float outputGain;
            public bool isBypassed;
        }

        [SerializeField] private int eqBandCount = 5;
        [SerializeField] private float gainTolerance = 0.1f;
        [SerializeField] private float eqTolerance = 0.1f;
        [SerializeField] private float compressorTolerance = 0.1f;
        [SerializeField] private float stereoImagerTolerance = 0.1f;
        [SerializeField] private float limiterTolerance = 0.1f;

        private MasteringChain currentChain;
        private MasteringChain targetChain;
        private string selectedTool;

        private readonly string[] availableTools = { "gain", "eq", "compressor", "stereo", "limiter" };

        private void Awake()
        {
            currentType = "mastering";
            currentChain = new MasteringChain();
            targetChain = new MasteringChain();
        }

        public override void Initialize(int difficulty)
        {
            base.Initialize(difficulty);
            GenerateTargetChain();
            ResetChain();
        }

        private void GenerateTargetChain()
        {
            targetChain = new MasteringChain
            {
                inputGain = Random.Range(0.5f, 1.5f),
                eqBands = GenerateEqBands(),
                multibandCompressor = GenerateMultibandCompressor(),
                stereoImager = GenerateStereoImager(),
                limiter = GenerateLimiter(),
                outputGain = Random.Range(0.5f, 1.5f),
                isBypassed = false
            };
        }

        private float[] GenerateEqBands()
        {
            var bands = new float[eqBandCount];
            for (int i = 0; i < eqBandCount; i++)
            {
                bands[i] = Random.Range(-6f, 6f);
            }
            return bands;
        }

        private float[] GenerateMultibandCompressor()
        {
            return new float[] {
                Random.Range(0f, 1f), // low threshold
                Random.Range(0f, 1f), // low ratio
                Random.Range(0f, 1f), // mid threshold
                Random.Range(0f, 1f), // mid ratio
                Random.Range(0f, 1f), // high threshold
                Random.Range(0f, 1f), // high ratio
                Random.Range(0f, 1f), // attack
                Random.Range(0f, 1f), // release
                Random.Range(0f, 1f)  // makeup gain
            };
        }

        private float[] GenerateStereoImager()
        {
            return new float[] {
                Random.Range(0f, 1f), // width
                Random.Range(0f, 1f), // balance
                Random.Range(0f, 1f), // phase
                Random.Range(0f, 1f)  // mono mix
            };
        }

        private float[] GenerateLimiter()
        {
            return new float[] {
                Random.Range(0f, 1f), // threshold
                Random.Range(0f, 1f), // release
                Random.Range(0f, 1f), // lookahead
                Random.Range(0f, 1f)  // ceiling
            };
        }

        private void ResetChain()
        {
            currentChain = new MasteringChain
            {
                inputGain = 1f,
                eqBands = new float[eqBandCount],
                multibandCompressor = new float[9],
                stereoImager = new float[4],
                limiter = new float[4],
                outputGain = 1f,
                isBypassed = false
            };
            selectedTool = "gain";
        }

        public override void ProcessInput()
        {
            // Tool selection
            if (Input.GetKeyDown(KeyCode.Alpha1)) selectedTool = "gain";
            if (Input.GetKeyDown(KeyCode.Alpha2)) selectedTool = "eq";
            if (Input.GetKeyDown(KeyCode.Alpha3)) selectedTool = "compressor";
            if (Input.GetKeyDown(KeyCode.Alpha4)) selectedTool = "stereo";
            if (Input.GetKeyDown(KeyCode.Alpha5)) selectedTool = "limiter";

            switch (selectedTool)
            {
                case "gain":
                    if (Input.GetKey(KeyCode.Q)) currentChain.inputGain = Mathf.Clamp(currentChain.inputGain - Time.deltaTime, 0f, 2f);
                    if (Input.GetKey(KeyCode.W)) currentChain.inputGain = Mathf.Clamp(currentChain.inputGain + Time.deltaTime, 0f, 2f);
                    if (Input.GetKey(KeyCode.A)) currentChain.outputGain = Mathf.Clamp(currentChain.outputGain - Time.deltaTime, 0f, 2f);
                    if (Input.GetKey(KeyCode.S)) currentChain.outputGain = Mathf.Clamp(currentChain.outputGain + Time.deltaTime, 0f, 2f);
                    break;
                case "eq":
                    if (Input.GetKey(KeyCode.Q)) currentChain.eqBands[0] = Mathf.Clamp(currentChain.eqBands[0] - Time.deltaTime * 10f, -12f, 12f);
                    if (Input.GetKey(KeyCode.W)) currentChain.eqBands[0] = Mathf.Clamp(currentChain.eqBands[0] + Time.deltaTime * 10f, -12f, 12f);
                    if (Input.GetKey(KeyCode.A)) currentChain.eqBands[1] = Mathf.Clamp(currentChain.eqBands[1] - Time.deltaTime * 10f, -12f, 12f);
                    if (Input.GetKey(KeyCode.S)) currentChain.eqBands[1] = Mathf.Clamp(currentChain.eqBands[1] + Time.deltaTime * 10f, -12f, 12f);
                    if (Input.GetKey(KeyCode.D)) currentChain.eqBands[2] = Mathf.Clamp(currentChain.eqBands[2] - Time.deltaTime * 10f, -12f, 12f);
                    if (Input.GetKey(KeyCode.F)) currentChain.eqBands[2] = Mathf.Clamp(currentChain.eqBands[2] + Time.deltaTime * 10f, -12f, 12f);
                    if (Input.GetKey(KeyCode.G)) currentChain.eqBands[3] = Mathf.Clamp(currentChain.eqBands[3] - Time.deltaTime * 10f, -12f, 12f);
                    if (Input.GetKey(KeyCode.H)) currentChain.eqBands[3] = Mathf.Clamp(currentChain.eqBands[3] + Time.deltaTime * 10f, -12f, 12f);
                    if (Input.GetKey(KeyCode.J)) currentChain.eqBands[4] = Mathf.Clamp(currentChain.eqBands[4] - Time.deltaTime * 10f, -12f, 12f);
                    if (Input.GetKey(KeyCode.K)) currentChain.eqBands[4] = Mathf.Clamp(currentChain.eqBands[4] + Time.deltaTime * 10f, -12f, 12f);
                    break;
                case "compressor":
                    if (Input.GetKey(KeyCode.Q)) currentChain.multibandCompressor[0] = Mathf.Clamp01(currentChain.multibandCompressor[0] - Time.deltaTime);
                    if (Input.GetKey(KeyCode.W)) currentChain.multibandCompressor[0] = Mathf.Clamp01(currentChain.multibandCompressor[0] + Time.deltaTime);
                    if (Input.GetKey(KeyCode.A)) currentChain.multibandCompressor[1] = Mathf.Clamp01(currentChain.multibandCompressor[1] - Time.deltaTime);
                    if (Input.GetKey(KeyCode.S)) currentChain.multibandCompressor[1] = Mathf.Clamp01(currentChain.multibandCompressor[1] + Time.deltaTime);
                    if (Input.GetKey(KeyCode.D)) currentChain.multibandCompressor[2] = Mathf.Clamp01(currentChain.multibandCompressor[2] - Time.deltaTime);
                    if (Input.GetKey(KeyCode.F)) currentChain.multibandCompressor[2] = Mathf.Clamp01(currentChain.multibandCompressor[2] + Time.deltaTime);
                    if (Input.GetKey(KeyCode.G)) currentChain.multibandCompressor[3] = Mathf.Clamp01(currentChain.multibandCompressor[3] - Time.deltaTime);
                    if (Input.GetKey(KeyCode.H)) currentChain.multibandCompressor[3] = Mathf.Clamp01(currentChain.multibandCompressor[3] + Time.deltaTime);
                    if (Input.GetKey(KeyCode.J)) currentChain.multibandCompressor[4] = Mathf.Clamp01(currentChain.multibandCompressor[4] - Time.deltaTime);
                    if (Input.GetKey(KeyCode.K)) currentChain.multibandCompressor[4] = Mathf.Clamp01(currentChain.multibandCompressor[4] + Time.deltaTime);
                    if (Input.GetKey(KeyCode.L)) currentChain.multibandCompressor[5] = Mathf.Clamp01(currentChain.multibandCompressor[5] - Time.deltaTime);
                    if (Input.GetKey(KeyCode.Semicolon)) currentChain.multibandCompressor[5] = Mathf.Clamp01(currentChain.multibandCompressor[5] + Time.deltaTime);
                    if (Input.GetKey(KeyCode.Z)) currentChain.multibandCompressor[6] = Mathf.Clamp01(currentChain.multibandCompressor[6] - Time.deltaTime);
                    if (Input.GetKey(KeyCode.X)) currentChain.multibandCompressor[6] = Mathf.Clamp01(currentChain.multibandCompressor[6] + Time.deltaTime);
                    if (Input.GetKey(KeyCode.C)) currentChain.multibandCompressor[7] = Mathf.Clamp01(currentChain.multibandCompressor[7] - Time.deltaTime);
                    if (Input.GetKey(KeyCode.V)) currentChain.multibandCompressor[7] = Mathf.Clamp01(currentChain.multibandCompressor[7] + Time.deltaTime);
                    if (Input.GetKey(KeyCode.B)) currentChain.multibandCompressor[8] = Mathf.Clamp01(currentChain.multibandCompressor[8] - Time.deltaTime);
                    if (Input.GetKey(KeyCode.N)) currentChain.multibandCompressor[8] = Mathf.Clamp01(currentChain.multibandCompressor[8] + Time.deltaTime);
                    break;
                case "stereo":
                    if (Input.GetKey(KeyCode.Q)) currentChain.stereoImager[0] = Mathf.Clamp01(currentChain.stereoImager[0] - Time.deltaTime);
                    if (Input.GetKey(KeyCode.W)) currentChain.stereoImager[0] = Mathf.Clamp01(currentChain.stereoImager[0] + Time.deltaTime);
                    if (Input.GetKey(KeyCode.A)) currentChain.stereoImager[1] = Mathf.Clamp01(currentChain.stereoImager[1] - Time.deltaTime);
                    if (Input.GetKey(KeyCode.S)) currentChain.stereoImager[1] = Mathf.Clamp01(currentChain.stereoImager[1] + Time.deltaTime);
                    if (Input.GetKey(KeyCode.D)) currentChain.stereoImager[2] = Mathf.Clamp01(currentChain.stereoImager[2] - Time.deltaTime);
                    if (Input.GetKey(KeyCode.F)) currentChain.stereoImager[2] = Mathf.Clamp01(currentChain.stereoImager[2] + Time.deltaTime);
                    if (Input.GetKey(KeyCode.G)) currentChain.stereoImager[3] = Mathf.Clamp01(currentChain.stereoImager[3] - Time.deltaTime);
                    if (Input.GetKey(KeyCode.H)) currentChain.stereoImager[3] = Mathf.Clamp01(currentChain.stereoImager[3] + Time.deltaTime);
                    break;
                case "limiter":
                    if (Input.GetKey(KeyCode.Q)) currentChain.limiter[0] = Mathf.Clamp01(currentChain.limiter[0] - Time.deltaTime);
                    if (Input.GetKey(KeyCode.W)) currentChain.limiter[0] = Mathf.Clamp01(currentChain.limiter[0] + Time.deltaTime);
                    if (Input.GetKey(KeyCode.A)) currentChain.limiter[1] = Mathf.Clamp01(currentChain.limiter[1] - Time.deltaTime);
                    if (Input.GetKey(KeyCode.S)) currentChain.limiter[1] = Mathf.Clamp01(currentChain.limiter[1] + Time.deltaTime);
                    if (Input.GetKey(KeyCode.D)) currentChain.limiter[2] = Mathf.Clamp01(currentChain.limiter[2] - Time.deltaTime);
                    if (Input.GetKey(KeyCode.F)) currentChain.limiter[2] = Mathf.Clamp01(currentChain.limiter[2] + Time.deltaTime);
                    if (Input.GetKey(KeyCode.G)) currentChain.limiter[3] = Mathf.Clamp01(currentChain.limiter[3] - Time.deltaTime);
                    if (Input.GetKey(KeyCode.H)) currentChain.limiter[3] = Mathf.Clamp01(currentChain.limiter[3] + Time.deltaTime);
                    break;
            }

            // Bypass
            if (Input.GetKeyDown(KeyCode.Space))
            {
                currentChain.isBypassed = !currentChain.isBypassed;
            }

            UpdateProgress();
        }

        private void UpdateProgress()
        {
            float chainProgress = 0f;
            chainProgress += Mathf.Abs(currentChain.inputGain - targetChain.inputGain) < gainTolerance ? 1f : 0f;
            chainProgress += Mathf.Abs(currentChain.outputGain - targetChain.outputGain) < gainTolerance ? 1f : 0f;
            chainProgress += currentChain.isBypassed == targetChain.isBypassed ? 1f : 0f;

            for (int i = 0; i < eqBandCount; i++)
            {
                chainProgress += Mathf.Abs(currentChain.eqBands[i] - targetChain.eqBands[i]) < eqTolerance ? 1f : 0f;
            }

            for (int i = 0; i < 9; i++)
            {
                chainProgress += Mathf.Abs(currentChain.multibandCompressor[i] - targetChain.multibandCompressor[i]) < compressorTolerance ? 1f : 0f;
            }

            for (int i = 0; i < 4; i++)
            {
                chainProgress += Mathf.Abs(currentChain.stereoImager[i] - targetChain.stereoImager[i]) < stereoImagerTolerance ? 1f : 0f;
            }

            for (int i = 0; i < 4; i++)
            {
                chainProgress += Mathf.Abs(currentChain.limiter[i] - targetChain.limiter[i]) < limiterTolerance ? 1f : 0f;
            }

            progress = chainProgress / (3f + eqBandCount + 9f + 4f + 4f);
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