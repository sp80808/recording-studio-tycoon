using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.Core;
using RecordingStudioTycoon.DataModels; // Ensure Equipment is accessible
using RecordingStudioTycoon.Utils; // For SerializableDictionary

[CreateAssetMenu(fileName = "EquipmentData", menuName = "Game Data/Equipment Data")]
public class EquipmentData : ScriptableObject
{
    public List<Equipment> AllEquipment;

    public Equipment GetEquipmentById(string id)
    {
        return AllEquipment.Find(e => e.Id == id);
    }
}
