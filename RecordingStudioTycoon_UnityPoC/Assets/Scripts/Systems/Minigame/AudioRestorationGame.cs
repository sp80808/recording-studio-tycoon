using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;

namespace RecordingStudioTycoon.Systems.Minigame
{
    public class AudioRestorationGame : BaseMinigame
    {
        [System.Serializable]
        public class Tool
        {
            public string name;
            public float effectiveness;
            public float precision;
            public float speed;
            public bool isSelected;
        }

        [SerializeField] private List<Tool> availableTools;
        [SerializeField] private float noiseReductionTarget = 0.8f;
        [SerializeField] private float clickRemovalTarget = 0.9f;
        [SerializeField] private float humRemovalTarget = 0.85f;
        [SerializeField] private float crackleRemovalTarget = 0.75f;
        [SerializeField] private float targetTolerance = 0.1f;

        private float currentNoiseReduction;
        private float currentClickRemoval;
        private float currentHumRemoval;
        private float currentCrackleRemoval;
        private Tool selectedTool;

        private void Awake()
        {
            currentType = "audioRestoration";
            InitializeTools();
        }

        private void InitializeTools()
        {
            availableTools = new List<Tool>
            {
                new Tool { name = "Noise Gate", effectiveness = 0.7f, precision = 0.8f, speed = 0.6f },
                new Tool { name = "Click Remover", effectiveness = 0.8f, precision = 0.9f, speed = 0.5f },
                new Tool { name = "Hum Filter", effectiveness = 0.75f, precision = 0.85f, speed = 0.7f },
                new Tool { name = "Crackle Reducer", effectiveness = 0.65f, precision = 0.75f, speed = 0.8f }
            };
        }

        public override void Initialize(int difficulty)
        {
            base.Initialize(difficulty);
            ResetProgress();
            SelectTool(0);
        }

        private void ResetProgress()
        {
            currentNoiseReduction = 0f;
            currentClickRemoval = 0f;
            currentHumRemoval = 0f;
            currentCrackleRemoval = 0f;
        }

        private void SelectTool(int index)
        {
            if (index >= 0 && index < availableTools.Count)
            {
                foreach (var tool in availableTools)
                {
                    tool.isSelected = false;
                }
                availableTools[index].isSelected = true;
                selectedTool = availableTools[index];
            }
        }

        public override void ProcessInput()
        {
            // Tool selection
            if (Input.GetKeyDown(KeyCode.Alpha1)) SelectTool(0);
            if (Input.GetKeyDown(KeyCode.Alpha2)) SelectTool(1);
            if (Input.GetKeyDown(KeyCode.Alpha3)) SelectTool(2);
            if (Input.GetKeyDown(KeyCode.Alpha4)) SelectTool(3);

            if (selectedTool == null) return;

            // Apply selected tool
            float input = Input.GetAxis("Vertical");
            if (Mathf.Abs(input) > 0.1f)
            {
                float amount = input * Time.deltaTime * selectedTool.effectiveness;
                switch (selectedTool.name)
                {
                    case "Noise Gate":
                        currentNoiseReduction = Mathf.Clamp01(currentNoiseReduction + amount);
                        break;
                    case "Click Remover":
                        currentClickRemoval = Mathf.Clamp01(currentClickRemoval + amount);
                        break;
                    case "Hum Filter":
                        currentHumRemoval = Mathf.Clamp01(currentHumRemoval + amount);
                        break;
                    case "Crackle Reducer":
                        currentCrackleRemoval = Mathf.Clamp01(currentCrackleRemoval + amount);
                        break;
                }
            }

            UpdateProgress();
        }

        private void UpdateProgress()
        {
            float noiseProgress = Mathf.Abs(currentNoiseReduction - noiseReductionTarget) < targetTolerance ? 1f : 0f;
            float clickProgress = Mathf.Abs(currentClickRemoval - clickRemovalTarget) < targetTolerance ? 1f : 0f;
            float humProgress = Mathf.Abs(currentHumRemoval - humRemovalTarget) < targetTolerance ? 1f : 0f;
            float crackleProgress = Mathf.Abs(currentCrackleRemoval - crackleRemovalTarget) < targetTolerance ? 1f : 0f;

            progress = (noiseProgress + clickProgress + humProgress + crackleProgress) / 4f;
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
            Debug.Log($"Audio Restoration Game completed with score: {score}");
        }
    }
} 