using UnityEngine;
using System;

namespace RecordingStudioTycoon
{
    public enum RewardType
    {
        Money,
        XP,
        Item
    }

    public class RewardManager : MonoBehaviour
    {
        public static RewardManager Instance { get; private set; }

        // Event for UI to subscribe to for visual feedback
        public static event Action<RewardType, float> OnRewardGranted;

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
        /// Grants a specified reward to the player.
        /// </summary>
        /// <param name="type">The type of reward (Money, XP, Item).</param>
        /// <param name="amount">The amount of the reward. For items, this might represent quantity or a specific item ID.</param>
        public void GrantReward(RewardType type, float amount)
        {
            Debug.Log($"Granting {amount} {type} reward.");

            switch (type)
            {
                case RewardType.Money:
                    Systems.Finance.FinanceManager.Instance?.AddMoney(amount);
                    Debug.Log($"Player received ${amount}.");
                    break;
                case RewardType.XP:
                    // TODO: Integrate with a PlayerProgressionManager or similar
                    Debug.Log($"Player received {amount} XP.");
                    break;
                case RewardType.Item:
                    // TODO: Integrate with an InventoryManager or similar
                    Debug.Log($"Player received {amount} item(s).");
                    break;
                default:
                    Debug.LogWarning($"Unknown reward type: {type}.");
                    break;
            }

            OnRewardGranted?.Invoke(type, amount);
        }

        // Example usage (can be removed or modified later)
        public void TestGrantRewards()
        {
            GrantReward(RewardType.Money, 100.50f);
            GrantReward(RewardType.XP, 50f);
            // GrantReward(RewardType.Item, 1f); // For item, 'amount' could be item ID or quantity
        }
    }
}