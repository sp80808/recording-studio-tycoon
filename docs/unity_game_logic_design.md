# Unity C# Structure for Core Game Logic

This document outlines the proposed Unity C# structure for the core game logic, based on the analysis of `src/hooks/useGameActions.ts` and `src/hooks/useGameState.tsx` from the existing React application.

### Overall Architecture Flow

```mermaid
graph TD
    UnityScene[Unity Scene] --> GameManagerGO(GameManager GameObject)
    GameManagerGO --> GameManager(GameManager.cs)
    GameManager --> GameStateInstance(GameState Instance)
    GameManager --> StaticUtils[Static Utility Classes]
    GameManager --> ScriptableObjects[ScriptableObject Data Assets]
    GameManager --> UnityEvents[Unity Events / C# Events]

    GameStateInstance --> GameStateClass(GameState.cs)
    GameStateClass --> PlayerDataClass(PlayerData.cs)
    GameStateClass --> StudioSkillClass(StudioSkill.cs)
    GameStateClass --> EquipmentClass(Equipment.cs)
    GameStateClass --> NotificationClass(GameNotification.cs)
    GameStateClass --> BandClass(Band.cs)
    GameStateClass --> StaffMemberClass(StaffMember.cs)
    GameStateClass --> ProjectClasses[Project Types (e.g., OriginalTrackProject.cs)]
    GameStateClass --> ChartDataClass(ChartsData.cs)
    GameStateClass --> MarketTrendsClass(MarketTrends.cs)
    GameStateClass --> AggregatedPerkModifiersClass(AggregatedPerkModifiers.cs)
    GameStateClass --> FocusAllocationClass(FocusAllocation.cs)

    GameManager -- "Calls Methods" --> GameStateInstance
    GameManager -- "Uses" --> StaticUtils
    GameManager -- "Loads Data From" --> ScriptableObjects
    GameManager -- "Triggers" --> UnityEvents
    UnityEvents -- "Listens To" --> UIManager[UI Manager / Other Game Systems]
    StaticUtils -- "Provides Logic" --> GameManager
    ScriptableObjects -- "Provides Data" --> GameManager
```

### 1. Core Game State Class: `GameState.cs`

The `GameState.cs` class will be a regular C# class, not a `ScriptableObject`. This is because `GameState` represents the dynamic, mutable state of the entire game that needs to be saved and loaded. `ScriptableObject` is best suited for static, immutable data assets that are configured in the Unity Editor.

To ensure `GameState` can be easily serialized for saving and loading, it will be marked with `[System.Serializable]`. All complex nested types will also be defined as `[System.Serializable]` classes or structs.

**File:** `Assets/Scripts/Game/GameState.cs`

