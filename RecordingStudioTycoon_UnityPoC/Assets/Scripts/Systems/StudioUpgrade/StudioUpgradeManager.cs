using UnityEngine;
using System;
using System.Collections.Generic;
using RecordingStudioTycoon.GameLogic; // For GameState
using RecordingStudioTycoon.UI; // For UIManager

namespace RecordingStudioTycoon.Systems.StudioUpgrade
{
    public class StudioUpgradeManager : MonoBehaviour
    {
        public static StudioUpgradeManager Instance { get; private set; }

        [SerializeField] private StudioPerkData _studioPerkData; // Reference to ScriptableObject for perk definitions

        // Events for UI or other systems to subscribe to
        public static event Action<StudioPerk> OnPerkPurchased;
        public static event Action<string, int> OnStudioPrestigeChanged; // string for type of prestige, int for amount
        public static event Action OnStudioUpgraded; // Generic event for any studio upgrade/expansion

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

        private void Start()
        {
            // Ensure GameManager is initialized and accessible
            if (GameManager.Instance == null)
            {
                Debug.LogError("GameManager not found. StudioUpgradeManager requires GameManager to be initialized.");
                return;
            }

            // Initialize any dynamic state related to upgrades if not loaded from save
            // For now, assume GameState handles persistence of unlocked perks
        }

        /// <summary>
        /// Attempts to purchase a studio perk.
        /// </summary>
        /// <param name="perkId">The ID of the perk to purchase.</param>
        /// <returns>True if the perk was successfully purchased, false otherwise.</returns>
        public bool PurchaseStudioPerk(string perkId)
        {
            if (GameManager.Instance == null)
            {
                Debug.LogError("GameManager is not available.");
                return false;
            }

            StudioPerk perkToPurchase = GetPerkById(perkId);

            if (perkToPurchase == null)
            {
                Debug.LogWarning($"Perk with ID '{perkId}' not found.");
                return false;
            }

            if (perkToPurchase.IsUnlocked)
            {
                Debug.LogWarning($"Perk '{perkToPurchase.Name}' is already unlocked.");
                return false;
            }

            // Check prerequisites
            foreach (string prereqId in perkToPurchase.Prerequisites)
            {
                StudioPerk prereqPerk = GetPerkById(prereqId);
                if (prereqPerk == null || !prereqPerk.IsUnlocked)
                {
                    Debug.LogWarning($"Prerequisite perk '{prereqId}' for '{perkToPurchase.Name}' is not met.");
                    UIManager.Instance?.ShowNotification($"Cannot purchase {perkToPurchase.Name}: Requires {prereqPerk?.Name ?? prereqId} first.", NotificationType.Warning);
                    return false;
                }
            }

            // Check cost
            if (GameManager.Instance.Money < perkToPurchase.Cost)
            {
                Debug.LogWarning($"Insufficient funds to purchase perk '{perkToPurchase.Name}'. Cost: {perkToPurchase.Cost}, Available: {GameManager.Instance.Money}");
                UIManager.Instance?.ShowNotification($"Insufficient funds for {perkToPurchase.Name}.", NotificationType.Error);
                return false;
            }

            // Deduct money
            GameManager.Instance.DeductMoney(perkToPurchase.Cost);

            // Unlock perk in GameState (assuming GameState manages this)
            // This would typically involve updating a list of unlocked perks in GameState
            // For demonstration, we'll directly modify the ScriptableObject instance (which is not ideal for runtime state)
            // In a real game, you'd have a runtime representation of perks in GameState.
            // For now, let's simulate by marking it unlocked and applying effects.
            perkToPurchase.IsUnlocked = true; // This modifies the SO asset, which is generally bad for runtime state.
                                            // A better approach: GameState has a list of unlocked perk IDs.
                                            // When loading, populate a runtime dictionary/list of perks.
            
            // Apply perk effects
            ApplyPerkEffects(perkToPurchase);

            Debug.Log($"Successfully purchased perk: {perkToPurchase.Name}");
            UIManager.Instance?.ShowNotification($"Purchased: {perkToPurchase.Name}!", NotificationType.Success);
            OnPerkPurchased?.Invoke(perkToPurchase);
            OnStudioUpgraded?.Invoke(); // Generic upgrade event
            GameManager.Instance.SaveGameData(); // Save game after purchase
            return true;
        }

        /// <summary>
        /// Applies the effects of a purchased perk to the game state.
        /// </summary>
        /// <param name="perk">The perk whose effects are to be applied.</param>
        private void ApplyPerkEffects(StudioPerk perk)
        {
            if (GameManager.Instance == null || GameManager.Instance.GameState == null) return;

            // Example: Apply modifiers from the perk
            foreach (var modifier in perk.Modifiers)
            {
                switch (modifier.Key)
                {
                    case "studioPrestigeBonus":
                        GameManager.Instance.GameState.studioPrestige += (int)modifier.Value;
                        OnStudioPrestigeChanged?.Invoke("general", (int)modifier.Value);
                        Debug.Log($"Studio prestige increased by {modifier.Value} due to perk '{perk.Name}'.");
                        break;
                    case "staffEfficiencyBonus":
                        // Apply to all staff or specific staff types
                        // GameManager.Instance.StaffManagement.ApplyGlobalEfficiencyBonus(modifier.Value);
                        Debug.Log($"Staff efficiency bonus of {modifier.Value} applied due to perk '{perk.Name}'.");
                        break;
                    case "unlockEquipmentSlot":
                        GameManager.Instance.GameState.unlockedEquipmentSlots++;
                        Debug.Log($"New equipment slot unlocked due to perk '{perk.Name}'. Total slots: {GameManager.Instance.GameState.unlockedEquipmentSlots}");
                        break;
                    // Add more cases for different perk effects (e.g., new project types, reduced costs)
                    default:
                        Debug.LogWarning($"Unknown perk modifier: {modifier.Key} for perk {perk.Name}");
                        break;
                }
            }
            GameManager.Instance.OnGameDataChanged?.Invoke(); // Notify UI of state changes
        }

