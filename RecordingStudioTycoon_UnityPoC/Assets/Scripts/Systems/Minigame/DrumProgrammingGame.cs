using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;

namespace RecordingStudioTycoon.Systems.Minigame
{
    public class DrumProgrammingGame : BaseMinigame
    {
        [System.Serializable]
        public class DrumHit
        {
            public float velocity;
            public float timing;
            public float pitch;
            public bool isAccent;
        }

        [System.Serializable]
        public class DrumPattern
        {
            public List<DrumHit> kickHits;
            public List<DrumHit> snareHits;
            public List<DrumHit> hihatHits;
            public List<DrumHit> tomHits;
            public List<DrumHit> cymbalHits;
        }

        [SerializeField] private int patternLength = 16;
        [SerializeField] private float timingTolerance = 0.1f;
        [SerializeField] private float velocityTolerance = 0.1f;
        [SerializeField] private float pitchTolerance = 0.1f;
        [SerializeField] private float grooveTolerance = 0.1f;

        private DrumPattern currentPattern;
        private DrumPattern targetPattern;
        private int currentStep;
        private string selectedDrum;
        private float currentGroove;

        private void Awake()
        {
            currentType = "drumProgramming";
            currentPattern = new DrumPattern();
            targetPattern = new DrumPattern();
        }

        public override void Initialize(int difficulty)
        {
            base.Initialize(difficulty);
            GenerateTargetPattern();
            ResetPattern();
        }

        private void GenerateTargetPattern()
        {
            targetPattern = new DrumPattern
            {
                kickHits = GenerateDrumHits(4),
                snareHits = GenerateDrumHits(4),
                hihatHits = GenerateDrumHits(8),
                tomHits = GenerateDrumHits(2),
                cymbalHits = GenerateDrumHits(2)
            };
        }

        private List<DrumHit> GenerateDrumHits(int count)
        {
            var hits = new List<DrumHit>();
            for (int i = 0; i < count; i++)
            {
                hits.Add(new DrumHit
                {
                    velocity = Random.Range(0.5f, 1f),
                    timing = Random.Range(-0.1f, 0.1f),
                    pitch = Random.Range(-12f, 12f),
                    isAccent = Random.value > 0.7f
                });
            }
            return hits;
        }

        private void ResetPattern()
        {
            currentPattern = new DrumPattern
            {
                kickHits = new List<DrumHit>(),
                snareHits = new List<DrumHit>(),
                hihatHits = new List<DrumHit>(),
                tomHits = new List<DrumHit>(),
                cymbalHits = new List<DrumHit>()
            };
            currentStep = 0;
            selectedDrum = "kick";
            currentGroove = 0f;
        }

        public override void ProcessInput()
        {
            // Drum selection
            if (Input.GetKeyDown(KeyCode.Alpha1)) selectedDrum = "kick";
            if (Input.GetKeyDown(KeyCode.Alpha2)) selectedDrum = "snare";
            if (Input.GetKeyDown(KeyCode.Alpha3)) selectedDrum = "hihat";
            if (Input.GetKeyDown(KeyCode.Alpha4)) selectedDrum = "tom";
            if (Input.GetKeyDown(KeyCode.Alpha5)) selectedDrum = "cymbal";

            // Step navigation
            if (Input.GetKeyDown(KeyCode.RightArrow))
            {
                currentStep = (currentStep + 1) % patternLength;
            }
            if (Input.GetKeyDown(KeyCode.LeftArrow))
            {
                currentStep = (currentStep - 1 + patternLength) % patternLength;
            }

            // Hit placement and modification
            if (Input.GetKeyDown(KeyCode.Space))
            {
                PlaceDrumHit();
            }

            // Hit modification
            if (Input.GetKey(KeyCode.UpArrow))
            {
                ModifyCurrentHit(0.1f);
            }
            if (Input.GetKey(KeyCode.DownArrow))
            {
                ModifyCurrentHit(-0.1f);
            }

            // Groove adjustment
            if (Input.GetKey(KeyCode.G))
            {
                currentGroove = Mathf.Clamp(currentGroove + Time.deltaTime, -0.2f, 0.2f);
            }
            if (Input.GetKey(KeyCode.H))
            {
                currentGroove = Mathf.Clamp(currentGroove - Time.deltaTime, -0.2f, 0.2f);
            }

            UpdateProgress();
        }

        private void PlaceDrumHit()
        {
            var hit = new DrumHit
            {
                velocity = 0.8f,
                timing = currentGroove,
                pitch = 0f,
                isAccent = false
            };

            switch (selectedDrum)
            {
                case "kick":
                    currentPattern.kickHits.Add(hit);
                    break;
                case "snare":
                    currentPattern.snareHits.Add(hit);
                    break;
                case "hihat":
                    currentPattern.hihatHits.Add(hit);
                    break;
                case "tom":
                    currentPattern.tomHits.Add(hit);
                    break;
                case "cymbal":
                    currentPattern.cymbalHits.Add(hit);
                    break;
            }
        }

        private void ModifyCurrentHit(float amount)
        {
            List<DrumHit> currentHits = null;
            switch (selectedDrum)
            {
                case "kick":
                    currentHits = currentPattern.kickHits;
                    break;
                case "snare":
                    currentHits = currentPattern.snareHits;
                    break;
                case "hihat":
                    currentHits = currentPattern.hihatHits;
                    break;
                case "tom":
                    currentHits = currentPattern.tomHits;
                    break;
                case "cymbal":
                    currentHits = currentPattern.cymbalHits;
                    break;
            }

            if (currentHits != null && currentHits.Count > 0)
            {
                var hit = currentHits[currentHits.Count - 1];
                hit.velocity = Mathf.Clamp01(hit.velocity + amount);
                hit.timing = Mathf.Clamp(hit.timing + amount, -0.2f, 0.2f);
                hit.pitch = Mathf.Clamp(hit.pitch + amount * 10f, -12f, 12f);
            }
        }

        private void UpdateProgress()
        {
            float patternProgress = 0f;
            patternProgress += CompareDrumHits(currentPattern.kickHits, targetPattern.kickHits);
            patternProgress += CompareDrumHits(currentPattern.snareHits, targetPattern.snareHits);
            patternProgress += CompareDrumHits(currentPattern.hihatHits, targetPattern.hihatHits);
            patternProgress += CompareDrumHits(currentPattern.tomHits, targetPattern.tomHits);
            patternProgress += CompareDrumHits(currentPattern.cymbalHits, targetPattern.cymbalHits);

            progress = patternProgress / 5f;
        }

        private float CompareDrumHits(List<DrumHit> current, List<DrumHit> target)
        {
            if (current.Count == 0 || target.Count == 0) return 0f;

            float hitProgress = 0f;
            for (int i = 0; i < Mathf.Min(current.Count, target.Count); i++)
            {
                var currentHit = current[i];
                var targetHit = target[i];

                hitProgress += Mathf.Abs(currentHit.velocity - targetHit.velocity) < velocityTolerance ? 1f : 0f;
                hitProgress += Mathf.Abs(currentHit.timing - targetHit.timing) < timingTolerance ? 1f : 0f;
                hitProgress += Mathf.Abs(currentHit.pitch - targetHit.pitch) < pitchTolerance ? 1f : 0f;
                hitProgress += currentHit.isAccent == targetHit.isAccent ? 1f : 0f;
            }

            return hitProgress / (Mathf.Min(current.Count, target.Count) * 4f);
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
            Debug.Log($"Drum Programming Game completed with score: {score}");
        }
    }
} 