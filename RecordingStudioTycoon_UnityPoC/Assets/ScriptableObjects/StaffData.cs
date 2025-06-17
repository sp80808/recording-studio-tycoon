using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.ScriptableObjects
{
    [CreateAssetMenu(fileName = "StaffData", menuName = "RecordingStudioTycoon/StaffData", order = 5)]
    public class StaffData : ScriptableObject
    {
        public string StaffRoleId;
        public string RoleName;
        public string Description;
        public int BaseSalary;
        public int UnlockLevel;
        public bool IsUnlocked;
        public SerializableDictionary<string, int> BaseSkills;
        public List<string> PossibleTrainings;
        public int MaxAssignableProjects;
        public float EfficiencyMultiplier;
        
        public StaffData()
        {
            StaffRoleId = "staff_engineer";
            RoleName = "Sound Engineer";
            Description = "A skilled professional responsible for recording and mixing audio.";
            BaseSalary = 2000;
            UnlockLevel = 1;
            IsUnlocked = false;
            BaseSkills = new SerializableDictionary<string, int>();
            PossibleTrainings = new List<string>();
            MaxAssignableProjects = 2;
            EfficiencyMultiplier = 1.0f;
        }
    }
}
