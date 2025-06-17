using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels.Market
{
    [System.Serializable]
    public class Tour
    {
        public string Id;
        public string Name;
        public string BandId;
        public List<string> VenueIds;
        public int StartDay;
        public int EndDay;
        public float ExpectedRevenue;
        public bool IsActive;
    }
}
