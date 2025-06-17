using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class SessionMusician
    {
        public string Id;
        public string Name;
        public string Instrument;
        public int SkillLevel;
        public int Fee;
        public List<string> Genres;

        public SessionMusician()
        {
            Id = Guid.NewGuid().ToString();
            Name = "Session Musician";
            Instrument = "Guitar";
            SkillLevel = 1;
            Fee = 50;
            Genres = new List<string>();
        }
    }
}