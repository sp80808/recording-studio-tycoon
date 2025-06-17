using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels
{
    // Enums
    [Serializable]
    public enum MusicGenre
    {
        Pop, Rock, HipHop, Electronic, Country, Jazz, R_n_B, Folk, Classical, Alternative, Acoustic, Indie, Metal, Punk, Dance, Funk, Soul, Blues, Reggae
    }

    [Serializable]
    public enum TrendDirection
    {
        Rising, Stable, Falling, Emerging, Fading
    }

    [Serializable]
    public enum Mood
    {
        Upbeat, Melancholy, Aggressive, Chill, Experimental, Neutral
    }

    [Serializable]
    public enum EntityType
    {
        Artist, RecordLabel, Client
    }

    [Serializable]
    public enum PerkCategory
    {
        Acoustics, BusinessOperations, TalentAcquisition, Marketing, Production, Engineering, Mixing, Mastering, StaffManagement, ResearchDevelopment, Financial, Reputation
    }

    [Serializable]
    public enum ConditionType
    {
        PlayerLevel, StudioReputation, CompletedProjects, ProjectsInGenre, StaffSkillSum, SpecificEquipmentOwned, SpecificPerkUnlocked, MoneyEarned, ChartSuccesses
    }

    [Serializable]
    public enum EffectOperation
    {
        Add, Multiply, Set
    }

    [Serializable]
    public enum PlayerAttributeType
    {
        FocusMastery, CreativeIntuition, TechnicalAptitude, BusinessAcumen, Creativity, Technical, Business, Charisma, Luck
    }

    [Serializable]
    public enum StudioSkillType
    {
        Recording, Mixing, Mastering, Production, Marketing, Business, StaffManagement, Research, Innovation
    }

    [Serializable]
    public enum ProjectType
    {
        Client, OriginalTrack, Contract, Collaboration
    }

    // Common Data Structures (if not already defined elsewhere as full classes)
    [Serializable]
    public class PerkCost
    {
        public int money;
        public int perkPoints;
    }

    [Serializable]
    public class RelationshipBonuses
    {
        public float contractValueIncrease;
        public float projectOfferFrequency;
        public float uniqueProjectChance;
        public float reputationGainMultiplier;
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

    [Serializable]
    public class EraUnlock
    {
        public string unlockId;
        public string unlockType;
        public string description;
    }

    [Serializable]
    public class UnlockedFeatureInfo
    {
        public string featureId;
        public string name;
        public string description;
        public int unlockedDay;
    }

    [Serializable]
    public class Training
    {
        public string id;
        public string name;
        public string description;
        public int cost;
        public int durationDays;
        public StudioSkillType skillTrained;
        public int xpGain;
    }

    [Serializable]
    public class Expansion
    {
        public string id;
        public string name;
        public string description;
        public int cost;
        public ExpansionRequirements requirements;
        public SerializableDictionary<string, float> benefits; // e.g., "recordingQualityMultiplier": 1.1
    }

    [Serializable]
    public class ExpansionRequirements
    {
        public int level;
        public int reputation;
    }

    [Serializable]
    public class ProjectCompletionReport
    {
        public string projectId;
        public string title;
        public float qualityScore;
        public float finalScore;
        public int earnings;
        public int xpGained;
        public long completionTime; // Timestamp
        public List<string> stageReports; // Details about each stage's performance
    }

    [Serializable]
    public class LevelUpDetails
    {
        public int newLevel;
        public int perkPointsEarned;
        public List<string> unlockedFeatures;
        public List<string> newEraUnlocks;
    }
}