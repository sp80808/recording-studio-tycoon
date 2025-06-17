using UnityEngine;
using RecordingStudioTycoon.DataModels.Relationships;
using RecordingStudioTycoon.DataModels.Projects;
using RecordingStudioTycoon.DataModels.Market;
using RecordingStudioTycoon.Utils;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;
using System;
using System.Collections.Generic;
using System.Linq;
using RecordingStudioTycoon_UnityPoC.Assets.Scripts.DataModels; // For RelationshipStats, Mood, EntityType, etc.
using RecordingStudioTycoon.GameLogic; // For GameState
using RecordingStudioTycoon.Systems.Project; // For Project, ProjectManager
using RecordingStudioTycoon.UI; // For UIManager

namespace RecordingStudioTycoon.Systems.Relationship
{
    public class RelationshipManager : MonoBehaviour
    {
        public static RelationshipManager Instance { get; private set; }

        // Internal storage for all entity relationships
        private Dictionary<string, RelationshipStats> _entityRelationships = new Dictionary<string, RelationshipStats>();

        // Events for UI or other systems to subscribe to
        public static event Action<string, RelationshipStats> OnRelationshipStatsChanged; // string for entity ID, RelationshipStats for new stats
        public static event Action<string> OnNewContactUnlocked; // string for new contact ID
        public static event Action<string, string> OnEntityBlacklisted; // entityId, reason
        public static event Action<string> OnBlacklistLifted; // entityId

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
            if (GameManager.Instance == null)
            {
                Debug.LogError("GameManager not found. RelationshipManager requires GameManager to be initialized.");
                return;
            }
            if (ProjectManager.Instance == null)
            {
                Debug.LogError("ProjectManager not found. RelationshipManager requires ProjectManager to be initialized.");
                return;
            }

            // Load relationships from GameState if available, otherwise initialize
            LoadRelationshipsFromState(GameManager.Instance.GameState.relationships);
        }

        /// <summary>
        /// Loads relationship data from the GameState.
        /// </summary>
        /// <param name="relationships">The dictionary of relationships from GameState.</param>
        public void LoadRelationshipsFromState(Dictionary<string, RelationshipStats> relationships)
        {
            if (relationships != null)
            {
                _entityRelationships = new Dictionary<string, RelationshipStats>(relationships);
                // Ensure all loaded relationships have the isBlacklisted field
                foreach (var kvp in _entityRelationships.ToList()) // ToList to allow modification during iteration
                {
                    if (kvp.Value.IsBlacklisted == null) // Check if it's null, meaning it wasn't set
                    {
                        kvp.Value.IsBlacklisted = false;
                        _entityRelationships[kvp.Key] = kvp.Value; // Update the dictionary entry
                    }
                }
            }
            else
            {
                _entityRelationships = new Dictionary<string, RelationshipStats>();
            }
            Debug.Log($"RelationshipManager loaded with {_entityRelationships.Count} relationships.");
        }

        /// <summary>
        /// Ensures a relationship exists for an entity and returns its stats.
        /// Initializes with default values if not found.
        /// </summary>
        /// <param name="entityId">The unique identifier of the entity.</param>
        /// <returns>The relationship statistics for the entity.</returns>
        private RelationshipStats EnsureEntityRelationship(string entityId)
        {
            if (!_entityRelationships.ContainsKey(entityId))
            {
                _entityRelationships[entityId] = new RelationshipStats
                {
                    RelationshipScore = 50,
                    Trust = 50,
                    Respect = 50,
                    LastInteractionDay = 0,
                    InteractionCount = 0,
                    SuccessfulProjects = 0,
                    FailedProjects = 0,
                    IsBlacklisted = false // Initialize isBlacklisted
                };
            }
            // Ensure IsBlacklisted exists if the object was created before this field was added
            if (_entityRelationships[entityId].IsBlacklisted == null)
            {
                _entityRelationships[entityId].IsBlacklisted = false;
            }
            return _entityRelationships[entityId];
        }

