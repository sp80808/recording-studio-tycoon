namespace RecordingStudioTycoon.DataModels.Market
{
    [System.Serializable]
    public class Venue
    {
        public string Id;
        public string Name;
        public int Capacity;
        public string VenueType;
        public float BaseRevenue;
        public bool IsUnlocked;
    }
}
