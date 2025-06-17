using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace RecordingStudioTycoon.DataModels.Tours
{
    public enum TourStatus
    {
        Planning,
        Active,
        Completed,
        Cancelled
    }

    [Serializable]
    public class Tour
    {
        public string id;
        public string bandId;
        public string name;
        public long startDate; // Game day number
        public long endDate; // Game day number
        public List<TourStop> stops;
        public TourStatus status;
        public int totalRevenue;
        public int totalExpenses;
        public int reputationImpact;
        public float genreMatch; // How well tour matches band's genre

        public Tour()
        {
            id = Guid.NewGuid().ToString();
            bandId = "";
            name = "";
            startDate = 0;
            endDate = 0;
            stops = new List<TourStop>();
            status = TourStatus.Planning;
            totalRevenue = 0;
            totalExpenses = 0;
            reputationImpact = 0;
            genreMatch = 0f;
        }

        public Tour(string band, string tourName, long start, long end)
        {
            id = Guid.NewGuid().ToString();
            bandId = band;
            name = tourName;
            startDate = start;
            endDate = end;
            stops = new List<TourStop>();
            status = TourStatus.Planning;
            totalRevenue = 0;
            totalExpenses = 0;
            reputationImpact = 0;
            genreMatch = 0f;
        }

        public void AddStop(TourStop stop)
        {
            if (stop != null && !stops.Any(s => s.id == stop.id))
            {
                stops.Add(stop);
                CalculateTotals();
            }
        }

        public void RemoveStop(string stopId)
        {
            stops.RemoveAll(s => s.id == stopId);
            CalculateTotals();
        }

        public void StartTour()
        {
            if (status == TourStatus.Planning && stops.Count > 0)
            {
                status = TourStatus.Active;
            }
        }

        public void CompleteTour()
        {
            status = TourStatus.Completed;
            CalculateTotals();
            CalculateReputationImpact();
        }

        public void CancelTour()
        {
            status = TourStatus.Cancelled;
            foreach (var stop in stops)
            {
                if (stop.status == TourStopStatus.Scheduled)
                {
                    stop.status = TourStopStatus.Cancelled;
                }
            }
        }

        public int GetTotalProfit()
        {
            return totalRevenue - totalExpenses;
        }

        public int GetCompletedStopsCount()
        {
            return stops.Count(s => s.IsCompleted());
        }

        public int GetCancelledStopsCount()
        {
            return stops.Count(s => s.IsCancelled());
        }

        public float GetAveragePerformanceRating()
        {
            var completedStops = stops.Where(s => s.IsCompleted()).ToList();
            if (completedStops.Count == 0) return 0f;
            
            return completedStops.Average(s => s.performanceRating);
        }

        public bool IsActive()
        {
            return status == TourStatus.Active;
        }

        public bool IsCompleted()
        {
            return status == TourStatus.Completed;
        }

        public bool IsCancelled()
        {
            return status == TourStatus.Cancelled;
        }

        private void CalculateTotals()
        {
            totalRevenue = stops.Sum(s => s.revenue);
            totalExpenses = stops.Sum(s => s.expenses);
        }

        private void CalculateReputationImpact()
        {
            var completedStops = stops.Where(s => s.IsCompleted()).ToList();
            if (completedStops.Count == 0)
            {
                reputationImpact = 0;
                return;
            }

            // Base reputation impact on average performance and completion rate
            float averageRating = GetAveragePerformanceRating();
            float completionRate = (float)completedStops.Count / stops.Count;
            
            reputationImpact = Mathf.RoundToInt(averageRating * completionRate * 0.5f);
        }

        public TourStop GetNextScheduledStop(long currentDay)
        {
            return stops
                .Where(s => s.status == TourStopStatus.Scheduled && s.date >= currentDay)
                .OrderBy(s => s.date)
                .FirstOrDefault();
        }

        public bool HasStopOnDate(long date)
        {
            return stops.Any(s => s.date == date);
        }
    }
}
