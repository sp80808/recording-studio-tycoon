using System;
using UnityEngine;

namespace RecordingStudioTycoon.DataModels.Tours
{
    public enum TourStopStatus
    {
        Scheduled,
        Completed,
        Cancelled
    }

    [Serializable]
    public class TourStop
    {
        public string id;
        public string venueId;
        public long date; // Game day number
        public int expectedAttendance;
        public int ticketPrice;
        public int expenses;
        public TourStopStatus status;
        public int actualAttendance;
        public int revenue;
        public int reputationGain;
        public float performanceRating; // 0-100 rating

        public TourStop()
        {
            id = Guid.NewGuid().ToString();
            venueId = "";
            date = 0;
            expectedAttendance = 0;
            ticketPrice = 0;
            expenses = 0;
            status = TourStopStatus.Scheduled;
            actualAttendance = 0;
            revenue = 0;
            reputationGain = 0;
            performanceRating = 0f;
        }

        public TourStop(string venue, long tourDate, int attendance, int price, int cost)
        {
            id = Guid.NewGuid().ToString();
            venueId = venue;
            date = tourDate;
            expectedAttendance = attendance;
            ticketPrice = price;
            expenses = cost;
            status = TourStopStatus.Scheduled;
            actualAttendance = 0;
            revenue = 0;
            reputationGain = 0;
            performanceRating = 0f;
        }

        public bool IsCompleted()
        {
            return status == TourStopStatus.Completed;
        }

        public bool IsCancelled()
        {
            return status == TourStopStatus.Cancelled;
        }

        public int GetProfit()
        {
            return revenue - expenses;
        }

        public void CompleteStop(int attendance, float rating)
        {
            status = TourStopStatus.Completed;
            actualAttendance = attendance;
            performanceRating = rating;
            revenue = actualAttendance * ticketPrice;
            
            // Calculate reputation gain based on performance and attendance
            float attendanceRatio = (float)actualAttendance / expectedAttendance;
            reputationGain = Mathf.RoundToInt((rating / 100f) * attendanceRatio * 10f);
        }
    }
}
