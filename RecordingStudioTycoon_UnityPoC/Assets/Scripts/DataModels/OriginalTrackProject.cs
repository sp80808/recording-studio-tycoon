using System;
using System.Collections.Generic;
using UnityEngine;
using RecordingStudioTycoon.DataModels.Projects;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class OriginalTrackProject : Project // Inherit from Project
    {
        public string SongTitle;
    public string SongGenre;
    public List<string> CollaboratorIds; // IDs of staff/session musicians collaborating
    }
}
