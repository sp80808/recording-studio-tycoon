using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.Core;
using RecordingStudioTycoon.Utils;

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
    public SerializableDictionary<string, float> Modifiers; // e.g., "projectQualityBonus": 0.1
    public bool IsUnlocked;
}
