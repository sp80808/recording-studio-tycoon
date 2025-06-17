using UnityEngine;
using System;
using System.Collections.Generic;
using System.Linq;
using RecordingStudioTycoon.DataModels; // For ProjectCompletionReport
using RecordingStudioTycoon.DataModels.Game;
using RecordingStudioTycoon.DataModels.Progression;
using RecordingStudioTycoon.DataModels.Market; // For MusicGenre
using RecordingStudioTycoon.GameLogic; // For GameState
using RecordingStudioTycoon.ScriptableObjects;
using RecordingStudioTycoon.Utils; // For SerializableDictionary

namespace RecordingStudioTycoon.Systems.Progression
{
    public class StudioUpgradeManager : MonoBehaviour
    {
        public static StudioUpgradeManager Instance { get; private set; }

        [SerializeField] private GameStateSO gameStateSO;
        [SerializeField] private RecordingStudioTycoon.ScriptableObjects.StudioPerksDataSO studioPerksData; // ScriptableObject for all perk definitions
        [SerializeField] private RecordingStudioTycoon.ScriptableObjects.ProgressionDataSO progressionData; // For milestones related to upgrades/expansions

        // Events for UI updates
        public event Action OnStudioUpgradesUpdated;
        public event Action<StudioPerk> OnPerkUnlocked;
        public event Action<RecordingStudioTycoon.DataModels.Progression.Expansion> OnExpansionPurchased;
        public event Action<RecordingStudioTycoon.DataModels.Progression.StudioSpecialization> OnSpecializationActivated;

        private List<StudioPerk> _allStudioPerks;
        private List<RecordingStudioTycoon.DataModels.Progression.Expansion> _allExpansions;
        private List<RecordingStudioTycoon.DataModels.Progression.StudioSpecialization> _allSpecializations; // Definitions of specializations

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
            InitializeStudioUpgrades();
        }

        private void InitializeStudioUpgrades()
        {
            if (studioPerksData == null)
            {
                Debug.LogError("StudioPerksDataSO is not assigned to StudioUpgradeManager.");
                _allStudioPerks = new List<StudioPerk>();
                _allExpansions = new List<Expansion>();
                _allSpecializations = new List<StudioSpecialization>();
                return;
            }

            _allStudioPerks = new List<StudioPerk>(studioPerksData.AllStudioPerks);
            _allExpansions = new List<Expansion>(studioPerksData.AllExpansions);
            _allSpecializations = new List<StudioSpecialization>(studioPerksData.AllSpecializations);

            // Ensure GameStateSO has ownedUpgrades and aggregatedPerkModifiers initialized
            if (gameStateSO != null)
            {
                if (gameStateSO.GameState.OwnedUpgrades == null)
                {
                    gameStateSO.GameState.OwnedUpgrades = new List<string>();
                }
                if (gameStateSO.GameState.AggregatedPerkModifiers == null)
                {
                    gameStateSO.GameState.AggregatedPerkModifiers = new AggregatedPerkModifiers();
                }
                if (gameStateSO.GameState.StudioSpecializations == null)
                {
                    gameStateSO.GameState.StudioSpecializations = new SerializableDictionary<MusicGenre, StudioSpecialization>();
                }
                ApplyAllPerkEffects(); // Apply effects of already owned perks on start
            }
            else
            {
                Debug.LogError("GameStateSO is not assigned to StudioUpgradeManager.");
            }

            OnStudioUpgradesUpdated?.Invoke();
        }

        // --- Perk Management (Ported from useStudioPerks.tsx and studioUpgradeService.ts) ---