```csharp
using System;
using System.Collections.Generic;
using UnityEngine; // For common Unity types if needed, though not strictly for data

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
    public Dictionary<StudioSkillType, StudioSkill> studioSkills; // Enum for keys
    public List<string> ownedUpgrades; // Assuming string IDs for upgrades
    public List<Equipment> ownedEquipment;
    public List<Project> availableProjects; // Base Project class
    public Project activeProject; // Nullable
    public List<StaffMember> hiredStaff;
    public List<StaffMember> availableCandidates;
    public int lastSalaryDay;
    public List<GameNotification> notifications;
    public List<Band> bands;
    public List<Band> playerBands;
    public List<SessionMusician> availableSessionMusicians;
    public OriginalTrackProject activeOriginalTrack; // Nullable
    public ChartsData chartsData;
    public FocusAllocation focusAllocation;
    public List<Project> completedProjects;
    public LevelUpDetails levelUpDetails; // Nullable
    public List<UnlockedFeatureInfo> unlockedFeatures;
    public List<Training> availableTraining; // Assuming Training is a defined type
    public List<Expansion> availableExpansions; // Assuming Expansion is a defined type
    public MarketTrends marketTrends;
    public List<Venue> venues; // Assuming Venue is a defined type
    public List<Tour> tours; // Assuming Tour is a defined type
    public Dictionary<string, int> lastMinigameTriggers; // Assuming string keys for minigame types
    public AggregatedPerkModifiers aggregatedPerkModifiers;

    // Constructor for initial state
    public GameState()
    {
        // Initialize default values similar to createDefaultGameState in useGameState.tsx
        money = 2000;
        reputation = 10;
        currentDay = 1;
        currentYear = 1960;
        currentEra = "analog60s";
        selectedEra = "analog60s";
        eraStartYear = 1960;
        equipmentMultiplier = 0.3f;
        playerData = new PlayerData();
        studioSkills = new Dictionary<StudioSkillType, StudioSkill>();
        // Populate initial studio skills
        foreach (StudioSkillType skillType in Enum.GetValues(typeof(StudioSkillType)))
        {
            studioSkills[skillType] = new StudioSkill { Name = skillType, Level = 1, Experience = 0, Multiplier = 1, XpToNextLevel = 100 };
        }
        ownedUpgrades = new List<string>();
        ownedEquipment = new List<Equipment>
        {
            new Equipment { Id = "basic_mic", Name = "Basic USB Mic", Category = "microphone", Price = 0, Description = "Standard starter microphone", Bonuses = new Dictionary<string, float> { { "qualityBonus", 0f } }, Icon = "🎤", Condition = 100 },
            new Equipment { Id = "basic_monitors", Name = "Basic Speakers", Category = "monitor", Price = 0, Description = "Standard studio monitors", Bonuses = new Dictionary<string, float> { { "qualityBonus", 0f } }, Icon = "🔊", Condition = 100 }
        };
        availableProjects = new List<Project>();
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
        completedProjects = new List<Project>();
        levelUpDetails = null;
        unlockedFeatures = new List<UnlockedFeatureInfo>();
        availableTraining = new List<Training>();
        availableExpansions = new List<Expansion>();
        marketTrends = new MarketTrends();
        venues = new List<Venue>();
        tours = new List<Tour>();
        lastMinigameTriggers = new Dictionary<string, int>();
        aggregatedPerkModifiers = new AggregatedPerkModifiers();
    }
}

// Define nested serializable classes/structs for complex types
[System.Serializable]
public class PlayerData
{
    public string name;
    public int level;
    public int experience;
    public int money; // Redundant if money is in GameState, but kept for consistency with TS
    public int reputation;
    public Dictionary<StudioSkillType, int> skills; // Enum for keys
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
        skills = new Dictionary<StudioSkillType, int>();
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

[System.Serializable]
public class StudioSkill
{
    public StudioSkillType Name;
    public int Level;
    public int Experience;
    public float Multiplier;
    public int XpToNextLevel;
}

[System.Serializable]
public class Equipment
{
    public string Id;
    public string Name;
    public string Category;
    public int Price;
    public string Description;
    public Dictionary<string, float> Bonuses; // e.g., qualityBonus
    public string Icon;
    public int Condition;
}

[System.Serializable]
public class Project { /* ... define properties for Project ... */ }
[System.Serializable]
public class StaffMember { /* ... define properties for StaffMember ... */ }
[System.Serializable]
public class GameNotification { /* ... define properties for GameNotification ... */ }
[System.Serializable]
public class Band { /* ... define properties for Band ... */ }
[System.Serializable]
public class SessionMusician { /* ... define properties for SessionMusician ... */ }
[System.Serializable]
public class OriginalTrackProject { /* ... define properties for OriginalTrackProject ... */ }
[System.Serializable]
public class ChartsData { /* ... define properties for ChartsData ... */ }
[System.Serializable]
public class FocusAllocation { /* ... define properties for FocusAllocation ... */ }
[System.Seralizable]
public class LevelUpDetails { /* ... define properties for LevelUpDetails ... */ }
[System.Serializable]
public class UnlockedFeatureInfo { /* ... define properties for UnlockedFeatureInfo ... */ }
[System.Serializable]
public class Training { /* ... define properties for Training ... */ }
[System.Serializable]
public class Expansion { /* ... define properties for Expansion ... */ }
[System.Seralizable]
public class MarketTrends { /* ... define properties for MarketTrends ... */ }
[System.Serializable]
public class Venue { /* ... define properties for Venue ... */ }
[System.Serializable]
public class Tour { /* ... define properties for Tour ... */ }
[System.Serializable]
public class AggregatedPerkModifiers { /* ... define properties for AggregatedPerkModifiers ... */ }

// Note: For Dictionary serialization in Unity, you might need a custom wrapper class
// or use a third-party serialization library like Newtonsoft.Json.
// For simplicity, assuming Unity's default JSONUtility can handle it or a custom solution will be implemented.
```

