using UnityEngine;
using System;
using System.Collections.Generic;
using System.Linq;
using RecordingStudioTycoon.DataModels.Game;
using RecordingStudioTycoon.DataModels.Relationships;
using RecordingStudioTycoon.DataModels.Projects; // For Project and ProjectCompletionReport
using RecordingStudioTycoon.DataModels.Market; // For MusicGenre
using RecordingStudioTycoon.ScriptableObjects;
using RecordingStudioTycoon.Utils; // For SerializableDictionary

namespace RecordingStudioTycoon.Systems.Relationship
{
    public class RelationshipManager : MonoBehaviour
    {
        public static RelationshipManager Instance { get; private set; }

        [SerializeField] private GameStateSO gameStateSO;
        [SerializeField] private RelationshipDataSO relationshipData; // ScriptableObject for initial entities

        // Events for UI updates
        public event Action OnRelationshipsUpdated;
        public event Action<string, int, string> OnRelationshipChanged; // entityId, amount, reason
        public event Action<string, string> OnEntityBlacklisted; // entityId, reason

        private Dictionary<string, ReputableEntity> _allEntities; // EntityId -> ReputableEntity
        private Dictionary<string, RelationshipStats> _entityRelationshipStats; // EntityId -> RelationshipStats

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
            InitializeRelationships();
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

        private void InitializeRelationships()
        {
            if (relationshipData == null)
            {
                Debug.LogError("RelationshipDataSO is not assigned to RelationshipManager.");
                _allEntities = new Dictionary<string, ReputableEntity>();
                _entityRelationshipStats = new Dictionary<string, RelationshipStats>();
                return;
            }

            _allEntities = new Dictionary<string, ReputableEntity>();
            _entityRelationshipStats = new Dictionary<string, RelationshipStats>();

            // Load initial entities from ScriptableObject
            if (relationshipData.InitialEntities != null)
            {
                foreach (var entity in relationshipData.InitialEntities)
                {
                    _allEntities[entity.Id] = entity;
                    _entityRelationshipStats[entity.Id] = entity.Stats ?? new RelationshipStats();
                    // Ensure IsBlacklisted is correctly set from loaded data
                    _entityRelationshipStats[entity.Id].IsBlacklisted = entity.IsBlacklisted;
                }
            }
            else
            {
                Debug.LogWarning("InitialEntities in RelationshipDataSO is empty. No initial relationships loaded.");
            }

            // Ensure GameStateSO has relationships initialized
            if (gameStateSO != null)
            {
                if (gameStateSO.GameState.Relationships == null)
                {
                    gameStateSO.GameState.Relationships = new SerializableDictionary<string, RelationshipStats>();
                }
                // Copy initial stats to GameState
                foreach (var kvp in _entityRelationshipStats)
                {
                    gameStateSO.GameState.Relationships[kvp.Key] = kvp.Value;
                }
            }
            else
            {
                Debug.LogError("GameStateSO is not assigned to RelationshipManager.");
            }

            OnRelationshipsUpdated?.Invoke();
        }

        // This method should be called by GameManager on a periodic basis (e.g., daily)
        public void DailyRelationshipUpdate(int currentDay)
        {
            Debug.Log($"RelationshipManager: Performing daily relationship update for day: {currentDay}");
            // Implement any daily decay, or other periodic relationship changes here
            // For now, just update lastInteractionDay for all entities that have interacted
            foreach (var kvp in _entityRelationshipStats)
            {
                if (kvp.Value.InteractionCount > 0)
                {
                    kvp.Value.LastInteractionDay = currentDay;
                }
            }
            OnRelationshipsUpdated?.Invoke();
        }

        // --- Relationship Management (Ported from relationshipService.ts) ---

        public ReputableEntity GetEntityById(string entityId)
        {
            _allEntities.TryGetValue(entityId, out ReputableEntity entity);
            return entity;
        }

        public RelationshipStats GetRelationshipStats(string entityId)
        {
            if (!_entityRelationshipStats.ContainsKey(entityId))
            {
                // Create default stats if not found
                _entityRelationshipStats[entityId] = new RelationshipStats();
                // Also update the ReputableEntity if it exists
                if (_allEntities.TryGetValue(entityId, out ReputableEntity entity))
                {
                    entity.Stats = _entityRelationshipStats[entityId];
                }
            }
            return _entityRelationshipStats[entityId];
        }