        public List<StudioPerk> GetAvailablePerks()
        {
            if (gameStateSO == null) return new List<StudioPerk>();

            List<string> ownedUpgrades = gameStateSO.GameState.OwnedUpgrades;

            return _allStudioPerks.Where(perk => {
                if (ownedUpgrades.Contains(perk.Id) && !perk.IsRepeatable)
                {
                    return false;
                }
                if (perk.IsRepeatable && perk.MaxRepeats > 0)
                {
                    int timesOwned = ownedUpgrades.Count(id => id == perk.Id);
                    if (timesOwned >= perk.MaxRepeats) return false;
                }
                if (perk.Prerequisites != null && !perk.Prerequisites.All(prereqId => ownedUpgrades.Contains(prereqId)))
                {
                    return false;
                }
                return perk.UnlockConditions.All(condition => CheckPerkUnlockCondition(condition, gameStateSO.GameState));
            }).ToList();
        }

        public List<StudioPerk> GetOwnedPerks()
        {
            if (gameStateSO == null) return new List<StudioPerk>();
            List<string> ownedUpgrades = gameStateSO.GameState.OwnedUpgrades;
            return _allStudioPerks.Where(perk => ownedUpgrades.Contains(perk.Id)).ToList();
        }

        public bool CanUnlockPerk(string perkId)
        {
            if (gameStateSO == null) return false;

            StudioPerk perk = _allStudioPerks.Find(p => p.Id == perkId);
            if (perk == null) return false;

            List<string> ownedUpgrades = gameStateSO.GameState.OwnedUpgrades;

            if (ownedUpgrades.Contains(perk.Id) && !perk.IsRepeatable) return false;
            if (perk.IsRepeatable && perk.MaxRepeats > 0)
            {
                int timesOwned = ownedUpgrades.Count(id => id == perk.Id);
                if (timesOwned >= perk.MaxRepeats) return false;
            }
            if (perk.Prerequisites != null && !perk.Prerequisites.All(pId => ownedUpgrades.Contains(pId)))
            {
                return false;
            }

            // Check cost
            if (perk.Cost != null)
            {
                if (perk.Cost.Money > 0 && gameStateSO.GameState.Money < perk.Cost.Money) return false;
                if (perk.Cost.PerkPoints > 0 && gameStateSO.GameState.PlayerData.PerkPoints < perk.Cost.PerkPoints) return false;
            }

            return perk.UnlockConditions.All(condition => CheckPerkUnlockCondition(condition, gameStateSO.GameState));
        }

        public bool UnlockPerk(string perkId)
        {
            if (gameStateSO == null) return false;

            StudioPerk perk = _allStudioPerks.Find(p => p.Id == perkId);
            if (perk == null || !CanUnlockPerk(perkId))
            {
                Debug.LogWarning($"Cannot unlock perk {perkId}. Conditions not met or perk already owned.");
                return false;
            }

            // Deduct cost
            if (perk.Cost != null)
            {
                if (perk.Cost.Money > 0) gameStateSO.GameState.Money -= perk.Cost.Money;
                if (perk.Cost.PerkPoints > 0) gameStateSO.GameState.PlayerData.PerkPoints -= perk.Cost.PerkPoints;
            }

            gameStateSO.GameState.OwnedUpgrades.Add(perk.Id);
            ApplyAllPerkEffects(); // Re-apply all perk effects after unlocking a new one

            Debug.Log($"Perk {perk.Name} unlocked!");
            OnPerkUnlocked?.Invoke(perk);
            OnStudioUpgradesUpdated?.Invoke();
            return true;
        }

        public StudioPerk GetPerkById(string perkId)
        {
            return _allStudioPerks.Find(p => p.Id == perkId);
        }

