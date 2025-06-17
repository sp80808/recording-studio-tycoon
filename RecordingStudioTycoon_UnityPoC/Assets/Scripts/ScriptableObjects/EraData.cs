using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.Core;

namespace RecordingStudioTycoon.ScriptableObjects
{
    [CreateAssetMenu(fileName = "EraData", menuName = "Recording Studio Tycoon/Era Data")]
    public class EraData : ScriptableObject
    {
        public string eraName;
        public int startYear;
        public int endYear;
        public List<UnlockedFeatureInfo> unlockedFeatures;
        public SerializableDictionary<string, float> eraModifiers;
    }
} 