        public void IncreaseRelationship(string entityId, float amount, string reason, int currentDay)
        {
            RelationshipStats currentRel = GetRelationshipStats(entityId);
            if (currentRel.IsBlacklisted) return; // Cannot increase relationship if blacklisted

            float scoreIncrease = amount;
            float trustIncrease = 0;
            float respectIncrease = 0;

            switch (reason)
            {
                case "PROJECT_COMPLETED_ON_TIME":
                case "PROJECT_COMPLETED_VERY_EARLY":
                    trustIncrease = amount * 0.7f;
                    respectIncrease = amount * 0.1f;
                    break;
                case "PROJECT_HIGH_QUALITY":
                case "PROJECT_EXCELLENT_QUALITY":
                    respectIncrease = amount * 0.7f;
                    trustIncrease = amount * 0.2f;
                    break;
                case "SUCCESSFUL_ORIGINAL_MUSIC_RELEASE_WITH_LABEL":
                    scoreIncrease = amount * 1.5f;
                    respectIncrease = amount;
                    trustIncrease = amount * 0.5f;
                    break;
                case "PLAYER_FAVOR_COMPLETED":
                    trustIncrease = amount;
                    break;
                case "AVERAGE_ORIGINAL_MUSIC_RELEASE_WITH_LABEL":
                    respectIncrease = amount * 0.5f;
                    trustIncrease = amount * 0.2f;
                    break;
                default:
                    trustIncrease = amount * 0.2f;
                    respectIncrease = amount * 0.2f;
                    break;
            }

            currentRel.RelationshipScore = Mathf.Min(100, currentRel.RelationshipScore + Mathf.RoundToInt(scoreIncrease));
            currentRel.Trust = Mathf.Min(100, currentRel.Trust + Mathf.RoundToInt(trustIncrease));
            currentRel.Respect = Mathf.Min(100, currentRel.Respect + Mathf.RoundToInt(respectIncrease));
            currentRel.InteractionCount += 1;
            currentRel.LastInteractionDay = currentDay;

            if (reason.StartsWith("PROJECT_") && (reason.Contains("QUALITY") || reason.Contains("EARLY") || reason.Contains("ON_TIME")))
            {
                currentRel.SuccessfulProjects += 1;
            }

            // If relationship was bad enough to be blacklisted, a very positive interaction might lift it
            if (currentRel.IsBlacklisted && currentRel.RelationshipScore > 30 && reason != "BLACKLIST_LIFTED_MANUALLY")
            {
                currentRel.IsBlacklisted = false;
                Debug.Log($"Blacklist lifted for {entityId} due to improved relations.");
                // Potentially trigger a positive PR event or notification
            }

            UpdateGameStateRelationships(entityId, currentRel);
            Debug.Log($"Relationship with {entityId} increased by {scoreIncrease} (Trust: +{trustIncrease}, Respect: +{respectIncrease}) due to {reason}. New score: {currentRel.RelationshipScore}");
            OnRelationshipChanged?.Invoke(entityId, Mathf.RoundToInt(amount), reason);
        }