        /// <summary>
        /// Placeholder for purchasing studio expansions (e.g., new rooms, larger capacity).
        /// </summary>
        /// <param name="expansionId">The ID of the expansion to purchase.</param>
        /// <param name="cost">The cost of the expansion.</param>
        /// <returns>True if the expansion was successfully purchased, false otherwise.</returns>
        public bool PurchaseStudioExpansion(string expansionId, int cost)
        {
            if (GameManager.Instance == null) return false;

            if (GameManager.Instance.Money < cost)
            {
                Debug.LogWarning($"Insufficient funds for expansion '{expansionId}'. Cost: {cost}, Available: {GameManager.Instance.Money}");
                UIManager.Instance?.ShowNotification($"Insufficient funds for studio expansion.", NotificationType.Error);
                return false;
            }

            GameManager.Instance.DeductMoney(cost);
            GameManager.Instance.GameState.unlockedExpansions.Add(expansionId); // Assuming GameState tracks unlocked expansions
            Debug.Log($"Successfully purchased studio expansion: {expansionId}");
            UIManager.Instance?.ShowNotification($"Purchased: Studio Expansion!", NotificationType.Success);
            OnStudioUpgraded?.Invoke(); // Generic upgrade event
            GameManager.Instance.SaveGameData();
            return true;
        }

        /// <summary>
        /// Placeholder for purchasing general studio upgrades (e.g., better acoustics, improved wiring).
        /// </summary>
        /// <param name="upgradeId">The ID of the upgrade to purchase.</param>
        /// <param name="cost">The cost of the upgrade.</param>
        /// <param name="prestigeIncrease">Amount of prestige gained from this upgrade.</param>
        /// <returns>True if the upgrade was successfully purchased, false otherwise.</returns>
        public bool PurchaseGeneralUpgrade(string upgradeId, int cost, int prestigeIncrease)
        {
            if (GameManager.Instance == null) return false;

            if (GameManager.Instance.Money < cost)
            {
                Debug.LogWarning($"Insufficient funds for general upgrade '{upgradeId}'. Cost: {cost}, Available: {GameManager.Instance.Money}");
                UIManager.Instance?.ShowNotification($"Insufficient funds for studio upgrade.", NotificationType.Error);
                return false;
            }

            GameManager.Instance.DeductMoney(cost);
            GameManager.Instance.GameState.studioPrestige += prestigeIncrease;
            GameManager.Instance.GameState.unlockedUpgrades.Add(upgradeId); // Assuming GameState tracks unlocked upgrades
            OnStudioPrestigeChanged?.Invoke("general", prestigeIncrease);
            Debug.Log($"Successfully purchased general studio upgrade: {upgradeId}. Prestige increased by {prestigeIncrease}.");
            UIManager.Instance?.ShowNotification($"Purchased: Studio Upgrade!", NotificationType.Success);
            OnStudioUpgraded?.Invoke(); // Generic upgrade event
            GameManager.Instance.SaveGameData();
            return true;
        }

        /// <summary>
        /// Retrieves a StudioPerk by its ID from the StudioPerkData ScriptableObject.
        /// </summary>
        /// <param name="perkId">The ID of the perk.</param>
        /// <returns>The StudioPerk object if found, otherwise null.</returns>
        public StudioPerk GetPerkById(string perkId)
        {
            if (_studioPerkData == null || _studioPerkData.PerkTrees == null)
            {
                Debug.LogError("StudioPerkData or its perk trees are not assigned/initialized.");
                return null;
            }

            foreach (var tree in _studioPerkData.PerkTrees)
            {
                foreach (var perk in tree.Perks)
                {
                    if (perk.Id == perkId)
                    {
                        return perk;
                    }
                }
            }
            return null;
        }

        /// <summary>
        /// Checks if a specific perk is currently unlocked.
        /// </summary>
        /// <param name="perkId">The ID of the perk to check.</param>
        /// <returns>True if the perk is unlocked, false otherwise.</returns>
        public bool IsPerkUnlocked(string perkId)
        {
            StudioPerk perk = GetPerkById(perkId);
            return perk != null && perk.IsUnlocked;
        }

        // Method to get all available perks (for UI display)
        public List<StudioPerk> GetAllAvailablePerks()
        {
            List<StudioPerk> allPerks = new List<StudioPerk>();
            if (_studioPerkData != null && _studioPerkData.PerkTrees != null)
            {
                foreach (var tree in _studioPerkData.PerkTrees)
                {
                    allPerks.AddRange(tree.Perks);
                }
            }
            return allPerks;
        }
    }
}