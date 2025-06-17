using System;

namespace RecordingStudioTycoon.DataModels.Tours
{
    public enum TourStopStatus
    {
        Scheduled,
        Completed,
        Cancelled,
        Missed
    }

    [Serializable]
    public class TourStop
    {
        public string id;
        public string tourId;
        public string venueId;
        public long date; // Game day number
        public TourStopStatus status;
        public int revenue;
        public int expenses;
        public float performanceRating; // 0-100, how well the band performed
        public int fanAttendance;
        public int fanCapacity;
        public string notes;

        public TourStop()
        {
            id = Guid.NewGuid().ToString();
            tourId = "";
            venueId = "";
            date = 0;
            status = TourStopStatus.Scheduled;
            revenue = 0;
            expenses = 0;
            performanceRating = 0f;
            fanAttendance = 0;
            fanCapacity = 0;
            notes = "";
        }

        public TourStop(string tour, string venue, long stopDate)
        {
            id = Guid.NewGuid().ToString();
            tourId = tour;
            venueId = venue;
            date = stopDate;
            status = TourStopStatus.Scheduled;
            revenue = 0;
            expenses = 0;
            performanceRating = 0f;
            fanAttendance = 0;
            fanCapacity = 0;
            notes = "";
        }

        public void CompleteStop(int earnedRevenue, int incurredExpenses, float rating, int attendance, int capacity, string performanceNotes = "")
        {
            status = TourStopStatus.Completed;
            revenue = earnedRevenue;
            expenses = incurredExpenses;
            performanceRating = rating;
            fanAttendance = attendance;
            fanCapacity = capacity;
            notes = performanceNotes;
        }

        public void CancelStop(string reason = "")
        {
            status = TourStopStatus.Cancelled;
            notes = reason;
        }

        public void MissStop(string reason = "")
        {
            status = TourStopStatus.Missed;
            notes = reason;
        }

        public bool IsCompleted()
        {
            return status == TourStopStatus.Completed;
        }

        public bool IsCancelled()
        {
            return status == TourStopStatus.Cancelled;
        }

        public bool IsMissed()
        {
            return status == TourStopStatus.Missed;
        }

        public bool IsScheduled()
        {
            return status == TourStopStatus.Scheduled;
        }
    }
}
