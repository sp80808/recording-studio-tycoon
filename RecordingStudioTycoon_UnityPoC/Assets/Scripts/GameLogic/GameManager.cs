using UnityEngine;
using System;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.DataModels.Projects; // For Project, OriginalTrackProject
using RecordingStudioTycoon.DataModels.Staff; // For StaffMember, SessionMusician
using RecordingStudioTycoon.DataModels.Equipment; // For Equipment
using RecordingStudioTycoon.DataModels.Market; // For MarketState, TrendEvent
using RecordingStudioTycoon.DataModels.Songs; // For Song, Band
using RecordingStudioTycoon.DataModels.Tours; // For Venue, Tour
using RecordingStudioTycoon.DataModels.Characters; // For Artist
using RecordingStudioTycoon.Utils; // For SerializableDictionary, ProjectUtils, StaffUtils, BandUtils, ProgressionUtils
using RecordingStudioTycoon.Core; // For GameStateData
using RecordingStudioTycoon.Systems.Market;
using RecordingStudioTycoon.Systems.Progression;
using RecordingStudioTycoon.Systems.Relationship;
using RecordingStudioTycoon.Systems.Project;
using RecordingStudioTycoon.Systems.Staff;
using RecordingStudioTycoon.Systems.Finance;
using RecordingStudioTycoon.Systems.Reward; // For RewardManager

