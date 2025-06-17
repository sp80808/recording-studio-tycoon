using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels.Charts
{
    [System.Serializable]
    public class ChartsData
    {
        public string Id;
        public int CurrentWeek;
        public int CurrentYear;
        public List<Chart> Charts;

        public ChartsData()
        {
            Id = Guid.NewGuid().ToString();
            CurrentWeek = 1;
            CurrentYear = 2023;
            Charts = new List<Chart>();
        }
    }
}