        private bool CheckPerkUnlockCondition(PerkUnlockCondition condition, GameState gameState)
        {
            switch (condition.Type)
            {
                case "playerLevel":
                    return gameState.PlayerData.Level >= condition.Value;
                case "studioReputation":
                    return gameState.Reputation >= condition.Value;
                case "completedProjects":
                    return (gameState.CompletedProjects?.Count ?? 0) >= condition.Value;
                case "projectsInGenre":
                    if (string.IsNullOrEmpty(condition.Genre)) return false;
                    return (gameState.CompletedProjects?.Count(p => p.Genre.ToString() == condition.Genre) ?? 0) >= condition.Value;
                case "staffSkillSum":
                    // Implement staff skill sum check
                    return true; 
                case "specificEquipmentOwned":
                    if (string.IsNullOrEmpty(condition.EquipmentId)) return false;
                    return gameState.OwnedEquipment.Any(eq => eq.Id == condition.EquipmentId);
                case "specificPerkUnlocked":
                    if (string.IsNullOrEmpty(condition.ConditionPerkId)) return false;
                    return gameState.OwnedUpgrades.Contains(condition.ConditionPerkId);
                case "moneyEarned":
                    // Implement money earned check
                    return true;
                case "chartSuccesses":
                    // Implement chart successes check
                    return true;
                default:
                    return false;
            }
        }

        public void ApplyAllPerkEffects()
        {
            if (gameStateSO == null) return;

            GameState gameState = gameStateSO.GameState;
            List<StudioPerk> ownedPerks = GetOwnedPerks();

            // Reset aggregated modifiers to default values
            AggregatedPerkModifiers defaultModifiers = new AggregatedPerkModifiers();
            gameState.AggregatedPerkModifiers = defaultModifiers;

            foreach (var perk in ownedPerks)
            {
                foreach (var effect in perk.Effects)
                {
                    ApplyPerkEffect(gameState.AggregatedPerkModifiers, effect);
                }
            }
            OnStudioUpgradesUpdated?.Invoke();
        }

        private void ApplyPerkEffect(AggregatedPerkModifiers modifiers, PerkEffect effect)
        {
            switch (effect.Key)
            {
                case "globalRecordingQualityModifier":
                    modifiers.GlobalRecordingQualityModifier = ApplyOperation(modifiers.GlobalRecordingQualityModifier, effect.Value, effect.Operation);
                    break;
                case "globalMixingQualityModifier":
                    modifiers.GlobalMixingQualityModifier = ApplyOperation(modifiers.GlobalMixingQualityModifier, effect.Value, effect.Operation);
                    break;
                case "globalMasteringQualityModifier":
                    modifiers.GlobalMasteringQualityModifier = ApplyOperation(modifiers.GlobalMasteringQualityModifier, effect.Value, effect.Operation);
                    break;
                case "contractPayoutModifier":
                    modifiers.ContractPayoutModifier = ApplyOperation(modifiers.ContractPayoutModifier, effect.Value, effect.Operation);
                    break;
                case "researchSpeedModifier":
                    modifiers.ResearchSpeedModifier = ApplyOperation(modifiers.ResearchSpeedModifier, effect.Value, effect.Operation);
                    break;
                case "staffHappinessModifier":
                    modifiers.StaffHappinessModifier = ApplyOperation(modifiers.StaffHappinessModifier, effect.Value, effect.Operation);
                    break;
                case "staffTrainingSpeedModifier":
                    modifiers.StaffTrainingSpeedModifier = ApplyOperation(modifiers.StaffTrainingSpeedModifier, effect.Value, effect.Operation);
                    break;
                case "marketingEffectivenessModifier":
                    modifiers.MarketingEffectivenessModifier = ApplyOperation(modifiers.MarketingEffectivenessModifier, effect.Value, effect.Operation);
                    break;
                case "projectAppealModifier":
                    // Handle genre-specific appeal modifiers
                    MusicGenre targetGenre = MusicGenre.Pop; // Default or parse from effect.Genre
                    if (!string.IsNullOrEmpty(effect.Genre))
                    {
                        Enum.TryParse(effect.Genre, true, out targetGenre);
                    }
                    
                    if (!modifiers.ProjectAppealModifier.ContainsKey(targetGenre))
                    {
                        modifiers.ProjectAppealModifier[targetGenre] = 1.0f;
                    }
                    modifiers.ProjectAppealModifier[targetGenre] = ApplyOperation(modifiers.ProjectAppealModifier[targetGenre], effect.Value, effect.Operation);
                    break;
                case "candidateQualityBonus":
                    modifiers.CandidateQualityBonus = ApplyOperation(modifiers.CandidateQualityBonus, effect.Value, effect.Operation);
                    break;
                case "operatingCostReduction":
                    modifiers.OperatingCostReduction = ApplyOperation(modifiers.OperatingCostReduction, effect.Value, effect.Operation);
                    break;
                case "equipmentDiscounts":
                    modifiers.EquipmentDiscounts = ApplyOperation(modifiers.EquipmentDiscounts, effect.Value, effect.Operation);
                    break;
                case "reputationGainMultiplier":
                    modifiers.ReputationGainMultiplier = ApplyOperation(modifiers.ReputationGainMultiplier, effect.Value, effect.Operation);
                    break;
                default:
                    Debug.LogWarning($"Unhandled perk effect key: {effect.Key}");
                    break;
            }
        }

