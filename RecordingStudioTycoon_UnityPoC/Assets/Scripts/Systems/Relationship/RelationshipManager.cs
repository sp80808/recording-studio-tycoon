using UnityEngine;
using System;
using System.Collections.Generic;
using System.Linq;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.GameLogic; // For GameManager and GameState

namespace RecordingStudioTycoon.Systems.Relationship
{
    public class RelationshipManager : MonoBehaviour
    {
        public static RelationshipManager Instance { get; private set; }

        [SerializeField] private RelationshipData relationshipData; // Assign ScriptableObject in Inspector

        private Dictionary<string, ReputableEntity> allEntitiesLookup;
        private Dictionary<string, RelationshipStats> currentRelationships; // Runtime relationship stats

        // Events for relationship updates
        public event Action OnRelationshipChanged;
        public event Action OnReputationChanged;
        public event Action OnContractGenerated;

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
            if (relationshipData == null)
            {
                Debug.LogError("RelationshipData ScriptableObject not assigned to RelationshipManager.");
                return;
            }

            InitializeEntities();
            InitializeRelationships();

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

        private void InitializeEntities()
        {
            allEntitiesLookup = new Dictionary<string, ReputableEntity>();
            if (relationshipData.initialEntities != null)
            {
                foreach (var entity in relationshipData.initialEntities)
                {
                    if (!allEntitiesLookup.ContainsKey(entity.id))
                    {
                        allEntitiesLookup.Add(entity.id, entity);
                    }
                    else
                    {
                        Debug.LogWarning($"Duplicate entity ID found: {entity.id}. Skipping.");
                    }
                }
            }
        }

        private void InitializeRelationships()
        {
            currentRelationships = new Dictionary<string, RelationshipStats>();
            // Load initial relationship stats from GameState if available, otherwise use defaults
            if (GameManager.Instance != null && GameManager.Instance.CurrentGameState.entityRelationships != null)
            {
                foreach (var kvp in GameManager.Instance.CurrentGameState.entityRelationships)
                {
                    currentRelationships.Add(kvp.Key, kvp.Value);
                }
            }
            else
            {
                // Initialize default relationships for all known entities
                foreach (var entityId in allEntitiesLookup.Keys)
                {
                    EnsureEntityRelationship(entityId);
                }
            }
        }

        private RelationshipStats EnsureEntityRelationship(string entityId)
        {
            if (!currentRelationships.ContainsKey(entityId))
            {
                currentRelationships[entityId] = new RelationshipStats
                {
                    relationshipScore = 50f,
                    trust = 50f,
                    respect = 50f,
                    lastInteractionDay = 0,
                    interactionCount = 0,
                    successfulProjects = 0,
                    failedProjects = 0,
                    isBlacklisted = false
                };
            }
            // Ensure isBlacklisted exists for older saves
            if (currentRelationships[entityId].isBlacklisted == null)
            {
                currentRelationships[entityId].isBlacklisted = false;
            }
            return currentRelationships[entityId];
        }

        // --- Relationship Management ---
        public void UpdateRelationship(string entityId, float amount, string reason)
        {
            if (!allEntitiesLookup.ContainsKey(entityId))
            {
                Debug.LogWarning($"Attempted to update relationship for unknown entity: {entityId}");
                return;
            }

            RelationshipStats stats = EnsureEntityRelationship(entityId);
            GameState gameState = GameManager.Instance.CurrentGameState; // Assuming GameManager is available

            if (amount > 0)
            {
                IncreaseRelationship(entityId, amount, reason, stats, gameState);
            }
            else
            {
                DecreaseRelationship(entityId, Mathf.Abs(amount), reason, stats, gameState);
            }

            // Update GameState and notify
            GameManager.Instance.CurrentGameState.entityRelationships = currentRelationships;
            GameManager.Instance.UpdateGameState(GameManager.Instance.CurrentGameState);
            OnRelationshipChanged?.Invoke();
            Debug.Log($"Relationship with {entityId} updated. New score: {stats.relationshipScore}");
        }

        private void IncreaseRelationship(string entityId, float amount, string reason, RelationshipStats stats, GameState gameState)
        {
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
                    trustIncrease = amount * 0.3f;
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

            stats.relationshipScore = Mathf.Min(100f, stats.relationshipScore + scoreIncrease);
            stats.trust = Mathf.Min(100f, stats.trust + trustIncrease);
            stats.respect = Mathf.Min(100f, stats.respect + respectIncrease);
            stats.interactionCount += 1;
            stats.lastInteractionDay = gameState.currentDay;

            if (reason.StartsWith("PROJECT_") && (reason.Contains("QUALITY") || reason.Contains("EARLY") || reason.Contains("ON_TIME")))
            {
                stats.successfulProjects += 1;
            }

            if (stats.isBlacklisted && stats.relationshipScore > 30f && reason != "BLACKLIST_LIFTED_MANUALLY")
            {
                stats.isBlacklisted = false;
                Debug.Log($"Blacklist lifted for {entityId} due to improved relations.");
            }
            currentRelationships[entityId] = stats;
        }

