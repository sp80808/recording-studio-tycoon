using UnityEngine;
using System;
using System.Collections.Generic;
using System.Linq;
using RecordingStudioTycoon.DataModels.Game;
using RecordingStudioTycoon.DataModels.Progression;
using RecordingStudioTycoon.DataModels.Projects;
using RecordingStudioTycoon.ScriptableObjects;
using RecordingStudioTycoon.Utils; // For ProgressionUtils

namespace RecordingStudioTycoon.Systems.Progression
{
    public class ProgressionManager : MonoBehaviour
    {
        public static ProgressionManager Instance { get; private set; }

        [SerializeField] private GameStateSO gameStateSO;
        [SerializeField] private ProgressionDataSO progressionData; // ScriptableObject for milestones, XP requirements

        // Events for UI updates
        public event Action<LevelUpDetails> OnPlayerLevelUp;
        public event Action<ProgressionMilestone> OnMilestoneUnlocked;
        public event Action OnProgressionUpdated;

        private List<ProgressionMilestone> _milestones;

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
            InitializeProgression();
            // Subscribe to game day advancement if GameManager provides such an event
            // GameManager.Instance.OnDayAdvanced += OnDayAdvanced;
        }

        private void OnDestroy()
        {
            // Unsubscribe from events to prevent memory leaks
            // if (GameManager.Instance != null)
            // {
            //     GameManager.Instance.OnDayAdvanced -= OnDayAdvanced;
            // }
        }

        private void InitializeProgression()
        {
            if (progressionData == null)
            {
                Debug.LogError("ProgressionDataSO is not assigned to ProgressionManager.");
                _milestones = new List<ProgressionMilestone>();
                return;
            }

            _milestones = new List<ProgressionMilestone>(progressionData.Milestones);

            // Ensure GameStateSO has player data initialized
            if (gameStateSO != null)
            {
                // If player data is not initialized, do it here or ensure GameManager does it.
                if (gameStateSO.GameState.PlayerData == null)
                {
                    gameStateSO.GameState.PlayerData = new PlayerData();
                }
                // Ensure XP to next level is correctly set on start
                gameStateSO.GameState.PlayerData.XpToNextLevel = ProgressionUtils.CalculatePlayerXpRequirement(gameStateSO.GameState.PlayerData.Level);
            }
            else
            {
                Debug.LogError("GameStateSO is not assigned to ProgressionManager.");
            }

            OnProgressionUpdated?.Invoke();
        }

        public void AddXP(int amount)
        {
            if (gameStateSO == null) return;

            PlayerData playerData = gameStateSO.GameState.PlayerData;
            int initialPlayerLevel = playerData.Level;
            int newPlayerLevel = initialPlayerLevel;
            int currentXp = playerData.Xp + amount;
            int xpToNext = playerData.XpToNextLevel;
            int perkPointsGainedThisLevelUp = 0;
            int attributePointsGainedThisLevelUp = 0;

            List<UnlockedFeatureInfo> collectedUnlockedFeatures = new List<UnlockedFeatureInfo>();
            List<PlayerAbilityChange> collectedAbilityChanges = new List<PlayerAbilityChange>();
            List<PlayerAttributeChange> collectedAttributeChanges = new List<PlayerAttributeChange>();

            bool levelUpOccurred = false;

            while (currentXp >= xpToNext)
            {
                levelUpOccurred = true;
                currentXp -= xpToNext;
                newPlayerLevel++;
                xpToNext = ProgressionUtils.CalculatePlayerXpRequirement(newPlayerLevel);

                ProgressionMilestone milestone = progressionData?.GetPlayerMilestone(newPlayerLevel);
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

                    OnMilestoneUnlocked?.Invoke(milestone); // Notify about milestone unlock
                }
            }

            playerData.Xp = currentXp;
            playerData.Level = newPlayerLevel;
            playerData.XpToNextLevel = xpToNext;
            playerData.PerkPoints += perkPointsGainedThisLevelUp;
            playerData.AttributePoints += attributePointsGainedThisLevelUp;