        /// <summary>
        /// Adjusts the relationship score with an entity based on a specific reason.
        /// </summary>
        /// <param name="entityId">The unique identifier of the entity.</param>
        /// <param name="amount">The base amount to change the relationship by.</param>
        /// <param name="reason">The reason for the change (e.g., 'PROJECT_COMPLETED_ON_TIME').</param>
        /// <param name="isIncrease">True if increasing, false if decreasing.</param>
        public void AdjustRelationship(string entityId, int amount, string reason, bool isIncrease)
        {
            if (GameManager.Instance == null || GameManager.Instance.GameState == null) return;

            RelationshipStats currentRel = EnsureEntityRelationship(entityId);
            int scoreChange = amount;
            int trustChange = 0;
            int respectChange = 0;

            if (isIncrease)
            {
                switch (reason)
                {
                    case "PROJECT_COMPLETED_ON_TIME":
                    case "PROJECT_COMPLETED_VERY_EARLY":
                        trustChange = Mathf.FloorToInt(amount * 0.7f);
                        respectChange = Mathf.FloorToInt(amount * 0.1f);
                        break;
                    case "PROJECT_HIGH_QUALITY":
                    case "PROJECT_EXCELLENT_QUALITY":
                        respectChange = Mathf.FloorToInt(amount * 0.7f);
                        trustChange = Mathf.FloorToInt(amount * 0.2f);
                        break;
                    case "SUCCESSFUL_ORIGINAL_MUSIC_RELEASE_WITH_LABEL":
                        scoreChange = Mathf.FloorToInt(amount * 1.5f);
                        respectChange = amount;
                        trustChange = Mathf.FloorToInt(amount * 0.5f);
                        break;
                    case "PLAYER_FAVOR_COMPLETED":
                        trustChange = amount;
                        break;
                    case "AVERAGE_ORIGINAL_MUSIC_RELEASE_WITH_LABEL":
                        respectChange = Mathf.FloorToInt(amount * 0.5f);
                        trustChange = Mathf.FloorToInt(amount * 0.2f);
                        break;
                    default:
                        trustChange = Mathf.FloorToInt(amount * 0.2f);
                        respectChange = Mathf.FloorToInt(amount * 0.2f);
                        break;
                }

                currentRel.RelationshipScore = Mathf.Min(100, currentRel.RelationshipScore + scoreChange);
                currentRel.Trust = Mathf.Min(100, currentRel.Trust + trustChange);
                currentRel.Respect = Mathf.Min(100, currentRel.Respect + respectChange);

                if (reason.StartsWith("PROJECT_") && (reason.Contains("QUALITY") || reason.Contains("EARLY") || reason.Contains("ON_TIME")))
                {
                    currentRel.SuccessfulProjects += 1;
                }

                // If relationship was bad enough to be blacklisted, a very positive interaction might lift it
                if (currentRel.IsBlacklisted == true && currentRel.RelationshipScore > 30 && reason != "BLACKLIST_LIFTED_MANUALLY")
                {
                    currentRel.IsBlacklisted = false;
                    Debug.Log($"Blacklist lifted for {entityId} due to improved relations.");
                    OnBlacklistLifted?.Invoke(entityId);
                    UIManager.Instance?.ShowNotification($"Blacklist lifted for {entityId} due to improved relations!", NotificationType.Info);
                }
            }
            else // isDecrease
            {
                switch (reason)
                {
                    case "PROJECT_LATE":
                        trustChange = Mathf.FloorToInt(amount * 0.8f);
                        break;
                    case "PROJECT_POOR_QUALITY":
                    case "PROJECT_SUBPAR_QUALITY":
                        respectChange = Mathf.FloorToInt(amount * 0.7f);
                        trustChange = Mathf.FloorToInt(amount * 0.3f);
                        break;
                    case "FAILED_ORIGINAL_MUSIC_RELEASE_WITH_LABEL":
                        scoreChange = Mathf.FloorToInt(amount * 1.5f);
                        respectChange = amount;
                        trustChange = Mathf.FloorToInt(amount * 0.5f);
                        break;
                    case "PLAYER_FAVOR_REJECTED":
                        trustChange = amount;
                        break;
                    default:
                        trustChange = Mathf.FloorToInt(amount * 0.2f);
                        respectChange = Mathf.FloorToInt(amount * 0.2f);
                        break;
                }

                currentRel.RelationshipScore = Mathf.Max(0, currentRel.RelationshipScore - scoreChange);
                currentRel.Trust = Mathf.Max(0, currentRel.Trust - trustChange);
                currentRel.Respect = Mathf.Max(0, currentRel.Respect - respectChange);

                if (reason.StartsWith("PROJECT_") && (reason.Contains("LATE") || reason.Contains("QUALITY")))
                {
                    currentRel.FailedProjects += 1;
                }
            }

            currentRel.InteractionCount += 1;
            currentRel.LastInteractionDay = GameManager.Instance.GameState.currentDay;

            _entityRelationships[entityId] = currentRel; // Update the internal dictionary
            GameManager.Instance.GameState.relationships[entityId] = currentRel; // Update GameState for persistence

            Debug.Log($"Relationship with {entityId} changed by {(isIncrease ? "+" : "-")}{scoreChange} (Trust: {(isIncrease ? "+" : "-")}{trustChange}, Respect: {(isIncrease ? "+" : "-")}{respectChange}) due to {reason}. New score: {currentRel.RelationshipScore}");
            OnRelationshipStatsChanged?.Invoke(entityId, currentRel);
            GameManager.Instance.OnGameDataChanged?.Invoke(); // Notify UI of state changes
            GameManager.Instance.SaveGameData(); // Save game after relationship change

            CheckAndApplyBlacklisting(entityId, currentRel);
        }