### 2. Game Manager Class: `GameManager.cs`

The `GameManager.cs` will be a `MonoBehaviour` and implement the Singleton pattern for easy global access. It will hold the `GameState` instance and expose methods for game actions.

**File:** `Assets/Scripts/Game/GameManager.cs`

```csharp
using UnityEngine;
using System;
using System.Collections.Generic;

public class GameManager : MonoBehaviour
{
    // Singleton instance
    public static GameManager Instance { get; private set; }

    [SerializeField] private GameState _gameState; // Use SerializeField to expose in Inspector for debugging
    public GameState GameState => _gameState; // Public getter for GameState

    // Events for UI updates or other systems to subscribe to
    public static event Action<LevelUpDetails> OnPlayerLevelUp;
    public static event Action OnGameStateChanged; // Generic event for any state change

    // Dependencies (ScriptableObjects for static data, or other MonoBehaviours/static classes)
    [SerializeField] private ProgressionData _progressionData; // ScriptableObject for milestones, XP requirements
    [SerializeField] private ProjectData _projectData; // ScriptableObject for project templates, candidate generation rules
    // ... other ScriptableObject dependencies

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject); // Persist across scenes

        InitializeGame();
    }

    private void InitializeGame()
    {
        // Load game state from save system, or create default
        // For now, create default
        _gameState = new GameState();

        // Initialize dynamic data based on initial game state
        // These would typically be handled by dedicated services/managers
        _gameState.availableProjects = ProjectUtils.GenerateNewProjects(3, _gameState.playerData.level, _gameState.currentEra);
        _gameState.availableCandidates = StaffUtils.GenerateCandidates(3, _gameState);
        _gameState.availableSessionMusicians = BandUtils.GenerateSessionMusicians(5);

        Debug.Log("GameManager initialized. Current Day: " + _gameState.currentDay);
        OnGameStateChanged?.Invoke(); // Notify listeners that game state is ready
    }

    // --- Game Actions (Translated from useGameActions.ts) ---

    public void AdvanceDay()
    {
        _gameState.currentDay++;
        // Trigger daily events, staff work, project progress, etc.
        PerformDailyWork(); // Call the internal method
        Debug.Log($"Day advanced to: {_gameState.currentDay}");
        OnGameStateChanged?.Invoke();
    }

    private void PerformDailyWork()
    {
        // Placeholder for daily work logic.
        // This would involve iterating through active projects, staff assignments, etc.
        // and updating the game state accordingly.
        Debug.Log("Performing daily work...");
        // Example: ProjectManager.Instance.ProcessActiveProjects(_gameState);
        // Example: StaffManager.Instance.ProcessStaffActions(_gameState);
    }

    public void CollectMoney(int amount)
    {
        _gameState.money += amount;
        Debug.Log($"Collected {amount} money. Total: {_gameState.money}");
        OnGameStateChanged?.Invoke();
    }

    public void AddMoney(int amount)
    {
        CollectMoney(amount); // Direct call, as in TS
    }

    public void AddReputation(int amount)
    {
        _gameState.reputation += amount;
        Debug.Log($"Added {amount} reputation. Total: {_gameState.reputation}");
        OnGameStateChanged?.Invoke();
    }

    public void AddXP(int amount)
    {
        bool levelUpOccurred = false;
        int initialPlayerLevel = _gameState.playerData.level;
        int newPlayerLevel = initialPlayerLevel;
        int currentXp = _gameState.playerData.xp + amount;
        int xpToNext = _gameState.playerData.xpToNextLevel;
        int perkPointsGainedThisLevelUp = 0;
        int attributePointsGainedThisLevelUp = 0;

        List<UnlockedFeatureInfo> collectedUnlockedFeatures = new List<UnlockedFeatureInfo>();
        List<PlayerAbilityChange> collectedAbilityChanges = new List<PlayerAbilityChange>();
        List<PlayerAttributeChange> collectedAttributeChanges = new List<PlayerAttributeChange>();

        while (currentXp >= xpToNext)
        {
            levelUpOccurred = true;
            newPlayerLevel++;
            currentXp -= xpToNext;
            xpToNext = ProgressionUtils.CalculatePlayerXpRequirement(newPlayerLevel); // Use C# utility
            
            // Access milestones from ScriptableObject or static data
            PlayerMilestone milestone = _progressionData.GetPlayerMilestone(newPlayerLevel);
            if (milestone != null)
            {
                if (milestone.UnlockedFeatures != null)
                {
                    collectedUnlockedFeatures.AddRange(milestone.UnlockedFeatures);
                }
                if (milestone.AbilityChanges != null)
                {
                    collectedAbilityChanges.AddRange(milestone.AbilityChanges);
                }
                perkPointsGainedThisLevelUp += milestone.PerkPointsGained;
                attributePointsGainedThisLevelUp += milestone.AttributePointsGained;
            }
        }

        _gameState.playerData.xp = currentXp;
        _gameState.playerData.level = newPlayerLevel;
        _gameState.playerData.xpToNextLevel = xpToNext;
        _gameState.playerData.perkPoints += perkPointsGainedThisLevelUp;
        _gameState.playerData.attributePoints += attributePointsGainedThisLevelUp;

        if (levelUpOccurred)
        {
            // Apply direct ability changes
            foreach (var change in collectedAbilityChanges)
            {
                if (change.Name == "Daily Work Capacity" && change.NewValue is int)
                {
                    _gameState.playerData.dailyWorkCapacity = (int)change.NewValue;
                }
                // Add other direct ability changes here
            }

            LevelUpDetails detailsForModal = new LevelUpDetails
            {
                NewPlayerLevel = newPlayerLevel,
                UnlockedFeatures = collectedUnlockedFeatures,
                AbilityChanges = collectedAbilityChanges,
                AttributeChanges = collectedAttributeChanges, // Will be empty based on current milestone setup
                ProjectSummaries = new List<ProjectSummary>(), // Placeholder
                StaffHighlights = new List<StaffHighlight>() // Placeholder
            };
            OnPlayerLevelUp?.Invoke(detailsForModal); // Trigger event for UI
        }
        OnGameStateChanged?.Invoke();
    }

    public void AddAttributePoints(string attributeName) // Use string for attribute name
    {
        if (_gameState.playerData.attributePoints > 0)
        {
            // Use reflection or a switch statement to update the specific attribute
            // For simplicity, assuming direct access or a helper method
            switch (attributeName)
            {
                case "focusMastery": _gameState.playerData.attributes.focusMastery++; break;
                case "creativeIntuition": _gameState.playerData.attributes.creativeIntuition++; break;
                case "technicalAptitude": _gameState.playerData.attributes.technicalAptitude++; break;
                case "businessAcumen": _gameState.playerData.attributes.businessAcumen++; break;
                case "creativity": _gameState.playerData.attributes.creativity++; break;
                case "technical": _gameState.playerData.attributes.technical++; break;
                case "business": _gameState.playerData.attributes.business++; break;
                case "charisma": _gameState.playerData.attributes.charisma++; break;
                case "luck": _gameState.playerData.attributes.luck++; break;
            }
            _gameState.playerData.attributePoints--;
            OnGameStateChanged?.Invoke();
        }
    }

    public void AddSkillXP(StudioSkillType skillId, int amount)
    {
        if (_gameState.studioSkills.ContainsKey(skillId))
        {
            _gameState.studioSkills[skillId].Experience += amount;
            // Add skill level up logic here or in ProgressionUtils
            Debug.Log($"Added {amount} XP to {skillId}. Current XP: {_gameState.studioSkills[skillId].Experience}");
            OnGameStateChanged?.Invoke();
        }
    }

    public void AddPerkPoint()
    {
        _gameState.playerData.perkPoints++;
        Debug.Log($"Added perk point. Total: {_gameState.playerData.perkPoints}");
        OnGameStateChanged?.Invoke();
    }

    public void TriggerEraTransition(string newEraId)
    {
        Debug.Log($"Triggering era transition to {newEraId} (placeholder)");
        _gameState.currentEra = newEraId;
        OnGameStateChanged?.Invoke();
    }

    public void RefreshCandidates()
    {
        Debug.Log("Refreshing candidates (placeholder in GameManager)");
        _gameState.availableCandidates = StaffUtils.GenerateCandidates(3, _gameState);
        OnGameStateChanged?.Invoke();
    }

    // --- Helper methods for GameState updates ---
    // In C#, direct modification of public fields is common.
    // If complex updates are needed, a dedicated GameStateService could be used,
    // or methods within GameManager that encapsulate the logic.
    // For now, direct modification within GameManager methods is sufficient.

    // Example of a method that might be called by a UI element
    public void SetFocusAllocation(FocusAllocation newAllocation)
    {
        _gameState.focusAllocation = newAllocation;
        OnGameStateChanged?.Invoke();
    }
}

// Define supporting types for events and data
[System.Serializable]
public class PlayerAbilityChange { public string Name; public object OldValue; public object NewValue; }
[System.Serializable]
public class PlayerAttributeChange { public string Name; public int OldValue; public int NewValue; }
[System.Serializable]
public class ProjectSummary { /* ... */ }
[System.Serializable]
public class StaffHighlight { /* ... */ }

// --- ScriptableObject Definitions for Static Data ---

// File: Assets/ScriptableObjects/ProgressionData.cs
[CreateAssetMenu(fileName = "ProgressionData", menuName = "Game Data/Progression Data")]
public class ProgressionData : ScriptableObject
{
    public List<PlayerMilestone> PlayerMilestones; // List of all milestones

    public PlayerMilestone GetPlayerMilestone(int level)
    {
        return PlayerMilestones.Find(m => m.Level == level);
    }
}

[System.Serializable]
public class PlayerMilestone
{
    public int Level;
    public List<UnlockedFeatureInfo> UnlockedFeatures;
    public List<PlayerAbilityChange> AbilityChanges;
    public int PerkPointsGained;
    public int AttributePointsGained;
}

// File: Assets/ScriptableObjects/ProjectData.cs
[CreateAssetMenu(fileName = "ProjectData", menuName = "Game Data/Project Data")]
public class ProjectData : ScriptableObject
{
    public List<ProjectTemplate> ProjectTemplates;
    // ... other project-related static data
}

// --- Static Utility Classes (Replacing JS utils) ---

// File: Assets/Scripts/Utils/ProgressionUtils.cs
public static class ProgressionUtils
{
    public static int CalculatePlayerXpRequirement(int level)
    {
        // Implement XP calculation logic here
        return 100 + (level - 1) * 50; // Example
    }
}

// File: Assets/Scripts/Utils/ProjectUtils.cs
public static class ProjectUtils
{
    public static List<Project> GenerateNewProjects(int count, int playerLevel, string currentEra)
    {
        // Implement project generation logic
        return new List<Project>();
    }
}

// File: Assets/Scripts/Utils/StaffUtils.cs
public static class StaffUtils
{
    public static List<StaffMember> GenerateCandidates(int count, GameState gameState)
    {
        // Implement candidate generation logic
        return new List<StaffMember>();
    }
}

// File: Assets/Scripts/Utils/BandUtils.cs
public static class BandUtils
{
    public static List<SessionMusician> GenerateSessionMusicians(int count)
    {
        // Implement session musician generation logic
        return new List<SessionMusician>();
    }
}
```

