using UnityEngine;
using System;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.ScriptableObjects;
using RecordingStudioTycoon.Utils;
using RecordingStudioTycoon.Systems.Market;
using RecordingStudioTycoon.Systems.Progression;
using RecordingStudioTycoon.Systems.Relationship;
using RecordingStudioTycoon.Systems.Project;
using RecordingStudioTycoon.Systems.Staff;
using RecordingStudioTycoon.Systems.Finance; // Assuming a FinanceManager will be created
using RecordingStudioTycoon.Systems.Reward; // For RewardManager

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
        // Dependencies (ScriptableObjects for static data, or other MonoBehaviours/static classes)
        // Managers are now accessed via their singletons, so direct SerializeField references are not always needed here.
        // However, ScriptableObjects for static data are still serialized.
        [SerializeField] private ProgressionDataSO _progressionData; // ScriptableObject for milestones, XP requirements
        [SerializeField] private ProjectDataSO _projectData; // ScriptableObject for project templates, candidate generation rules
        [SerializeField] private EquipmentDataSO _equipmentData; // ScriptableObject for equipment data
        [SerializeField] private StaffDataSO _staffData; // ScriptableObject for staff templates
        [SerializeField] private EraDataSO _eraData; // ScriptableObject for era information
        [SerializeField] private GameStateSO _gameStateSO; // Reference to the global GameState ScriptableObject

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
            // Load game state from save system, or create default
            // For now, create default and assign to GameStateSO
            _gameState = new GameState();
            if (_gameStateSO != null)
            {
                _gameStateSO.GameState = _gameState;
            }
            else
            {
                Debug.LogError("GameStateSO is not assigned to GameManager. Game state will not be persisted correctly.");
            }

            // Initialize dynamic data based on initial game state
            // These would typically be handled by dedicated services/managers
            // Initialize dynamic data based on initial game state
            // These would typically be handled by dedicated services/managers
            // ProjectManager.Instance.InitializeProjects(); // Example call if ProjectManager had an init
            // StaffManager.Instance.InitializeStaff(); // Example call if StaffManager had an init
            // MarketManager.Instance.InitializeMarketTrends(); // MarketManager already initializes in Start
            // ProgressionManager.Instance.InitializeProgression(); // ProgressionManager already initializes in Start
            // RelationshipManager.Instance.InitializeRelationships(); // RelationshipManager already initializes in Start

            // Initial generation of available projects and candidates can still happen here or be moved to their managers
            _gameState.AvailableProjects = ProjectUtils.GenerateNewProjects(3, _gameState.PlayerData.Level, _gameState.CurrentEra);
            _gameState.AvailableCandidates = StaffUtils.GenerateCandidates(3, _gameState);
            _gameState.AvailableSessionMusicians = BandUtils.GenerateSessionMusicians(5);

            Debug.Log("GameManager initialized. Current Day: " + _gameState.currentDay);
            OnGameStateChanged?.Invoke(); // Notify listeners that game state is ready
        }

        // --- Game Actions (Translated from useGameActions.ts) ---

        public void AdvanceDay()
        {
            _gameState.CurrentDay++;
            // Trigger daily events, staff work, project progress, etc.
            PerformDailyWork(); // Call the internal method
            Debug.Log($"Day advanced to: {_gameState.CurrentDay}");
            OnGameStateChanged?.Invoke();
        }

        private void PerformDailyWork()
        {
            // Placeholder for daily work logic.
            // Process active projects (assuming ProjectManager handles this)
            if (ProjectManager.Instance != null)
            {
                ProjectManager.Instance.ProcessActiveProjects(_gameState.CurrentDay);
            }

            // Process staff daily updates (assuming StaffManager handles this)
            if (StaffManager.Instance != null)
            {
                StaffManager.Instance.DailyStaffUpdate(_gameState.CurrentDay);
            }

            // Update market trends (assuming MarketManager handles this)
            if (MarketManager.Instance != null)
            {
                // Pass completed projects from the last day/week if tracked, and global events
                // For now, pass empty lists as these are not yet fully integrated
                MarketManager.Instance.UpdateMarketTrends(new List<DataModels.Projects.Project>(), new List<DataModels.Market.TrendEvent>(), _gameState.CurrentDay);
            }

            // Update charts (assuming ChartManager handles this)
            if (Systems.Charts.ChartManager.Instance != null)
            {
                Systems.Charts.ChartManager.Instance.UpdateAllCharts(_gameState.CurrentDay);
            }

            // Update relationships (assuming RelationshipManager handles this)
            if (RelationshipManager.Instance != null)
            {
                RelationshipManager.Instance.DailyRelationshipUpdate(_gameState.CurrentDay);
            }

            // Process financial updates (assuming FinanceManager handles this)
            if (FinanceManager.Instance != null)
            {
                FinanceManager.Instance.ProcessDailyFinances(_gameState.CurrentDay);
            }

            Debug.Log("Performing daily work...");
        }

        // Removed direct money manipulation. Use FinanceManager.Instance.AddMoney/DeductMoney instead.
        // public void CollectMoney(int amount)
        // {
        //     _gameState.money += amount;
        //     Debug.Log($"Collected {amount} money. Total: {_gameState.money}");
        //     OnGameStateChanged?.Invoke();
        // }

        // public void AddMoney(int amount)
        // {
        //     CollectMoney(amount); // Direct call, as in TS
        // }

        public void AddReputation(int amount) // This method should ideally be handled by RelationshipManager
        {
            if (RelationshipManager.Instance != null)
            {
                // RelationshipManager.Instance.IncreaseOverallReputation(amount); // Example of a method in RelationshipManager
                _gameState.Reputation += amount; // Direct modification for now
                Debug.Log($"Added {amount} reputation. Total: {_gameState.Reputation}");
                OnGameStateChanged?.Invoke();
            }
            else
            {
                Debug.LogWarning("RelationshipManager not found. Cannot add reputation.");
            }
        }

        public void AddXP(int amount) // Delegate to ProgressionManager
        {
            if (ProgressionManager.Instance != null)
            {
                ProgressionManager.Instance.AddXP(amount);
            }
            else
            {
                Debug.LogWarning("ProgressionManager not found. Cannot add XP.");
                // Fallback to direct modification if manager not found (for testing/initial setup)
                _gameState.PlayerData.Xp += amount;
                _gameState.PlayerData.XpToNextLevel = ProgressionUtils.CalculatePlayerXpRequirement(_gameState.PlayerData.Level);
                OnGameStateChanged?.Invoke();
            }
        }

        public void AddAttributePoints(PlayerAttributeType attributeType) // Delegate to ProgressionManager
        {
            if (ProgressionManager.Instance != null)
            {
                ProgressionManager.Instance.AddAttributePoints(attributeType);
            }
            else
            {
                Debug.LogWarning("ProgressionManager not found. Cannot add attribute points.");
                // Fallback to direct modification if manager not found
                if (_gameState.PlayerData.AttributePoints > 0)
                {
                    _gameState.PlayerData.AttributePoints--;
                    // This logic should ideally be in a dedicated PlayerAttributes class/struct
                    switch (attributeType)
                    {
                        case PlayerAttributeType.FocusMastery: _gameState.PlayerData.Attributes.FocusMastery++; break;
                        case PlayerAttributeType.CreativeIntuition: _gameState.PlayerData.Attributes.CreativeIntuition++; break;
                        case PlayerAttributeType.TechnicalAptitude: _gameState.PlayerData.Attributes.TechnicalAptitude++; break;
                        case PlayerAttributeType.BusinessAcumen: _gameState.PlayerData.Attributes.BusinessAcumen++; break;
                        case PlayerAttributeType.Creativity: _gameState.PlayerData.Attributes.Creativity++; break;
                        case PlayerAttributeType.Technical: _gameState.PlayerData.Technical++; break;
                        case PlayerAttributeType.Business: _gameState.PlayerData.Attributes.Business++; break;
                        case PlayerAttributeType.Charisma: _gameState.PlayerData.Attributes.Charisma++; break;
                        case PlayerAttributeType.Luck: _gameState.PlayerData.Attributes.Luck++; break;
                    }
                    OnGameStateChanged?.Invoke();
                }
            }
        }

        public void AddSkillXP(StudioSkillType skillId, int amount) // Delegate to ProgressionManager
        {
            if (ProgressionManager.Instance != null)
            {
                ProgressionManager.Instance.AddSkillXP(skillId, amount);
            }
            else
            {
                Debug.LogWarning("ProgressionManager not found. Cannot add skill XP.");
                // Fallback
                if (_gameState.StudioSkills.ContainsKey(skillId))
                {
                    _gameState.StudioSkills[skillId].Experience += amount;
                    Debug.Log($"Added {amount} XP to {skillId}. Current XP: {_gameState.StudioSkills[skillId].Experience}");
                    OnGameStateChanged?.Invoke();
                }
            }
        }

        public void AddPerkPoint() // Delegate to ProgressionManager
        {
            if (ProgressionManager.Instance != null)
            {
                ProgressionManager.Instance.AddPerkPoint();
            }
            else
            {
                Debug.LogWarning("ProgressionManager not found. Cannot add perk point.");
                // Fallback
                _gameState.PlayerData.PerkPoints++;
                Debug.Log($"Added perk point. Total: {_gameState.PlayerData.PerkPoints}");
                OnGameStateChanged?.Invoke();
            }
        }

        public void TriggerEraTransition(string newEraId) // Delegate to ProgressionManager
        {
            if (ProgressionManager.Instance != null)
            {
                ProgressionManager.Instance.TriggerEraTransition(newEraId);
            }
            else
            {
                Debug.LogWarning("ProgressionManager not found. Cannot trigger era transition.");
                // Fallback
                _gameState.CurrentEra = newEraId;
                OnGameStateChanged?.Invoke();
            }
        }

        public void RefreshCandidates() // Delegate to StaffManager
        {
            if (StaffManager.Instance != null)
            {
                StaffManager.Instance.RefreshAvailableCandidates(_gameState);
            }
            else
            {
                Debug.LogWarning("StaffManager not found. Cannot refresh candidates.");
                // Fallback
                _gameState.AvailableCandidates = StaffUtils.GenerateCandidates(3, _gameState);
                OnGameStateChanged?.Invoke();
            }
        }

        // --- Helper methods for GameState updates ---
        // In C#, direct modification of public fields is common.
        // If complex updates are needed, a dedicated GameStateService could be used,
        // or methods within GameManager that encapsulate the logic.
        // For now, direct modification within GameManager methods is sufficient.

        // Example of a method that might be called by a UI element
        public void SetFocusAllocation(FocusAllocation newAllocation) // Direct GameState update
        {
            _gameState.FocusAllocation = newAllocation;
            OnGameStateChanged?.Invoke();
        }
    }
}
