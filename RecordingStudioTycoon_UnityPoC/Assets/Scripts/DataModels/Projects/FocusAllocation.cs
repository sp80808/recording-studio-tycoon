using System;

namespace RecordingStudioTycoon.DataModels.Projects
{
    [System.Serializable]
    public class FocusAllocation
    {
        public string FocusArea; // e.g., "Recording", "Mixing", "Marketing"
        public int Percentage; // 0-100, how much focus is allocated to this area
        
        public FocusAllocation()
        {
            FocusArea = "Recording";
            Percentage = 33;
        }

        public FocusAllocation(string area, int percentage)
        {
            FocusArea = area;
            Percentage = percentage;
        }
    }
}
