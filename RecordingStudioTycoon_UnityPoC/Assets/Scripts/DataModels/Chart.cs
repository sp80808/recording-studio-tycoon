using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class Chart
    {
        public string Id;
        public string Name;
        public string Description;
        public int MinLevelToAccess;
        public List<ChartEntry> Entries; // Current entries on the chart
        public long LastUpdatedDay;

        public Chart()
        {
            Id = Guid.NewGuid().ToString();
            Name = "New Chart";
            Description = "";
            MinLevelToAccess = 1;
            Entries = new List<ChartEntry>();
            LastUpdatedDay = 0;
        }

        public Chart(string id, string name, string description, int minLevelToAccess)
        {
            Id = id;
            Name = name;
            Description = description;
            MinLevelToAccess = minLevelToAccess;
            Entries = new List<ChartEntry>();
            LastUpdatedDay = 0;
        }
    }
}