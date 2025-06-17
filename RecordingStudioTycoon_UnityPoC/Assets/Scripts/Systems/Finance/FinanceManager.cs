using UnityEngine;
using System;
using RecordingStudioTycoon.GameLogic; // For GameState
using RecordingStudioTycoon.UI; // For UIManager

namespace RecordingStudioTycoon.Systems.Finance
{
    public class FinanceManager : MonoBehaviour
    {
        public static FinanceManager Instance { get; private set; }

        // Event for UI or other systems to subscribe to when money changes
        public static event Action<float> OnMoneyChanged;

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

        /// <summary>
        /// Gets the current money balance from GameState.
        /// </summary>
        public float CurrentMoney
        {
            get { return GameManager.Instance.GameState.money; }
        }

        /// <summary>
        /// Adds money to the player's balance.
        /// </summary>
        /// <param name="amount">The amount of money to add.</param>
        public void AddMoney(float amount)
        {
            if (GameManager.Instance == null || GameManager.Instance.GameState == null) return;

            GameManager.Instance.GameState.money += amount;
            Debug.Log($"Added {amount} money. Total: {GameManager.Instance.GameState.money}");
            OnMoneyChanged?.Invoke(GameManager.Instance.GameState.money);
            GameManager.Instance.OnGameDataChanged?.Invoke(); // Notify UI of state changes
            GameManager.Instance.SaveGameData(); // Save game after money change
        }

        /// <summary>
        /// Deducts money from the player's balance.
        /// </summary>
        /// <param name="amount">The amount of money to deduct.</param>
        /// <returns>True if deduction was successful, false if insufficient funds.</returns>
        public bool DeductMoney(float amount)
        {
            if (GameManager.Instance == null || GameManager.Instance.GameState == null) return false;

            if (GameManager.Instance.GameState.money >= amount)
            {
                GameManager.Instance.GameState.money -= amount;
                Debug.Log($"Deducted {amount} money. Total: {GameManager.Instance.GameState.money}");
                OnMoneyChanged?.Invoke(GameManager.Instance.GameState.money);
                GameManager.Instance.OnGameDataChanged?.Invoke(); // Notify UI of state changes
                GameManager.Instance.SaveGameData(); // Save game after money change
                return true;
            }
            else
            {
                Debug.LogWarning($"Insufficient funds to deduct {amount}. Current money: {GameManager.Instance.GameState.money}");
                UIManager.Instance?.ShowNotification($"Insufficient funds!", NotificationType.Error);
                return false;
            }
        }

        /// <summary>
        /// Checks if the player has enough money for a given amount.
        /// </summary>
        /// <param name="amount">The amount to check against.</param>
        /// <returns>True if sufficient funds, false otherwise.</returns>
        public bool HasEnoughMoney(float amount)
        {
            if (GameManager.Instance == null || GameManager.Instance.GameState == null) return false;
            return GameManager.Instance.GameState.money >= amount;
        }

        /// <summary>
        /// Calculates a financial bonus multiplier based on studio specialization and industry prestige.
        /// </summary>
        /// <param name="genre">The genre of the project/income source, for specialization bonuses.</param>
        /// <returns>A float multiplier for financial gains.</returns>
        public float GetFinancialBonusMultiplier(DataModels.Market.MusicGenre genre)
        {
            if (GameManager.Instance == null || GameManager.Instance.GameState == null) return 1.0f;

            float multiplier = 1.0f;

            // Apply Studio Specialization bonus
            if (GameManager.Instance.GameState.studioSpecializations.TryGetValue(genre, out DataModels.Progression.StudioSpecialization specialization))
            {
                multiplier *= (1.0f + (specialization.BonusMultiplier - 1.0f) * 0.5f); // Half the specialization bonus for financial gain
                Debug.Log($"Applying {specialization.Genre} specialization financial bonus: {multiplier}");
            }

            // Apply general Industry Prestige bonus
            if (GameManager.Instance.GameState.industryPrestige.TryGetValue("general", out DataModels.Progression.IndustryPrestige generalPrestige))
            {
                multiplier *= (1.0f + (generalPrestige.BonusMultiplier - 1.0f) * 0.5f); // Half the general prestige bonus for financial gain
                Debug.Log($"Applying general industry prestige financial bonus: {multiplier}");
            }

            // Apply genre-specific Industry Prestige bonus
            string genrePrestigeKey = genre.ToString().ToLowerInvariant() + "_industry";
            if (GameManager.Instance.GameState.industryPrestige.TryGetValue(genrePrestigeKey, out DataModels.Progression.IndustryPrestige genrePrestige))
            {
                multiplier *= (1.0f + (genrePrestige.BonusMultiplier - 1.0f) * 0.5f); // Half the genre prestige bonus for financial gain
                Debug.Log($"Applying {genre} industry prestige financial bonus: {multiplier}");
            }

            return multiplier;
        }
    }
}