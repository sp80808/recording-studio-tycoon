using UnityEngine;
using System.Collections.Generic;

namespace RecordingStudioTycoon.ScriptableObjects
{
    [CreateAssetMenu(fileName = "ProjectData", menuName = "RecordingStudioTycoon/ProjectData", order = 2)]
    public class ProjectData : ScriptableObject
    {
        public string ProjectTypeId;
        public string ProjectTypeName;
        public string Description;
        public int BaseComplexity;
        public int BaseDurationDays;
        public int BaseBudget;
        public List<string> RequiredSkills;
        public List<string> RequiredEquipment;
        public List<string> Stages;
        public int UnlockLevel;
        public bool IsUnlocked;
        
        // Additional field from merged content
        public List<ProjectTemplate> ProjectTemplates;
        
        public ProjectData()
        {
            ProjectTypeId = "project_default";
            ProjectTypeName = "Default Project";
            Description = "A default project type for the recording studio.";
            BaseComplexity = 3;
            BaseDurationDays = 14;
            BaseBudget = 5000;
            RequiredSkills = new List<string>();
            RequiredEquipment = new List<string>();
            Stages = new List<string>();
            UnlockLevel = 1;
            IsUnlocked = false;
        }
    }
    
    [System.Serializable]
    public class ProjectTemplate
    {
        public string Id;
        public string Name;
        public string Genre;
        public int BaseQuality;
        public int BaseRewardMoney;
        public int BaseRewardXP;
        public int BaseDifficulty;
        public List<string> RequiredSkills;
        public List<string> Tags;
        public string Description;
    }
}
