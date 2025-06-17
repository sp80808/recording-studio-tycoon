using UnityEngine;
using System;
using System.Collections.Generic;
using System.Linq;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.GameLogic; // For GameManager and GameState
using RecordingStudioTycoon.Utils; // For any utility functions

namespace RecordingStudioTycoon.Systems.Progression
{
    public class ProgressionManager : MonoBehaviour
    {
        public static ProgressionManager Instance { get; private set; }

        [SerializeField] private ProgressionData progressionData; // Assign ScriptableObject in Inspector
        [SerializeField] private StudioPerkData studioPerkData; // Assign ScriptableObject in Inspector
        [SerializeField] private List<EraData> allEras; // Assign all Era ScriptableObjects in Inspector

        // Events for progression updates
        public event Action OnPlayerLevelUp;
        public event Action OnPerkUnlocked;
        public event Action OnEraTransition;
        public event Action OnMilestoneReached;

        private Dictionary<string, StudioPerk> allPerksLookup;

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
            if (progressionData == null)
            {
                Debug.LogError("ProgressionData ScriptableObject not assigned to ProgressionManager.");
                return;
            }
            if (studioPerkData == null)
            {
                Debug.LogError("StudioPerkData ScriptableObject not assigned to ProgressionManager.");
                return;
            }
            if (allEras == null || allEras.Count == 0)
            {
                Debug.LogError("EraData ScriptableObjects not assigned to ProgressionManager.");
            }

            InitializePerkLookup();

            // Subscribe to game state changes if GameManager provides an event
            // GameManager.Instance.OnGameStateChanged += OnGameStateChanged; // Example
        }

        private void OnDestroy()
        {
            // if (GameManager.Instance != null)
            // {
            //     GameManager.Instance.OnGameStateChanged -= OnGameStateChanged;
            // }
        }

        private void InitializePerkLookup()
        {
            allPerksLookup = new Dictionary<string, StudioPerk>();
            if (studioPerkData != null && studioPerkData.allPerks != null)
            {
                foreach (var perk in studioPerkData.allPerks)
                {
                    if (!allPerksLookup.ContainsKey(perk.id))
                    {
                        allPerksLookup.Add(perk.id, perk);
                    }
                    else
                    {
                        Debug.LogWarning($"Duplicate perk ID found: {perk.id}. Skipping.");
                    }
                }
            }
        }

        // --- Player Progression (XP & Level) ---
        public void AddXP(int amount)
        {
            if (GameManager.Instance == null) return;

            GameState currentGameState = GameManager.Instance.CurrentGameState;
            currentGameState.playerData.xp += amount;
            Debug.Log($"Added {amount} XP. Current XP: {currentGameState.playerData.xp}");

            CheckAndHandleLevelUp();
            GameManager.Instance.UpdateGameState(currentGameState); // Notify GameManager of state change
        }

        public void CheckAndHandleLevelUp()
        {
            if (GameManager.Instance == null || progressionData == null) return;

            GameState currentGameState = GameManager.Instance.CurrentGameState;
            PlayerData playerData = currentGameState.playerData;
            
            int newLevel = playerData.level;
            int newXP = playerData.xp;
            int newPerkPoints = playerData.perkPoints;
            bool leveledUp = false;

            while (newXP >= progressionData.CalculateXPToNextLevel(newLevel))
            {
                newXP -= progressionData.CalculateXPToNextLevel(newLevel);
                newLevel++;
                int perkPointsToAdd = newLevel <= 10 ? 2 : (newLevel <= 25 ? 1 : 0);
                newPerkPoints += perkPointsToAdd;
                leveledUp = true;

                Debug.Log($"Player Leveled Up to Level {newLevel}! Earned {perkPointsToAdd} Perk Points.");
                // TODO: Trigger UI notification (e.g., a toast or modal)
                OnPlayerLevelUp?.Invoke();
            }

            if (leveledUp)
            {
                playerData.level = newLevel;
                playerData.xp = newXP;
                playerData.xpToNextLevel = progressionData.CalculateXPToNextLevel(newLevel);
                playerData.perkPoints = newPerkPoints;
                // Update daily work capacity based on new level and focus mastery
                playerData.dailyWorkCapacity = playerData.attributes.focusMastery + 3 + playerData.level - 1;
                GameManager.Instance.UpdateGameState(currentGameState); // Ensure GameState is updated
                CheckEraTransition(currentGameState); // Check for era transition after level up
            }
        }

