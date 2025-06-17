using System;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels.Market; // For MusicGenre

namespace RecordingStudioTycoon.DataModels.Relationships
{
    [Serializable]
    public class ReputableEntity
    {
        public string Id;
        public string Name;
        public EntityType Type;
        public string ImagePath;
        public int RelationshipScore; // Current relationship score (0-100)
        public List<MusicGenre> PreferredGenres;
        public List<string> PreferredMoods; // Assuming Mood is a string enum or class
        public RelationshipStats Stats; // Detailed stats like trust, respect, interaction counts
        public bool IsBlacklisted;

        public ReputableEntity()
        {
            PreferredGenres = new List<MusicGenre>();
            PreferredMoods = new List<string>();
            Stats = new RelationshipStats();
            IsBlacklisted = false;
        }
    }
}