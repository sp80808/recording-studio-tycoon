using UnityEngine;
using System;
using System.Collections.Generic;
using RecordingStudioTycoon.GameLogic; // For GameManager
using RecordingStudioTycoon.DataModels; // For Band, Song, Project
using RecordingStudioTycoon.ScriptableObjects; // For ProjectData, MarketTrendData
using RecordingStudioTycoon.Systems.Project; // For ProjectManager
using RecordingStudioTycoon.Systems.Market; // For MarketManager

namespace RecordingStudioTycoon.Systems.BandAndSong
{
    public class BandAndSongManager : MonoBehaviour
    {
        public static BandAndSongManager Instance { get; private set; }

        [SerializeField] public ProjectData projectData; // Reference to ProjectData ScriptableObject
        [SerializeField] public MarketTrendData[] marketTrendData; // Reference to MarketTrendData ScriptableObjects

        private List<Band> _activeBands = new List<Band>(); // Bands currently managed by the player
        private List<Song> _releasedSongs = new List<Song>(); // All songs released by player's bands

        public List<Band> ActiveBands => _activeBands;
        public List<Song> ReleasedSongs => _releasedSongs;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
            }
            else
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
        }

        private void Start()
        {
            // Load existing bands and songs from GameState if available
            if (GameManager.Instance != null)
            {
                _activeBands = GameManager.Instance.GameState.playerBands;
                _releasedSongs = GameManager.Instance.GameState.releasedSongs;
                GameManager.Instance.OnDayAdvanced += UpdateBandAndSongData;
            }
        }

        private void OnDestroy()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnDayAdvanced -= UpdateBandAndSongData;
            }
        }

        /// <summary>
        /// Creates a new band and adds it to the game state.
        /// </summary>
        /// <param name="bandName">The name of the new band.</param>
        /// <param name="genre">The primary genre of the band.</param>
        /// <param name="memberNames">List of initial band member names.</param>
        /// <returns>The newly created Band object.</returns>
        public Band CreateBand(string bandName, string genre, List<string> memberNames)
        {
            Band newBand = new Band
            {
                Id = Guid.NewGuid().ToString(),
                Name = bandName,
                Genre = genre,
                Reputation = 10, // Starting reputation
                MemberNames = memberNames,
                Discography = new List<Song>()
            };

            _activeBands.Add(newBand);
            if (GameManager.Instance != null)
            {
                GameManager.Instance.GameState.playerBands = _activeBands; // Update GameState reference
                GameManager.Instance.SaveGameData(); // Save changes
            }
            Debug.Log($"Band '{newBand.Name}' created with ID: {newBand.Id}");
            return newBand;
        }

        /// <summary>
        /// Creates a new song for a given band.
        /// This typically happens after a project related to song creation is completed.
        /// </summary>
        /// <param name="bandId">The ID of the band creating the song.</param>
        /// <param name="songTitle">The title of the song.</param>
        /// <param name="genre">The genre of the song.</param>
        /// <param name="quality">The initial quality of the song (e.g., from project outcome).</param>
        /// <returns>The newly created Song object.</returns>
        public Song CreateSong(string bandId, string songTitle, string genre, int quality)
        {
            Band band = _activeBands.Find(b => b.Id == bandId);
            if (band == null)
            {
                Debug.LogError($"Band with ID '{bandId}' not found. Cannot create song.");
                return null;
            }

            Song newSong = new Song
            {
                Id = Guid.NewGuid().ToString(),
                Title = songTitle,
                Genre = genre,
                Quality = quality,
                ChartPosition = 0, // Initial chart position (unranked)
                ReleaseDate = GameManager.Instance.CurrentDay, // Assuming CurrentDay is a long or can be converted
                BandId = bandId
            };

            band.Discography.Add(newSong);
            _releasedSongs.Add(newSong);

            if (GameManager.Instance != null)
            {
                GameManager.Instance.GameState.releasedSongs = _releasedSongs; // Update GameState reference
                GameManager.Instance.SaveGameData(); // Save changes
            }
            Debug.Log($"Song '{newSong.Title}' created for band '{band.Name}' with quality: {newSong.Quality}");
            return newSong;
        }

        /// <summary>
        /// Manages band reputation and song quality over time.
        /// Called daily by GameManager.
        /// </summary>
        private void UpdateBandAndSongData()
        {
            Debug.Log("BandAndSongManager: Updating band reputation and song data...");

            // Update band reputations
            foreach (Band band in _activeBands)
            {
                // Example: Reputation decay over time, or increase based on recent song performance
                band.Reputation = Mathf.Max(0, band.Reputation - 1); // Simple decay
                Debug.Log($"Band '{band.Name}' reputation: {band.Reputation}");
            }

            // Update song quality (e.g., if not yet released, or if there's a decay)
            foreach (Song song in _releasedSongs)
            {
                // Example: Song quality decay over time after release
                // song.Quality = Mathf.Max(0, song.Quality - 1);
            }

            // Interact with MarketManager for chart performance
            if (MarketManager.Instance != null)
            {
                // MarketManager will handle updating chart positions based on released songs
                // No direct call needed here, as MarketManager subscribes to OnDayAdvanced
            }
            else
            {
                Debug.LogWarning("MarketManager instance not found. Cannot update song chart performance.");
            }

            if (GameManager.Instance != null)
            {
                GameManager.Instance.SaveGameData(); // Save changes after updates
            }
        }

        /// <summary>
        /// Gets all active songs (e.g., for MarketManager to process charts).
        /// </summary>
        /// <returns>A list of all currently released songs.</returns>
        public List<Song> GetAllActiveSongs()
        {
            return _releasedSongs;
        }

        /// <summary>
        /// Gets a specific band by its ID.
        /// </summary>
        /// <param name="bandId">The ID of the band.</param>
        /// <returns>The Band object if found, otherwise null.</returns>
        public Band GetBandById(string bandId)
        {
            return _activeBands.Find(b => b.Id == bandId);
        }

        /// <summary>
        /// Gets a specific song by its ID.
        /// </summary>
        /// <param name="songId">The ID of the song.</param>
        /// <returns>The Song object if found, otherwise null.</returns>
        public Song GetSongById(string songId)
        {
            return _releasedSongs.Find(s => s.Id == songId);
        }
    }
}