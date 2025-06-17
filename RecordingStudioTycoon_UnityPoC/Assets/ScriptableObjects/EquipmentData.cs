using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.ScriptableObjects
{
    [CreateAssetMenu(fileName = "EquipmentData", menuName = "RecordingStudioTycoon/EquipmentData", order = 6)]
    public class EquipmentData : ScriptableObject
    {
        public string EquipmentId;
        public string EquipmentName;
        public string Description;
        public int Cost;
        public int UnlockLevel;
        public bool IsUnlocked;
        public SerializableDictionary<string, float> QualityModifiers;
        public List<string> CompatibleProjectTypes;
        public List<string> CompatibleMinigames;
        public float MaintenanceCostMultiplier;
        public float Durability; // 0-1, how long it lasts before needing repair/replacement
        public bool IsOwned;
        public float Condition; // 0-1, current state of the equipment
        
        public EquipmentData()
        {
            EquipmentId = "equip_console_basic";
            EquipmentName = "Basic Mixing Console";
            Description = "A basic mixing console for recording and mixing audio.";
            Cost = 5000;
            UnlockLevel = 1;
            IsUnlocked = false;
            QualityModifiers = new SerializableDictionary<string, float>();
            CompatibleProjectTypes = new List<string>();
            CompatibleMinigames = new List<string>();
            MaintenanceCostMultiplier = 0.1f;
            Durability = 0.8f;
            IsOwned = false;
            Condition = 1.0f;
        }
    }
}
