using UnityEngine;
using System;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels; // For MusicGenre, EquipmentData, etc.

namespace RecordingStudioTycoon.DataModels
{
    [Serializable]
    public class EraUnlock
    {
        public string unlockId; // Unique ID for the unlocked item/feature
        public string unlockType; // e.g., "Equipment", "StaffRole", "Minigame", "ProjectTemplate", "PerkTree"
        public string description; // Description of what is unlocked
    }

    [CreateAssetMenu(fileName = "NewEraData", menuName = "ScriptableObjects/Era Data")]
    public class EraData : ScriptableObject
    {
        public string eraId;
        public string eraName;
        public string description;
        public int minPlayerLevel; // Minimum player level to enter this era
        public List<EraUnlock> unlocks; // List of items/features unlocked in this era
        public List<MusicGenre> popularGenres; // Genres that are popular in this era
        public List<MusicGenre> emergingGenres; // Genres that start emerging in this era
        public List<MusicGenre> fadingGenres; // Genres that start fading in this era
        public List<string> historicalEvents; // IDs of historical events that can occur in this era
    }
}
