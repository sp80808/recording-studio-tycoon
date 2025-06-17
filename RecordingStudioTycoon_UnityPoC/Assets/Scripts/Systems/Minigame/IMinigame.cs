using UnityEngine;
using System;

namespace RecordingStudioTycoon.Systems.Minigame
{
    public interface IMinigame
    {
        bool IsActive { get; }
        string CurrentType { get; }
        int Difficulty { get; }
        float TimeRemaining { get; }
        int Score { get; }
        float Progress { get; }
        bool IsPlaying { get; }

        void Initialize(int difficulty);
        void StartGame();
        void PauseGame();
        void ResumeGame();
        void EndGame();
        void UpdateGame(float deltaTime);
        void ProcessInput();
        void CalculateScore();
        void SaveProgress();
    }
} 