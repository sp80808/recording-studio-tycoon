using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.DataModels.Equipment
{
    [System.Serializable]
    public class Equipment
    {
        public string Id;
        public string Name;
        public string Category;
        public int Price;
        public string Description;
        public SerializableDictionary<string, float> Bonuses;
        public string Icon;
        public int Condition;
        public bool IsOwned;
        public int PurchaseDay;
        
        public Equipment()
        {
            Bonuses = new SerializableDictionary<string, float>();
            Condition = 100;
            IsOwned = false;
        }
    }
}
