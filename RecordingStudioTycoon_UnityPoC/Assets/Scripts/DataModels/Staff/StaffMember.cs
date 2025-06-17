using System;
using System.Collections.Generic;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.DataModels.Staff
{
    [System.Serializable]
    public class StaffMember
    {
        public string Id;
        public string Name;
        public string Role;
        public int Salary;
        public int Experience;
        public SerializableDictionary<string, int> Skills;
        public string AssignedProjectId;
        public int Availability;
        public int Morale;
        public int Fatigue;
        public string PortraitId;

        public StaffMember()
        {
            Id = Guid.NewGuid().ToString();
            Name = "New Staff";
            Role = "Engineer";
            Salary = 1000;
            Experience = 0;
            Skills = new SerializableDictionary<string, int>();
            AssignedProjectId = "";
            Availability = 100;
            Morale = 80;
            Fatigue = 0;
            PortraitId = "";
        }
    }
}