        public int GetXPToNextLevel(int currentLevel)
        {
            if (progressionData == null) return 0;
            return progressionData.CalculateXPToNextLevel(currentLevel);
        }

        // --- Studio Perks & Upgrades ---
        public bool CanUnlockPerk(string perkId)
        {
            if (GameManager.Instance == null || !allPerksLookup.ContainsKey(perkId)) return false;

            StudioPerk perk = allPerksLookup[perkId];
            GameState gameState = GameManager.Instance.CurrentGameState;

            // Check if already owned (if not repeatable)
            if (gameState.ownedUpgrades.Contains(perk.id) && !perk.isRepeatable) return false;
            // Check max repeats
            if (perk.isRepeatable && perk.maxRepeats > 0)
            {
                int timesOwned = gameState.ownedUpgrades.Count(id => id == perk.id);
                if (timesOwned >= perk.maxRepeats) return false;
            }
            // Check prerequisites
            if (perk.prerequisites != null && perk.prerequisites.Any(prereqId => !gameState.ownedUpgrades.Contains(prereqId)))
            {
                return false;
            }
            // Check unlock conditions
            return perk.unlockConditions.All(condition => CheckPerkCondition(condition, gameState));
        }

        public bool UnlockPerk(string perkId)
        {
            if (!CanUnlockPerk(perkId))
            {
                Debug.LogWarning($"Cannot unlock perk {perkId}. Conditions not met or already owned.");
                // TODO: Trigger UI toast/notification for why it failed
                return false;
            }

            StudioPerk perk = allPerksLookup[perkId];
            GameState currentGameState = GameManager.Instance.CurrentGameState;

            // Check and deduct cost
            if (perk.cost != null)
            {
                if (perk.cost.money > 0 && currentGameState.money < perk.cost.money)
                {
                    Debug.LogWarning($"Not enough money to unlock {perk.name}. Needed: {perk.cost.money}, Have: {currentGameState.money}");
                    return false;
                }
                if (perk.cost.perkPoints > 0 && currentGameState.playerData.perkPoints < perk.cost.perkPoints)
                {
                    Debug.LogWarning($"Not enough perk points to unlock {perk.name}. Needed: {perk.cost.perkPoints}, Have: {currentGameState.playerData.perkPoints}");
                    return false;
                }

                currentGameState.money -= perk.cost.money;
                currentGameState.playerData.perkPoints -= perk.cost.perkPoints;
            }

            currentGameState.ownedUpgrades.Add(perk.id);
            ApplyPerkEffects(perk, currentGameState); // Apply effects immediately
            GameManager.Instance.UpdateGameState(currentGameState); // Update global state

            Debug.Log($"Perk '{perk.name}' unlocked successfully!");
            OnPerkUnlocked?.Invoke();
            return true;
        }

        public List<StudioPerk> GetAvailablePerks()
        {
            if (GameManager.Instance == null || studioPerkData == null) return new List<StudioPerk>();
            return studioPerkData.allPerks.Where(perk => CanUnlockPerk(perk.id)).ToList();
        }

        public List<StudioPerk> GetOwnedPerks()
        {
            if (GameManager.Instance == null) return new List<StudioPerk>();
            return GameManager.Instance.CurrentGameState.ownedUpgrades
                .Select(id => allPerksLookup.ContainsKey(id) ? allPerksLookup[id] : null)
                .Where(perk => perk != null)
                .ToList();
        }

