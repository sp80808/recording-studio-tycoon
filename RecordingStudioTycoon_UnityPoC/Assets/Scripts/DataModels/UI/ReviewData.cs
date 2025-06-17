using System;

namespace RecordingStudioTycoon.DataModels.UI
{
    [Serializable]
    public class ReviewData
    {
        public string projectTitle;
        public string genre;
        public int payout;
        public int reputation;
        public int creativityPoints;
        public int technicalPoints;
        public int qualityScore;
        public int repGain;
        public int xpGain;

        public ReviewData()
        {
            projectTitle = "";
            genre = "";
            payout = 0;
            reputation = 0;
            creativityPoints = 0;
            technicalPoints = 0;
            qualityScore = 0;
            repGain = 0;
            xpGain = 0;
        }

        public ReviewData(string title, string projectGenre, int payment, int rep, int creativity, int technical, int quality, int repGained, int xpGained)
        {
            projectTitle = title;
            genre = projectGenre;
            payout = payment;
            reputation = rep;
            creativityPoints = creativity;
            technicalPoints = technical;
            qualityScore = quality;
            repGain = repGained;
            xpGain = xpGained;
        }
    }
}
