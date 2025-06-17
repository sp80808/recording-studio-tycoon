using System;

namespace RecordingStudioTycoon.DataModels.Progression
{
    [System.Serializable]
    public class IndustryPrestige
    {
        public string Type; // e.g., "general", "pop_industry", "rock_industry"
        public int Level = 0; // Start at level 0 or 1
        public float BonusMultiplier = 1.0f; // Base multiplier, increases with level

        public IndustryPrestige(string type)
        {
            Type = type;
            Level = 0;
            BonusMultiplier = 1.0f;
        }

        // Method to increase prestige level
        public void IncreasePrestige(int amount)
        {
            Level += amount;
            BonusMultiplier += (amount * 0.01f); // Example: 1% bonus per prestige level
            UnityEngine.Debug.Log($"Industry Prestige for {Type} increased to Level {Level}! Bonus Multiplier: {BonusMultiplier}");
        }
    }
}