        private void DecreaseRelationship(string entityId, float amount, string reason, RelationshipStats stats, GameState gameState)
        {
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

            stats.relationshipScore = Mathf.Max(0f, stats.relationshipScore - scoreDecrease);
            stats.trust = Mathf.Max(0f, stats.trust - trustDecrease);
            stats.respect = Mathf.Max(0f, stats.respect - respectDecrease);
            stats.interactionCount += 1;
            stats.lastInteractionDay = gameState.currentDay;

            if (reason.StartsWith("PROJECT_") && (reason.Contains("LATE") || reason.Contains("QUALITY")))
            {
                stats.failedProjects += 1;
            }

            currentRelationships[entityId] = stats; // Save intermediate state
            CheckAndApplyBlacklisting(entityId, stats); // Check for blacklisting
        }

        private void CheckAndApplyBlacklisting(string entityId, RelationshipStats stats)
        {
            const float BLACKLIST_THRESHOLD = 10f;
            const int FAILED_PROJECTS_BLACKLIST_THRESHOLD = 3;

            if (stats.isBlacklisted) return;

            bool shouldBlacklist = false;
            string blacklistReason = "";

            if (stats.relationshipScore <= BLACKLIST_THRESHOLD)
            {
                shouldBlacklist = true;
                blacklistReason = $"Relationship score dropped to {stats.relationshipScore}.";
            }
            else if (stats.failedProjects >= FAILED_PROJECTS_BLACKLIST_THRESHOLD && stats.interactionCount > FAILED_PROJECTS_BLACKLIST_THRESHOLD)
            {
                float successRatio = (stats.successfulProjects > 0 || stats.failedProjects > 0) ? (float)stats.successfulProjects / (stats.successfulProjects + stats.failedProjects) : 1f;
                if (stats.failedProjects > stats.successfulProjects && successRatio < 0.25f && stats.interactionCount > 5)
                {
                    shouldBlacklist = true;
                    blacklistReason = $"{stats.failedProjects} failed projects and low success ratio ({(successRatio * 100).ToString("F0")}%).";
                }
            }

            if (shouldBlacklist)
            {
                stats.isBlacklisted = true;
                Debug.LogWarning($"Entity {entityId} has blacklisted the player. Reason: {blacklistReason}");
                // TODO: Trigger UI notification for blacklisting
            }
        }

        public ReputableEntity GetEntityById(string entityId)
        {
            allEntitiesLookup.TryGetValue(entityId, out ReputableEntity entity);
            return entity;
        }

        public float GetRelationshipScore(string entityId)
        {
            return EnsureEntityRelationship(entityId).relationshipScore;
        }

        public string GetRelationshipLevel(string entityId)
        {
            float score = GetRelationshipScore(entityId);
            if (score >= 90) return "Legendary";
            if (score >= 75) return "Excellent";
            if (score >= 60) return "Good";
            if (score >= 40) return "Neutral";
            if (score >= 20) return "Poor";
            return "Terrible";
        }

        public RelationshipBonuses CalculateRelationshipBonuses(string entityId)
        {
            RelationshipStats stats = EnsureEntityRelationship(entityId);
            RelationshipBonuses bonuses = new RelationshipBonuses();

            // Example bonus calculations (can be more complex based on levels/tiers)
            bonuses.contractValueIncrease = (stats.relationshipScore / 100f) * 0.2f; // Max 20% increase
            bonuses.projectOfferFrequency = (stats.relationshipScore / 100f) * 0.5f; // Max 50% more frequent
            bonuses.uniqueProjectChance = (stats.relationshipScore / 100f) * 0.1f; // Max 10% chance
            bonuses.reputationGainMultiplier = 1f + (stats.respect / 100f) * 0.5f; // Max 50% more reputation gain

            return bonuses;
        }

        public List<ReputableEntity> GetAllEntities()
        {
            return allEntitiesLookup.Values.ToList();
        }

        public List<ReputableEntity> GetEntitiesByType(EntityType type)
        {
            return allEntitiesLookup.Values.Where(e => e.type == type).ToList();
        }

