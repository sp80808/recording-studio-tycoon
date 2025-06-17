using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.GameLogic;
using Project = RecordingStudioTycoon.DataModels.Project;

namespace RecordingStudioTycoon.Systems.Project
{
    public class ProjectManager : MonoBehaviour
    {
        private Project activeProject;
        private Project currentProject;
        private Project project;
        private Project selectedProject;
        private Project targetProject;
        private Project projectToComplete;
        private Project projectToStart;
        private Project projectToCancel;

        // ... rest of the implementation
    }
} 