        /// <summary>
        /// Retrieves the current relationship stats for a specific entity.
        /// </summary>
        /// <param name="entityId">The ID of the entity.</param>
        /// <returns>The current relationship stats, or default if the entity is not found.</returns>
        public RelationshipStats GetRelationshipStats(string entityId)
        {
            return EnsureEntityRelationship(entityId);
        }

        /// <summary>
        /// Checks if an entity should be blacklisted based on relationship stats.
        /// </summary>
        /// <param name="entityId">The unique identifier of the entity.</param>
        /// <param name="currentRelStats">The current relationship statistics.</param>
        private void CheckAndApplyBlacklisting(string entityId, RelationshipStats currentRelStats)
        {
            const int BLACKLIST_THRESHOLD = 10;
            const int FAILED_PROJECTS_BLACKLIST_THRESHOLD = 3;

            if (currentRelStats.IsBlacklisted == true)
            {
                return;
            }

            bool shouldBlacklist = false;
            string blacklistReason = "";

            if (currentRelStats.RelationshipScore <= BLACKLIST_THRESHOLD)
            {
                shouldBlacklist = true;
                blacklistReason = $"Relationship score dropped to {currentRelStats.RelationshipScore}.";
            }
            else if (currentRelStats.FailedProjects >= FAILED_PROJECTS_BLACKLIST_THRESHOLD && currentRelStats.InteractionCount > FAILED_PROJECTS_BLACKLIST_THRESHOLD)
            {
                float successRatio = currentRelStats.SuccessfulProjects > 0 || currentRelStats.FailedProjects > 0 ? (float)currentRelStats.SuccessfulProjects / (currentRelStats.SuccessfulProjects + currentRelStats.FailedProjects) : 1f;
                if (currentRelStats.FailedProjects > currentRelStats.SuccessfulProjects && successRatio < 0.25f && currentRelStats.InteractionCount > 5)
                {
                    shouldBlacklist = true;
                    blacklistReason = $"{currentRelStats.FailedProjects} failed projects and low success ratio ({(successRatio * 100).ToString("F0")}%).";
                }
            }

            if (shouldBlacklist)
            {
                currentRelStats.IsBlacklisted = true;
                _entityRelationships[entityId] = currentRelStats; // Update internal dictionary
                GameManager.Instance.GameState.relationships[entityId] = currentRelStats; // Update GameState
                Debug.LogWarning($"Entity {entityId} has blacklisted the player. Reason: {blacklistReason}");
                UIManager.Instance?.ShowNotification($"You have been blacklisted by {entityId}! They will no longer offer you projects. Reason: {blacklistReason}", NotificationType.Error);
                OnEntityBlacklisted?.Invoke(entityId, blacklistReason);
            }
        }

