using UnityEngine;
using UnityEngine.Audio;
using System.Collections.Generic;
using System.Collections;
using RecordingStudioTycoon.Utils;

namespace RecordingStudioTycoon.Core
{
    /// <summary>
    /// Manages all audio in the game including background music, sound effects, and spatial audio
    /// </summary>
    public class AudioManager : MonoBehaviour
    {
        [Header("Audio Mixer")]
        [SerializeField] private AudioMixer masterMixer;
        [SerializeField] private AudioMixerGroup musicGroup;
        [SerializeField] private AudioMixerGroup sfxGroup;
        [SerializeField] private AudioMixerGroup ambientGroup;
        [SerializeField] private AudioMixerGroup uiGroup;

        [Header("Audio Sources")]
        [SerializeField] private AudioSource musicSource;
        [SerializeField] private AudioSource ambientSource;
        [SerializeField] private AudioSource[] sfxSources = new AudioSource[10];

        [Header("Music Settings")]
        [SerializeField] private AudioClip[] backgroundTracks;
        [SerializeField] private float musicFadeTime = 2f;
        [SerializeField] private bool shuffleMusic = true;

        [Header("UI Audio")]
        [SerializeField] private AudioClip buttonClickSound;
        [SerializeField] private AudioClip buttonHoverSound;
        [SerializeField] private AudioClip notificationSound;
        [SerializeField] private AudioClip levelUpSound;
        [SerializeField] private AudioClip projectCompleteSound;
        [SerializeField] private AudioClip purchaseSound;
        [SerializeField] private AudioClip errorSound;

        [Header("Game Audio")]
        [SerializeField] private AudioClip[] recordingAmbient;
        [SerializeField] private AudioClip[] mixingAmbient;
        [SerializeField] private AudioClip[] equipmentSounds;

        [Header("Volume Settings")]
        [SerializeField, Range(0f, 1f)] private float masterVolume = 1f;
        [SerializeField, Range(0f, 1f)] private float musicVolume = 0.7f;
        [SerializeField, Range(0f, 1f)] private float sfxVolume = 0.8f;
        [SerializeField, Range(0f, 1f)] private float ambientVolume = 0.5f;
        [SerializeField, Range(0f, 1f)] private float uiVolume = 0.6f;

        // Private fields
        private Dictionary<string, AudioClip> audioClips = new Dictionary<string, AudioClip>();
        private Queue<AudioSource> availableSFXSources = new Queue<AudioSource>();
        private int currentMusicIndex = 0;
        private bool isMusicFading = false;
        private Coroutine musicPlayCoroutine;

        // Singleton
        public static AudioManager Instance { get; private set; }

        // Events
        public static System.Action<string> OnSoundPlayed;
        public static System.Action<string> OnMusicChanged;

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
            LoadAudioClips();
        }

        private void Start()
        {
            ApplyVolumeSettings();
            StartBackgroundMusic();
        }

        #region Initialization

        private void InitializeAudioSources()
        {
            // Setup music source
            if (musicSource == null)
            {
                musicSource = gameObject.AddComponent<AudioSource>();
            }
            musicSource.outputAudioMixerGroup = musicGroup;
            musicSource.loop = false;
            musicSource.playOnAwake = false;

            // Setup ambient source
            if (ambientSource == null)
            {
                ambientSource = gameObject.AddComponent<AudioSource>();
            }
            ambientSource.outputAudioMixerGroup = ambientGroup;
            ambientSource.loop = true;
            ambientSource.playOnAwake = false;

            // Setup SFX sources
            for (int i = 0; i < sfxSources.Length; i++)
            {
                if (sfxSources[i] == null)
                {
                    sfxSources[i] = gameObject.AddComponent<AudioSource>();
                }
                sfxSources[i].outputAudioMixerGroup = sfxGroup;
                sfxSources[i].playOnAwake = false;
                availableSFXSources.Enqueue(sfxSources[i]);
            }
        }