namespace RecordingStudioTycoon.GameLogic
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [SerializeField] private GameState _gameState;
        public GameState CurrentGameState => _gameState; // Renamed to CurrentGameState for clarity

        public static event Action<LevelUpDetails> OnPlayerLevelUp;
        public static event Action OnGameStateChanged;

        [SerializeField] private ProgressionData _progressionData;
        [SerializeField] private ProjectData _projectData;
        [SerializeField] private EquipmentData _equipmentData;
        [SerializeField] private StaffData _staffData;
        [SerializeField] private EraData _eraData;
        [SerializeField] private StudioPerkData _studioPerkData; // Added StudioPerkData
        [SerializeField] private GameStateData _gameStateData; // Renamed from GameStateSO

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            InitializeGame();
        }

        private void InitializeGame()
        {
            _gameState = new GameState();
            if (_gameStateData != null)
            {
                _gameStateData.GameState = _gameState;
            }
            else
            {
                Debug.LogError("GameStateData is not assigned to GameManager. Game state will not be persisted correctly.");
            }

            _gameState.availableProjects = ProjectUtils.GenerateNewProjects(3, _gameState.playerData.level, _gameState.currentEra);
            _gameState.availableCandidates = StaffUtils.GenerateCandidates(3, _gameState);
            _gameState.availableSessionMusicians = BandUtils.GenerateSessionMusicians(5);

            Debug.Log("GameManager initialized. Current Day: " + _gameState.currentDay);
            OnGameStateChanged?.Invoke();
        }

        public void AdvanceDay()
        {
            _gameState.currentDay++;
            PerformDailyWork();
            Debug.Log($"Day advanced to: {_gameState.currentDay}");
            OnGameStateChanged?.Invoke();
        }

        private void PerformDailyWork()
        {
            if (ProjectManager.Instance != null)
            {
                ProjectManager.Instance.ProcessActiveProjects(_gameState.currentDay);
            }

            if (StaffManager.Instance != null)
            {
                StaffManager.Instance.DailyStaffUpdate(_gameState.currentDay);
            }

            if (MarketManager.Instance != null)
            {
                MarketManager.Instance.UpdateMarketAndCharts(new List<Project>(), new List<TrendEvent>());
            }

            // ChartManager is now part of MarketManager, so no separate call needed here.

            if (RelationshipManager.Instance != null)
            {
                // RelationshipManager.Instance.DailyRelationshipUpdate(_gameState.CurrentDay); // This method doesn't exist in RelationshipManager.cs
                // Instead, individual relationship updates should be triggered by specific game events (e.g., project completion)
            }

            if (FinanceManager.Instance != null)
            {
                FinanceManager.Instance.ProcessDailyFinances(_gameState.currentDay);
            }

            Debug.Log("Performing daily work...");
        }

        public void AddReputation(int amount)
        {
            if (RelationshipManager.Instance != null)
            {
                // RelationshipManager.Instance.IncreaseOverallReputation(amount); // Example of a method in RelationshipManager
                _gameState.reputation += amount;
                Debug.Log($"Added {amount} reputation. Total: {_gameState.reputation}");
                OnGameStateChanged?.Invoke();
            }
            else
            {
                Debug.LogWarning("RelationshipManager not found. Cannot add reputation.");
            }
        }

        public void AddXP(int amount)
        {
            if (ProgressionManager.Instance != null)
            {
                ProgressionManager.Instance.AddXP(amount);
            }
            else
            {
                Debug.LogWarning("ProgressionManager not found. Cannot add XP.");
                _gameState.playerData.xp += amount;
                _gameState.playerData.xpToNextLevel = _progressionData.CalculateXPToNextLevel(_gameState.playerData.level); // Use _progressionData
                OnGameStateChanged?.Invoke();
            }
        }

        public void AddAttributePoints(PlayerAttributeType attributeType)
        {
            if (ProgressionManager.Instance != null)
            {
                ProgressionManager.Instance.AddAttributePoints(attributeType);
            }
            else
            {
                Debug.LogWarning("ProgressionManager not found. Cannot add attribute points.");
                if (_gameState.playerData.attributePoints > 0)
                {
                    _gameState.playerData.attributePoints--;
                    switch (attributeType)
                    {
                        case PlayerAttributeType.FocusMastery: _gameState.playerData.attributes.focusMastery++; break;
                        case PlayerAttributeType.CreativeIntuition: _gameState.playerData.attributes.creativeIntuition++; break;
                        case PlayerAttributeType.TechnicalAptitude: _gameState.playerData.attributes.technicalAptitude++; break;
                        case PlayerAttributeType.BusinessAcumen: _gameState.playerData.attributes.businessAcumen++; break;
                        case PlayerAttributeType.Creativity: _gameState.playerData.attributes.creativity++; break;
                        case PlayerAttributeType.Technical: _gameState.playerData.technical++; break;
                        case PlayerAttributeType.Business: _gameState.playerData.attributes.business++; break;
                        case PlayerAttributeType.Charisma: _gameState.playerData.attributes.charisma++; break;
                        case PlayerAttributeType.Luck: _gameState.playerData.attributes.luck++; break;
                    }
                    OnGameStateChanged?.Invoke();
                }
            }
        }

        public void AddSkillXP(StudioSkillType skillId, int amount)
        {
            if (ProgressionManager.Instance != null)
            {
                ProgressionManager.Instance.AddSkillXP(skillId, amount);
            }
            else
            {
                Debug.LogWarning("ProgressionManager not found. Cannot add skill XP.");
                if (_gameState.studioSkills.ContainsKey(skillId))
                {
                    _gameState.studioSkills[skillId].experience += amount;
                    Debug.Log($"Added {amount} XP to {skillId}. Current XP: {_gameState.studioSkills[skillId].experience}");
                    OnGameStateChanged?.Invoke();
                }
            }
        }

        public void AddPerkPoint()
        {
            if (ProgressionManager.Instance != null)
            {
                ProgressionManager.Instance.AddPerkPoint();
            }
            else
            {
                Debug.LogWarning("ProgressionManager not found. Cannot add perk point.");
                _gameState.playerData.perkPoints++;
                Debug.Log($"Added perk point. Total: {_gameState.playerData.perkPoints}");
                OnGameStateChanged?.Invoke();
            }
        }

        public void TriggerEraTransition(string newEraId)
        {
            if (ProgressionManager.Instance != null)
            {
                ProgressionManager.Instance.TriggerEraTransition(newEraId);
            }
            else
            {
                Debug.LogWarning("ProgressionManager not found. Cannot trigger era transition.");
                _gameState.currentEra = newEraId;
                OnGameStateChanged?.Invoke();
            }
        }

        public void RefreshCandidates()
        {
            if (StaffManager.Instance != null)
            {
                StaffManager.Instance.RefreshAvailableCandidates(_gameState);
            }
            else
            {
                Debug.LogWarning("StaffManager not found. Cannot refresh candidates.");
                _gameState.availableCandidates = StaffUtils.GenerateCandidates(3, _gameState);
                OnGameStateChanged?.Invoke();
            }
        }

        public void UpdateGameState(GameState newGameState)
        {
            _gameState = newGameState;
            if (_gameStateData != null)
            {
                _gameStateData.GameState = _gameState;
            }
            OnGameStateChanged?.Invoke();
        }

        public void SetFocusAllocation(FocusAllocation newAllocation)
        {
            _gameState.focusAllocation = newAllocation;
            OnGameStateChanged?.Invoke();
        }
    }
}
