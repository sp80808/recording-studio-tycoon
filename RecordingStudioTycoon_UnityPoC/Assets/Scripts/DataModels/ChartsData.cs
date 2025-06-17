using System;
using System.Collections.Generic;

namespace RecordingStudioTycoon.DataModels
{
    [System.Serializable]
    public class ChartsData
    {
        public List<SongChart> PopChart;
        public List<SongChart> RockChart;
        public List<SongChart> HipHopChart;
        public List<SongChart> RnBChart;
        public List<SongChart> CountryChart;
        public List<SongChart> ElectronicChart;

        public ChartsData()
        {
            PopChart = new List<SongChart>();
            RockChart = new List<SongChart>();
            HipHopChart = new List<SongChart>();
            RnBChart = new List<SongChart>();
            CountryChart = new List<SongChart>();
            ElectronicChart = new List<SongChart>();
        }
    }

    [System.Serializable]
    public class SongChart
    {
        public string SongId;
        public string SongTitle;
        public string ArtistName;
        public string Genre;
        public int CurrentRank;
        public int PeakRank;
        public int WeeksOnChart;
        public DateTime EntryDate;
        public List<ChartHistoryEntry> History;

        public SongChart()
        {
            SongId = Guid.NewGuid().ToString();
            SongTitle = "";
            ArtistName = "";
            Genre = "Pop";
            CurrentRank = 0;
            PeakRank = 0;
            WeeksOnChart = 0;
            EntryDate = DateTime.Now;
            History = new List<ChartHistoryEntry>();
        }
    }

    [System.Serializable]
    public class ChartHistoryEntry
    {
        public int Day;
        public int Rank;

        public ChartHistoryEntry()
        {
            Day = 0;
            Rank = 0;
        }
    }
}