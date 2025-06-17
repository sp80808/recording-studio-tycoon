using UnityEngine;
using System.Collections.Generic;

[CreateAssetMenu(fileName = "ProjectData", menuName = "Game Data/Project Data")]
public class ProjectData : ScriptableObject
{
    public List<ProjectTemplate> ProjectTemplates;
    // ... other project-related static data
}

[System.Serializable]
public class ProjectTemplate { /* ... define properties for ProjectTemplate ... */ }