using System;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class ExpansionRequirements
    {
        public int Level;
        public int Reputation;
        // Add other requirements as needed

        public ExpansionRequirements()
        {
            Level = 0;
            Reputation = 0;
        }

        public ExpansionRequirements(int level, int reputation)
        {
            Level = level;
            Reputation = reputation;
        }
    }
}