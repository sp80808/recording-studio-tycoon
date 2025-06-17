using System;

namespace RecordingStudioTycoon.DataModels.Relationships
{
    [Serializable]
    public class RelationshipStats
    {
        public int RelationshipScore; // 0-100
        public int Trust; // 0-100
        public int Respect; // 0-100
        public int LastInteractionDay;
        public int InteractionCount;
        public int SuccessfulProjects;
        public int FailedProjects;
        public bool IsBlacklisted;

        public RelationshipStats()
        {
            RelationshipScore = 50;
            Trust = 50;
            Respect = 50;
            LastInteractionDay = 0;
            InteractionCount = 0;
            SuccessfulProjects = 0;
            FailedProjects = 0;
            IsBlacklisted = false;
        }
    }
}