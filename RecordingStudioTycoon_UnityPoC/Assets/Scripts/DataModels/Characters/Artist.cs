using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels.Characters
{
    [Serializable]
    public class Artist
    {
        public string id;
        public string name;
        public MusicGenre primaryGenre;
        public float talent;
        public float popularity;
        public float reputation;
        public List<string> albumIds;
        public List<string> collaborationIds;
        public bool isSignedToLabel;
        public string labelId;

        public Artist()
        {
            id = Guid.NewGuid().ToString();
            albumIds = new List<string>();
            collaborationIds = new List<string>();
            isSignedToLabel = false;
        }
    }
}
