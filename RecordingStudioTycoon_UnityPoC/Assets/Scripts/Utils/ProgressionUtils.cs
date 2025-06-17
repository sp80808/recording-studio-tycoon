using UnityEngine;
using RecordingStudioTycoon.DataModels.Progression;
using RecordingStudioTycoon.DataModels.Staff;
using RecordingStudioTycoon.GameLogic;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.ScriptableObjects;
using System;
using System.Collections.Generic;
using RecordingStudioTycoon.ScriptableObjects; // For EraData
using RecordingStudioTycoon.DataModels; // For UnlockedFeatureInfo, PlayerAbilityChange, StudioSkill, StudioSkillType, PlayerData, PlayerAttributes
using RecordingStudioTycoon.DataModels.Progression; // For PlayerAttributeChange
using RecordingStudioTycoon.GameLogic;
using RecordingStudioTycoon.Core;
using RecordingStudioTycoon.Utils; // For SerializableDictionary

namespace RecordingStudioTycoon.Utils
{
    public static class ProgressionUtils
    {
        public static int CalculatePlayerXpRequirement(int level)
        {
            // A more dynamic XP curve could be implemented here
            return 100 + (level - 1) * 50;
        }

        public static int CalculateEraMilestoneXPRequirement(int eraIndex)
        {
            // Example: XP requirement for era transition
            return 1000 + eraIndex * 500;
        }

        public static void CheckSkillLevelUp(StudioSkill skill)
        {
            while (skill.Experience >= skill.XpToNextLevel)
            {
                skill.Level++;
                skill.Experience -= skill.XpToNextLevel;
                skill.XpToNextLevel = skill.XpToNextLevel + 50;
                skill.Multiplier += 0.05f;
                Debug.Log($"Skill {skill.Name} leveled up to {skill.Level}!");
            }
        }

        /// <summary>
        /// Unlocks features based on era transition or level up.
        /// </summary>
        public static void UnlockFeatures(List<UnlockedFeatureInfo> features)
        {
            if (features == null) return;

            foreach (var feature in features)
            {
                Debug.Log($"Unlocked: {feature.Name} - {feature.Description}");
                // TODO: Implement actual unlocking logic (e.g., enable UI elements, add to available lists)
                // This might involve GameManager, UIManager, or other specific managers.
            }
        }

        /// <summary>
        /// Applies player ability changes.
        /// </summary>
        public static void ApplyAbilityChanges(PlayerData playerData, List<PlayerAbilityChange> changes)
        {
            if (changes == null) return;

            foreach (var change in changes)
            {
                Debug.Log($"Applying ability change: {change.Name} from {change.OldValue} to {change.NewValue}");
                // Example: Direct application to PlayerData
                if (change.Name == "Daily Work Capacity" && change.NewValue is int)
                {
                    playerData.dailyWorkCapacity = (int)change.NewValue;
                }
                // Add more ability changes as needed
            }
        }

        /// <summary>
        /// Applies player attribute changes.
        /// </summary>
        public static void ApplyAttributeChanges(PlayerAttributes attributes, List<PlayerAttributeChange> changes)
        {
            if (changes == null) return;

            foreach (var change in changes)
            {
                Debug.Log($"Applying attribute change: {change.Name} from {change.OldValue} to {change.NewValue}");
                // Example: Direct application to PlayerAttributes
                switch (change.Name)
                {
                    case "focusMastery": attributes.focusMastery = change.NewValue; break;
                    case "creativeIntuition": attributes.creativeIntuition = change.NewValue; break;
                    case "technicalAptitude": attributes.technicalAptitude = change.NewValue; break;
                    case "businessAcumen": attributes.businessAcumen = change.NewValue; break;
                    case "creativity": attributes.creativity = change.NewValue; break;
                    case "technical": attributes.technical = change.NewValue; break;
                    case "business": attributes.business = change.NewValue; break;
                    case "charisma": attributes.charisma = change.NewValue; break;
                    case "luck": attributes.luck = change.NewValue; break;
                }
            }
        }

        public static void LevelUpSkill(StudioSkill skill, int levels = 1)
        {
            // Implement skill level up logic
        }

        public static float CalculateSkillMultiplier(StudioSkill skill)
        {
            // Implement multiplier calculation
            return 1.0f;
        }
    }
}