        public List<ReputableEntity> GetTopRelationships(int limit = 5)
        {
            return allEntitiesLookup.Values
                .OrderByDescending(e => EnsureEntityRelationship(e.id).relationshipScore)
                .Take(limit)
                .ToList();
        }

        public List<MusicGenre> GetPreferredGenres(string entityId)
        {
            return GetEntityById(entityId)?.preferredGenres ?? new List<MusicGenre>();
        }

        public List<Mood> GetPreferredMoods(string entityId)
        {
            return GetEntityById(entityId)?.preferredMoods ?? new List<Mood>();
        }

        public float CalculateContractValueModifier(string entityId, MusicGenre projectGenre, Mood projectMood)
        {
            ReputableEntity entity = GetEntityById(entityId);
            if (entity == null) return 1.0f;

            RelationshipBonuses bonuses = CalculateRelationshipBonuses(entityId);
            float modifier = 1.0f + bonuses.contractValueIncrease;

            if (entity.preferredGenres.Contains(projectGenre))
            {
                modifier += 0.15f;
            }
            if (entity.preferredMoods.Contains(projectMood))
            {
                modifier += 0.1f;
            }

            return Mathf.Max(0.5f, modifier); // Minimum 50% value
        }

        public List<Contract> GetAvailableContracts(EntityType? entityType = null)
        {
            // This is a placeholder. In a real game, contracts would be dynamically generated
            // based on game state, relationships, era, etc.
            List<Contract> available = new List<Contract>();
            foreach (var contract in relationshipData.initialContracts)
            {
                if (entityType == null || contract.clientType == entityType)
                {
                    // Add logic to filter contracts based on relationship score, player level, etc.
                    available.Add(contract);
                }
            }
            return available;
        }

        public void RecordContractCompletion(string entityId, bool success, float quality)
        {
            // This method would be called by ProjectManager upon project completion
            // It needs the actual project data to determine relationship impact
            Debug.Log($"Recording contract completion for {entityId}. Success: {success}, Quality: {quality}");

            // Mock project data for now, as actual project data is not passed here
            Project mockProject = new Project
            {
                id = "mock-project-" + Guid.NewGuid().ToString(),
                title = "Mock Contract Project",
                genre = MusicGenre.Pop, // Placeholder
                targetMood = Mood.Neutral, // Placeholder
                type = ProjectType.Contract,
                clientType = GetEntityById(entityId)?.type ?? EntityType.Client,
                contractProviderId = entityId,
                qualityScore = quality,
                endDate = GameManager.Instance.CurrentGameState.currentDay,
                deadlineDay = GameManager.Instance.CurrentGameState.currentDay + 7 // Assume on time for mock
            };

            HandleProjectCompletion(mockProject);
        }

        public void HandleProjectCompletion(Project project)
        {
            string entityId = project.contractProviderId;
            if (string.IsNullOrEmpty(entityId))
            {
                Debug.Log($"Project {project.title}: No specific contract provider. No relationship update.");
                return;
            }

            string qualityReason = "";
            float qualityAmount = 0;
            string timelinessReason = "";
            float timelinessAmount = 0;

            if (project.qualityScore != null)
            {
                if (project.qualityScore >= 85) { qualityReason = "PROJECT_EXCELLENT_QUALITY"; qualityAmount = 15; }
                else if (project.qualityScore >= 65) { qualityReason = "PROJECT_GOOD_QUALITY"; qualityAmount = 8; }
                else if (project.qualityScore < 40) { qualityReason = "PROJECT_POOR_QUALITY"; qualityAmount = 12; }
                else if (project.qualityScore < 55) { qualityReason = "PROJECT_SUBPAR_QUALITY"; qualityAmount = 6; }
            }

            if (project.endDate != null && project.deadlineDay != null)
            {
                int daysDifference = project.deadlineDay.Value - project.endDate.Value;
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
                    DecreaseRelationship(entityId, qualityAmount, qualityReason, EnsureEntityRelationship(entityId), GameManager.Instance.CurrentGameState);
                }
                else
                {
                    IncreaseRelationship(entityId, qualityAmount, qualityReason, EnsureEntityRelationship(entityId), GameManager.Instance.CurrentGameState);
                }
            }
            if (!string.IsNullOrEmpty(timelinessReason) && timelinessAmount > 0)
            {
                if (timelinessReason.Contains("LATE"))
                {
                    DecreaseRelationship(entityId, timelinessAmount, timelinessReason, EnsureEntityRelationship(entityId), GameManager.Instance.CurrentGameState);
                }
                else
                {
                    IncreaseRelationship(entityId, timelinessAmount, timelinessReason, EnsureEntityRelationship(entityId), GameManager.Instance.CurrentGameState);
                }
            }

