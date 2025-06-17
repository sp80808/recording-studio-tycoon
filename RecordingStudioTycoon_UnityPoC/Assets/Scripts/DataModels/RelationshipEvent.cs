using System;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class RelationshipEvent
    {
        public string Type; // e.g., "PROJECT_COMPLETED_ON_TIME", "BLACKLISTED_BY_ENTITY"
        public long Timestamp; // Game day or real-world timestamp
        public string Description;
        public string EntityId; // The entity involved in the event
        public float Impact; // Numeric impact on relationship score

        public RelationshipEvent()
        {
            Type = "";
            Timestamp = 0;
            Description = "";
            EntityId = null;
            Impact = 0f;
        }

        public RelationshipEvent(string type, long timestamp, string description, string entityId, float impact)
        {
            Type = type;
            Timestamp = timestamp;
            Description = description;
            EntityId = entityId;
            Impact = impact;
        }
    }
}