            if (levelUpOccurred)
            {
                // Apply direct ability changes
                foreach (var change in collectedAbilityChanges)
                {
                    if (change.Name == "Daily Work Capacity" && change.NewValue is int intValue)
                    {
                        playerData.DailyWorkCapacity = intValue;
                    }
                    // Add other direct ability changes here as needed
                }

                LevelUpDetails detailsForModal = new LevelUpDetails
                {
                    NewPlayerLevel = newPlayerLevel,
                    UnlockedFeatures = collectedUnlockedFeatures,
                    AbilityChanges = collectedAbilityChanges,
                    AttributeChanges = collectedAttributeChanges,
                    ProjectSummaries = new List<ProjectSummary>(), // Placeholder
                    StaffHighlights = new List<StaffHighlight>() // Placeholder
                };
                OnPlayerLevelUp?.Invoke(detailsForModal); // Trigger event for UI
            }
            OnProgressionUpdated?.Invoke();
        }

        public void SpendPerkPoint(PlayerAttributeType attribute)
        {
            if (gameStateSO == null) return;

            PlayerData playerData = gameStateSO.GameState.PlayerData;

            if (playerData.PerkPoints > 0)
            {
                playerData.PerkPoints--;
                // This logic should ideally be in a dedicated PlayerAttributes class/struct
                // For now, direct modification based on enum
                switch (attribute)
                {
                    case PlayerAttributeType.FocusMastery: playerData.Attributes.FocusMastery++; break;
                    case PlayerAttributeType.CreativeIntuition: playerData.Attributes.CreativeIntuition++; break;
                    case PlayerAttributeType.TechnicalAptitude: playerData.Attributes.TechnicalAptitude++; break;
                    case PlayerAttributeType.BusinessAcumen: playerData.Attributes.BusinessAcumen++; break;
                    case PlayerAttributeType.Creativity: playerData.Attributes.Creativity++; break;
                    case PlayerAttributeType.Technical: playerData.Technical++; break; // Assuming this is a direct field
                    case PlayerAttributeType.Business: playerData.Attributes.Business++; break;
                    case PlayerAttributeType.Charisma: playerData.Attributes.Charisma++; break;
                    case PlayerAttributeType.Luck: playerData.Attributes.Luck++; break;
                }

                // Update daily work capacity if focusMastery was upgraded
                if (attribute == PlayerAttributeType.FocusMastery)
                {
                    playerData.DailyWorkCapacity = playerData.Attributes.FocusMastery + 3 + playerData.Level - 1;
                }
                OnProgressionUpdated?.Invoke();
            }
        }

        public void AddAttributePoints(PlayerAttributeType attribute)
        {
            if (gameStateSO == null) return;

            PlayerData playerData = gameStateSO.GameState.PlayerData;

            if (playerData.AttributePoints > 0)
            {
                playerData.AttributePoints--;
                switch (attribute)
                {
                    case PlayerAttributeType.FocusMastery: playerData.Attributes.FocusMastery++; break;
                    case PlayerAttributeType.CreativeIntuition: playerData.Attributes.CreativeIntuition++; break;
                    case PlayerAttributeType.TechnicalAptitude: playerData.Attributes.TechnicalAptitude++; break;
                    case PlayerAttributeType.BusinessAcumen: playerData.Attributes.BusinessAcumen++; break;
                    case PlayerAttributeType.Creativity: playerData.Attributes.Creativity++; break;
                    case PlayerAttributeType.Technical: playerData.Technical++; break;
                    case PlayerAttributeType.Business: playerData.Attributes.Business++; break;
                    case PlayerAttributeType.Charisma: playerData.Attributes.Charisma++; break;
                    case PlayerAttributeType.Luck: playerData.Attributes.Luck++; break;
                }
                OnProgressionUpdated?.Invoke();
            }
        }

        public void AddSkillXP(StudioSkillType skillId, int amount)
        {
            if (gameStateSO == null) return;

            if (gameStateSO.GameState.StudioSkills.ContainsKey(skillId))
            {
                gameStateSO.GameState.StudioSkills[skillId].Experience += amount;
                // Add skill level up logic here or in ProgressionUtils
                Debug.Log($"Added {amount} XP to {skillId}. Current XP: {gameStateSO.GameState.StudioSkills[skillId].Experience}");
                OnProgressionUpdated?.Invoke();
            }
        }

        public void AddPerkPoint()
        {
            if (gameStateSO == null) return;
            gameStateSO.GameState.PlayerData.PerkPoints++;
            Debug.Log($"Added perk point. Total: {gameStateSO.GameState.PlayerData.PerkPoints}");
            OnProgressionUpdated?.Invoke();
        }

        public void TriggerEraTransition(string newEraId)
        {
            if (gameStateSO == null) return;
            Debug.Log($"Triggering era transition to {newEraId} (placeholder)");
            gameStateSO.GameState.CurrentEra = newEraId;
            // Potentially update eraStartYear, unlock new content, etc.
            OnProgressionUpdated?.Invoke();
        }

        // --- Progression System Logic (Ported from ProgressionSystem.ts) ---

        public ProgressionStatus GetProgressionStatus()
        {
            if (gameStateSO == null) return new ProgressionStatus(); // Return default if no game state

            PlayerData playerData = gameStateSO.GameState.PlayerData;
            int playerLevel = playerData.Level;
            int staffCount = gameStateSO.GameState.HiredStaff.Count;
            int projectsCompleted = CalculateCompletedProjects(gameStateSO.GameState);

            ProgressionMilestone currentMilestone = null;
            ProgressionMilestone nextMilestone = null;

            for (int i = 0; i < _milestones.Count; i++)
            {
                ProgressionMilestone milestone = _milestones[i];
                
                if (MeetsMilestoneRequirements(milestone, playerLevel, staffCount, projectsCompleted))
                {
                    currentMilestone = milestone;
                    nextMilestone = (i + 1 < _milestones.Count) ? _milestones[i + 1] : null;
                }
                else
                {
                    if (nextMilestone == null)
                    {
                        nextMilestone = milestone;
                    }
                    break;
                }
            }

            if (currentMilestone == null)
            {
                currentMilestone = _milestones.FirstOrDefault(); // Should be the first milestone
                nextMilestone = _milestones.Count > 1 ? _milestones[1] : null;
            }

            float progressToNext = 1f;
            if (nextMilestone != null)
            {
                float levelProgress = Mathf.Min(1f, (float)playerLevel / nextMilestone.Level);
                float staffProgress = Mathf.Min(1f, (float)staffCount / nextMilestone.StaffCount);
                float projectProgress = Mathf.Min(1f, (float)projectsCompleted / nextMilestone.ProjectsCompleted);
                
                progressToNext = (levelProgress + staffProgress + projectProgress) / 3f;
            }

            bool isMultiProjectUnlocked = currentMilestone != null && 
                                          (currentMilestone.Level >= 3 && currentMilestone.StaffCount >= 2);

            string reason = GenerateProgressionReason(playerLevel, staffCount, projectsCompleted, nextMilestone);

            return new ProgressionStatus
            {
                IsMultiProjectUnlocked = isMultiProjectUnlocked,
                CurrentMilestone = currentMilestone,
                NextMilestone = nextMilestone,
                ProgressToNext = progressToNext,
                Reason = reason
            };
        }

        public int GetMaxConcurrentProjects()
        {
            ProgressionStatus status = GetProgressionStatus();
            
            if (!status.IsMultiProjectUnlocked)
            {
                return 1;
            }

            ProgressionMilestone milestone = status.CurrentMilestone;
            if (milestone == null) return 1;

            if (milestone.Level >= 12) return 5;
            if (milestone.Level >= 8) return 4;
            if (milestone.Level >= 5) return 3;
            if (milestone.Level >= 3) return 2;
            
            return 1;
        }

        public List<string> GetAvailableAutomationFeatures()
        {
            ProgressionStatus status = GetProgressionStatus();
            
            if (status.CurrentMilestone == null) return new List<string>();
            
            ProgressionMilestone milestone = status.CurrentMilestone;
            List<string> features = new List<string>();

            if (milestone.Level >= 3)
            {
                features.Add("basic_automation");
                features.Add("dual_projects");
            }
            
            if (milestone.Level >= 5)
            {
                features.Add("smart_automation");
                features.Add("priority_system");
                features.Add("advanced_dashboard");
            }
            
            if (milestone.Level >= 8)
            {
                features.Add("ai_optimization");
                features.Add("advanced_analytics");
                features.Add("enterprise_features");
            }
            
            if (milestone.Level >= 12)
            {
                features.Add("legendary_automation");
                features.Add("complete_suite");
                features.Add("industry_tools");
            }

            return features;
        }

        public bool IsFeatureUnlocked(string feature)
        {
            List<string> availableFeatures = GetAvailableAutomationFeatures();
            return availableFeatures.Contains(feature);
        }

        public ProgressionUnlockRequirements GetNextUnlockRequirements()
        {
            ProgressionStatus status = GetProgressionStatus();
            
            if (status.NextMilestone == null) return null;

            PlayerData playerData = gameStateSO.GameState.PlayerData;
            int playerLevel = playerData.Level;
            int staffCount = gameStateSO.GameState.HiredStaff.Count;
            int projectsCompleted = CalculateCompletedProjects(gameStateSO.GameState);

            return new ProgressionUnlockRequirements
            {
                LevelNeeded = status.NextMilestone.Level,
                StaffNeeded = status.NextMilestone.StaffCount,
                ProjectsNeeded = status.NextMilestone.ProjectsCompleted,
                CurrentLevel = playerLevel,
                CurrentStaff = staffCount,
                CurrentProjects = projectsCompleted
            };
        }

        public MilestoneCheckResult CheckForNewMilestone(GameState oldGameState, GameState newGameState)
        {
            ProgressionStatus oldStatus = GetProgressionStatusForState(oldGameState);
            ProgressionStatus newStatus = GetProgressionStatusForState(newGameState);

            bool hasProgressed = newStatus.CurrentMilestone != null && 
                                 (oldStatus.CurrentMilestone == null || 
                                  newStatus.CurrentMilestone.Level > oldStatus.CurrentMilestone.Level);

            return new MilestoneCheckResult
            {
                Unlocked = hasProgressed,
                Milestone = hasProgressed ? newStatus.CurrentMilestone : null
            };
        }

        private bool MeetsMilestoneRequirements(ProgressionMilestone milestone, int level, int staffCount, int projectsCompleted)
        {
            return level >= milestone.Level && 
                   staffCount >= milestone.StaffCount && 
                   projectsCompleted >= milestone.ProjectsCompleted;
        }

        private int CalculateCompletedProjects(GameState gameState)
        {
            // This is a simplified calculation - you may want to track this more explicitly
            // For now, we'll estimate based on player XP and level progression
            int baseProjects = Mathf.FloorToInt((float)gameState.PlayerData.Xp / 1000f);
            int levelBonus = Mathf.FloorToInt((float)gameState.PlayerData.Level / 2f);
            
            return Mathf.Max(0, baseProjects + levelBonus);
        }

        private string GenerateProgressionReason(int level, int staffCount, int projectsCompleted, ProgressionMilestone nextMilestone)
        {
            if (nextMilestone == null)
            {
                return "You've reached the highest progression level!";
            }

            List<string> requirements = new List<string>();
            
            if (level < nextMilestone.Level)
            {
                requirements.Add($"Level {nextMilestone.Level} (currently {level})");
            }
            
            if (staffCount < nextMilestone.StaffCount)
            {
                requirements.Add($"{nextMilestone.StaffCount} staff members (currently {staffCount})");
            }
            
            if (projectsCompleted < nextMilestone.ProjectsCompleted)
            {
                requirements.Add($"{nextMilestone.ProjectsCompleted} completed projects (currently {projectsCompleted})");
            }

            if (requirements.Count == 0)
            {
                return "Ready for next milestone!";
            }

            return $"To unlock next features, you need: {string.Join(", ", requirements)}";
        }

        // Helper to get progression status for a specific GameState instance (used by CheckForNewMilestone)
        private ProgressionStatus GetProgressionStatusForState(GameState state)
        {
            int playerLevel = state.PlayerData.Level;
            int staffCount = state.HiredStaff.Count;
            int projectsCompleted = CalculateCompletedProjects(state);

            ProgressionMilestone currentMilestone = null;
            ProgressionMilestone nextMilestone = null;

            for (int i = 0; i < _milestones.Count; i++)
            {
                ProgressionMilestone milestone = _milestones[i];
                
                if (MeetsMilestoneRequirements(milestone, playerLevel, staffCount, projectsCompleted))
                {
                    currentMilestone = milestone;
                    nextMilestone = (i + 1 < _milestones.Count) ? _milestones[i + 1] : null;
                }
                else
                {
                    if (nextMilestone == null)
                    {
                        nextMilestone = milestone;
                    }
                    break;
                }
            }

            if (currentMilestone == null)
            {
                currentMilestone = _milestones.FirstOrDefault();
                nextMilestone = _milestones.Count > 1 ? _milestones[1] : null;
            }

            float progressToNext = 1f;
            if (nextMilestone != null)
            {
                float levelProgress = Mathf.Min(1f, (float)playerLevel / nextMilestone.Level);
                float staffProgress = Mathf.Min(1f, (float)staffCount / nextMilestone.StaffCount);
                float projectProgress = Mathf.Min(1f, (float)projectsCompleted / nextMilestone.ProjectsCompleted);
                
                progressToNext = (levelProgress + staffProgress + projectProgress) / 3f;
            }

            bool isMultiProjectUnlocked = currentMilestone != null && 
                                          (currentMilestone.Level >= 3 && currentMilestone.StaffCount >= 2);

            string reason = GenerateProgressionReason(playerLevel, staffCount, projectsCompleted, nextMilestone);

            return new ProgressionStatus
            {
                IsMultiProjectUnlocked = isMultiProjectUnlocked,
                CurrentMilestone = currentMilestone,
                NextMilestone = nextMilestone,
                ProgressToNext = progressToNext,
                Reason = reason
            };
        }
    }
}