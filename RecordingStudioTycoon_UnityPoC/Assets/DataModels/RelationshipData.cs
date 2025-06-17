using UnityEngine;
using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels
{
    [Serializable]
    public enum EntityType
    {
        Artist, RecordLabel, Client
    }

    [Serializable]
    public enum Mood
    {
        Upbeat, Melancholy, Aggressive, Chill, Experimental, Neutral
    }

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

    [Serializable]
    public class RelationshipBonuses
    {
        public float contractValueIncrease;
        public float projectOfferFrequency;
        public float uniqueProjectChance;
        public float reputationGainMultiplier;
        // Add other bonuses as needed
    }

    [Serializable]
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

    [Serializable]
    public class ReputationScore
    {
        public MusicGenre genre;
        public float score;
    }

    [Serializable]
    public class ReputationHistoryEntry
    {
        public int gameDay;
        public float overallReputation;
        public List<ReputationScore> genreReputations;
    }

    [CreateAssetMenu(fileName = "NewRelationshipData", menuName = "ScriptableObjects/Relationship Data")]
    public class RelationshipData : ScriptableObject
    {
        public List<ReputableEntity> initialEntities;
        public List<Contract> initialContracts; // Example contracts
        public List<ReputationHistoryEntry> initialReputationHistory;
    }
}