        public void DecreaseRelationship(string entityId, float amount, string reason, int currentDay)
        {
            RelationshipStats currentRel = GetRelationshipStats(entityId);
            if (currentRel.IsBlacklisted && reason != "BLACKLIST_LIFTED_MANUALLY") return; // Cannot decrease if already blacklisted, unless it's a manual lift

            float scoreDecrease = amount;
            float trustDecrease = 0;
            float respectDecrease = 0;

            switch (reason)
            {
                case "PROJECT_LATE":
                    trustDecrease = amount * 0.8f;
                    break;
                case "PROJECT_POOR_QUALITY":
                case "PROJECT_SUBPAR_QUALITY":
                    respectDecrease = amount * 0.7f;
                    trustDecrease = amount * 0.3f;
                    break;
                case "FAILED_ORIGINAL_MUSIC_RELEASE_WITH_LABEL":
                    scoreDecrease = amount * 1.5f;
                    respectDecrease = amount;
                    trustDecrease = amount * 0.5f;
                    break;
                case "PLAYER_FAVOR_REJECTED":
                    trustDecrease = amount;
                    break;
                default:
                    trustDecrease = amount * 0.2f;
                    respectDecrease = amount * 0.2f;
                    break;
            }

            currentRel.RelationshipScore = Mathf.Max(0, currentRel.RelationshipScore - Mathf.RoundToInt(scoreDecrease));
            currentRel.Trust = Mathf.Max(0, currentRel.Trust - Mathf.RoundToInt(trustDecrease));
            currentRel.Respect = Mathf.Max(0, currentRel.Respect - Mathf.RoundToInt(respectDecrease));
            currentRel.InteractionCount += 1;
            currentRel.LastInteractionDay = currentDay;

            if (reason.StartsWith("PROJECT_") && (reason.Contains("LATE") || reason.Contains("QUALITY")))
            {
                currentRel.FailedProjects += 1;
            }

            CheckAndApplyBlacklisting(entityId, currentRel); // This will update currentRel.IsBlacklisted if needed

            UpdateGameStateRelationships(entityId, currentRel);
            Debug.Log($"Relationship with {entityId} decreased by {scoreDecrease} (Trust: -{trustDecrease}, Respect: -{respectDecrease}) due to {reason}. New score: {currentRel.RelationshipScore}");
            OnRelationshipChanged?.Invoke(entityId, -Mathf.RoundToInt(amount), reason);

            if (currentRel.RelationshipScore < 20 && !currentRel.IsBlacklisted)
            {
                // Trigger a low relationship warning PR event
                TriggerPREvent("LOW_RELATIONSHIP_WARNING", entityId);
            }
        }

        private void CheckAndApplyBlacklisting(string entityId, RelationshipStats currentRelStats)
        {
            const int BLACKLIST_THRESHOLD = 10;
            const int FAILED_PROJECTS_BLACKLIST_THRESHOLD = 3;

            if (currentRelStats.IsBlacklisted)
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
                Debug.LogWarning($"Entity {entityId} has blacklisted the player. Reason: {blacklistReason}");
                TriggerPREvent("BLACKLISTED_BY_ENTITY", entityId, blacklistReason);
                OnEntityBlacklisted?.Invoke(entityId, blacklistReason);
            }
        }

        private void TriggerPREvent(string eventType, string entityId, string reason = "")
        {
            Debug.Log($"PR Event triggered: {eventType}, Entity: {entityId}, Reason: {reason}");
            // This would typically involve adding a GameNotification or triggering a UI event
            // For now, just log.
        }

        public void ProcessProjectCompletion(Project project, ProjectCompletionReport report, int currentDay)
        {
            string contractProviderId = project.ContractProviderId;
            string contractProviderType = project.ContractProviderType;

            if (string.IsNullOrEmpty(contractProviderId) || string.IsNullOrEmpty(contractProviderType))
            {
                Debug.Log($"Project {project.Title}: No specific contract provider. No relationship update.");
                return;
            }

            string entityId = contractProviderId;
            string qualityReason = "";
            float qualityAmount = 0;
            string timelinessReason = "";
            float timelinessAmount = 0;

            if (report.QualityScore.HasValue)
            {
                if (report.QualityScore.Value >= 85) { qualityReason = "PROJECT_EXCELLENT_QUALITY"; qualityAmount = 15; }
                else if (report.QualityScore.Value >= 65) { qualityReason = "PROJECT_GOOD_QUALITY"; qualityAmount = 8; }
                else if (report.QualityScore.Value < 40) { qualityReason = "PROJECT_POOR_QUALITY"; qualityAmount = 12; }
                else if (report.QualityScore.Value < 55) { qualityReason = "PROJECT_SUBPAR_QUALITY"; qualityAmount = 6; }
            }

            if (project.EndDate.HasValue && project.DeadlineDay.HasValue)
            {
                int daysDifference = project.DeadlineDay.Value - project.EndDate.Value;
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
                    DecreaseRelationship(entityId, qualityAmount, qualityReason, currentDay);
                }
                else
                {
                    IncreaseRelationship(entityId, qualityAmount, qualityReason, currentDay);
                }
            }
            if (!string.IsNullOrEmpty(timelinessReason) && timelinessAmount > 0)
            {
                if (timelinessReason.Contains("LATE"))
                {
                    DecreaseRelationship(entityId, timelinessAmount, timelinessReason, currentDay);
                }
                else
                {
                    IncreaseRelationship(entityId, timelinessAmount, timelinessReason, currentDay);
                }
            }

