using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.Core;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.Utils; // For SerializableDictionary

[CreateAssetMenu(fileName = "EraData", menuName = "Game Data/Era Data")]
public class EraData : ScriptableObject
{
    public List<EraInfo> Eras;
}

[System.Serializable]
public class EraInfo
{
    public string Id;
    public string Name;
    public int StartYear;
    public int EndYear;
    public string Description;
    public List<string> UnlockedEquipmentCategories;
    public List<string> UnlockedMinigames;
    public List<UnlockedFeatureInfo> UnlockedFeatures; // New: Features unlocked by this era
    public SerializableDictionary<string, float> EraSpecificModifiers; // e.g., genre popularity
}