        private bool CheckPerkCondition(PerkUnlockCondition condition, GameState gameState)
        {
            switch (condition.type)
            {
                case ConditionType.PlayerLevel:
                    return gameState.playerData.level >= condition.value;
                case ConditionType.StudioReputation:
                    return gameState.reputation >= condition.value;
                case ConditionType.CompletedProjects:
                    return gameState.completedProjects.Count >= condition.value;
                case ConditionType.ProjectsInGenre:
                    return gameState.completedProjects.Count(p => p.genre == condition.genre) >= condition.value;
                case ConditionType.SpecificEquipmentOwned:
                    return gameState.ownedEquipment.Any(eq => eq.id == condition.equipmentId);
                case ConditionType.SpecificPerkUnlocked:
                    return gameState.ownedUpgrades.Contains(condition.perkId);
                case ConditionType.MoneyEarned:
                    // This would require tracking total money earned, not just current money
                    // For now, return true or implement a tracking mechanism
                    return true; 
                case ConditionType.ChartSuccesses:
                    // This would require tracking chart successes
                    return true;
                default:
                    return false;
            }
        }

        private void ApplyPerkEffects(StudioPerk perk, GameState gameState)
        {
            if (gameState.aggregatedPerkModifiers == null)
            {
                gameState.aggregatedPerkModifiers = new AggregatedPerkModifiers();
            }

            foreach (var effect in perk.effects)
            {
                // This is a simplified application. A more robust system would use reflection
                // or a dedicated effect application class.
                switch (effect.key)
                {
                    case "globalRecordingQualityModifier":
                        if (effect.operation == EffectOperation.Multiply) gameState.aggregatedPerkModifiers.globalRecordingQualityModifier *= (1 + effect.value);
                        else if (effect.operation == EffectOperation.Add) gameState.aggregatedPerkModifiers.globalRecordingQualityModifier += effect.value;
                        break;
                    case "contractPayoutModifier":
                        if (effect.operation == EffectOperation.Multiply) gameState.aggregatedPerkModifiers.contractPayoutModifier *= (1 + effect.value);
                        else if (effect.operation == EffectOperation.Add) gameState.aggregatedPerkModifiers.contractPayoutModifier += effect.value;
                        break;
                    case "candidateQualityBonus":
                        if (effect.operation == EffectOperation.Add) gameState.aggregatedPerkModifiers.candidateQualityBonus += (int)effect.value;
                        break;
                    case "projectAppealModifier":
                        // Handle genre-specific appeal modifiers
                        if (effect.genre != MusicGenre.Pop) // Assuming Pop is default/all
                        {
                            // This needs a proper dictionary or map in AggregatedPerkModifiers
                            // For now, a placeholder.
                            Debug.LogWarning($"Genre-specific projectAppealModifier for {effect.genre} not fully implemented in AggregatedPerkModifiers.");
                        }
                        else
                        {
                            // Apply to all if no specific genre
                            if (effect.operation == EffectOperation.Add) gameState.aggregatedPerkModifiers.projectAppealModifier["all"] += effect.value;
                            else if (effect.operation == EffectOperation.Multiply) gameState.aggregatedPerkModifiers.projectAppealModifier["all"] *= (1 + effect.value);
                        }
                        break;
                    // Add other cases for different perk effect keys
                    default:
                        Debug.LogWarning($"Unhandled perk effect key: {effect.key}");
                        break;
                }
            }
            Debug.Log("Aggregated Perk Modifiers after applying perk effects: " + JsonUtility.ToJson(gameState.aggregatedPerkModifiers));
        }

        // --- Era Transitions & Content Unlocks ---
        public void CheckEraTransition(GameState gameState)
        {
            if (allEras == null || allEras.Count == 0) return;

            EraData currentEraData = allEras.Find(e => e.eraId == gameState.currentEra);
            EraData nextEra = allEras.OrderBy(e => e.minPlayerLevel).FirstOrDefault(e => e.minPlayerLevel > gameState.playerData.level && e.minPlayerLevel <= gameState.playerData.level + 5); // Look ahead a few levels

            if (nextEra != null && gameState.playerData.level >= nextEra.minPlayerLevel && gameState.currentEra != nextEra.eraId)
            {
                Debug.Log($"Transitioning to new era: {nextEra.eraName}");
                gameState.currentEra = nextEra.eraId;
                ApplyEraUnlocks(nextEra, gameState);
                OnEraTransition?.Invoke();
                GameManager.Instance.UpdateGameState(gameState); // Update global state
                // TODO: Trigger UI notification for era transition
            }
        }

