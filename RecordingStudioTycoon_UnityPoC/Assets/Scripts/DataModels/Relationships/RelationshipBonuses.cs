using System;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels.Market; // For MusicGenre

namespace RecordingStudioTycoon.DataModels.Relationships
{
    [Serializable]
    public class RelationshipBonuses
    {
        public float ContractValueIncrease;
        public float ProjectQualityBonus;
        public float ProjectSpeedBonus;
        public float StaffHappinessBonus;
        public float ReputationGainMultiplier;
        public float MarketingEffectivenessBonus;
        public Dictionary<MusicGenre, float> GenreSpecificBonuses; // Genre -> bonus multiplier

        public RelationshipBonuses()
        {
            ContractValueIncrease = 0f;
            ProjectQualityBonus = 0f;
            ProjectSpeedBonus = 0f;
            StaffHappinessBonus = 0f;
            ReputationGainMultiplier = 1f;
            MarketingEffectivenessBonus = 0f;
            GenreSpecificBonuses = new Dictionary<MusicGenre, float>();
        }
    }
}