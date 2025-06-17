using System;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.DataModels.Progression
{
    [System.Serializable]
    public class ExpansionRequirements
    {
        public int Level;
        public int Money;
        public SerializableDictionary<string, int> Skills;
        public List<string> RequiredUpgrades;

        public ExpansionRequirements()
        {
            Level = 1;
            Money = 1000;
            Skills = new SerializableDictionary<string, int>();
            RequiredUpgrades = new List<string>();
        }
    }
}
