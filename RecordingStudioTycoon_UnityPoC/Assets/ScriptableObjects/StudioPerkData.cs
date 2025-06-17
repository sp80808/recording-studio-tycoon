using UnityEngine;
using System;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels; // For MusicGenre, PerkCategory, ConditionType, EffectOperation, PerkCost, PerkUnlockCondition, PerkEffect

namespace RecordingStudioTycoon.DataModels
{
    public class PerkUnlockCondition
    {
        public ConditionType type;
        public float value; // Numeric value for level, reputation, count etc.
        public MusicGenre genre; // For ProjectsInGenre condition
        public string equipmentId; // For SpecificEquipmentOwned
        public string perkId; // For SpecificPerkUnlocked
    }

    public class PerkEffect
    {
        public string key; // Corresponds to a property in AggregatedPerkModifiers
        public float value;
        public EffectOperation operation;
        public MusicGenre genre; // For genre-specific effects like projectAppealModifier
    }

    public class StudioPerk
    {
        public string id;
        public string name;
        public string description;
        public PerkCategory category;
        public int tier;
        public PerkCost cost;
        public List<PerkUnlockCondition> unlockConditions;
        public List<PerkEffect> effects;
        public List<string> prerequisites; // IDs of perks that must be unlocked first
        public bool isRepeatable;
        public int maxRepeats;
    }

    public class PerkTier
    {
        public int tierNumber;
        public List<StudioPerk> perks;
    }

    public class PerkTree
    {
        public string id;
        public string name;
        public List<PerkTier> tiers;
    }

    [CreateAssetMenu(fileName = "NewStudioPerkData", menuName = "ScriptableObjects/Studio Perk Data")]
    public class StudioPerkData : ScriptableObject
    {
        public List<PerkTree> perkTrees;
        public List<StudioPerk> allPerks; // A flat list of all perks for easy lookup
    }
}
