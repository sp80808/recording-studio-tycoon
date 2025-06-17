using UnityEngine;
using System;
using System.Collections.Generic;
using RecordingStudioTycoon.GameLogic; // For GameStateEnum

namespace RecordingStudioTycoon.Core
{
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        [Header("Audio Sources")]
        [SerializeField] private AudioSource _musicSource;
        [SerializeField] private AudioSource _sfxSource;

        [Header("Audio Clips")]
        [SerializeField] private AudioClip[] _backgroundMusicClips;
        [SerializeField] private AudioClip[] _inGameMusicClips; // New: Music specifically for InGame state
        [SerializeField] private AudioClip[] _minigameMusicClips; // New: Music specifically for Minigame state
        [SerializeField] private AudioClip[] _uiSfxClips;
        [SerializeField] private AudioClip[] _inGameSfxClips; // New: In-game sound effects
        [SerializeField] private AudioClip[] _minigameSfxClips;

        private Dictionary<string, AudioClip> _uiSfxMap = new Dictionary<string, AudioClip>();
        private Dictionary<string, AudioClip> _minigameSfxMap = new Dictionary<string, AudioClip>();

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            InitializeAudioSources();
            PopulateAudioClipMaps();
            // Subscribe to GameState changes for music transitions
            GameManager.OnGameStateChanged += HandleGameStateChanged;
        }

        private void InitializeAudioSources()
        {
            if (_musicSource == null)
            {
                _musicSource = gameObject.AddComponent<AudioSource>();
                _musicSource.loop = true; // Music usually loops
                _musicSource.playOnAwake = false;
            }
            if (_sfxSource == null)
            {
                _sfxSource = gameObject.AddComponent<AudioSource>();
                _sfxSource.loop = false; // SFX usually don't loop
                _sfxSource.playOnAwake = false;
            }
        }

        private void PopulateAudioClipMaps()
        {
            foreach (var clip in _uiSfxClips)
            {
                if (!_uiSfxMap.ContainsKey(clip.name))
                {
                    _uiSfxMap.Add(clip.name, clip);
                }
            }
            // Populate in-game SFX map
            foreach (var clip in _inGameSfxClips)
            {
                if (!_uiSfxMap.ContainsKey(clip.name)) // Using _uiSfxMap for now, consider a separate map if needed
                {
                    _uiSfxMap.Add(clip.name, clip);
                }
            }
            foreach (var clip in _minigameSfxClips)
            {
                if (!_minigameSfxMap.ContainsKey(clip.name))
                {
                    _minigameSfxMap.Add(clip.name, clip);
                }
            }
        }

        /// <summary>
        /// Plays a background music clip.
        /// </summary>
        /// <param name="clip">The AudioClip to play.</param>
        /// <param name="loop">Whether the music should loop. Defaults to true.</param>
        public void PlayBackgroundMusic(AudioClip clip, bool loop = true)
        {
            if (clip == null)
            {
                Debug.LogWarning("Attempted to play null background music clip.");
                return;
            }
            // Implement cross-fading for smoother transitions
            if (_musicSource.isPlaying)
            {
                if (_musicSource.clip == clip) return; // Already playing this music

                // Simple cross-fade: stop current, play new. For real cross-fade, use Coroutines.
                _musicSource.Stop();
            }

            _musicSource.clip = clip;
            _musicSource.loop = loop;
            _musicSource.Play();
            Debug.Log($"Playing background music: {clip.name}");
        }

        /// <summary>
        /// Plays a random background music clip from the assigned array for the MainMenu state.
        /// </summary>
        public void PlayMainMenuMusic()
        {
            if (_backgroundMusicClips.Length > 0)
            {
                int randomIndex = UnityEngine.Random.Range(0, _backgroundMusicClips.Length);
                PlayBackgroundMusic(_backgroundMusicClips[randomIndex]);
            }
            else
            {
                Debug.LogWarning("No Main Menu background music clips assigned to AudioManager.");
            }
        }

        /// <summary>
        /// Plays an in-game sound effect by name.
        /// </summary>
        /// <param name="sfxName">The name of the in-game sound effect clip.</param>
        /// <param name="volumeScale">Optional volume scale.</param>
        public void PlayInGameSFX(string sfxName, float volumeScale = 1f)
        {
            if (_uiSfxMap.TryGetValue(sfxName, out AudioClip clip)) // Using _uiSfxMap for now, consider a separate map if needed
            {
                PlaySFX(clip, volumeScale);
            }
            else
            {
                Debug.LogWarning($"In-Game SFX '{sfxName}' not found in map.");
            }
        }

        /// <summary>
        /// Plays a random in-game music clip from the assigned array.
        /// </summary>
        public void PlayInGameMusic()
        {
            if (_inGameMusicClips.Length > 0)
            {
                int randomIndex = UnityEngine.Random.Range(0, _inGameMusicClips.Length);
                PlayBackgroundMusic(_inGameMusicClips[randomIndex]);
            }
            else
            {
                Debug.LogWarning("No In-Game music clips assigned to AudioManager.");
            }
        }

        /// <summary>
        /// Plays a random minigame music clip from the assigned array.
        /// </summary>
        public void PlayMinigameMusic()
        {
            if (_minigameMusicClips.Length > 0)
            {
                int randomIndex = UnityEngine.Random.Range(0, _minigameMusicClips.Length);
                PlayBackgroundMusic(_minigameMusicClips[randomIndex]);
            }
            else
            {
                Debug.LogWarning("No Minigame music clips assigned to AudioManager.");
            }
        }

        /// <summary>
        /// Stops the current background music.
        /// </summary>
        public void StopBackgroundMusic()
        {
            _musicSource.Stop();
            Debug.Log("Background music stopped.");
        }

        /// <summary>
        /// Plays a sound effect.
        /// </summary>
        /// <param name="clip">The AudioClip to play.</param>
        /// <param name="volumeScale">Optional volume scale for this specific sound effect.</param>
        public void PlaySFX(AudioClip clip, float volumeScale = 1f)
        {
            if (clip == null)
            {
                Debug.LogWarning("Attempted to play null SFX clip.");
                return;
            }
            _sfxSource.PlayOneShot(clip, volumeScale);
            Debug.Log($"Playing SFX: {clip.name}");
        }

        /// <summary>
        /// Plays a UI sound effect by name.
        /// </summary>
        /// <param name="sfxName">The name of the UI sound effect clip.</param>
        /// <param name="volumeScale">Optional volume scale.</param>
        public void PlayUISFX(string sfxName, float volumeScale = 1f)
        {
            if (_uiSfxMap.TryGetValue(sfxName, out AudioClip clip))
            {
                PlaySFX(clip, volumeScale);
            }
            else
            {
                Debug.LogWarning($"UI SFX '{sfxName}' not found in map.");
            }
        }

        /// <summary>
        /// Plays a minigame sound effect by name.
        /// </summary>
        /// <param name="sfxName">The name of the minigame sound effect clip.</param>
        /// <param name="volumeScale">Optional volume scale.</param>
        public void PlayMinigameSFX(string sfxName, float volumeScale = 1f)
        {
            if (_minigameSfxMap.TryGetValue(sfxName, out AudioClip clip))
            {
                PlaySFX(clip, volumeScale);
            }
            else
            {
                Debug.LogWarning($"Minigame SFX '{sfxName}' not found in map.");
            }
        }

        /// <summary>
        /// Sets the master volume for music.
        /// </summary>
        /// <param name="volume">Volume level (0.0 to 1.0).</param>
        public void SetMusicVolume(float volume)
        {
            _musicSource.volume = Mathf.Clamp01(volume);
        }

        /// <summary>
        /// Sets the master volume for sound effects.
        /// </summary>
        /// <param name="volume">Volume level (0.0 to 1.0).</param>
        public void SetSFXVolume(float volume)
        {
            _sfxSource.volume = Mathf.Clamp01(volume);
        }

        // You can add more advanced features like:
        // - Fading music in/out (requires Coroutines)
        // - Pitch variation for SFX
        // - Audio mixer group integration
        // - Saving/loading volume settings

        private void HandleGameStateChanged(GameStateEnum previousState, GameStateEnum newState)
        {
            switch (newState)
            {
                case GameStateEnum.MainMenu:
                    PlayMainMenuMusic();
                    break;
                case GameStateEnum.InGame:
                    PlayInGameMusic();
                    break;
                case GameStateEnum.Minigame:
                    PlayMinigameMusic();
                    break;
                case GameStateEnum.Paused:
                case GameStateEnum.GameOver:
                case GameStateEnum.EraTransition:
                case GameStateEnum.Settings:
                    StopBackgroundMusic(); // Or play specific music for these states
                    break;
            }
        }

        private void OnDestroy()
        {
            GameManager.OnGameStateChanged -= HandleGameStateChanged;
        }
    }
}