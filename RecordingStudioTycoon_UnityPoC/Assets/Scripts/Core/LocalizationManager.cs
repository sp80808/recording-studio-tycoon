using UnityEngine;
using System.Collections.Generic;
using System.IO;

namespace RecordingStudioTycoon.Core
{
    public class LocalizationManager : MonoBehaviour
    {
        // Singleton instance
        private static LocalizationManager _instance;
        public static LocalizationManager Instance
        {
            get { return _instance; }
        }

        // Current language
        private string _currentLanguage = "en"; // Default to English
        public string CurrentLanguage
        {
            get { return _currentLanguage; }
            set
            {
                if (_currentLanguage != value && SupportedLanguages.Contains(value))
                {
                    _currentLanguage = value;
                    LoadTranslations();
                    ApplyTranslations();
                    Debug.Log("Language changed to: " + _currentLanguage);
                }
            }
        }

        // Supported languages
        public List<string> SupportedLanguages = new List<string> { "en", "pl" }; // English and Polish as per i18n.ts

        // Translation dictionary
        private Dictionary<string, string> _translations = new Dictionary<string, string>();

        // Path to localization files
        private string LocalizationPath => Path.Combine(Application.streamingAssetsPath, "Locales");

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
        }

        void Start()
        {
            // Initialize localization
            InitializeLocalization();
        }

        private void InitializeLocalization()
        {
            // Load language from settings or player prefs if available
            string savedLanguage = PlayerPrefs.GetString("Language", _currentLanguage);
            if (SupportedLanguages.Contains(savedLanguage))
            {
                _currentLanguage = savedLanguage;
            }

            // Load translations for the current language
            LoadTranslations();
            ApplyTranslations();
            Debug.Log("Localization initialized with language: " + _currentLanguage);
        }

        private void LoadTranslations()
        {
            _translations.Clear();
            string filePath = Path.Combine(LocalizationPath, _currentLanguage, "common.json");

            if (File.Exists(filePath))
            {
                string jsonContent = File.ReadAllText(filePath);
                // Parse JSON content into dictionary
                // Note: For simplicity, this assumes a flat JSON structure. In a real implementation, use a JSON parser like Newtonsoft.Json.
                // Here, we're simulating the loading process.
                Debug.Log("Loading translations from: " + filePath);

                // Placeholder for actual JSON parsing
                // Example: _translations = JsonUtility.FromJson<Dictionary<string, string>>(jsonContent);
                // For now, add dummy translations
                if (_currentLanguage == "en")
                {
                    _translations.Add("welcome", "Welcome to Recording Studio Tycoon!");
                    _translations.Add("settings", "Settings");
                    _translations.Add("startGame", "Start Game");
                }
                else if (_currentLanguage == "pl")
                {
                    _translations.Add("welcome", "Witamy w Recording Studio Tycoon!");
                    _translations.Add("settings", "Ustawienia");
                    _translations.Add("startGame", "Rozpocznij Grę");
                }
            }
            else
            {
                Debug.LogWarning("Translation file not found at: " + filePath + ". Falling back to default language.");
                // Fallback to English if file not found
                if (_currentLanguage != "en")
                {
                    _currentLanguage = "en";
                    LoadTranslations();
                }
            }
        }

        private void ApplyTranslations()
        {
            // Notify UI or other systems to update text based on current translations
            // In a real implementation, this would trigger updates to all Text components or UI elements
            Debug.Log("Applying translations for language: " + _currentLanguage);
            // Placeholder for actual application of translations to UI elements
        }

        // Get a translated string by key
        public string GetTranslation(string key)
        {
            if (_translations.ContainsKey(key))
            {
                return _translations[key];
            }
            Debug.LogWarning("Translation key not found: " + key);
            return key; // Return the key itself as a fallback
        }

        // Change language and save preference
        public void ChangeLanguage(string newLanguage)
        {
            if (SupportedLanguages.Contains(newLanguage))
            {
                CurrentLanguage = newLanguage;
                PlayerPrefs.SetString("Language", newLanguage);
                PlayerPrefs.Save();
            }
            else
            {
                Debug.LogWarning("Unsupported language: " + newLanguage);
            }
        }
    }
}
