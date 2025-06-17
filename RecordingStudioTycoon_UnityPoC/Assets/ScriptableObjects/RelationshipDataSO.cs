using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels.Relationships;

namespace RecordingStudioTycoon.ScriptableObjects
{
    [CreateAssetMenu(fileName = "RelationshipData", menuName = "ScriptableObjects/Relationship Data")]
    public class RelationshipDataSO : ScriptableObject
    {
        public List<ReputableEntity> InitialEntities;
        // Potentially add definitions for contract templates, favor types, etc.
    }
}