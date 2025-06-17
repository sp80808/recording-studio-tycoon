using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.GameLogic;
using RecordingStudioTycoon.Utils; // For SerializableDictionary
// Remove the alias to avoid conflict if the namespace is also named Project
// using Project = RecordingStudioTycoon.DataModels.Project;

namespace RecordingStudioTycoon.Systems.Project
{
    public class ProjectManager : MonoBehaviour
    {
        private RecordingStudioTycoon.DataModels.Project activeProject;
        private RecordingStudioTycoon.DataModels.Project currentProject;
        private RecordingStudioTycoon.DataModels.Project project;
        private RecordingStudioTycoon.DataModels.Project selectedProject;
        private RecordingStudioTycoon.DataModels.Project targetProject;
        private RecordingStudioTycoon.DataModels.Project projectToComplete;
        private RecordingStudioTycoon.DataModels.Project projectToStart;
        private RecordingStudioTycoon.DataModels.Project projectToCancel;

        // ... rest of the implementation
    }
} 