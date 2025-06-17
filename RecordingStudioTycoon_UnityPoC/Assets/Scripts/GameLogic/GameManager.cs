using UnityEngine;
using System;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels; // Assuming data models are here
using RecordingStudioTycoon.ScriptableObjects; // Assuming ScriptableObjects are here
using RecordingStudioTycoon.Utils; // Assuming utility classes are here

namespace RecordingStudioTycoon.GameLogic
{
    public class GameManager : MonoBehaviour
    {
        // Singleton instance
        public static GameManager Instance { get; private set; }

        [SerializeField] private GameState _gameState; // Use SerializeField to expose in Inspector for debugging
        public GameState GameState => _gameState; // Public getter for GameState

        // Events for UI updates or other systems to subscribe to
        public static event Action<LevelUpDetails> OnPlayerLevelUp;
        public static event Action OnGameStateChanged; // Generic event for any state change

        // Dependencies (ScriptableObjects for static data, or other MonoBehaviours/static classes)
        [SerializeField] private ProgressionData _progressionData; // ScriptableObject for milestones, XP requirements
        [SerializeField] private ProjectData _projectData; // ScriptableObject for project templates, candidate generation rules
        // ... other ScriptableObject dependencies

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject); // Persist across scenes

            InitializeGame();
        }

        private void InitializeGame()
        {
            // Load game state from save system, or create default
            // For now, create default
            _gameState = new GameState();

            // Initialize dynamic data based on initial game state
            // These would typically be handled by dedicated services/managers
            _gameState.availableProjects = ProjectUtils.GenerateNewProjects(3, _gameState.playerData.level, _gameState.currentEra);
            _gameState.availableCandidates = StaffUtils.GenerateCandidates(3, _gameState);
            _gameState.availableSessionMusicians = BandUtils.GenerateSessionMusicians(5);

            Debug.Log("GameManager initialized. Current Day: " + _gameState.currentDay);
            OnGameStateChanged?.Invoke(); // Notify listeners that game state is ready
        }

        // --- Game Actions (Translated from useGameActions.ts) ---

        public void AdvanceDay()
        {
            _gameState.currentDay++;
            // Trigger daily events, staff work, project progress, etc.
            PerformDailyWork(); // Call the internal method
            Debug.Log($"Day advanced to: {_gameState.currentDay}");
            OnGameStateChanged?.Invoke();
        }

        private void PerformDailyWork()
        {
            // Placeholder for daily work logic.
            // This would involve iterating through active projects, staff assignments, etc.
            // and updating the game state accordingly.
            Debug.Log("Performing daily work...");
            // Example: ProjectManager.Instance.ProcessActiveProjects(_gameState);
            // Example: StaffManager.Instance.ProcessStaffActions(_gameState);
        }

        public void CollectMoney(int amount)
        {
            _gameState.money += amount;
            Debug.Log($"Collected {amount} money. Total: {_gameState.money}");
            OnGameStateChanged?.Invoke();
        }

        public void AddMoney(int amount)
        {
            CollectMoney(amount); // Direct call, as in TS
        }

        public void AddReputation(int amount)
        {
            _gameState.reputation += amount;
            Debug.Log($"Added {amount} reputation. Total: {_gameState.reputation}");
            OnGameStateChanged?.Invoke();
        }

        public void AddXP(int amount)
        {
            bool levelUpOccurred = false;
            int initialPlayerLevel = _gameState.playerData.level;
            int newPlayerLevel = initialPlayerLevel;
            int currentXp = _gameState.playerData.xp + amount;
            int xpToNext = _gameState.playerData.xpToNextLevel;
            int perkPointsGainedThisLevelUp = 0;
            int attributePointsGainedThisLevelUp = 0;

            List<UnlockedFeatureInfo> collectedUnlockedFeatures = new List<UnlockedFeatureInfo>();
            List<PlayerAbilityChange> collectedAbilityChanges = new List<PlayerAbilityChange>();
            List<PlayerAttributeChange> collectedAttributeChanges = new List<PlayerAttributeChange>();

            while (currentXp >= xpToNext)
            {
                levelUpOccurred = true;
                newPlayerLevel++;
                currentXp -= xpToNext;
                xpToNext = ProgressionUtils.CalculatePlayerXpRequirement(newPlayerLevel); // Use C# utility
                
                // Access milestones from ScriptableObject or static data
                PlayerMilestone milestone = _progressionData?.GetPlayerMilestone(newPlayerLevel); // Null check for _progressionData
                if (milestone != null)
                {
                    if (milestone.UnlockedFeatures != null)
                    {
                        collectedUnlockedFeatures.AddRange(milestone.UnlockedFeatures);
                    }
                    if (milestone.AbilityChanges != null)
                    {
                        collectedAbilityChanges.AddRange(milestone.AbilityChanges);
                    }
                    perkPointsGainedThisLevelUp += milestone.PerkPointsGained;
                    attributePointsGainedThisLevelUp += milestone.AttributePointsGained;
                }
            }

            _gameState.playerData.xp = currentXp;
            _gameState.playerData.level = newPlayerLevel;
            _gameState.playerData.xpToNextLevel = xpToNext;
            _gameState.playerData.perkPoints += perkPointsGainedThisLevelUp;
            _gameState.playerData.attributePoints += attributePointsGainedThisLevelUp;

            if (levelUpOccurred)
            {
                // Apply direct ability changes
                foreach (var change in collectedAbilityChanges)
                {
                    if (change.Name == "Daily Work Capacity" && change.NewValue is int)
                    {
                        _gameState.playerData.dailyWorkCapacity = (int)change.NewValue;
                    }
                    // Add other direct ability changes here
                }

                LevelUpDetails detailsForModal = new LevelUpDetails
                {
                    NewPlayerLevel = newPlayerLevel,
                    UnlockedFeatures = collectedUnlockedFeatures,
                    AbilityChanges = collectedAbilityChanges,
                    AttributeChanges = collectedAttributeChanges, // Will be empty based on current milestone setup
                    ProjectSummaries = new List<ProjectSummary>(), // Placeholder
                    StaffHighlights = new List<StaffHighlight>() // Placeholder
                };
                OnPlayerLevelUp?.Invoke(detailsForModal); // Trigger event for UI
            }
            OnGameStateChanged?.Invoke();
        }

        public void AddAttributePoints(string attributeName) // Use string for attribute name
        {
            if (_gameState.playerData.attributePoints > 0)
            {
                // Use reflection or a switch statement to update the specific attribute
                // For simplicity, assuming direct access or a helper method
                switch (attributeName)
                {
                    case "focusMastery": _gameState.playerData.attributes.focusMastery++; break;
                    case "creativeIntuition": _gameState.playerData.attributes.creativeIntuition++; break;
                    case "technicalAptitude": _gameState.playerData.attributes.technicalAptitude++; break;
                    case "businessAcumen": _gameState.playerData.attributes.businessAcumen++; break;
                    case "creativity": _gameState.playerData.attributes.creativity++; break;
                    case "technical": _gameState.playerData.technical++; break;
                    case "business": _gameState.playerData.attributes.business++; break;
                    case "charisma": _gameState.playerData.attributes.charisma++; break;
                    case "luck": _gameState.playerData.attributes.luck++; break;
                }
                _gameState.playerData.attributePoints--;
                OnGameStateChanged?.Invoke();
            }
        }

        public void AddSkillXP(StudioSkillType skillId, int amount)
        {
            if (_gameState.studioSkills.ContainsKey(skillId))
            {
                _gameState.studioSkills[skillId].Experience += amount;
                // Add skill level up logic here or in ProgressionUtils
                Debug.Log($"Added {amount} XP to {skillId}. Current XP: {_gameState.studioSkills[skillId].Experience}");
                OnGameStateChanged?.Invoke();
            }
        }

        public void AddPerkPoint()
        {
            _gameState.playerData.perkPoints++;
            Debug.Log($"Added perk point. Total: {_gameState.playerData.perkPoints}");
            OnGameStateChanged?.Invoke();
        }

        public void TriggerEraTransition(string newEraId)
        {
            Debug.Log($"Triggering era transition to {newEraId} (placeholder)");
            _gameState.currentEra = newEraId;
            OnGameStateChanged?.Invoke();
        }

        public void RefreshCandidates()
        {
            Debug.Log("Refreshing candidates (placeholder in GameManager)");
            _gameState.availableCandidates = StaffUtils.GenerateCandidates(3, _gameState);
            OnGameStateChanged?.Invoke();
        }

        // --- Helper methods for GameState updates ---
        // In C#, direct modification of public fields is common.
        // If complex updates are needed, a dedicated GameStateService could be used,
        // or methods within GameManager that encapsulate the logic.
        // For now, direct modification within GameManager methods is sufficient.

        // Example of a method that might be called by a UI element
        public void SetFocusAllocation(FocusAllocation newAllocation)
        {
            _gameState.focusAllocation = newAllocation;
            OnGameStateChanged?.Invoke();
        }
    }
}
