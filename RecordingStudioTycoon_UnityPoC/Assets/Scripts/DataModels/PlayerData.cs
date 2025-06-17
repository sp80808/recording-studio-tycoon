using System;
using System.Collections.Generic;
using UnityEngine;
using RecordingStudioTycoon.Core;
using RecordingStudioTycoon.Utils; // For SerializableDictionary

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class PlayerData
    {
        public string name;
        public int level;
        public int experience;
        public int money; // Redundant if money is in GameState, but kept for consistency with TS
        public int reputation;
        public SerializableDictionary<StudioSkillType, int> skills; // Enum for keys
        public int xp;
        public int xpToNextLevel;
        public int perkPoints;
        public int attributePoints;
        public PlayerAttributes attributes;
        public int dailyWorkCapacity;
        public string lastMinigameType; // Nullable in TS, string in C# can be null or empty

        public PlayerData()
        {
            name = "Studio Owner";
            level = 1;
            experience = 0;
            money = 0;
            reputation = 10;
            skills = new SerializableDictionary<StudioSkillType, int>();
            foreach (StudioSkillType skillType in Enum.GetValues(typeof(StudioSkillType)))
            {
                skills[skillType] = 0;
            }
            xp = 0;
            xpToNextLevel = 100;
            perkPoints = 3;
            attributePoints = 0;
            attributes = new PlayerAttributes();
            dailyWorkCapacity = 5;
            lastMinigameType = null;
        }
    }

    [System.Serializable]
    public class PlayerAttributes
    {
        public int focusMastery;
        public int creativeIntuition;
        public int technicalAptitude;
        public int businessAcumen;
        public int creativity;
        public int technical;
        public int business;
        public int charisma;
        public int luck;

        public PlayerAttributes()
        {
            focusMastery = 1;
            creativeIntuition = 1;
            technicalAptitude = 1;
            businessAcumen = 1;
            creativity = 10;
            technical = 10;
            business = 10;
            charisma = 5;
            luck = 5;
        }
    }

    public enum StudioSkillType
    {
        recording, mixing, mastering, production, marketing, composition, soundDesign, sequencing
    }
}
