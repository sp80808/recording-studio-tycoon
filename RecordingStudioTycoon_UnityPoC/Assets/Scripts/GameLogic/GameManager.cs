using UnityEngine;
using System;
using System.Collections.Generic;
using System.Linq;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.ScriptableObjects;
using RecordingStudioTycoon.Core;
using RecordingStudioTycoon.Systems.Staff;
using RecordingStudioTycoon.Systems.Project;
using RecordingStudioTycoon.Systems.Market;
using RecordingStudioTycoon.Systems.BandAndSong;
using RecordingStudioTycoon.Systems.Minigame;
using RecordingStudioTycoon.Systems.StudioUpgrade;
using RecordingStudioTycoon.Systems.Relationship;
using RecordingStudioTycoon.UI;
using RecordingStudioTycoon.Utils;
using UnityEngine.SceneManagement;

namespace RecordingStudioTycoon.GameLogic
{
    public enum GameStateEnum
    {
        MainMenu,
        InGame,
        Paused,
        Minigame,
        GameOver,
        EraTransition,
        Settings,
        None // Default or uninitialized state
    }

    public class GameManager : MonoBehaviour
    {
        // Singleton instance
        public static GameManager Instance { get; private set; }

        [SerializeField] private GameState _gameState;
        public GameState GameState => _gameState;

        // FSM
        private GameStateEnum _currentGameState;
        public GameStateEnum CurrentGameState => _currentGameState;
        public static event Action<GameStateEnum, GameStateEnum> OnGameStateChanged;

        // Scoring System
        public int Money => _gameState.money;
        public int Reputation => _gameState.reputation;
        public int CurrentDay => _gameState.currentDay;
        public int CurrentYear => _gameState.currentYear;
        public int HighScore => _gameState.highScore;
        public int PlayerXp => _gameState.playerData.xp;
        public int PlayerLevel => _gameState.playerData.level;

        // Events for UI updates or other systems to subscribe to
        public static event Action<LevelUpDetails> OnPlayerLevelUp;
        public static event Action OnGameDataChanged;

        // Dependencies (ScriptableObjects for static data, or other MonoBehaviours/static classes)
        [SerializeField] private ProgressionData _progressionData;
        [SerializeField] private ProjectData _projectData;
        [SerializeField] private StaffData _staffData;
        [SerializeField] private EraData _eraData;

        // System References
        [SerializeField] private SaveSystem _saveSystem;
        [SerializeField] private StaffManagement _staffManagement;
        [SerializeField] private ProjectManager _projectManager;
        [SerializeField] private MarketManager _marketManager;
        [SerializeField] private BandAndSongManager _bandAndSongManager;
        [SerializeField] private MinigameManager _minigameManager;
        [SerializeField] private StudioUpgradeManager _studioUpgradeManager;
        [SerializeField] private RelationshipManager _relationshipManager;
        [SerializeField] private AudioManager _audioManager;

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
            SetState(GameStateEnum.MainMenu);
        }

        private void InitializeGame()
        {
            if (_saveSystem == null) _saveSystem = SaveSystem.Instance;
            if (_staffManagement == null) _staffManagement = StaffManagement.Instance;
            if (_projectManager == null) _projectManager = ProjectManager.Instance;
            if (_marketManager == null) _marketManager = MarketManager.Instance;
            if (_bandAndSongManager == null) _bandAndSongManager = BandAndSongManager.Instance;
            if (_minigameManager == null) _minigameManager = MinigameManager.Instance;
            if (_studioUpgradeManager == null) _studioUpgradeManager = StudioUpgradeManager.Instance;
            if (_relationshipManager == null) _relationshipManager = RelationshipManager.Instance;
            if (_audioManager == null) _audioManager = AudioManager.Instance;

            _gameState = _saveSystem?.LoadGame();

            if (_gameState == null)
            {
                _gameState = new GameState();
                Debug.Log("No save data found. Initializing new game state.");
            }
            else
            {
                Debug.Log("Loaded game state from save data.");
            }

            if (_staffManagement != null && _staffManagement.GetComponent<StaffManagement>().staffData == null)
            {
                _staffManagement.GetComponent<StaffManagement>().staffData = _staffData;
            }
            if (_projectManager != null && _projectManager.GetComponent<ProjectManager>().projectData == null)
            {
                _projectManager.GetComponent<ProjectManager>().projectData = _projectData;
            }
            
            _gameState.availableProjects = Utils.ProjectUtils.GenerateNewProjects(3, _gameState.playerData.level, _gameState.currentEra);
            _gameState.availableCandidates = Utils.StaffUtils.GenerateCandidates(3, _gameState);
            _gameState.availableSessionMusicians = Utils.BandUtils.GenerateSessionMusicians(5);

            Debug.Log("GameManager initialized. Current Day: " + _gameState.currentDay);
            OnGameDataChanged?.Invoke();
        }