        private void LoadAudioClips()
        {
            // Load UI sounds
            RegisterClip("ui_button_click", buttonClickSound);
            RegisterClip("ui_button_hover", buttonHoverSound);
            RegisterClip("ui_notification", notificationSound);
            RegisterClip("ui_level_up", levelUpSound);
            RegisterClip("ui_project_complete", projectCompleteSound);
            RegisterClip("ui_purchase", purchaseSound);
            RegisterClip("ui_error", errorSound);

            // Load game sounds
            for (int i = 0; i < recordingAmbient.Length; i++)
            {
                RegisterClip($"ambient_recording_{i}", recordingAmbient[i]);
            }

            for (int i = 0; i < mixingAmbient.Length; i++)
            {
                RegisterClip($"ambient_mixing_{i}", mixingAmbient[i]);
            }

            for (int i = 0; i < equipmentSounds.Length; i++)
            {
                RegisterClip($"equipment_{i}", equipmentSounds[i]);
            }
        }

        private void RegisterClip(string id, AudioClip clip)
        {
            if (clip != null && !audioClips.ContainsKey(id))
            {
                audioClips[id] = clip;
            }
        }

        #endregion

        #region Music Control

        public void StartBackgroundMusic()
        {
            if (backgroundTracks.Length == 0) return;

            if (shuffleMusic)
            {
                currentMusicIndex = Random.Range(0, backgroundTracks.Length);
            }

            PlayMusic(backgroundTracks[currentMusicIndex]);
        }

        public void PlayMusic(AudioClip clip, bool fadeIn = true)
        {
            if (clip == null) return;

            if (musicPlayCoroutine != null)
            {
                StopCoroutine(musicPlayCoroutine);
            }

            musicPlayCoroutine = StartCoroutine(PlayMusicCoroutine(clip, fadeIn));
        }

        public void PlayMusic(string trackName, bool fadeIn = true)
        {
            if (audioClips.ContainsKey(trackName))
            {
                PlayMusic(audioClips[trackName], fadeIn);
            }
        }

        public void StopMusic(bool fadeOut = true)
        {
            if (musicPlayCoroutine != null)
            {
                StopCoroutine(musicPlayCoroutine);
            }

            if (fadeOut)
            {
                StartCoroutine(FadeOutMusic());
            }
            else
            {
                musicSource.Stop();
            }
        }

        public void NextTrack()
        {
            if (backgroundTracks.Length <= 1) return;

            currentMusicIndex = (currentMusicIndex + 1) % backgroundTracks.Length;
            PlayMusic(backgroundTracks[currentMusicIndex]);
        }

        public void PreviousTrack()
        {
            if (backgroundTracks.Length <= 1) return;

            currentMusicIndex = currentMusicIndex - 1;
            if (currentMusicIndex < 0)
                currentMusicIndex = backgroundTracks.Length - 1;

            PlayMusic(backgroundTracks[currentMusicIndex]);
        }

        private IEnumerator PlayMusicCoroutine(AudioClip clip, bool fadeIn)
        {
            // Fade out current music if playing
            if (musicSource.isPlaying && fadeIn)
            {
                yield return StartCoroutine(FadeOutMusic());
            }

            // Set new clip and play
            musicSource.clip = clip;
            musicSource.Play();

            OnMusicChanged?.Invoke(clip.name);

            // Fade in new music
            if (fadeIn)
            {
                yield return StartCoroutine(FadeInMusic());
            }

            // Wait for music to finish, then play next track
            yield return new WaitWhile(() => musicSource.isPlaying);

            // Auto-play next track if background music is enabled
            if (backgroundTracks.Length > 1)
            {
                NextTrack();
            }
        }

        private IEnumerator FadeInMusic()
        {
            isMusicFading = true;
            float startVolume = 0f;
            musicSource.volume = startVolume;

            while (musicSource.volume < musicVolume)
            {
                musicSource.volume += musicVolume * Time.deltaTime / musicFadeTime;
                yield return null;
            }

            musicSource.volume = musicVolume;
            isMusicFading = false;
        }

