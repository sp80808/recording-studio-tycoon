using System;
using RecordingStudioTycoon.DataModels.Market; // For MusicGenre

namespace RecordingStudioTycoon.DataModels.Progression
{
    [System.Serializable]
    public class StudioSpecialization
    {
        public MusicGenre Genre;
        public int Level = 0; // Start at level 0 or 1
        public int Experience = 0;
        public float BonusMultiplier = 1.0f; // Base multiplier, increases with level
        public int XpToNextLevel = 100; // XP required to reach the next level

        public StudioSpecialization(MusicGenre genre)
        {
            Genre = genre;
            Level = 0;
            Experience = 0;
            BonusMultiplier = 1.0f;
            XpToNextLevel = 100;
        }

        // Method to level up specialization
        public void AddExperience(int amount)
        {
            Experience += amount;
            while (Experience >= XpToNextLevel)
            {
                Experience -= XpToNextLevel;
                Level++;
                BonusMultiplier += 0.05f; // Example: 5% bonus per level
                XpToNextLevel = (int)(XpToNextLevel * 1.2f); // Increase XP required for next level
                UnityEngine.Debug.Log($"Studio Specialization in {Genre} leveled up to Level {Level}! Bonus Multiplier: {BonusMultiplier}");
            }
        }
    }
}