        public void SetState(GameStateEnum newState)
        {
            if (_currentGameState == newState) return;

            Debug.Log($"Transitioning from {_currentGameState} to {newState}");
            GameStateEnum previousState = _currentGameState;
            _currentGameState = newState;

            OnStateExit(previousState);
            OnStateEnter(newState);
            
            if (UIManager.Instance != null)
            {
                UIManager.Instance.UpdateReactUnityProps();
            }

            OnGameStateChanged?.Invoke(previousState, newState);
            OnGameDataChanged?.Invoke();
        }

        private void Start()
        {
            if (UIManager.Instance != null)
            {
                UIManager.Instance.UpdateReactUnityProps();
            }
        }

        private void OnStateEnter(GameStateEnum state)
        {
            switch (state)
            {
                case GameStateEnum.MainMenu:
                    Debug.Log("Entering MainMenu state.");
                    break;
                case GameStateEnum.InGame:
                    Debug.Log("Entering InGame state.");
                    break;
                case GameStateEnum.Paused:
                    Debug.Log("Entering Paused state.");
                    Time.timeScale = 0f;
                    break;
                case GameStateEnum.Minigame:
                    Debug.Log("Entering Minigame state.");
                    break;
                case GameStateEnum.GameOver:
                    Debug.Log("Entering GameOver state.");
                    SaveGameData();
                    break;
                case GameStateEnum.EraTransition:
                    Debug.Log("Entering EraTransition state.");
                    break;
                case GameStateEnum.Settings:
                    Debug.Log("Entering Settings state.");
                    break;
            }
        }

        private void OnStateExit(GameStateEnum state)
        {
            switch (state)
            {
                case GameStateEnum.MainMenu:
                    Debug.Log("Exiting MainMenu state.");
                    break;
                case GameStateEnum.InGame:
                    Debug.Log("Exiting InGame state.");
                    break;
                case GameStateEnum.Paused:
                    Debug.Log("Exiting Paused state.");
                    Time.timeScale = 1f;
                    break;
                case GameStateEnum.Minigame:
                    Debug.Log("Exiting Minigame state.");
                    break;
                case GameStateEnum.GameOver:
                    Debug.Log("Exiting GameOver state.");
                    break;
                case GameStateEnum.EraTransition:
                    Debug.Log("Exiting EraTransition state.");
                    break;
                case GameStateEnum.Settings:
                    Debug.Log("Exiting Settings state.");
                    break;
            }
        }

        public void AdvanceDay()
        {
            if (_currentGameState != GameStateEnum.InGame)
            {
                Debug.LogWarning("Cannot advance day outside of InGame state.");
                return;
            }
            _gameState.currentDay++;
            _gameState.currentYear = _eraData.GetEraForYear(_gameState.currentDay).Year;

            PerformDailyWork();
            CheckWinLossConditions();
            CheckEraMilestones();
            Debug.Log($"Day advanced to: {_gameState.currentDay}, Year: {_gameState.currentYear}");
            OnGameDataChanged?.Invoke();
        }

        private void PerformDailyWork()
        {
            Debug.Log("Performing daily work...");
            _staffManagement?.ProcessStaffActions(_gameState);
            _projectManager?.ProcessActiveProjects(_gameState);
            _marketManager?.UpdateMarketTrends(_gameState);
            _bandAndSongManager?.UpdateBandAndSongData();
            _relationshipManager?.UpdateRelationshipsDaily(_gameState);
        }

        public void CollectMoney(int amount)
        {
            _gameState.money += amount;
            Debug.Log($"Collected {amount} money. Total: {_gameState.money}");
            OnGameDataChanged?.Invoke();
        }

        public void AddMoney(int amount)
        {
            CollectMoney(amount);
        }