        private float ApplyOperation(float currentValue, float effectValue, string operation)
        {
            switch (operation)
            {
                case "multiply":
                    return currentValue * (1f + effectValue);
                case "add":
                    return currentValue + effectValue;
                case "set":
                    return effectValue;
                default:
                    Debug.LogWarning($"Unknown operation type: {operation}");
                    return currentValue;
            }
        }

        // --- Specialization Management ---

        public List<StudioSpecialization> GetAvailableSpecializations()
        {
            // Filter specializations based on player level, completed projects, etc.
            // For now, return all defined specializations
            return new List<StudioSpecialization>(_allSpecializations);
        }

        public bool CanActivateSpecialization(string specializationId)
        {
            if (gameStateSO == null) return false;

            StudioSpecialization specialization = _allSpecializations.Find(s => s.Id == specializationId);
            if (specialization == null) return false;

            // Check if already specialized in this genre
            if (gameStateSO.GameState.StudioSpecializations.ContainsValue(specialization)) return false;

            // Check requirements (e.g., player level, completed projects in genre, money)
            // This would involve checking conditions similar to perks
            return true; // Placeholder
        }

        public bool ActivateSpecialization(string specializationId)
        {
            if (gameStateSO == null) return false;

            StudioSpecialization specialization = _allSpecializations.Find(s => s.Id == specializationId);
            if (specialization == null || !CanActivateSpecialization(specializationId))
            {
                Debug.LogWarning($"Cannot activate specialization {specializationId}. Conditions not met.");
                return false;
            }

            // Deduct cost if any
            // Apply specialization benefits (e.g., add to AggregatedPerkModifiers)
            // Set current specialization in GameState
            gameStateSO.GameState.StudioSpecializations[specialization.Genre] = specialization;
            ApplyAllPerkEffects(); // Re-apply effects to include specialization bonuses

            Debug.Log($"Specialization {specialization.Name} activated!");
            OnSpecializationActivated?.Invoke(specialization);
            OnStudioUpgradesUpdated?.Invoke();
            return true;
        }

        // --- Studio Expansion Purchases (Ported from useStudioExpansion.tsx) ---

        public List<Expansion> GetAvailableExpansions()
        {
            if (gameStateSO == null) return new List<Expansion>();

            List<string> ownedUpgrades = gameStateSO.GameState.OwnedUpgrades;

            return _allExpansions.Where(expansion => {
                if (ownedUpgrades.Contains(expansion.Id)) return false; // Already owned

                // Check requirements
                if (expansion.Requirements != null)
                {
                    if (expansion.Requirements.Level > 0 && gameStateSO.GameState.PlayerData.Level < expansion.Requirements.Level) return false;
                    if (expansion.Requirements.Reputation > 0 && gameStateSO.GameState.Reputation < expansion.Requirements.Reputation) return false;
                    // Add other requirements as needed (e.g., specific perks, completed projects)
                }
                return true;
            }).ToList();
        }

