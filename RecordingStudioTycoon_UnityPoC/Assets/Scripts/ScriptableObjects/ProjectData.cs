using System.Collections.Generic;
using UnityEngine;

namespace RecordingStudioTycoon.ScriptableObjects
{
    [CreateAssetMenu(fileName = "ProjectData", menuName = "Game Data/Project Data")]
    public class ProjectData : ScriptableObject
    {
        public List<ProjectTemplate> ProjectTemplates;
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