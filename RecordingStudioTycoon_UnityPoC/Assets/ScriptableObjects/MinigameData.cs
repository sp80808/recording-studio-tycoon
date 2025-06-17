using UnityEngine;
using System.Collections.Generic;

[CreateAssetMenu(fileName = "MinigameData", menuName = "Game Data/Minigame Data")]
public class MinigameData : ScriptableObject
{
    public List<MinigameTemplate> MinigameTemplates;
}

[System.Serializable]
public class MinigameTemplate
{
    public string Id;
    public string Name;
    public string Description;
    public int BaseDifficulty;
    public int BaseRewardXP;
    public int BaseRewardMoney;
    public string AssociatedSkill; // e.g., "recording", "mixing"
}