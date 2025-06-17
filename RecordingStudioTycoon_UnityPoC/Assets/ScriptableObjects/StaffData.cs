using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.Core;
using RecordingStudioTycoon.DataModels;

[CreateAssetMenu(fileName = "StaffData", menuName = "Game Data/Staff Data")]
public class StaffData : ScriptableObject
{
    public List<StaffMemberTemplate> StaffMemberTemplates;
    public List<SessionMusicianTemplate> SessionMusicianTemplates;
}

[System.Serializable]
public class StaffMemberTemplate
{
    public string Id;
    public string Name;
    public string Role;
    public int BaseSalary;
    public SerializableDictionary<StudioSkillType, int> BaseSkills;
    public int BaseMood;
    public int BaseEnergy;
}

[System.Serializable]
public class SessionMusicianTemplate
{
    public string Id;
    public string Name;
    public string Instrument;
    public int BaseSkillLevel;
    public int BaseFee;
}
