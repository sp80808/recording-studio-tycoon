using System;
using RecordingStudioTycoon.DataModels.Market;

namespace RecordingStudioTycoon.DataModels.Market
{
    [Serializable]
    public class SubGenre
    {
        public string Id;
        public string Name;
        public MusicGenre ParentGenre;
        public string Description;
    }
}