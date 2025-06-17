using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.Core;

namespace RecordingStudioTycoon.ScriptableObjects
{
    [CreateAssetMenu(fileName = "EquipmentData", menuName = "Recording Studio Tycoon/Equipment Data")]
    public class EquipmentData : ScriptableObject
    {
        public List<Equipment> availableEquipment;
        public SerializableDictionary<string, Equipment> equipmentTemplates;
    }
} 