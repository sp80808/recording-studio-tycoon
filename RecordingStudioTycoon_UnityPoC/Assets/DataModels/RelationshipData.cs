using UnityEngine;
using System;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels; // For MusicGenre, Mood, EntityType, RelationshipBonuses, ReputationScore, ReputationHistoryEntry

namespace RecordingStudioTycoon.DataModels
{
    [Serializable]
    public class RelationshipStats
    {
        public float relationshipScore; // 0-100
        public float trust; // 0-100
        public float respect; // 0-100
        public int lastInteractionDay;
        public int interactionCount;
        public int successfulProjects;
        public int failedProjects;
        public bool isBlacklisted;
    }

    public class ReputableEntity
    {
        public string id;
        public string name;
        public EntityType type;
        public RelationshipStats stats;
        public List<MusicGenre> preferredGenres;
        public List<Mood> preferredMoods;
        public string description;
        // Add other entity-specific properties (e.g., for Artists: popularity, genre; for Labels: size, focus)
    }

    [Serializable]
    public class Contract
    {
        public string id;
        public string title;
        public string description;
        public string clientId; // ID of the entity offering the contract
        public EntityType clientType;
        public MusicGenre genre;
        public Mood targetMood;
        public int basePayout;
        public int deadlineDays;
        public int minQualityRequired;
        public List<string> requiredSkills; // e.g., "Mixing", "Mastering"
        public bool isExclusive;
        public int durationDays; // How long the contract is active for
    }

    [CreateAssetMenu(fileName = "NewRelationshipData", menuName = "ScriptableObjects/Relationship Data")]
    public class RelationshipData : ScriptableObject
    {
        public List<ReputableEntity> initialEntities;
        public List<Contract> initialContracts; // Example contracts
        public List<ReputationHistoryEntry> initialReputationHistory;
    }
}