        /// <summary>
        /// Handles the completion of a project and updates relationships accordingly.
        /// </summary>
        /// <param name="project">The completed project.</param>
        /// <param name="qualityScore">The quality score of the project.</param>
        /// <param name="completionDay">The day the project was completed.</param>
        public void HandleProjectCompletion(Project project, int qualityScore, int completionDay)
        {
            if (project == null || string.IsNullOrEmpty(project.contractProviderId))
            {
                Debug.Log($"Project {project?.title}: No specific contract provider. No relationship update.");
                return;
            }

            string entityId = project.contractProviderId;
            string qualityReason = "";
            int qualityAmount = 0;
            string timelinessReason = "";
            int timelinessAmount = 0;

            if (qualityScore >= 85)
            {
                qualityReason = "PROJECT_EXCELLENT_QUALITY"; qualityAmount = 15;
            }
            else if (qualityScore >= 65)
            {
                qualityReason = "PROJECT_GOOD_QUALITY"; qualityAmount = 8;
            }
            else if (qualityScore < 40)
            {
                qualityReason = "PROJECT_POOR_QUALITY"; qualityAmount = 12;
            }
            else if (qualityScore < 55)
            {
                qualityReason = "PROJECT_SUBPAR_QUALITY"; qualityAmount = 6;
            }

            if (project.deadlineDay.HasValue)
            {
                int daysDifference = project.deadlineDay.Value - completionDay;
                if (daysDifference >= 0)
                {
                    if (daysDifference > 7) { timelinessReason = "PROJECT_COMPLETED_VERY_EARLY"; timelinessAmount = 10; }
                    else { timelinessReason = "PROJECT_COMPLETED_ON_TIME"; timelinessAmount = 5; }
                }
                else
                {
                    int daysLate = Mathf.Abs(daysDifference);
                    timelinessReason = "PROJECT_LATE";
                    if (daysLate > 14) { timelinessAmount = 15; }
                    else if (daysLate > 7) { timelinessAmount = 10; }
                    else { timelinessAmount = 5; }
                }
            }

            if (!string.IsNullOrEmpty(qualityReason) && qualityAmount > 0)
            {
                if (qualityReason.Contains("POOR") || qualityReason.Contains("SUBPAR"))
                {
                    AdjustRelationship(entityId, qualityAmount, qualityReason, false);
                }
                else
                {
                    AdjustRelationship(entityId, qualityAmount, qualityReason, true);
                }
            }
            if (!string.IsNullOrEmpty(timelinessReason) && timelinessAmount > 0)
            {
                if (timelinessReason.Contains("LATE"))
                {
                    AdjustRelationship(entityId, timelinessAmount, timelinessReason, false);
                }
                else
                {
                    AdjustRelationship(entityId, timelinessAmount, timelinessReason, true);
                }
            }

            // Handle original music release impact for record labels
            if (project.contractProviderType == "recordLabel" && !string.IsNullOrEmpty(project.associatedBandId) && !string.IsNullOrEmpty(entityId))
            {
                // This part needs to be integrated with the actual Song/Release data in Unity
                // For now, we'll use project quality as a proxy if no specific release data is available.
                int releaseSuccessAmount = 0;
                string releaseReason = "";
                int successMetricScore = -1;

                // In a real Unity implementation, you'd look up the actual song release data
                // For now, we'll use the project quality score as a fallback
                if (qualityScore != -1)
                {
                    successMetricScore = qualityScore;
                    Debug.Log($"Original Track Release: {project.title}. Using project quality score: {successMetricScore}");
                }

                if (successMetricScore != -1)
                {
                    if (successMetricScore >= 75)
                    {
                        releaseReason = "SUCCESSFUL_ORIGINAL_MUSIC_RELEASE_WITH_LABEL";
                        releaseSuccessAmount = (successMetricScore >= 90) ? 30 : 20;
                        AdjustRelationship(entityId, releaseSuccessAmount, releaseReason, true);
                    }
                    else if (successMetricScore < 40)
                    {
                        releaseReason = "FAILED_ORIGINAL_MUSIC_RELEASE_WITH_LABEL";
                        releaseSuccessAmount = (successMetricScore < 20) ? 25 : 15;
                        AdjustRelationship(entityId, releaseSuccessAmount, releaseReason, false);
                    }
                    else if (successMetricScore >= 50)
                    {
                        releaseReason = "AVERAGE_ORIGINAL_MUSIC_RELEASE_WITH_LABEL";
                        releaseSuccessAmount = 5;
                        AdjustRelationship(entityId, releaseSuccessAmount, releaseReason, true);
                    }
                    else
                    {
                        Debug.Log($"Original Track Release: {project.title}. Performance (score: {successMetricScore}) was below average. No specific label relationship impact beyond standard project metrics for this release.");
                    }
                }
                else
                {
                    Debug.LogWarning($"Original Track Release: {project.title}. Could not determine a success metric for label relationship impact.");
                }
            }
        }

