using UnityEngine;
using RecordingStudioTycoon.DataModels.Progression;
using RecordingStudioTycoon.DataModels.Staff;
using RecordingStudioTycoon.DataModels.Equipment;
using RecordingStudioTycoon.Utils;
using System.Collections.Generic;
using RecordingStudioTycoon.GameLogic;
using System;
using System.Collections.Generic;
using System.Linq;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.GameLogic; // For GameManager and GameState
using RecordingStudioTycoon.ScriptableObjects; // For StudioPerkData, EraData
using RecordingStudioTycoon.Utils; // For SerializableDictionary

namespace RecordingStudioTycoon.Systems.Progression
{
    public class StudioUpgradeManager : MonoBehaviour
    {
        public static StudioUpgradeManager Instance { get; private set; }

        [SerializeField] private StudioPerkData studioPerkData; // Reference to ScriptableObject for all perks
        [SerializeField] private EraData eraData; // Reference to EraData for era-specific unlocks
        // [SerializeField] private ExpansionData expansionData; // Future: ScriptableObject for expansions

        public event Action OnPerkUnlocked;
        public event Action OnExpansionPurchased;
        public event Action OnSpecializationActivated;

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

        private void Start()
        {
            if (GameManager.Instance != null)
            {
                // Subscribe to relevant events if needed, e.g., OnDayAdvanced for passive effects
                // GameManager.Instance.OnDayAdvanced += OnDayAdvanced;
            }
            // Initialize aggregated perk modifiers in GameState if null
            if (GameManager.Instance.GameState.aggregatedPerkModifiers == null)
            {
                GameManager.Instance.GameState.aggregatedPerkModifiers = new AggregatedPerkModifiers();
            }
            ApplyAllPerkEffects(); // Apply initial effects on start
        }

        private void OnDestroy()
        {
            if (GameManager.Instance != null)
            {
                // GameManager.Instance.OnDayAdvanced -= OnDayAdvanced;
            }
        }

        // --- Studio Perks Logic (from studioUpgradeService.ts and useStudioPerks.tsx) ---

        /// <summary>
        /// Gets all available perks that meet unlock conditions.
        /// </summary>
        public List<StudioPerk> GetAvailablePerks()
        {
            if (studioPerkData == null || studioPerkData.PerkTrees == null) return new List<StudioPerk>();

            GameState gameState = GameManager.Instance.GameState;
            List<StudioPerk> allPerks = studioPerkData.PerkTrees.SelectMany(tree => tree.Perks).ToList();

            return allPerks.Where(perk =>
            {
                // Check if already owned and not repeatable
                if (gameState.ownedUpgrades.Contains(perk.Id) && !perk.IsRepeatable)
                {
                    return false;
                }
                // Check max repeats for repeatable perks
                if (perk.IsRepeatable && perk.MaxRepeats > 0)
                {
                    int timesOwned = gameState.ownedUpgrades.Count(id => id == perk.Id);
                    if (timesOwned >= perk.MaxRepeats) return false;
                }
                // Check prerequisites
                if (perk.Prerequisites != null && !perk.Prerequisites.All(prereqId => gameState.ownedUpgrades.Contains(prereqId)))
                {
                    return false;
                }
                // Check unlock conditions
                return perk.UnlockConditions.All(condition => CheckCondition(condition, gameState));
            }).ToList();
        }

        /// <summary>
        /// Checks if a specific perk can be unlocked.
        /// </summary>
        public bool CanUnlockPerk(string perkId)
        {
            StudioPerk perk = GetPerkById(perkId);
            if (perk == null) return false;

            GameState gameState = GameManager.Instance.GameState;

            if (gameState.ownedUpgrades.Contains(perk.Id) && !perk.IsRepeatable) return false;
            if (perk.IsRepeatable && perk.MaxRepeats > 0)
            {
                int timesOwned = gameState.ownedUpgrades.Count(id => id == perk.Id);
                if (timesOwned >= perk.MaxRepeats) return false;
            }
            if (perk.Prerequisites != null && !perk.Prerequisites.All(pId => gameState.ownedUpgrades.Contains(pId)))
            {
                return false;
            }

            // Check costs
            if (perk.Cost > 0)
            {
                if (gameState.money < perk.Cost) return false;
            }
            // Assuming perk points are handled by ProgressionManager's SpendPerkPoint
            // if (perk.Cost.PerkPoints > 0 && gameState.playerData.perkPoints < perk.Cost.PerkPoints) return false;

            return perk.UnlockConditions.All(condition => CheckCondition(condition, gameState));
        }

