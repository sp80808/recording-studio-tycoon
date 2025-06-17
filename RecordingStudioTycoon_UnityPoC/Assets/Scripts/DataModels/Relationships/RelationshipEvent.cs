using System;

namespace RecordingStudioTycoon.DataModels.Relationships
{
    [Serializable]
    public class RelationshipEvent
    {
        public string Id;
        public string Type; // e.g., "PROJECT_COMPLETED_ON_TIME", "PLAYER_FAVOR_COMPLETED"
        public string Description;
        public string EntityId; // The entity involved in the event
        public int Day; // Game day the event occurred
        public float Impact; // Numeric impact on relationship score
    }
}