        /// <summary>
        /// Initiates a player favor with an entity.
        /// </summary>
        /// <param name="entityId">The unique identifier of the entity.</param>
        /// <param name="favorType">The type of favor being initiated.</param>
        /// <returns>An object indicating if the favor can proceed and a message.</returns>
        public (bool canProceed, string message) InitiatePlayerFavor(string entityId, string favorType)
        {
            Debug.Log($"Player is considering initiating favor of type '{favorType}' with entity {entityId}.");
            // Add logic to check if favor can proceed (e.g., relationship level, prerequisites)
            return (true, $"Favor '{favorType}' can be initiated.");
        }

        /// <summary>
        /// Resolves a player favor with an entity.
        /// </summary>
        /// <param name="entityId">The unique identifier of the entity.</param>
        /// <param name="favorType">The type of favor being resolved.</param>
        /// <param name="success">Whether the favor was successful.</param>
        /// <param name="magnitude">Optional magnitude of the favor's impact.</param>
        public void ResolvePlayerFavor(string entityId, string favorType, bool success, int magnitude = 10)
        {
            if (success)
            {
                Debug.Log($"Player successfully completed favor '{favorType}' for {entityId}.");
                AdjustRelationship(entityId, magnitude, "PLAYER_FAVOR_COMPLETED", true);
            }
            else
            {
                Debug.Log($"Player failed or rejected favor '{favorType}' for {entityId}.");
                AdjustRelationship(entityId, magnitude, "PLAYER_FAVOR_REJECTED", false);
            }
        }

        // --- Public Getters for Relationship Data ---

        public List<ReputableEntity> GetAllEntities()
        {
            // This would ideally return a list of all actual ReputableEntity objects (Artists, Clients, Labels)
            // For now, we'll create mock entities based on existing relationships.
            List<ReputableEntity> entities = new List<ReputableEntity>();
            foreach (var kvp in _entityRelationships)
            {
                // In a real scenario, you'd fetch the actual entity data from a data source
                // For demonstration, we'll create a basic ReputableEntity
                entities.Add(new ReputableEntity
                {
                    Id = kvp.Key,
                    Name = kvp.Key, // Use ID as name for now
                    RelationshipStats = kvp.Value,
                    Type = EntityType.Artist, // Placeholder type
                    PreferredGenres = new List<MusicGenre> { MusicGenre.Pop, MusicGenre.Rock }, // Placeholder
                    PreferredMoods = new List<Mood> { Mood.Upbeat, Mood.Energetic } // Placeholder
                });
            }
            return entities;
        }

        public ReputableEntity GetEntityById(string entityId)
        {
            if (_entityRelationships.TryGetValue(entityId, out RelationshipStats stats))
            {
                return new ReputableEntity
                {
                    Id = entityId,
                    Name = entityId,
                    RelationshipStats = stats,
                    Type = EntityType.Artist, // Placeholder
                    PreferredGenres = new List<MusicGenre> { MusicGenre.Pop, MusicGenre.Rock }, // Placeholder
                    PreferredMoods = new List<Mood> { Mood.Upbeat, Mood.Energetic } // Placeholder
                };
            }
            return null;
        }

        public int GetRelationshipScore(string entityId)
        {
            return EnsureEntityRelationship(entityId).RelationshipScore;
        }

        public string GetRelationshipLevel(string entityId)
        {
            int score = GetRelationshipScore(entityId);
            if (score >= 90) return "Legendary";
            if (score >= 75) return "Excellent";
            if (score >= 60) return "Good";
            if (score >= 40) return "Neutral";
            if (score >= 20) return "Poor";
            return "Terrible";
        }