        private IEnumerator FadeOutMusic()
        {
            isMusicFading = true;
            float startVolume = musicSource.volume;

            while (musicSource.volume > 0)
            {
                musicSource.volume -= startVolume * Time.deltaTime / musicFadeTime;
                yield return null;
            }

            musicSource.volume = 0f;
            musicSource.Stop();
            isMusicFading = false;
        }

        #endregion

        #region Sound Effects

        public void PlaySFX(AudioClip clip, float volume = 1f, float pitch = 1f)
        {
            if (clip == null) return;

            AudioSource source = GetAvailableSFXSource();
            if (source != null)
            {
                source.clip = clip;
                source.volume = volume * sfxVolume;
                source.pitch = pitch;
                source.Play();

                OnSoundPlayed?.Invoke(clip.name);
                StartCoroutine(ReturnSFXSource(source, clip.length / pitch));
            }
        }

        public void PlaySFX(string clipId, float volume = 1f, float pitch = 1f)
        {
            if (audioClips.ContainsKey(clipId))
            {
                PlaySFX(audioClips[clipId], volume, pitch);
            }
            else
            {
                Debug.LogWarning($"Audio clip '{clipId}' not found!");
            }
        }

        public void PlayUISFX(string clipId)
        {
            PlaySFX(clipId, uiVolume);
        }

        public void PlaySFX3D(AudioClip clip, Vector3 position, float volume = 1f, float pitch = 1f)
        {
            if (clip == null) return;

            GameObject tempAudioGO = new GameObject("TempAudio");
            tempAudioGO.transform.position = position;

            AudioSource tempSource = tempAudioGO.AddComponent<AudioSource>();
            tempSource.clip = clip;
            tempSource.volume = volume * sfxVolume;
            tempSource.pitch = pitch;
            tempSource.spatialBlend = 1f; // 3D sound
            tempSource.outputAudioMixerGroup = sfxGroup;
            tempSource.Play();

            OnSoundPlayed?.Invoke(clip.name);
            Destroy(tempAudioGO, clip.length / pitch);
        }

        private AudioSource GetAvailableSFXSource()
        {
            if (availableSFXSources.Count > 0)
            {
                return availableSFXSources.Dequeue();
            }

            // If no available sources, find one that's not playing
            foreach (var source in sfxSources)
            {
                if (!source.isPlaying)
                {
                    return source;
                }
            }

            // All sources are busy, use the first one
            return sfxSources[0];
        }

        private IEnumerator ReturnSFXSource(AudioSource source, float delay)
        {
            yield return new WaitForSeconds(delay);
            availableSFXSources.Enqueue(source);
        }

        #endregion

        #region Ambient Audio

        public void PlayAmbient(AudioClip clip, float volume = 1f, bool loop = true)
        {
            if (clip == null) return;

            ambientSource.clip = clip;
            ambientSource.volume = volume * ambientVolume;
            ambientSource.loop = loop;
            ambientSource.Play();
        }

        public void PlayAmbient(string clipId, float volume = 1f, bool loop = true)
        {
            if (audioClips.ContainsKey(clipId))
            {
                PlayAmbient(audioClips[clipId], volume, loop);
            }
        }

        public void StopAmbient()
        {
            ambientSource.Stop();
        }

        public void FadeAmbient(float targetVolume, float duration = 2f)
        {
            StartCoroutine(FadeAmbientCoroutine(targetVolume, duration));
        }

        private IEnumerator FadeAmbientCoroutine(float targetVolume, float duration)
        {
            float startVolume = ambientSource.volume;
            float time = 0f;

            while (time < duration)
            {
                time += Time.deltaTime;
                float normalizedTime = time / duration;
                ambientSource.volume = Mathf.Lerp(startVolume, targetVolume * ambientVolume, normalizedTime);
                yield return null;
            }

            ambientSource.volume = targetVolume * ambientVolume;
        }

