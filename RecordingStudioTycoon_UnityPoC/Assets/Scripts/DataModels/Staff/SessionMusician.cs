using System;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.DataModels.Staff
{
    [System.Serializable]
    public class SessionMusician
    {
        public string Id;
        public string Name;
        public string Specialty; // e.g., "Guitar", "Vocals", "Drums"
        public int CostPerSession;
        public int Availability; // Percentage chance they're available for a session
        public int SkillLevel; // 1-100, how skilled they are
        public SerializableDictionary<string, int> GenreAffinity; // Affinity for specific genres
        public bool IsHired;
        public string CurrentProjectId;

        public SessionMusician()
        {
            Id = Guid.NewGuid().ToString();
            Name = "Session Musician";
            Specialty = "Guitar";
            CostPerSession = 500;
            Availability = 80;
            SkillLevel = 50;
            GenreAffinity = new SerializableDictionary<string, int>();
            IsHired = false;
            CurrentProjectId = "";
        }
    }
}
