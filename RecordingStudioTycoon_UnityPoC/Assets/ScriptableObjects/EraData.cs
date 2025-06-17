using UnityEngine;
using System.Collections.Generic;

namespace RecordingStudioTycoon.ScriptableObjects
{
    [CreateAssetMenu(fileName = "EraData", menuName = "RecordingStudioTycoon/EraData", order = 4)]
    public class EraData : ScriptableObject
    {
        public string EraId;
        public string EraName;
        public string Description;
        public int StartYear;
        public int EndYear;
        public List<string> PopularGenres;
        public List<string> PopularSubGenres;
        public List<string> AvailableEquipment;
        public List<string> AvailableProjectTypes;
        public float MarketTrendMultiplier;
        public int UnlockLevel;
        public bool IsUnlocked;
        
        public EraData()
        {
            EraId = "era_1960s";
            EraName = "1960s";
            Description = "The era of classic rock and early pop music.";
            StartYear = 1960;
            EndYear = 1969;
            PopularGenres = new List<string>();
            PopularSubGenres = new List<string>();
            AvailableEquipment = new List<string>();
            AvailableProjectTypes = new List<string>();
            MarketTrendMultiplier = 1.0f;
            UnlockLevel = 1;
            IsUnlocked = false;
        }
    }
}