        public RelationshipBonuses CalculateRelationshipBonuses(string entityId)
        {
            RelationshipStats stats = GetRelationshipStats(entityId);
            RelationshipBonuses bonuses = new RelationshipBonuses();

            // Example bonus calculations (adjust as needed)
            if (stats.RelationshipScore >= 70)
            {
                bonuses.ContractValueIncrease += 0.1f; // 10% bonus
                bonuses.ProjectSuccessChanceIncrease += 0.05f; // 5% bonus
            }
            if (stats.Trust >= 80)
            {
                bonuses.PaymentTimelinessIncrease += 0.15f; // 15% faster payments
            }
            if (stats.Respect >= 80)
            {
                bonuses.NegotiationAdvantage += 0.1f; // 10% better negotiation
            }
            if (stats.IsBlacklisted == true)
            {
                bonuses.ContractValueIncrease = -1.0f; // Cannot get contracts
                bonuses.ProjectSuccessChanceIncrease = -0.5f; // Significant penalty
            }

            return bonuses;
        }

        public List<ReputableEntity> GetEntitiesByType(EntityType type)
        {
            return GetAllEntities().Where(e => e.Type == type).ToList();
        }

        public List<ReputableEntity> GetTopRelationships(int limit = 5)
        {
            return GetAllEntities()
                .OrderByDescending(e => e.RelationshipStats.RelationshipScore)
                .Take(limit)
                .ToList();
        }

        public List<MusicGenre> GetPreferredGenres(string entityId)
        {
            ReputableEntity entity = GetEntityById(entityId);
            return entity?.PreferredGenres ?? new List<MusicGenre>();
        }

        public List<Mood> GetPreferredMoods(string entityId)
        {
            ReputableEntity entity = GetEntityById(entityId);
            return entity?.PreferredMoods ?? new List<Mood>();
        }

        public float CalculateContractValueModifier(string entityId, MusicGenre projectGenre, Mood projectMood)
        {
            ReputableEntity entity = GetEntityById(entityId);
            if (entity == null) return 1.0f;

            RelationshipBonuses bonuses = CalculateRelationshipBonuses(entityId);
            float modifier = bonuses.ContractValueIncrease;

            // Genre preference bonus
            if (entity.PreferredGenres.Contains(projectGenre))
            {
                modifier += 0.15f;
            }

            // Mood preference bonus
            if (entity.PreferredMoods.Contains(projectMood))
            {
                modifier += 0.1f;
            }

            return Mathf.Max(0.5f, modifier); // Minimum 50% value
        }

        public List<object> GetAvailableContracts(EntityType? entityType = null)
        {
            // This would integrate with the contract generation system
            // For now, return mock data based on relationships
            List<ReputableEntity> entities = entityType.HasValue ? GetEntitiesByType(entityType.Value) : GetAllEntities();

            List<object> contracts = new List<object>();
            foreach (var entity in entities.Where(e => e.RelationshipStats.IsBlacklisted == false)) // Not blacklisted
            {
                contracts.Add(new
                {
                    entity.Id,
                    entity.Name,
                    RelationshipLevel = GetRelationshipLevel(entity.Id),
                    ContractValueModifier = CalculateContractValueModifier(entity.Id, MusicGenre.Pop, Mood.Upbeat), // Example genres/moods
                    entity.PreferredGenres,
                    EstimatedValue = Mathf.FloorToInt(1000 + (entity.RelationshipStats.RelationshipScore * 50))
                });
            }
            return contracts;
        }

        // Placeholder for reputation tracking (genre and overall)
        // These would likely be calculated based on successful projects, chart performance, etc.
        public Dictionary<MusicGenre, int> GenreReputation { get; private set; } = new Dictionary<MusicGenre, int>();
        public List<object> ReputationHistory { get; private set; } = new List<object>(); // Placeholder for history

        public int GetGenreReputation(MusicGenre genre)
        {
            return GenreReputation.ContainsKey(genre) ? GenreReputation[genre] : 0;
        }

        public int GetOverallReputation()
        {
            if (GenreReputation.Count == 0) return 0;
            return Mathf.FloorToInt(GenreReputation.Values.Average());
        }
    }
}
