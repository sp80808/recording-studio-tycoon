using System;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels.Market; // For MusicGenre

namespace RecordingStudioTycoon.DataModels.Progression
{
    [Serializable]
    public class StudioPerk
    {
        public string Id;
        public string Name;
        public string Description;
        public string Category;
        public int Tier;
        public PerkCost Cost;
        public List<PerkUnlockCondition> UnlockConditions;
        public List<PerkEffect> Effects;
        public List<string> Prerequisites; // IDs of perks that must be unlocked first
        public bool IsRepeatable;
        public int MaxRepeats;
        public int CooldownDays; // Days before perk can be used/applied again if repeatable
    }

    [Serializable]
    public class PerkCost
    {
        public int Money;
        public int PerkPoints;
    }
}