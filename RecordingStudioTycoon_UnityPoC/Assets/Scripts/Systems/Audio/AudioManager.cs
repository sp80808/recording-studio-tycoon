using UnityEngine;
using System;

namespace RecordingStudioTycoon.Core
{
    /// <summary>
    /// Manages all audio playback in the game.
    /// </summary>
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        [SerializeField] private AudioSource _musicSource;
        [SerializeField] private AudioSource _sfxSource;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            if (_musicSource == null)
            {
                _musicSource = gameObject.AddComponent<AudioSource>();
                _musicSource.loop = true;
            }
            if (_sfxSource == null)
            {
                _sfxSource = gameObject.AddComponent<AudioSource>();
            }
        }

        /// <summary>
        /// Plays background music.
        /// </summary>
        /// <param name="clip">The audio clip to play.</param>
        /// <param name="loop">Whether the music should loop.</param>
        public void PlayMusic(AudioClip clip, bool loop = true)
        {
            if (_musicSource != null)
            {
                _musicSource.clip = clip;
                _musicSource.loop = loop;
                _musicSource.Play();
            }
        }

        /// <summary>
        /// Stops the currently playing background music.
        /// </summary>
        public void StopMusic()
        {
            if (_musicSource != null)
            {
                _musicSource.Stop();
            }
        }

        /// <summary>
        /// Plays a one-shot sound effect.
        /// </summary>
        /// <param name="clip">The audio clip to play.</param>
        /// <param name="volumeScale">Volume scale for the sound effect.</param>
        public void PlaySFX(AudioClip clip, float volumeScale = 1.0f)
        {
            if (_sfxSource != null && clip != null)
            {
                _sfxSource.PlayOneShot(clip, volumeScale);
            }
        }

        /// <summary>
        /// Plays a one-shot sound effect by name (placeholder for a more robust system).
        /// </summary>
        /// <param name="sfxName">The name of the SFX to play.</param>
        /// <param name="volumeScale">Volume scale for the sound effect.</param>
        public void PlaySFX(string sfxName, float volumeScale = 1.0f)
        {
            Debug.Log($"Playing SFX: {sfxName} (placeholder)");
            // In a real implementation, you would load the AudioClip based on sfxName
            // For example, from a dictionary of preloaded clips or a Resources folder.
            // AudioClip clip = Resources.Load<AudioClip>($"Audio/SFX/{sfxName}");
            // if (clip != null)
            // {
            //     PlaySFX(clip, volumeScale);
            // }
            // else
            // {
            //     Debug.LogWarning($"SFX clip '{sfxName}' not found.");
            // }
        }

        /// <summary>
        /// Sets the volume for music.
        /// </summary>
        /// <param name="volume">Volume level (0.0 to 1.0).</param>
        public void SetMusicVolume(float volume)
        {
            if (_musicSource != null)
            {
                _musicSource.volume = Mathf.Clamp01(volume);
            }
        }

        /// <summary>
        /// Sets the volume for sound effects.
        /// </summary>
        /// <param name="volume">Volume level (0.0 to 1.0).</param>
        public void SetSFXVolume(float volume)
        {
            if (_sfxSource != null)
            {
                _sfxSource.volume = Mathf.Clamp01(volume);
            }
        }
    }
}