        public bool PurchaseExpansion(string expansionId)
        {
            if (gameStateSO == null) return false;

            Expansion expansion = _allExpansions.Find(e => e.Id == expansionId);
            if (expansion == null || !GetAvailableExpansions().Any(e => e.Id == expansionId))
            {
                Debug.LogWarning($"Cannot purchase expansion {expansionId}. Not available or already owned.");
                return false;
            }

            if (gameStateSO.GameState.Money < expansion.Cost)
            {
                Debug.LogWarning($"Not enough money to purchase expansion {expansionId}. Needed: {expansion.Cost}, Have: {gameStateSO.GameState.Money}");
                return false;
            }

            // Deduct cost
            gameStateSO.GameState.Money -= expansion.Cost;
            gameStateSO.GameState.OwnedUpgrades.Add(expansion.Id);

            // Apply expansion benefits (directly modify GameState or through AggregatedPerkModifiers)
            // For now, directly modify studioSkills multipliers as in TS
            if (expansion.Benefits != null)
            {
                foreach (var benefit in expansion.Benefits)
                {
                    if (gameStateSO.GameState.StudioSkills.ContainsKey(benefit.Key))
                    {
                        gameStateSO.GameState.StudioSkills[benefit.Key].Multiplier *= benefit.Value;
                    }
                }
            }
            ApplyAllPerkEffects(); // Re-apply all perk effects to ensure consistency

            Debug.Log($"Expansion {expansion.Name} purchased!");
            OnExpansionPurchased?.Invoke(expansion);
            OnStudioUpgradesUpdated?.Invoke();
            return true;
        }

        public Dictionary<StudioSkillType, float> GetTotalStudioMultipliers()
        {
            if (gameStateSO == null) return new Dictionary<StudioSkillType, float>();

            Dictionary<StudioSkillType, float> multipliers = new Dictionary<StudioSkillType, float>();
            
            // Start with base multipliers from studio skills
            foreach (var skillEntry in gameStateSO.GameState.StudioSkills)
            {
                multipliers[skillEntry.Key] = skillEntry.Value.Multiplier;
            }

            // Apply owned expansion benefits
            foreach (string upgradeId in gameStateSO.GameState.OwnedUpgrades)
            {
                Expansion expansion = _allExpansions.Find(e => e.Id == upgradeId);
                if (expansion != null && expansion.Benefits != null)
                {
                    foreach (var benefit in expansion.Benefits)
                    {
                        if (multipliers.ContainsKey(benefit.Key))
                        {
                            multipliers[benefit.Key] *= benefit.Value;
                        }
                    }
                }
            }
            return multipliers;
        }

        // --- Industry Prestige (from useStudioUpgrades.ts) ---
        public IndustryPrestige GetIndustryPrestige()
        {
            if (gameStateSO == null || !gameStateSO.GameState.IndustryPrestige.ContainsKey("general"))
            {
                // Return a default or error state if not initialized
                return new IndustryPrestige("general");
            }
            return gameStateSO.GameState.IndustryPrestige["general"];
        }

        public void ProcessProjectCompletionForPrestige(Project project, ProjectCompletionReport report)
        {
            if (gameStateSO == null || !gameStateSO.GameState.IndustryPrestige.ContainsKey("general")) return;

            IndustryPrestige generalPrestige = gameStateSO.GameState.IndustryPrestige["general"];
            
            // Example logic: increase prestige based on project quality and earnings
            generalPrestige.Points += Mathf.RoundToInt(report.QualityScore * 0.5f + report.Earnings / 1000f);

            // Check for tier advancement
            // This logic would be more complex, potentially involving a ScriptableObject for prestige tiers
            if (generalPrestige.Points >= generalPrestige.NextTierRequirement)
            {
                generalPrestige.Level++;
                generalPrestige.Tier = $"Tier {generalPrestige.Level}"; // Simple tier naming
                generalPrestige.NextTierRequirement = generalPrestige.Points + 1000; // Example: next tier requires 1000 more points
                // Apply new benefits
                Debug.Log($"Industry Prestige Leveled Up! New Tier: {generalPrestige.Tier}");
            }
            OnStudioUpgradesUpdated?.Invoke();
        }
    }
}
