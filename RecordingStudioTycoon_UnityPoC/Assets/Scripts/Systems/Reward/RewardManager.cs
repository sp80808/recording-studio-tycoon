using System;
using System.Collections.Generic;
using UnityEngine;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.GameLogic;

namespace RecordingStudioTycoon.Systems.Reward
{
    public class RewardManager : MonoBehaviour
    {
        public static RewardManager Instance { get; private set; }

        [SerializeField] private List<RewardData> availableRewards;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void ProcessProjectReward(string projectId, float qualityScore)
        {
            // Calculate rewards based on project completion
            int xpReward = Mathf.RoundToInt(qualityScore * 50);
            int moneyReward = Mathf.RoundToInt(qualityScore * 100);

            if (GameManager.Instance != null)
            {
                GameManager.Instance.AddXP(xpReward);
                // Add money through game state
                var gameState = GameManager.Instance.CurrentGameState;
                gameState.money += moneyReward;
                
                Debug.Log($"Project reward: {xpReward} XP, ${moneyReward}");
            }
        }

        public void ProcessDailyReward()
        {
            // Process daily rewards like passive income, reputation decay, etc.
            Debug.Log("Processing daily rewards...");
        }
    }

    [Serializable]
    public class RewardData
    {
        public string id;
        public string name;
        public RewardType type;
        public int value;
        public string description;
    }

    [Serializable]
    public enum RewardType
    {
        Money, XP, Reputation, PerkPoints, Equipment
    }
}