        public void DeductMoney(int amount)
        {
            _gameState.money -= amount;
            Debug.Log($"Deducted {amount} money. Total: {_gameState.money}");
            OnGameDataChanged?.Invoke();
        }

        public void AddReputation(int amount)
        {
            _gameState.reputation += amount;
            Debug.Log($"Added {amount} reputation. Total: {_gameState.reputation}");
            OnGameDataChanged?.Invoke();
        }

        public void SaveGameData()
        {
            _saveSystem?.SaveGame(_gameState);
            Debug.Log("Game Data Saved.");
            OnGameDataChanged?.Invoke();
        }

        public void LoadGameData()
        {
            GameState loadedState = _saveSystem?.LoadGame();
            if (loadedState != null)
            {
                _gameState = loadedState;
                Debug.Log("Game Data Loaded.");
                OnGameDataChanged?.Invoke();
                OnGameStateChanged?.Invoke(_currentGameState, _currentGameState);
            }
            else
            {
                Debug.LogWarning("No save data found to load.");
            }
        }

        public void ResetGameData()
        {
            _gameState = new GameState();
            Debug.Log("Game Data Reset to Default.");
            OnGameDataChanged?.Invoke();
            OnGameStateChanged?.Invoke(_currentGameState, GameStateEnum.MainMenu);
        }

        private void CheckWinLossConditions()
        {
            if (_gameState.money <= 0 && _gameState.currentDay > 1)
            {
                SetState(GameStateEnum.GameOver);
                Debug.Log("Game Over: Ran out of money!");
            }
        }

        private void CheckEraMilestones()
        {
            Era currentEraDef = _eraData?.GetEraForYear(_gameState.currentYear);
            if (currentEraDef != null && _gameState.currentEra != currentEraDef.Id)
            {
                SetState(GameStateEnum.EraTransition);
                TriggerEraTransition(currentEraDef.Id);
            }
        }

        public void TriggerEraTransition(string newEraId)
        {
            Debug.Log($"Triggering era transition to {newEraId}");
            _gameState.currentEra = newEraId;
            OnGameDataChanged?.Invoke();
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
                xpToNext = ProgressionUtils.CalculatePlayerXpRequirement(newPlayerLevel);
                
                PlayerMilestone milestone = _progressionData?.GetPlayerMilestone(newPlayerLevel);
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
                foreach (var change in collectedAbilityChanges)
                {
                    if (change.Name == "Daily Work Capacity" && change.NewValue is int)
                    {
                        _gameState.playerData.dailyWorkCapacity = (int)change.NewValue;
                    }
                }

                LevelUpDetails detailsForModal = new LevelUpDetails
                {
                    NewPlayerLevel = newPlayerLevel,
                    UnlockedFeatures = collectedUnlockedFeatures,
                    AbilityChanges = collectedAbilityChanges,
                    AttributeChanges = collectedAttributeChanges,
                    ProjectSummaries = new List<ProjectSummary>(),
                    StaffHighlights = new List<StaffHighlight>()
                };
                OnPlayerLevelUp?.Invoke(detailsForModal);
            }
            OnGameDataChanged?.Invoke();
        }

        public void AddAttributePoints(string attributeName)
        {
            if (_gameState.playerData.attributePoints > 0)
            {
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
                OnGameDataChanged?.Invoke();
            }
        }

        public void AddSkillXP(StudioSkillType skillId, int amount)
        {
            if (_gameState.studioSkills.ContainsKey(skillId))
            {
                _gameState.studioSkills[skillId].Experience += amount;
                Debug.Log($"Added {amount} XP to {skillId}. Current XP: {_gameState.studioSkills[skillId].Experience}");
                OnGameDataChanged?.Invoke();
            }
        }

        public void AddPerkPoint()
        {
            _gameState.playerData.perkPoints++;
            Debug.Log($"Added perk point. Total: {_gameState.playerData.perkPoints}");
            OnGameDataChanged?.Invoke();
        }

        public void RefreshCandidates()
        {
            Debug.Log("Refreshing candidates (placeholder in GameManager)");
            _gameState.availableCandidates = StaffUtils.GenerateCandidates(3, _gameState);
            OnGameDataChanged?.Invoke();
        }

        public void SetFocusAllocation(FocusAllocation newAllocation)
        {
            _gameState.focusAllocation = newAllocation;
            OnGameDataChanged?.Invoke();
        }
    }
} 