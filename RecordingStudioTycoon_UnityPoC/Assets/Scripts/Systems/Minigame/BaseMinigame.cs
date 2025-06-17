using UnityEngine;
using System;

namespace RecordingStudioTycoon.Systems.Minigame
{
    public abstract class BaseMinigame : MonoBehaviour, IMinigame
    {
        [SerializeField] protected float gameDuration = 60f;
        [SerializeField] protected float timeBonus = 5f;
        [SerializeField] protected float scoreMultiplier = 1f;

        protected bool isActive;
        protected string currentType;
        protected int difficulty;
        protected float timeRemaining;
        protected int score;
        protected float progress;
        protected bool isPlaying;

        public bool IsActive => isActive;
        public string CurrentType => currentType;
        public int Difficulty => difficulty;
        public float TimeRemaining => timeRemaining;
        public int Score => score;
        public float Progress => progress;
        public bool IsPlaying => isPlaying;

        public virtual void Initialize(int difficulty)
        {
            this.difficulty = difficulty;
            timeRemaining = gameDuration;
            score = 0;
            progress = 0f;
            isPlaying = false;
            isActive = true;
        }

        public virtual void StartGame()
        {
            isPlaying = true;
            isActive = true;
            timeRemaining = gameDuration;
        }

        public virtual void PauseGame()
        {
            isPlaying = false;
        }

        public virtual void ResumeGame()
        {
            isPlaying = true;
        }

        public virtual void EndGame()
        {
            isPlaying = false;
            isActive = false;
            CalculateScore();
            SaveProgress();
        }

        public virtual void UpdateGame(float deltaTime)
        {
            if (!isPlaying) return;

            timeRemaining -= deltaTime;
            if (timeRemaining <= 0)
            {
                EndGame();
            }
        }

        public abstract void ProcessInput();
        public abstract void CalculateScore();
        public abstract void SaveProgress();

        protected virtual void Update()
        {
            if (isPlaying)
            {
                UpdateGame(Time.deltaTime);
                ProcessInput();
            }
        }
    }
} 