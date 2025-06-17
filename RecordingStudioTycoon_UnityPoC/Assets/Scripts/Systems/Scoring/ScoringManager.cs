using UnityEngine;
using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.Systems.Scoring
{
    public class ScoringManager : MonoBehaviour
    {
        public static ScoringManager Instance { get; private set; }

        public event Action<int, float, string> OnScoreUpdated; // score, accuracy, feedback
        public event Action<int, float, string> OnMinigameComplete; // final score, accuracy, summary

        private int currentScore;
        private float currentAccuracy;
        private string currentFeedback;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }
        }

        public void UpdateScore(int score, float accuracy, string feedback = "")
        {
            currentScore = score;
            currentAccuracy = accuracy;
            currentFeedback = feedback;
            OnScoreUpdated?.Invoke(score, accuracy, feedback);
        }

        public void CompleteMinigame(int finalScore, float accuracy, string summary)
        {
            OnMinigameComplete?.Invoke(finalScore, accuracy, summary);
        }

        public int GetCurrentScore() => currentScore;
        public float GetCurrentAccuracy() => currentAccuracy;
        public string GetCurrentFeedback() => currentFeedback;
    }
} 