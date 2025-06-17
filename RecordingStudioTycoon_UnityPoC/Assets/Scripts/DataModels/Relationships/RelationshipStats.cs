using System;

namespace RecordingStudioTycoon.DataModels.Relationships
{
    [System.Serializable]
    public class RelationshipStats
    {
        public string EntityId;
        public int Trust;
        public int Respect;
        public int History;
        public int Conflict;

        public RelationshipStats(string entityId)
        {
            EntityId = entityId;
            Trust = 50;
            Respect = 50;
            History = 0;
            Conflict = 0;
        }

        public int GetOverallRelationship()
        {
            return (Trust + Respect + History) - Conflict;
        }
    }
}
