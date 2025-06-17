using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class ReputableEntity
    {
        public string Id;
        public string Name;
        public EntityType Type;
        public int RelationshipScore; // 0-100
        public List<string> PreferredGenres; // List of genre IDs
        public List<Mood> PreferredMoods; // List of Mood enums

        // Common properties from Artist/Client/RecordLabel
        public int Reputation; // Overall reputation of the entity
        public List<string> CollaborationHistory; // IDs of past collaborations
        public long LastActiveDay; // Game day of last activity
        public int DemandLevel; // How in-demand this entity is
        public string Description;
        public int Mood; // 0-100, general mood/disposition

        public ReputableEntity()
        {
            Id = Guid.NewGuid().ToString();
            Name = "New Entity";
            Type = EntityType.Client; // Default type
            RelationshipScore = 50;
            PreferredGenres = new List<string>();
            PreferredMoods = new List<Mood>();
            Reputation = 50;
            CollaborationHistory = new List<string>();
            LastActiveDay = 0;
            DemandLevel = 50;
            Description = "";
            Mood = 75;
        }
    }
}