using UnityEngine;
using RecordingStudioTycoon; // For RewardType, RewardManager

namespace RecordingStudioTycoon.Gameplay.Collectibles
{
    public enum CollectibleType
    {
        MoneyOrb,
        XPOB,
        RareItem
    }

    /// <summary>
    /// Placeholder for managing collectible spawning and tracking.
    /// Full implementation will be a later task.
    /// </summary>
    public class CollectibleManager : MonoBehaviour
    {
        public static CollectibleManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
            }
            else
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
        }

        /// <summary>
        /// Handles the collection of an item and grants the corresponding reward.
        /// </summary>
        /// <param name="type">The type of collectible.</param>
        /// <param name="amount">The amount or value associated with the collectible.</param>
        public void CollectItem(CollectibleType type, float amount)
        {
            Debug.Log($"Collected {type} with amount {amount}.");

            if (RewardManager.Instance != null)
            {
                switch (type)
                {
                    case CollectibleType.MoneyOrb:
                        Systems.Finance.FinanceManager.Instance.AddMoney(amount);
                        break;
                    case CollectibleType.XPOB:
                        RewardManager.Instance.GrantReward(RewardType.XP, amount);
                        break;
                    case CollectibleType.RareItem:
                        RewardManager.Instance.GrantReward(RewardType.Item, amount);
                        break;
                    default:
                        Debug.LogWarning($"Unhandled collectible type: {type}.");
                        break;
                }
            }
            else
            {
                Debug.LogWarning("RewardManager not found. Cannot grant collectible reward.");
            }
        }

        // This class will be expanded in future tasks to handle:
        // - Spawning collectibles at various locations
        // - Tracking collected items
        // - Managing collectible data persistence
        // - Potentially pooling collectibles for performance
    }
}