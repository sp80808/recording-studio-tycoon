using System;
using System.Collections.Generic;
using UnityEngine;
using RecordingStudioTycoon.Core;
using RecordingStudioTycoon.Utils; // For SerializableDictionary

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class StaffMember
    {
        public string Id;
        public string Name;
        public string Role; // e.g., "Mix Engineer", "Sound Designer"
        public int Level;
        public int Salary;
        public int Experience;
        public SerializableDictionary<StudioSkillType, int> Skills; // Dictionary of skills and their levels/experience
        public string AssignedProjectId; // Null if not assigned to a project
        public int Efficiency;
        public int Morale;
        public int Stamina; // For daily work capacity
        public bool IsAvailable;
        public List<string> Traits; // e.g., "Fast Learner", "Demotivated"
        public string Icon;

        public StaffMember()
        {
            Id = Guid.NewGuid().ToString();
            Name = "New Staff";
            Role = "Assistant";
            Level = 1;
            Salary = 100;
            Experience = 0;
            Skills = new SerializableDictionary<StudioSkillType, int>();
            AssignedProjectId = null;
            Efficiency = 100;
            Morale = 100;
            Stamina = 100;
            IsAvailable = true;
            Traits = new List<string>();
            Icon = "👤";
        }
    }
}
