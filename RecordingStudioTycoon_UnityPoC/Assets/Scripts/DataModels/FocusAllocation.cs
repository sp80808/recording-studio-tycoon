using System;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class FocusAllocation
    {
        public int studioProduction;
        public int marketingAndPromotions;
        public int researchAndDevelopment;

        public FocusAllocation()
        {
            studioProduction = 33;
            marketingAndPromotions = 33;
            researchAndDevelopment = 34;
        }
    }
}