using System;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.Core;
using UnityEngine;
using RecordingStudioTycoon.Utils;
using RecordingStudioTycoon_UnityPoC.Assets.Scripts.DataModels;
using RecordingStudioTycoon.DataModels.Studio;
using RecordingStudioTycoon.DataModels.Projects;
using RecordingStudioTycoon.DataModels.Staff;
using RecordingStudioTycoon.DataModels.Equipment;
using RecordingStudioTycoon.DataModels.Relationships;

namespace RecordingStudioTycoon.GameLogic
{
    [System.Serializable]
    public class GameState
    {
        public int money;
        public int reputation;
        public int currentDay;
        public int currentYear;
        public string currentEra;
        public string selectedEra;
        public int eraStartYear;
        public float equipmentMultiplier;
        public PlayerData playerData;
        public SerializableDictionary<StudioSkillType, StudioSkill> studioSkills;
        public List<string> ownedUpgrades;
        public List<Equipment> ownedEquipment;
        public List<RecordingStudioTycoon.DataModels.Project> availableProjects; // Fully qualify Project
        public RecordingStudioTycoon.DataModels.Project activeProject; // Fully qualify Project
        public List<StaffMember> hiredStaff;
        public List<StaffMember> availableCandidates;
        public int lastSalaryDay;
        public List<GameNotification> notifications;
        public List<Band> bands;
        public List<Band> playerBands;
        public List<SessionMusician> availableSessionMusicians;
        public OriginalTrackProject activeOriginalTrack;
        public ChartsData chartsData;
        public FocusAllocation focusAllocation;
        public List<RecordingStudioTycoon.DataModels.Project> completedProjects; // Fully qualify Project
        public LevelUpDetails levelUpDetails;
        public List<UnlockedFeatureInfo> unlockedFeatures;
        public List<Training> availableTraining;
        public List<Expansion> availableExpansions;
        public List<MarketTrend> currentMarketTrends; // Replaces MarketTrends class
        public List<MarketTrend> historicalMarketTrends; // To store historical data if needed
        public List<Venue> venues;
        public List<Tour> tours;
        public SerializableDictionary<string, int> lastMinigameTriggers;
        public AggregatedPerkModifiers aggregatedPerkModifiers;
        public SerializableDictionary<string, float> globalModifiers;
        public SerializableDictionary<string, RelationshipStats> relationships; // Entity ID -> detailed RelationshipStats
        public int highScore;

        public GameState()
        {
            money = 2000;
            reputation = 10;
            currentDay = 1;
            currentYear = 1960;
            currentEra = "analog60s";
            selectedEra = "analog60s";
            eraStartYear = 1960;
            equipmentMultiplier = 0.3f;
            playerData = new PlayerData();
            studioSkills = new SerializableDictionary<StudioSkillType, StudioSkill>();
            foreach (StudioSkillType skillType in Enum.GetValues(typeof(StudioSkillType)))
            {
                studioSkills[skillType] = new StudioSkill { Name = skillType, Level = 1, Experience = 0, Multiplier = 1, XpToNextLevel = 100 };
            }
            ownedUpgrades = new List<string>();
            ownedEquipment = new List<Equipment>
            {
                new Equipment { Id = "basic_mic", Name = "Basic USB Mic", Category = "microphone", Price = 0, Description = "Standard starter microphone", Bonuses = new SerializableDictionary<string, float> { { "qualityBonus", 0f } }, Icon = "🎤", Condition = 100 },
                new Equipment { Id = "basic_monitors", Name = "Basic Speakers", Category = "monitor", Price = 0, Description = "Standard studio monitors", Bonuses = new SerializableDictionary<string, float> { { "qualityBonus", 0f } }, Icon = "🔊", Condition = 100 }
            };
            availableProjects = new List<RecordingStudioTycoon.DataModels.Project>(); // Fully qualify Project
            activeProject = null;
            hiredStaff = new List<StaffMember>();
            availableCandidates = new List<StaffMember>();
            lastSalaryDay = 0;
            notifications = new List<GameNotification>();
            bands = new List<Band>();
            playerBands = new List<Band>();
            availableSessionMusicians = new List<SessionMusician>();
            activeOriginalTrack = null;
            chartsData = new ChartsData();
            focusAllocation = new FocusAllocation();
            completedProjects = new List<RecordingStudioTycoon.DataModels.Project>(); // Fully qualify Project
            levelUpDetails = null;
            unlockedFeatures = new List<UnlockedFeatureInfo>();
            availableTraining = new List<Training>();
            availableExpansions = new List<Expansion>();
            currentMarketTrends = new List<MarketTrend>(); // Initialize as empty, MarketManager will populate
            historicalMarketTrends = new List<MarketTrend>();
            venues = new List<Venue>();
            tours = new List<Tour>();
            lastMinigameTriggers = new SerializableDictionary<string, int>();
            aggregatedPerkModifiers = new AggregatedPerkModifiers();
            relationships = new SerializableDictionary<string, RelationshipStats>(); // Initialize new relationship dictionary
            highScore = 0;
        }
    }
}
