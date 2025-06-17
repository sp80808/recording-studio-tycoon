using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using RecordingStudioTycoon.DataModels.Tours;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.GameLogic;

namespace RecordingStudioTycoon.Systems.Tours
{
    public class TourManager : MonoBehaviour
    {
        [Header("Tour Configuration")]
        [SerializeField] private List<TourVenue> availableVenues;
        [SerializeField] private int maxToursPerBand = 3;
        [SerializeField] private int minDaysBetweenStops = 2;
        [SerializeField] private int maxDaysBetweenStops = 7;

        private List<Tour> activeTours;
        private List<Tour> completedTours;

        public static TourManager Instance { get; private set; }

        public event Action<Tour> OnTourStarted;
        public event Action<Tour> OnTourCompleted;
        public event Action<TourStop> OnTourStopCompleted;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                Initialize();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void Initialize()
        {
            activeTours = new List<Tour>();
            completedTours = new List<Tour>();
            InitializeDefaultVenues();
        }

        private void InitializeDefaultVenues()
        {
            if (availableVenues == null || availableVenues.Count == 0)
            {
                availableVenues = new List<TourVenue>
                {
                    new TourVenue("Madison Square Garden", "New York", 20000, 150, 80, 50000),
                    new TourVenue("The Forum", "Los Angeles", 17500, 120, 70, 40000),
                    new TourVenue("United Center", "Chicago", 23500, 100, 60, 35000),
                    new TourVenue("Red Rocks Amphitheatre", "Denver", 9525, 80, 50, 25000),
                    new TourVenue("The Fillmore", "San Francisco", 1315, 60, 40, 15000),
                    new TourVenue("9:30 Club", "Washington DC", 1200, 50, 30, 12000),
                    new TourVenue("The Troubadour", "West Hollywood", 400, 40, 20, 8000),
                    new TourVenue("First Avenue", "Minneapolis", 1550, 45, 25, 10000)
                };

                // Add genre preferences
                foreach (var venue in availableVenues)
                {
                    venue.genrePreferences.Add(new GenrePreference("rock", 1.2f));
                    venue.genrePreferences.Add(new GenrePreference("pop", 1.1f));
                    venue.genrePreferences.Add(new GenrePreference("electronic", 0.9f));
                }
            }
        }

        public List<TourVenue> GetAvailableVenues(int bandReputation = 0)
        {
            return availableVenues.Where(v => v.reputationRequirement <= bandReputation).ToList();
        }

        public Tour SuggestTourSchedule(string bandId, long startDate, long endDate, int numberOfStops)
        {
            var band = GameManager.Instance?.GameState?.playerBands?.FirstOrDefault(b => b.Id == bandId);
            if (band == null) return null;

            var suitableVenues = GetAvailableVenues(band.Reputation)
                .OrderByDescending(v => v.GetGenreMultiplier(band.PrimaryGenre))
                .Take(numberOfStops * 2) // Get more venues than needed for selection
                .ToList();

            if (suitableVenues.Count < numberOfStops) return null;

            var tour = new Tour(bandId, $"{band.Name} Tour", startDate, endDate);
            var selectedVenues = suitableVenues.Take(numberOfStops).ToList();
            
            long currentDate = startDate;
            var random = new System.Random();

            foreach (var venue in selectedVenues)
            {
                if (currentDate > endDate) break;

                var stop = CreateTourStop(venue, band, currentDate);
                tour.AddStop(stop);

                // Advance to next tour date
                currentDate += random.Next(minDaysBetweenStops, maxDaysBetweenStops + 1);
            }

            tour.genreMatch = CalculateGenreMatch(tour, band);
            return tour;
        }

        private TourStop CreateTourStop(TourVenue venue, Band band, long date)
        {
            var random = new System.Random();
            
            // Calculate expected attendance based on band reputation and venue capacity
            float attendanceRate = Mathf.Clamp01((float)band.Reputation / 100f);
            int expectedAttendance = Mathf.RoundToInt(venue.capacity * (0.3f + attendanceRate * 0.7f));
            
            // Adjust ticket price based on venue and band popularity
            int ticketPrice = Mathf.RoundToInt(venue.baseTicketPrice * (1f + band.Reputation / 200f));
            
            // Calculate expenses (venue rental + travel costs)
            int expenses = venue.rentalCost + random.Next(5000, 15000);

            return new TourStop(venue.id, date, expectedAttendance, ticketPrice, expenses);
        }

