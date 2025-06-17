using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.Core;

namespace RecordingStudioTycoon.ScriptableObjects
{
    [CreateAssetMenu(fileName = "StudioPerkData", menuName = "Recording Studio Tycoon/Studio Perk Data")]
    public class StudioPerkData : ScriptableObject
    {
        public SerializableDictionary<string, float> perkModifiers;
    }
} 