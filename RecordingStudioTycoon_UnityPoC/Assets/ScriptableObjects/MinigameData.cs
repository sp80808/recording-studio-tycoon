using UnityEngine;
using System.Collections.Generic;

namespace RecordingStudioTycoon.ScriptableObjects
{
    [CreateAssetMenu(fileName = "MinigameData", menuName = "RecordingStudioTycoon/MinigameData", order = 1)]
    public class MinigameData : ScriptableObject
    {
        public string MinigameId;
        public string MinigameName;
        public string Description;
        public string SceneName;
        public float BaseDifficulty;
        public int UnlockLevel;
        public bool IsUnlocked;
        public List<string> RequiredEquipment;
        public List<string> RequiredSkills;
        public float DurationMultiplier; // How long this minigame takes compared to standard time
        
        public MinigameData()
        {
            MinigameId = "minigame_default";
            MinigameName = "Default Minigame";
            Description = "A default minigame for the recording studio.";
            SceneName = "MinigameScene";
            BaseDifficulty = 1.0f;
            UnlockLevel = 1;
            IsUnlocked = false;
            RequiredEquipment = new List<string>();
            RequiredSkills = new List<string>();
            DurationMultiplier = 1.0f;
        }
    }
}
