using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels.Progression
{
    [Serializable]
    public class PerkTree
    {
        public string Id;
        public string Name;
        public string Description;
        public List<PerkTier> Tiers;
    }

    [Serializable]
    public class PerkTier
    {
        public int TierNumber;
        public List<StudioPerk> Perks;
    }
}