### 3. Simplification and Unity Best Practices

1.  **Singleton Pattern for `GameManager`**:
    *   The `GameManager` is implemented as a Singleton (`public static GameManager Instance { get; private set; }`). This provides a single, globally accessible point for all game logic and state, simplifying access from other `MonoBehaviour` scripts (e.g., UI elements, minigames).
    *   `DontDestroyOnLoad(gameObject)` ensures the `GameManager` persists across scene loads, maintaining the game state throughout the player's session.

2.  **`[SerializeField]` for Inspector Exposure**:
    *   Private fields like `_gameState`, `_progressionData`, and `_projectData` are marked with `[SerializeField]`. This allows them to be viewed and assigned in the Unity Inspector, which is invaluable for debugging and for designers to link `ScriptableObject` assets.

3.  **Data-Driven Design with `ScriptableObject`**:
    *   Static game data (e.g., `PLAYER_MILESTONES` from `progressionUtils`, `projectTemplates` from `projectUtils`) should be moved into `ScriptableObject` assets (e.g., `ProgressionData.cs`, `ProjectData.cs`).
    *   This allows designers to balance and configure game values (XP requirements, milestone unlocks, project parameters) directly in the Unity Editor without touching code, promoting a more flexible and maintainable game.
    *   The `GameManager` holds references to these `ScriptableObject` assets.

