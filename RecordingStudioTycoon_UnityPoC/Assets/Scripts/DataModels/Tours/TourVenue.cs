using System;
using System.Collections.Generic;
using UnityEngine;

namespace RecordingStudioTycoon.DataModels.Tours
{
    [Serializable]
    public class TourVenue
    {
        public string id;
        public string name;
        public string city;
        public int capacity;
        public int baseTicketPrice;
        public int reputationRequirement;
        public List<GenrePreference> genrePreferences;
        public int rentalCost;

        public TourVenue()
        {
            id = Guid.NewGuid().ToString();
            name = "";
            city = "";
            capacity = 0;
            baseTicketPrice = 0;
            reputationRequirement = 0;
            genrePreferences = new List<GenrePreference>();
            rentalCost = 0;
        }

        public TourVenue(string venueName, string venueCity, int venueCapacity, int ticketPrice, int repRequirement, int rental)
        {
            id = Guid.NewGuid().ToString();
            name = venueName;
            city = venueCity;
            capacity = venueCapacity;
            baseTicketPrice = ticketPrice;
            reputationRequirement = repRequirement;
            genrePreferences = new List<GenrePreference>();
            rentalCost = rental;
        }

        public float GetGenreMultiplier(string genre)
        {
            foreach (var preference in genrePreferences)
            {
                if (preference.genre.Equals(genre, StringComparison.OrdinalIgnoreCase))
                {
                    return preference.multiplier;
                }
            }
            return 1.0f; // Default multiplier if genre not found
        }
    }

    [Serializable]
    public class GenrePreference
    {
        public string genre;
        public float multiplier;

        public GenrePreference()
        {
            genre = "";
            multiplier = 1.0f;
        }

        public GenrePreference(string genreName, float genreMultiplier)
        {
            genre = genreName;
            multiplier = genreMultiplier;
        }
    }
}
