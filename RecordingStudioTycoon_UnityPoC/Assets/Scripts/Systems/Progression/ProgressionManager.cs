using UnityEngine;
using System;
using System.Collections.Generic;
using System.Linq;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.GameLogic; // For GameManager and GameState
using RecordingStudioTycoon.ScriptableObjects; // For ProgressionData

namespace RecordingStudioTycoon.Systems.Progression
{
    public class ProgressionManager : MonoBehaviour
    {
        public static ProgressionManager Instance { get; private set; }

        [SerializeField] private ProgressionData progressionData; // Reference to ScriptableObject for milestones

        public event Action<int> OnLevelUp; // Event for player level up
        public event Action<ProgressionMilestone> OnMilestoneReached; // Event for reaching a new milestone

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
                GameManager.Instance.OnDayAdvanced += OnDayAdvanced;
                // Subscribe to project completion event if available
                // GameManager.Instance.OnProjectCompleted += AddXP; 
            }
        }

        private void OnDestroy()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnDayAdvanced -= OnDayAdvanced;
                // GameManager.Instance.OnProjectCompleted -= AddXP;
            }
        }

        private void OnDayAdvanced(long currentDay)
        {
            // Check for level up and milestones daily or periodically
            CheckAndHandleLevelUp();
            CheckForNewMilestone(GameManager.Instance.GameState.playerData.level, GameManager.Instance.GameState.hiredStaff.Count, GameManager.Instance.GameState.completedProjects.Count);
        }

        /// <summary>
        /// Calculates the XP required for the next level.
        /// </summary>
        /// <param name="level">The current player level.</param>
        /// <returns>The amount of XP needed to reach the next level.</returns>
        public int CalculateXPToNextLevel(int level)
        {
            // Logarithmic progression to prevent exponential scaling
            const int baseXP = 100;
            const float growthFactor = 1.4f;
            int levelOffset = Mathf.Max(0, level - 1);
            
            return Mathf.FloorToInt(baseXP * Mathf.Pow(growthFactor, levelOffset * 0.7f));
        }

        /// <summary>
        /// Adds XP to the player and checks for level ups.
        /// </summary>
        /// <param name="amount">The amount of XP to add.</param>
        public void AddXP(int amount)
        {
            GameState gameState = GameManager.Instance.GameState;
            gameState.playerData.xp += amount;
            CheckAndHandleLevelUp();
        }

        /// <summary>
        /// Checks if the player has enough XP to level up and handles the level up process.
        /// </summary>
        public void CheckAndHandleLevelUp()
        {
            GameState gameState = GameManager.Instance.GameState;
            int newLevel = gameState.playerData.level;
            int newXP = gameState.playerData.xp;
            int newPerkPoints = gameState.playerData.perkPoints;
            bool leveledUp = false;

            while (newXP >= CalculateXPToNextLevel(newLevel))
            {
                newXP -= CalculateXPToNextLevel(newLevel);
                newLevel++;
                // Reduced perk points to balance progression
                int perkPointsToAdd = newLevel <= 10 ? 2 : (newLevel <= 25 ? 1 : 0);
                newPerkPoints += perkPointsToAdd;
                leveledUp = true;
                
                Debug.Log($"🎉 Level Up! Welcome to Level {newLevel}! +{perkPointsToAdd} Perk Points earned!");
                OnLevelUp?.Invoke(newLevel);
            }

            if (leveledUp)
            {
                gameState.playerData.level = newLevel;
                gameState.playerData.xp = newXP;
                gameState.playerData.xpToNextLevel = CalculateXPToNextLevel(newLevel);
                gameState.playerData.perkPoints = newPerkPoints;
                // Update daily work capacity based on focusMastery and new level
                gameState.playerData.dailyWorkCapacity = gameState.playerData.attributes.focusMastery + 3 + newLevel - 1;
            }
        }

        /// <summary>
        /// Spends a perk point on a specified player attribute.
        /// </summary>
        /// <param name="attribute">The attribute to upgrade.</param>
        public void SpendPerkPoint(PlayerAttributes.AttributeType attribute)
        {
            GameState gameState = GameManager.Instance.GameState;
            if (gameState.playerData.perkPoints <= 0)
            {
                Debug.LogWarning("Not enough perk points to spend.");
                return;
            }

            gameState.playerData.perkPoints--;
            switch (attribute)
            {
                case PlayerAttributes.AttributeType.FocusMastery:
                    gameState.playerData.attributes.focusMastery++;
                    // Update daily work capacity if focusMastery was upgraded
                    gameState.playerData.dailyWorkCapacity = gameState.playerData.attributes.focusMastery + 3 + gameState.playerData.level - 1;
                    break;
                case PlayerAttributes.AttributeType.CreativeIntuition:
                    gameState.playerData.attributes.creativeIntuition++;
                    break;
                case PlayerAttributes.AttributeType.TechnicalAptitude:
                    gameState.playerData.attributes.technicalAptitude++;
                    break;
                case PlayerAttributes.AttributeType.BusinessAcumen:
                    gameState.playerData.attributes.businessAcumen++;
                    break;
                case PlayerAttributes.AttributeType.Creativity:
                    gameState.playerData.attributes.creativity++;
                    break;
                case PlayerAttributes.AttributeType.Technical:
                    gameState.playerData.attributes.technical++;
                    break;
                case PlayerAttributes.AttributeType.Business:
                    gameState.playerData.attributes.business++;
                    break;
                case PlayerAttributes.AttributeType.Charisma:
                    gameState.playerData.attributes.charisma++;
                    break;
                case PlayerAttributes.AttributeType.Luck:
                    gameState.playerData.attributes.luck++;
                    break;
            }
            Debug.Log($"Spent perk point on {attribute}. Remaining points: {gameState.playerData.perkPoints}");
        }

        /// <summary>
        /// Checks for new milestones based on current game state.
        /// </summary>
        /// <param name="playerLevel">Current player level.</param>
        /// <param name="staffCount">Current staff count.</param>
        /// <param name="projectsCompleted">Number of completed projects.</param>
        public void CheckForNewMilestone(int playerLevel, int staffCount, int projectsCompleted)
        {
            if (progressionData == null || progressionData.PlayerMilestones == null)
            {
                Debug.LogWarning("ProgressionData ScriptableObject is not assigned or has no milestones.");
                return;
            }

            // Find the highest milestone already achieved
            PlayerMilestone lastAchievedMilestone = GetCurrentMilestone(playerLevel, staffCount, projectsCompleted);

            // Find the next unachieved milestone
            PlayerMilestone nextMilestone = GetNextMilestone(playerLevel, staffCount, projectsCompleted);

            if (nextMilestone != null && MeetsMilestoneRequirements(nextMilestone, playerLevel, staffCount, projectsCompleted))
            {
                Debug.Log($"🎉 Milestone Reached! {nextMilestone.Level} - {nextMilestone.UnlockedFeatures.FirstOrDefault()?.FeatureName}");
                OnMilestoneReached?.Invoke(nextMilestone);
                // Potentially add unlocked features to GameState.unlockedFeatures
                GameManager.Instance.GameState.unlockedFeatures.AddRange(nextMilestone.UnlockedFeatures.Where(f => !GameManager.Instance.GameState.unlockedFeatures.Any(uf => uf.FeatureName == f.FeatureName)));
            }
        }

        /// <summary>
        /// Gets the current progression status.
        /// </summary>
        public ProgressionStatus GetProgressionStatus()
        {
            GameState gameState = GameManager.Instance.GameState;
            int playerLevel = gameState.playerData.level;
            int staffCount = gameState.hiredStaff.Count;
            int projectsCompleted = gameState.completedProjects.Count; // Using actual completed projects count

            PlayerMilestone currentMilestone = GetCurrentMilestone(playerLevel, staffCount, projectsCompleted);
            PlayerMilestone nextMilestone = GetNextMilestone(playerLevel, staffCount, projectsCompleted);

            float progressToNext = 1f;
            if (nextMilestone != null)
            {
                float levelProgress = Mathf.Min(1f, (float)playerLevel / nextMilestone.Level);
                float staffProgress = Mathf.Min(1f, (float)staffCount / nextMilestone.StaffCount);
                float projectProgress = Mathf.Min(1f, (float)projectsCompleted / nextMilestone.ProjectsCompleted);
                
                progressToNext = (levelProgress + staffProgress + projectProgress) / 3f;
            }

            bool isMultiProjectUnlocked = currentMilestone != null && currentMilestone.Level >= 3 && currentMilestone.StaffCount >= 2;

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

        /// <summary>
        /// Gets the maximum number of concurrent projects allowed based on progression.
        /// </summary>
        public int GetMaxConcurrentProjects()
        {
            ProgressionStatus status = GetProgressionStatus();
            
            if (!status.IsMultiProjectUnlocked)
            {
                return 1; // Single project only
            }

            PlayerMilestone milestone = status.CurrentMilestone;
            if (milestone == null) return 1;

            // Map milestones to project capacity
            if (milestone.Level >= 12) return 5; // Industry Legend
            if (milestone.Level >= 8) return 4;  // Studio Empire
            if (milestone.Level >= 5) return 3;  // Multi-Project Mastery
            if (milestone.Level >= 3) return 2;  // Studio Expansion
            
            return 1; // Default single project
        }

        /// <summary>
        /// Gets the automation features available at current progression.
        /// </summary>
        public List<string> GetAvailableAutomationFeatures()
        {
            ProgressionStatus status = GetProgressionStatus();
            
            if (status.CurrentMilestone == null) return new List<string>();
            
            PlayerMilestone milestone = status.CurrentMilestone;
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

        /// <summary>
        /// Checks if a specific feature is unlocked.
        /// </summary>
        /// <param name="feature">The feature ID to check.</param>
        /// <returns>True if the feature is unlocked, false otherwise.</returns>
        public bool IsFeatureUnlocked(string feature)
        {
            List<string> availableFeatures = GetAvailableAutomationFeatures();
            return availableFeatures.Contains(feature);
        }

        /// <summary>
        /// Gets the requirements for the next unlock.
        /// </summary>
        public NextUnlockRequirements GetNextUnlockRequirements()
        {
            ProgressionStatus status = GetProgressionStatus();
            
            if (status.NextMilestone == null) return null;

            GameState gameState = GameManager.Instance.GameState;
            int playerLevel = gameState.playerData.level;
            int staffCount = gameState.hiredStaff.Count;
            int projectsCompleted = gameState.completedProjects.Count;

            return new NextUnlockRequirements
            {
                LevelNeeded = status.NextMilestone.Level,
                StaffNeeded = status.NextMilestone.StaffCount,
                ProjectsNeeded = status.NextMilestone.ProjectsCompleted,
                CurrentLevel = playerLevel,
                CurrentStaff = staffCount,
                CurrentProjects = projectsCompleted
            };
        }

        // Private helper methods
        private bool MeetsMilestoneRequirements(PlayerMilestone milestone, int level, int staffCount, int projectsCompleted)
        {
            return level >= milestone.Level && 
                   staffCount >= milestone.StaffCount && 
                   projectsCompleted >= milestone.ProjectsCompleted;
        }

        private PlayerMilestone GetCurrentMilestone(int playerLevel, int staffCount, int projectsCompleted)
        {
            if (progressionData == null || progressionData.PlayerMilestones == null) return null;

            PlayerMilestone currentMilestone = null;
            foreach (var milestone in progressionData.PlayerMilestones.OrderBy(m => m.Level))
            {
                if (MeetsMilestoneRequirements(milestone, playerLevel, staffCount, projectsCompleted))
                {
                    currentMilestone = milestone;
                }
                else
                {
                    break; // Milestones are ordered by level, so if we don't meet this one, we won't meet higher ones
                }
            }
            return currentMilestone ?? progressionData.PlayerMilestones.FirstOrDefault(); // Return first milestone if none met
        }

        private PlayerMilestone GetNextMilestone(int playerLevel, int staffCount, int projectsCompleted)
        {
            if (progressionData == null || progressionData.PlayerMilestones == null) return null;

            foreach (var milestone in progressionData.PlayerMilestones.OrderBy(m => m.Level))
            {
                if (!MeetsMilestoneRequirements(milestone, playerLevel, staffCount, projectsCompleted))
                {
                    return milestone;
                }
            }
            return null; // All milestones achieved
        }

        private string GenerateProgressionReason(int level, int staffCount, int projectsCompleted, PlayerMilestone nextMilestone)
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
    }

    // Data models for ProgressionStatus and NextUnlockRequirements
    [System.Serializable]
    public class ProgressionStatus
    {
        public bool IsMultiProjectUnlocked;
        public PlayerMilestone CurrentMilestone;
        public PlayerMilestone NextMilestone;
        public float ProgressToNext; // 0-1
        public string Reason;
    }

    [System.Serializable]
    public class NextUnlockRequirements
    {
        public int LevelNeeded;
        public int StaffNeeded;
        public int ProjectsNeeded;
        public int CurrentLevel;
        public int CurrentStaff;
        public int CurrentProjects;
    }
}