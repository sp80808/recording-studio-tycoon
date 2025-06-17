using UnityEngine;
using System.Collections.Generic;

namespace RecordingStudioTycoon.Systems.Audio
{
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        [SerializeField] private AudioSource musicSource;
        [SerializeField] private AudioSource sfxSource;
        [SerializeField] private List<AudioClip> backgroundMusicClips;

        private Dictionary<string, AudioClip> sfxClips = new Dictionary<string, AudioClip>();
        private int currentMusicIndex = 0;

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

            if (musicSource == null)
            {
                musicSource = gameObject.AddComponent<AudioSource>();
                musicSource.loop = true;
            }
            if (sfxSource == null)
            {
                sfxSource = gameObject.AddComponent<AudioSource>();
            }
        }

        private void Start()
        {
            PlayBackgroundMusic();
        }

        public void PlayBackgroundMusic()
        {
            if (backgroundMusicClips != null && backgroundMusicClips.Count > 0)
            {
                musicSource.clip = backgroundMusicClips[currentMusicIndex];
                musicSource.Play();
            }
        }

        public void PlaySFX(AudioClip clip)
        {
            if (sfxSource != null && clip != null)
            {
                sfxSource.PlayOneShot(clip);
            }
        }

        public void SetMusicVolume(float volume)
        {
            if (musicSource != null)
            {
                musicSource.volume = volume;
            }
        }

        public void SetSFXVolume(float volume)
        {
            if (sfxSource != null)
            {
                sfxSource.volume = volume;
            }
        }

        public void StopAllAudio()
        {
            musicSource?.Stop();
            sfxSource?.Stop();
        }

        // Add methods to load SFX clips dynamically if needed
        public void RegisterSFX(string key, AudioClip clip)
        {
            if (!sfxClips.ContainsKey(key))
            {
                sfxClips.Add(key, clip);
            }
            else
            {
                sfxClips[key] = clip; // Update existing
            }
        }

        public AudioClip GetSFX(string key)
        {
            sfxClips.TryGetValue(key, out AudioClip clip);
            return clip;
        }
    }
}