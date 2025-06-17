using UnityEngine;
using RecordingStudioTycoon.DataModels.Progression;
using RecordingStudioTycoon.Utils;
using System.Collections.Generic;
using RecordingStudioTycoon.Core;

[CreateAssetMenu(fileName = "StudioPerkData", menuName = "Game Data/Studio Perk Data")]
public class StudioPerkData : ScriptableObject
{
    public List<StudioPerkTree> PerkTrees;
}

[System.Serializable]
public class StudioPerkTree
{
    public string Id;
    public string Name;
    public List<StudioPerk> Perks;
}

[System.Serializable]
public class StudioPerk
{
    public string Id;
    public string Name;
    public string Description;
    public int Cost;
    public List<string> Prerequisites; // IDs of perks required to unlock this one
    public List<PerkUnlockCondition> UnlockConditions;
    public List<PerkEffect> Effects;
    public bool IsRepeatable;
    public int MaxRepeats; // 0 for unlimited, >0 for a specific limit
    public bool IsUnlocked; // This might be managed at runtime in GameState, not static data
}
