using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels.Charts
{
    [System.Serializable]
    public class Chart
    {
        public string Id;
        public string Name;
        public string Genre;
        public List<string> SongIds;
        public int Week;
        public int Year;

        public Chart()
        {
            Id = Guid.NewGuid().ToString();
            Name = "Top 10 Chart";
            Genre = "All";
            SongIds = new List<string>();
            Week = 1;
            Year = 2023;
        }
    }
}