        #endregion

        #region Volume Control

        public void SetMasterVolume(float volume)
        {
            masterVolume = Mathf.Clamp01(volume);
            masterMixer.SetFloat("MasterVolume", ConvertToDecibel(masterVolume));
            PlayerPrefs.SetFloat("MasterVolume", masterVolume);
        }

        public void SetMusicVolume(float volume)
        {
            musicVolume = Mathf.Clamp01(volume);
            masterMixer.SetFloat("MusicVolume", ConvertToDecibel(musicVolume));
            if (!isMusicFading)
            {
                musicSource.volume = musicVolume;
            }
            PlayerPrefs.SetFloat("MusicVolume", musicVolume);
        }

        public void SetSFXVolume(float volume)
        {
            sfxVolume = Mathf.Clamp01(volume);
            masterMixer.SetFloat("SFXVolume", ConvertToDecibel(sfxVolume));
            PlayerPrefs.SetFloat("SFXVolume", sfxVolume);
        }

        public void SetAmbientVolume(float volume)
        {
            ambientVolume = Mathf.Clamp01(volume);
            masterMixer.SetFloat("AmbientVolume", ConvertToDecibel(ambientVolume));
            ambientSource.volume = ambientVolume;
            PlayerPrefs.SetFloat("AmbientVolume", ambientVolume);
        }

        public void SetUIVolume(float volume)
        {
            uiVolume = Mathf.Clamp01(volume);
            masterMixer.SetFloat("UIVolume", ConvertToDecibel(uiVolume));
            PlayerPrefs.SetFloat("UIVolume", uiVolume);
        }

        private void ApplyVolumeSettings()
        {
            // Load saved settings
            masterVolume = PlayerPrefs.GetFloat("MasterVolume", masterVolume);
            musicVolume = PlayerPrefs.GetFloat("MusicVolume", musicVolume);
            sfxVolume = PlayerPrefs.GetFloat("SFXVolume", sfxVolume);
            ambientVolume = PlayerPrefs.GetFloat("AmbientVolume", ambientVolume);
            uiVolume = PlayerPrefs.GetFloat("UIVolume", uiVolume);

            // Apply to mixer
            SetMasterVolume(masterVolume);
            SetMusicVolume(musicVolume);
            SetSFXVolume(sfxVolume);
            SetAmbientVolume(ambientVolume);
            SetUIVolume(uiVolume);
        }

        private float ConvertToDecibel(float value)
        {
            return value > 0 ? 20f * Mathf.Log10(value) : -80f;
        }

        #endregion

        #region Public API

        public float GetMasterVolume() => masterVolume;
        public float GetMusicVolume() => musicVolume;
        public float GetSFXVolume() => sfxVolume;
        public float GetAmbientVolume() => ambientVolume;
        public float GetUIVolume() => uiVolume;

        public bool IsMusicPlaying() => musicSource.isPlaying;
        public bool IsAmbientPlaying() => ambientSource.isPlaying;

        public string GetCurrentTrackName()
        {
            return musicSource.clip ? musicSource.clip.name : "None";
        }

        public void MuteAll(bool mute)
        {
            masterMixer.SetFloat("MasterVolume", mute ? -80f : ConvertToDecibel(masterVolume));
        }

        #endregion

        #region Editor and Debug

        [ContextMenu("Play Random SFX")]
        private void PlayRandomSFX()
        {
            if (audioClips.Count > 0)
            {
                var clips = new List<AudioClip>(audioClips.Values);
                var randomClip = clips[Random.Range(0, clips.Count)];
                PlaySFX(randomClip);
            }
        }

        [ContextMenu("Next Music Track")]
        private void DebugNextTrack()
        {
            NextTrack();
        }

        private void OnValidate()
        {
            if (Application.isPlaying)
            {
                ApplyVolumeSettings();
            }
        }

        #endregion
    }
}