            // Handle original music release impact for record labels
            if (contractProviderType == "recordLabel" && !string.IsNullOrEmpty(project.AssociatedBandId) && !string.IsNullOrEmpty(entityId))
            {
                // This part needs access to Band data, which is not yet ported.
                // For now, we'll use project quality as a proxy.
                float releaseSuccessAmount = 0;
                string releaseReason = "";
                float successMetricScore = report.QualityScore ?? 0; // Use project quality if no specific release score

                if (successMetricScore >= 75)
                {
                    releaseReason = "SUCCESSFUL_ORIGINAL_MUSIC_RELEASE_WITH_LABEL";
                    releaseSuccessAmount = (successMetricScore >= 90) ? 30 : 20;
                    IncreaseRelationship(entityId, releaseSuccessAmount, releaseReason, currentDay);
                }
                else if (successMetricScore < 40)
                {
                    releaseReason = "FAILED_ORIGINAL_MUSIC_RELEASE_WITH_LABEL";
                    releaseSuccessAmount = (successMetricScore < 20) ? 25 : 15;
                    DecreaseRelationship(entityId, releaseSuccessAmount, releaseReason, currentDay);
                }
                else if (successMetricScore >= 50)
                {
                    releaseReason = "AVERAGE_ORIGINAL_MUSIC_RELEASE_WITH_LABEL";
                    releaseSuccessAmount = 5;
                    IncreaseRelationship(entityId, releaseSuccessAmount, releaseReason, currentDay);
                }
                else
                {
                    Debug.Log($"Original Track Release: {project.Title}. Performance (score: {successMetricScore}) was below average. No specific label relationship impact beyond standard project metrics for this release.");
                }
            }
            OnRelationshipsUpdated?.Invoke();
        }

        public void InitiatePlayerFavor(string entityId, string favorType)
        {
            Debug.Log($"Player is considering initiating favor of type '{favorType}' with entity {entityId}.");
            // Implement logic to check if favor can proceed (e.g., cooldowns, relationship level)
        }

        public void ResolvePlayerFavor(string entityId, string favorType, bool success, int currentDay, float magnitude = 10f)
        {
            if (success)
            {
                Debug.Log($"Player successfully completed favor '{favorType}' for {entityId}.");
                IncreaseRelationship(entityId, magnitude, "PLAYER_FAVOR_COMPLETED", currentDay);
            }
            else
            {
                Debug.Log($"Player failed or rejected favor '{favorType}' for {entityId}.");
                DecreaseRelationship(entityId, magnitude, "PLAYER_FAVOR_REJECTED", currentDay);
            }
        }

        public void BlacklistEntity(string entityId, string reason, int currentDay)
        {
            RelationshipStats currentRel = GetRelationshipStats(entityId);
            if (!currentRel.IsBlacklisted)
            {
                currentRel.IsBlacklisted = true;
                currentRel.RelationshipScore = 0; // Set to minimum
                UpdateGameStateRelationships(entityId, currentRel);
                Debug.LogWarning($"Manually blacklisted entity {entityId}. Reason: {reason}");
                OnEntityBlacklisted?.Invoke(entityId, reason);
                OnRelationshipChanged?.Invoke(entityId, -100, $"Blacklisted: {reason}");
            }
        }

        // --- Utility Functions (Ported from useRelationships.ts) ---

        public int GetRelationshipScore(string entityId)
        {
            return GetRelationshipStats(entityId).RelationshipScore;
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
            // This is a placeholder. Real logic would depend on relationship level, specific perks, etc.
            RelationshipBonuses bonuses = new RelationshipBonuses();
            int score = GetRelationshipScore(entityId);

            if (score >= 75) bonuses.ContractValueIncrease += 0.1f;
            if (score >= 90) bonuses.ProjectQualityBonus += 0.05f;

            return bonuses;
        }

        public List<ReputableEntity> GetAllEntities()
        {
            // Return a copy of all entities, ensuring their stats are up-to-date from _entityRelationshipStats
            foreach (var entity in _allEntities.Values)
            {
                if (_entityRelationshipStats.TryGetValue(entity.Id, out RelationshipStats stats))
                {
                    entity.RelationshipScore = stats.RelationshipScore;
                    entity.IsBlacklisted = stats.IsBlacklisted;
                    entity.Stats = stats; // Ensure the full stats object is also updated
                }
            }
            return new List<ReputableEntity>(_allEntities.Values);
        }

        public List<ReputableEntity> GetEntitiesByType(EntityType type)
        {
            return GetAllEntities().Where(entity => entity.Type == type).ToList();
        }

        public List<ReputableEntity> GetTopRelationships(int limit = 5)
        {
            return GetAllEntities()
                .Where(entity => !entity.IsBlacklisted)
                .OrderByDescending(entity => entity.RelationshipScore)
                .Take(limit)
                .ToList();
        }

        public List<MusicGenre> GetPreferredGenres(string entityId)
        {
            ReputableEntity entity = GetEntityById(entityId);
            return entity?.PreferredGenres ?? new List<MusicGenre>();
        }

        public List<string> GetPreferredMoods(string entityId)
        {
            ReputableEntity entity = GetEntityById(entityId);
            return entity?.PreferredMoods ?? new List<string>();
        }

        public float CalculateContractValueModifier(string entityId, MusicGenre projectGenre, string projectMood)
        {
            ReputableEntity entity = GetEntityById(entityId);
            if (entity == null) return 1.0f;

            RelationshipBonuses bonuses = CalculateRelationshipBonuses(entityId);
            float modifier = 1.0f + bonuses.ContractValueIncrease;

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

        public List<object> GetAvailableContracts(EntityType? entityType = null) // Returns object for now, replace with Contract class
        {
            // This would integrate with the contract generation system
            // For now, return mock data based on relationships
            List<ReputableEntity> entities = entityType.HasValue ? GetEntitiesByType(entityType.Value) : GetAllEntities();
            
            List<object> contracts = new List<object>();
            foreach (var entity in entities.Where(e => e.RelationshipScore > 10 && !e.IsBlacklisted)) // Not blacklisted
            {
                contracts.Add(new {
                    entityId = entity.Id,
                    entityName = entity.Name,
                    relationshipLevel = GetRelationshipLevel(entity.Id),
                    contractValueModifier = CalculateContractValueModifier(entity.Id, MusicGenre.Pop, "upbeat"), // Mock genre/mood
                    preferredGenres = entity.PreferredGenres,
                    estimatedValue = Mathf.FloorToInt(1000 + (entity.RelationshipScore * 50))
                });
            }
            return contracts;
        }

        public float GetGenreReputation(MusicGenre genre)
        {
            // This would be a more complex calculation based on successful projects in genre, etc.
            // For now, return a mock value or average of related entities
            return 50; // Placeholder
        }

        public float GetOverallReputation()
        {
            // This would be a more complex calculation based on all relationships and industry prestige
            // For now, return an average of all relationship scores
            if (_entityRelationshipStats.Count == 0) return 0;
            return _entityRelationshipStats.Values.Average(s => s.RelationshipScore);
        }

        public List<RelationshipEvent> GetReputationHistory()
        {
            // This would return a list of historical events that impacted reputation
            return new List<RelationshipEvent>(); // Placeholder
        }

        // Helper to update GameStateSO's relationships dictionary
        private void UpdateGameStateRelationships(string entityId, RelationshipStats stats)
        {
            if (gameStateSO != null)
            {
                gameStateSO.GameState.Relationships[entityId] = stats;
                // Also update the ReputableEntity in _allEntities to reflect the latest stats
                if (_allEntities.TryGetValue(entityId, out ReputableEntity entity))
                {
                    entity.RelationshipScore = stats.RelationshipScore;
                    entity.IsBlacklisted = stats.IsBlacklisted;
                    entity.Stats = stats;
                }
                OnRelationshipsUpdated?.Invoke();
            }
        }
    }
}