        /// <summary>
        /// Unlocks a specified perk and applies its effects.
        /// </summary>
        public bool UnlockPerk(string perkId)
        {
            StudioPerk perk = GetPerkById(perkId);
            if (perk == null || !CanUnlockPerk(perkId))
            {
                Debug.LogWarning($"Cannot unlock perk {perkId}. Conditions not met or perk already owned.");
                return false;
            }

            GameState gameState = GameManager.Instance.GameState;

            // Deduct money cost
            if (perk.Cost > 0)
            {
                gameState.money -= perk.Cost;
            }
            // Deduct perk points (handled by ProgressionManager)
            // ProgressionManager.Instance.SpendPerkPoint(perk.Cost.PerkPoints); // This needs to be integrated carefully

            gameState.ownedUpgrades.Add(perk.Id);
            ApplyAllPerkEffects(); // Re-apply all effects after new perk is unlocked

            Debug.Log($"Perk {perk.Name} unlocked!");
            OnPerkUnlocked?.Invoke();
            return true;
        }

        /// <summary>
        /// Gets all perks currently owned by the player.
        /// </summary>
        public List<StudioPerk> GetOwnedPerks()
        {
            if (studioPerkData == null || studioPerkData.PerkTrees == null) return new List<StudioPerk>();
            GameState gameState = GameManager.Instance.GameState;
            List<StudioPerk> allPerks = studioPerkData.PerkTrees.SelectMany(tree => tree.Perks).ToList();
            return allPerks.Where(perk => gameState.ownedUpgrades.Contains(perk.Id)).ToList();
        }

        /// <summary>
        /// Applies all active perk effects to the game state's aggregated modifiers.
        /// </summary>
        public void ApplyAllPerkEffects()
        {
            GameState gameState = GameManager.Instance.GameState;
            List<StudioPerk> ownedPerks = GetOwnedPerks();

            // Reset aggregated modifiers to default values
            // Ensure AggregatedPerkModifiers has a proper reset or default constructor
            gameState.aggregatedPerkModifiers = new AggregatedPerkModifiers(); 

            foreach (var perk in ownedPerks)
            {
                if (perk.Effects == null) continue;

                foreach (var effect in perk.Effects)
                {
                    // Apply effect based on key, value, operation, and genre
                    // This logic needs to mirror the TypeScript `applyAllPerkEffects`
                    ApplySinglePerkEffect(gameState.aggregatedPerkModifiers, effect);
                }
            }
            Debug.Log("All perk effects applied.");
        }

        /// <summary>
        /// Helper to apply a single perk effect to the aggregated modifiers.
        /// </summary>
        private void ApplySinglePerkEffect(AggregatedPerkModifiers modifiers, PerkEffect effect)
        {
            switch (effect.Key)
            {
                case "globalRecordingQualityModifier":
                    ApplyNumericEffect(ref modifiers.globalRecordingQualityModifier, effect);
                    break;
                case "globalMixingQualityModifier":
                    ApplyNumericEffect(ref modifiers.globalMixingQualityModifier, effect);
                    break;
                case "globalMasteringQualityModifier":
                    ApplyNumericEffect(ref modifiers.globalMasteringQualityModifier, effect);
                    break;
                case "contractPayoutModifier":
                    ApplyNumericEffect(ref modifiers.contractPayoutModifier, effect);
                    break;
                case "researchSpeedModifier":
                    ApplyNumericEffect(ref modifiers.researchSpeedModifier, effect);
                    break;
                case "staffHappinessModifier":
                    ApplyNumericEffect(ref modifiers.staffHappinessModifier, effect);
                    break;
                case "staffTrainingSpeedModifier":
                    ApplyNumericEffect(ref modifiers.staffTrainingSpeedModifier, effect);
                    break;
                case "marketingEffectivenessModifier":
                    ApplyNumericEffect(ref modifiers.marketingEffectivenessModifier, effect);
                    break;
                case "candidateQualityBonus":
                    ApplyNumericEffect(ref modifiers.candidateQualityBonus, effect);
                    break;
                case "projectAppealModifier":
                    // Handle genre-specific appeal modifiers
                    if (!string.IsNullOrEmpty(effect.Genre))
                    {
                        if (!modifiers.projectAppealModifier.ContainsKey(effect.Genre))
                        {
                            modifiers.projectAppealModifier[effect.Genre] = 1.0f;
                        }
                        ApplyNumericEffect(ref modifiers.projectAppealModifier[effect.Genre], effect);
                    }
                    else
                    {
                        // Apply to "all" or a default if no specific genre
                        if (!modifiers.projectAppealModifier.ContainsKey("all"))
                        {
                            modifiers.projectAppealModifier["all"] = 1.0f;
                        }
                        ApplyNumericEffect(ref modifiers.projectAppealModifier["all"], effect);
                    }
                    break;
                // Add other perk effect keys as needed
                default:
                    Debug.LogWarning($"Unhandled perk effect key: {effect.Key}");
                    break;
            }
        }