        private void ApplyEraUnlocks(EraData era, GameState gameState)
        {
            foreach (var unlock in era.unlocks)
            {
                Debug.Log($"Unlocked: {unlock.description} ({unlock.unlockType}: {unlock.unlockId})");
                // This is where you'd add logic to actually unlock things in the game
                // e.g., add equipment to available list, enable new staff roles, etc.
                // This will likely involve interacting with other managers (e.g., EquipmentManager, StaffManager)
                // For now, just log the unlock.
            }
        }

        // --- Achievement Milestones Tracking ---
        public void CheckMilestones(GameState gameState)
        {
            if (progressionData == null || progressionData.milestones == null) return;

            foreach (var milestone in progressionData.milestones)
            {
                if (!gameState.completedMilestones.Contains(milestone.level.ToString()) && // Using level as ID for simplicity
                    MeetsMilestoneRequirements(milestone, gameState))
                {
                    gameState.completedMilestones.Add(milestone.level.ToString());
                    Debug.Log($"Milestone Reached: {milestone.unlockMessage}");
                    OnMilestoneReached?.Invoke();
                    // TODO: Trigger UI notification for milestone
                }
            }
            GameManager.Instance.UpdateGameState(gameState); // Ensure state is updated after checking milestones
        }

        private bool MeetsMilestoneRequirements(ProgressionMilestone milestone, GameState gameState)
        {
            return gameState.playerData.level >= milestone.level &&
                   gameState.hiredStaff.Count >= milestone.staffCount &&
                   gameState.completedProjects.Count >= milestone.projectsCompleted;
        }

        public ProgressionMilestone GetCurrentMilestone(GameState gameState)
        {
            if (progressionData == null || progressionData.milestones == null) return null;
            return progressionData.milestones
                .Where(m => MeetsMilestoneRequirements(m, gameState))
                .OrderByDescending(m => m.level)
                .FirstOrDefault();
        }

        public ProgressionMilestone GetNextMilestone(GameState gameState)
        {
            if (progressionData == null || progressionData.milestones == null) return null;
            return progressionData.milestones
                .Where(m => !MeetsMilestoneRequirements(m, gameState))
                .OrderBy(m => m.level)
                .FirstOrDefault();
        }

        public float GetProgressToNextMilestone(GameState gameState)
        {
            ProgressionMilestone nextMilestone = GetNextMilestone(gameState);
            if (nextMilestone == null) return 1f; // Already at max milestone or no next

            float levelProgress = Mathf.Min(1f, (float)gameState.playerData.level / nextMilestone.level);
            float staffProgress = Mathf.Min(1f, (float)gameState.hiredStaff.Count / nextMilestone.staffCount);
            float projectProgress = Mathf.Min(1f, (float)gameState.completedProjects.Count / nextMilestone.projectsCompleted);

            // Average of relevant progress metrics
            int validMetrics = 0;
            float totalProgress = 0;

            if (nextMilestone.level > 0) { totalProgress += levelProgress; validMetrics++; }
            if (nextMilestone.staffCount > 0) { totalProgress += staffProgress; validMetrics++; }
            if (nextMilestone.projectsCompleted > 0) { totalProgress += projectProgress; validMetrics++; }

            return validMetrics > 0 ? totalProgress / validMetrics : 0f;
        }

        // --- Studio Expansion Purchases ---
        // This will likely be handled by a separate StudioManager or directly by UI,
        // but ProgressionManager might provide data or validation.
        // For now, no direct porting of useStudioExpansion.tsx logic here,
        // as it primarily modifies GameState directly and triggers toasts.
        // The data models for Expansion would be needed.
    }
}