        public bool ScheduleTour(Tour tour)
        {
            if (tour == null || string.IsNullOrEmpty(tour.bandId)) return false;

            // Check if band has too many active tours
            int activeTourCount = activeTours.Count(t => t.bandId == tour.bandId && t.IsActive());
            if (activeTourCount >= maxToursPerBand) return false;

            // Check for date conflicts
            foreach (var existingTour in activeTours.Where(t => t.bandId == tour.bandId))
            {
                if (DoesTourConflict(tour, existingTour)) return false;
            }

            activeTours.Add(tour);
            return true;
        }

        private bool DoesTourConflict(Tour newTour, Tour existingTour)
        {
            foreach (var newStop in newTour.stops)
            {
                if (existingTour.HasStopOnDate(newStop.date)) return true;
            }
            return false;
        }

        public void StartTour(string tourId)
        {
            var tour = activeTours.FirstOrDefault(t => t.id == tourId);
            if (tour != null && tour.status == TourStatus.Planning)
            {
                tour.StartTour();
                OnTourStarted?.Invoke(tour);
            }
        }

        public void ProcessDailyTourUpdates(long currentDay)
        {
            foreach (var tour in activeTours.Where(t => t.IsActive()).ToList())
            {
                var todaysStop = tour.stops.FirstOrDefault(s => s.date == currentDay && s.status == TourStopStatus.Scheduled);
                if (todaysStop != null)
                {
                    ExecuteTourStop(tour, todaysStop);
                }

                // Check if tour is complete
                if (tour.stops.All(s => s.status != TourStopStatus.Scheduled))
                {
                    CompleteTour(tour);
                }
            }
        }

        private void ExecuteTourStop(Tour tour, TourStop stop)
        {
            var band = GameManager.Instance?.GameState?.playerBands?.FirstOrDefault(b => b.Id == tour.bandId);
            if (band == null) return;

            var venue = availableVenues.FirstOrDefault(v => v.id == stop.venueId);
            if (venue == null) return;

            // Simulate performance
            var random = new System.Random();
            float performanceRating = CalculatePerformanceRating(band, venue);
            
            // Calculate actual attendance based on performance and other factors
            float attendanceVariation = random.Next(80, 121) / 100f; // 80% to 120% of expected
            int actualAttendance = Mathf.RoundToInt(stop.expectedAttendance * attendanceVariation);
            actualAttendance = Mathf.Min(actualAttendance, venue.capacity);

            stop.CompleteStop(actualAttendance, performanceRating);
            OnTourStopCompleted?.Invoke(stop);

            // Apply reputation gain to band
            band.Reputation += stop.reputationGain;
        }

        private float CalculatePerformanceRating(Band band, TourVenue venue)
        {
            var random = new System.Random();
            
            // Base rating on band stats and experience
            float baseRating = 50f + (band.Reputation / 2f);
            
            // Genre match bonus
            float genreBonus = venue.GetGenreMultiplier(band.PrimaryGenre) * 10f;
            
            // Random variation
            float randomFactor = random.Next(-10, 11);
            
            return Mathf.Clamp(baseRating + genreBonus + randomFactor, 0f, 100f);
        }

        private float CalculateGenreMatch(Tour tour, Band band)
        {
            if (tour.stops.Count == 0) return 0f;

            float totalMatch = 0f;
            foreach (var stop in tour.stops)
            {
                var venue = availableVenues.FirstOrDefault(v => v.id == stop.venueId);
                if (venue != null)
                {
                    totalMatch += venue.GetGenreMultiplier(band.PrimaryGenre);
                }
            }

            return totalMatch / tour.stops.Count;
        }

        private void CompleteTour(Tour tour)
        {
            tour.CompleteTour();
            activeTours.Remove(tour);
            completedTours.Add(tour);
            OnTourCompleted?.Invoke(tour);
        }

        public List<Tour> GetActiveTours(string bandId = null)
        {
            if (string.IsNullOrEmpty(bandId))
                return activeTours.ToList();
            
            return activeTours.Where(t => t.bandId == bandId).ToList();
        }

        public List<Tour> GetCompletedTours(string bandId = null)
        {
            if (string.IsNullOrEmpty(bandId))
                return completedTours.ToList();
            
            return completedTours.Where(t => t.bandId == bandId).ToList();
        }

        public void CancelTour(string tourId)
        {
            var tour = activeTours.FirstOrDefault(t => t.id == tourId);
            if (tour != null)
            {
                tour.CancelTour();
                activeTours.Remove(tour);
            }
        }

        public bool ValidateTourSchedule(Tour tour)
        {
            if (tour == null || tour.stops.Count == 0) return false;
            
            // Check date consistency
            if (tour.stops.Any(s => s.date < tour.startDate || s.date > tour.endDate)) return false;
            
            // Check for conflicting dates within the tour
            var dates = tour.stops.Select(s => s.date).ToList();
            if (dates.Count != dates.Distinct().Count()) return false;
            
            return true;
        }
    }
}