        /// <summary>
        /// Helper to apply a numeric effect (add, multiply, set).
        /// </summary>
        private void ApplyNumericEffect(ref float target, PerkEffect effect)
        {
            switch (effect.Operation)
            {
                case "add":
                    target += effect.Value;
                    break;
                case "multiply":
                    target *= (1f + effect.Value); // Assuming value is a percentage (e.g., 0.02 for 2%)
                    break;
                case "set":
                    target = effect.Value;
                    break;
                default:
                    Debug.LogWarning($"Unknown perk effect operation: {effect.Operation}");
                    break;
            }
        }

        /// <summary>
        /// Helper to check if a perk unlock condition is met.
        /// </summary>
        private bool CheckCondition(PerkUnlockCondition condition, GameState gameState)
        {
            switch (condition.Type)
            {
                case "playerLevel":
                    return gameState.playerData.level >= condition.Value;
                case "studioReputation":
                    return gameState.reputation >= condition.Value;
                case "completedProjects":
                    return gameState.completedProjects.Count >= condition.Value;
                case "projectsInGenre":
                    if (string.IsNullOrEmpty(condition.Genre)) return false;
                    return gameState.completedProjects.Count(p => p.Genre == condition.Genre) >= condition.Value;
                case "staffSkillSum":
                    // TODO: Implement staff skill sum check
                    return true; 
                case "specificEquipmentOwned":
                    if (string.IsNullOrEmpty(condition.EquipmentId)) return false;
                    return gameState.ownedEquipment.Any(eq => eq.Id == condition.EquipmentId);
                case "specificPerkUnlocked":
                    if (string.IsNullOrEmpty(condition.PerkId)) return false;
                    return gameState.ownedUpgrades.Contains(condition.PerkId);
                case "moneyEarned":
                    // TODO: Implement money earned check
                    return true;
                case "chartSuccesses":
                    // TODO: Implement chart successes check
                    return true;
                default:
                    Debug.LogWarning($"Unknown perk unlock condition type: {condition.Type}");
                    return false;
            }
        }

        public StudioPerk GetPerkById(string perkId)
        {
            if (studioPerkData == null || studioPerkData.PerkTrees == null) return null;
            return studioPerkData.PerkTrees.SelectMany(tree => tree.Perks).FirstOrDefault(p => p.Id == perkId);
        }

        // --- Studio Specializations Logic (from useStudioUpgrades.ts) ---
        // TODO: Implement StudioSpecialization data model and related logic

        // --- Industry Prestige Logic (from useStudioUpgrades.ts) ---
        // TODO: Implement IndustryPrestige data model and related logic

        // --- Studio Expansion Logic (from useStudioExpansion.tsx) ---
        // TODO: Implement Expansion data model and related logic
        // This will involve a new ScriptableObject for ExpansionData and a DataModel for Expansion.

        /// <summary>
        /// Purchases a studio expansion.
        /// </summary>
        /// <param name="expansionId">The ID of the expansion to purchase.</param>
        public bool PurchaseExpansion(string expansionId)
        {
            // This will require Expansion data model and a way to retrieve available expansions
            // For now, a placeholder.
            Debug.LogWarning($"PurchaseExpansion not fully implemented for {expansionId}.");
            return false;
        }

        /// <summary>
        /// Calculates total aggregated bonuses from all owned perks and active specializations.
        /// </summary>
        public AggregatedPerkModifiers CalculateTotalBonuses()
        {
            // This method is called by ApplyAllPerkEffects, so it's implicitly handled.
            // However, if other systems need to query the current bonuses without triggering a full re-calculation,
            // they can access GameManager.Instance.GameState.aggregatedPerkModifiers directly.
            return GameManager.Instance.GameState.aggregatedPerkModifiers;
        }
    }
}
