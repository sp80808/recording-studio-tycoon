using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels.Staff;

namespace RecordingStudioTycoon.ScriptableObjects
{
    [CreateAssetMenu(fileName = "New Staff Data", menuName = "Recording Studio Tycoon/Staff Data")]
    public class StaffDataSO : ScriptableObject
    {
        public List<StaffMember> availableStaff = new List<StaffMember>();
        public List<string> staffNames = new List<string>();
        public List<string> staffSurnames = new List<string>();
    }
}