4.  **Unity Events / C# Events for Callbacks**:
    *   Instead of passing `triggerLevelUpModal` as a function parameter, Unity's event system is leveraged.
    *   `public static event Action<LevelUpDetails> OnPlayerLevelUp;` is a C# event that `GameManager` invokes. Any UI component (e.g., a `LevelUpModalManager.cs` `MonoBehaviour`) can subscribe to this event in its `OnEnable()` method and unsubscribe in `OnDisable()`. This decouples the `GameManager` from specific UI implementations.
    *   A generic `OnGameStateChanged` event is also proposed to allow any part of the UI or other systems to react to general state updates, reducing the need for polling.

5.  **Separation of Concerns**:
    *   `GameState.cs` is purely a data container.
    *   `GameManager.cs` handles the core game logic and state transitions.
    *   Utility functions (like `calculatePlayerXpRequirement`, `generateNewProjects`) are moved into static helper classes (e.g., `ProgressionUtils.cs`, `ProjectUtils.cs`, `StaffUtils.cs`, `BandUtils.cs`). This keeps the `GameManager` cleaner and promotes reusability of these helper functions.
    *   UI components would subscribe to events from `GameManager` and read from `GameManager.Instance.GameState` to display information, maintaining a clear unidirectional data flow.

6.  **Serialization of Complex Types**:
    *   For `Dictionary` types (like `studioSkills` or `Bonuses` in `Equipment`), Unity's default JSON serialization (`JsonUtility`) has limitations. A custom serialization solution (e.g., a wrapper class that converts `Dictionary` to `List<KeyValuePair>` for serialization, or using a third-party library like Newtonsoft.Json) would be required for robust saving/loading. This is a common challenge in Unity and needs to be addressed during implementation.

7.  **Initialization Flow**:
    *   The `InitializeGame` method in `GameManager` handles the initial setup of the game state, similar to `initializeGameState` in `useGameState.tsx`. This method would typically load from a save file if one exists, otherwise create a default state.