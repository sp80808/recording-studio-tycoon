using UnityEngine;
using System.Collections.Generic;

namespace RecordingStudioTycoon.Core
{
    public class SettingsManager : MonoBehaviour
    {
        // Singleton instance
        private static SettingsManager _instance;
        public static SettingsManager Instance
        {
            get { return _instance; }
        }

        // Settings data
        public string Theme { get; private set; }
        public float MusicVolume { get; private set; }
        public float SoundEffectsVolume { get; private set; }
        public string Language { get; private set; }
        public bool IsDarkMode { get; private set; }

        // Player preferences keys
        private const string THEME_KEY = "Theme";
        private const string MUSIC_VOLUME_KEY = "MusicVolume";
        private const string SFX_VOLUME_KEY = "SoundEffectsVolume";
        private const string LANGUAGE_KEY = "Language";
        private const string DARK_MODE_KEY = "DarkMode";

        void Awake()
        {
            // Ensure only one instance exists
            if (_instance == null)
            {
                _instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }

            // Load settings from PlayerPrefs
            LoadSettings();
        }

        private void LoadSettings()
        {
            Theme = PlayerPrefs.GetString(THEME_KEY, "sunrise-studio");
            MusicVolume = PlayerPrefs.GetFloat(MUSIC_VOLUME_KEY, 0.75f);
            SoundEffectsVolume = PlayerPrefs.GetFloat(SFX_VOLUME_KEY, 0.75f);
            Language = PlayerPrefs.GetString(LANGUAGE_KEY, "en");
            IsDarkMode = PlayerPrefs.GetInt(DARK_MODE_KEY, 0) == 1;

            ApplySettings();
        }

        private void ApplySettings()
        {
            // Apply theme
            // Note: In Unity, theme application might involve changing materials or UI elements
            Debug.Log("Applying theme: " + Theme);

            // Apply volume settings
            AudioListener.volume = MusicVolume;
            // Additional logic for sound effects volume if managed separately

            // Apply language
            // Note: Implement localization system to handle language changes
            Debug.Log("Applying language: " + Language);

            // Apply dark mode
            // Note: Implement UI color changes for dark mode
            Debug.Log("Dark mode: " + (IsDarkMode ? "Enabled" : "Disabled"));
        }

        public void UpdateSettings(string theme, float musicVolume, float sfxVolume, string language, bool isDarkMode)
        {
            Theme = theme;
            MusicVolume = musicVolume;
            SoundEffectsVolume = sfxVolume;
            Language = language;
            IsDarkMode = isDarkMode;

            // Save to PlayerPrefs
            PlayerPrefs.SetString(THEME_KEY, Theme);
            PlayerPrefs.SetFloat(MUSIC_VOLUME_KEY, MusicVolume);
            PlayerPrefs.SetFloat(SFX_VOLUME_KEY, SoundEffectsVolume);
            PlayerPrefs.SetString(LANGUAGE_KEY, Language);
            PlayerPrefs.SetInt(DARK_MODE_KEY, IsDarkMode ? 1 : 0);
            PlayerPrefs.Save();

            // Apply the updated settings
            ApplySettings();
        }

        public void ResetSettingsToDefault()
        {
            // Reset to default values
            Theme = "sunrise-studio";
            MusicVolume = 0.75f;
            SoundEffectsVolume = 0.75f;
            Language = "en";
            IsDarkMode = false;

            // Save and apply
            UpdateSettings(Theme, MusicVolume, SoundEffectsVolume, Language, IsDarkMode);
        }
    }
}
