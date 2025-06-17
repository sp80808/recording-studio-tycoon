using UnityEngine;
using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels
{
    [Serializable]
    public class ProgressionMilestone
    {
        public int level;
        public int staffCount;
        public int projectsCompleted;
        public string unlockMessage;
        public List<string> features; // List of feature IDs unlocked by this milestone
    }

    [CreateAssetMenu(fileName = "NewProgressionData", menuName = "ScriptableObjects/Progression Data")]
    public class ProgressionData : ScriptableObject
    {
        public List<ProgressionMilestone> milestones;

        // Method to calculate XP to next level, similar to usePlayerProgression.tsx
        public int CalculateXPToNextLevel(int currentLevel)
        {
            const int baseXP = 100;
            const float growthFactor = 1.4f;
            int levelOffset = Mathf.Max(0, currentLevel - 1);
            return Mathf.FloorToInt(baseXP * Mathf.Pow(growthFactor, levelOffset * 0.7f));
        }
    }
}