            // Handle specific logic for record labels and original music releases
            if (project.clientType == EntityType.RecordLabel && !string.IsNullOrEmpty(project.associatedBandId) && !string.IsNullOrEmpty(entityId))
            {
                // This part needs actual band and release data, which is not directly available in Project model
                // For now, this logic is simplified.
                float releaseSuccessAmount = 0;
                string releaseReason = "";
                float successMetricScore = -1;

                if (project.qualityScore != null)
                {
                    successMetricScore = project.qualityScore.Value;
                }

                if (successMetricScore != -1)
                {
                    if (successMetricScore >= 75)
                    {
                        releaseReason = "SUCCESSFUL_ORIGINAL_MUSIC_RELEASE_WITH_LABEL";
                        releaseSuccessAmount = (successMetricScore >= 90) ? 30 : 20;
                        IncreaseRelationship(entityId, releaseSuccessAmount, releaseReason, EnsureEntityRelationship(entityId), GameManager.Instance.CurrentGameState);
                    }
                    else if (successMetricScore < 40)
                    {
                        releaseReason = "FAILED_ORIGINAL_MUSIC_RELEASE_WITH_LABEL";
                        releaseSuccessAmount = (successMetricScore < 20) ? 25 : 15;
                        DecreaseRelationship(entityId, releaseSuccessAmount, releaseReason, EnsureEntityRelationship(entityId), GameManager.Instance.CurrentGameState);
                    }
                    else if (successMetricScore >= 50)
                    {
                        releaseReason = "AVERAGE_ORIGINAL_MUSIC_RELEASE_WITH_LABEL";
                        releaseSuccessAmount = 5;
                        IncreaseRelationship(entityId, releaseSuccessAmount, releaseReason, EnsureEntityRelationship(entityId), GameManager.Instance.CurrentGameState);
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
            OnRelationshipChanged?.Invoke();
            OnReputationChanged?.Invoke(); // Reputation might change based on project completion
        }

        public void BlacklistEntity(string entityId, string reason)
        {
            if (!allEntitiesLookup.ContainsKey(entityId))
            {
                Debug.LogWarning($"Attempted to blacklist unknown entity: {entityId}");
                return;
            }
            RelationshipStats stats = EnsureEntityRelationship(entityId);
            stats.isBlacklisted = true;
            Debug.Log($"Entity {entityId} blacklisted. Reason: {reason}");
            GameManager.Instance.CurrentGameState.entityRelationships = currentRelationships;
            GameManager.Instance.UpdateGameState(GameManager.Instance.CurrentGameState);
            OnRelationshipChanged?.Invoke();
        }

        // --- Reputation Tracking ---
        public float GetGenreReputation(MusicGenre genre)
        {
            // This would require tracking genre-specific reputation, possibly in GameState
            // For now, return a placeholder or calculate based on relationships with genre-aligned entities
            return 50f; // Placeholder
        }

        public float GetOverallReputation()
        {
            // This would be an aggregate of all genre reputations or a separate metric
            // For now, return a placeholder
            return 50f; // Placeholder
        }

        public List<ReputationHistoryEntry> GetReputationHistory()
        {
            // This would be stored in GameState or a dedicated history object
            return relationshipData.initialReputationHistory ?? new List<ReputationHistoryEntry>(); // Placeholder
        }

        // --- Player Favor System ---
        public (bool canProceed, string message) InitiatePlayerFavor(string entityId, string favorType)
        {
            Debug.Log($"Player is considering initiating favor of type '{favorType}' with entity {entityId}.");
            // Add logic to check if favor can be initiated (e.g., cooldowns, relationship level)
            return (true, $"Favor '{favorType}' can be initiated.");
        }

        public void ResolvePlayerFavor(string entityId, string favorType, bool success, float magnitude = 10f)
        {
            GameState gameState = GameManager.Instance.CurrentGameState;
            if (success)
            {
                Debug.Log($"Player successfully completed favor '{favorType}' for {entityId}.");
                IncreaseRelationship(entityId, magnitude, "PLAYER_FAVOR_COMPLETED", EnsureEntityRelationship(entityId), gameState);
            }
            else
            {
                Debug.Log($"Player failed or rejected favor '{favorType}' for {entityId}.");
                DecreaseRelationship(entityId, magnitude, "PLAYER_FAVOR_REJECTED", EnsureEntityRelationship(entityId), gameState);
            }
            GameManager.Instance.CurrentGameState.entityRelationships = currentRelationships;
            GameManager.Instance.UpdateGameState(GameManager.Instance.CurrentGameState);
            OnRelationshipChanged?.Invoke();
        }
    }
}
