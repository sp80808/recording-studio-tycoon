using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.Core;

namespace RecordingStudioTycoon.ScriptableObjects
{
    [CreateAssetMenu(fileName = "StaffData", menuName = "Recording Studio Tycoon/Staff Data")]
    public class StaffData : ScriptableObject
    {
        public List<StaffMember> availableStaff;
        public SerializableDictionary<StudioSkillType, StudioSkill> skillTemplates;
    }
} 