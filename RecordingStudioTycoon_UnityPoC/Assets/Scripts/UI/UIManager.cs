using UnityEngine;
using System;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.GameLogic; // For GameStateEnum
using RecordingStudioTycoon.Core; // For AudioManager

namespace RecordingStudioTycoon.UI
{
    public class UIManager : MonoBehaviour
    {
        public static UIManager Instance { get; private set; }

        [Header("UI Panels")]
        [SerializeField] private CanvasGroup _mainMenuPanel;
        [SerializeField] private CanvasGroup _hudPanel;
        [SerializeField] private CanvasGroup _pauseMenuPanel;
        [SerializeField] private CanvasGroup _gameOverPanel;
        [SerializeField] private CanvasGroup _settingsPanel; // New settings panel

        // References to UI Text elements for HUD (to be assigned in Inspector)
        [Header("HUD UI Elements")]
        [SerializeField] private TMPro.TextMeshProUGUI _moneyText;
        [SerializeField] private TMPro.TextMeshProUGUI _dayText;
        [SerializeField] private TMPro.TextMeshProUGUI _yearText;
        [SerializeField] private TMPro.TextMeshProUGUI _xpText;
        [SerializeField] private TMPro.TextMeshProUGUI _levelText;

        // References to UI Sliders for Settings (to be assigned in Inspector)
        [Header("Settings UI Elements")]
        [SerializeField] private UnityEngine.UI.Slider _masterVolumeSlider;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void OnEnable()
        {
            GameManager.OnGameStateChanged += HandleGameStateChanged;
            GameManager.OnGameDataChanged += UpdateHUD; // Subscribe to generic game data changes
            GameManager.OnPlayerLevelUp += HandlePlayerLevelUp; // Subscribe to level up event
        }

        private void OnDisable()
        {
            GameManager.OnGameStateChanged -= HandleGameStateChanged;
            GameManager.OnGameDataChanged -= UpdateHUD;
            GameManager.OnPlayerLevelUp -= HandlePlayerLevelUp;
        }

        private void Start()
        {
            // Initialize UI visibility based on current game state
            HandleGameStateChanged(GameStateEnum.None, GameManager.Instance.CurrentGameState); // Pass None as previous state for initial setup
            UpdateHUD(); // Initial HUD update
            
            // Initialize settings slider values
            if (_masterVolumeSlider != null && AudioManager.Instance != null)
            {
                // Assuming AudioManager has a way to get current volume, or a default
                _masterVolumeSlider.value = 0.5f; // Default value, should load from save
                _masterVolumeSlider.onValueChanged.AddListener(SetMasterVolume);
            }
        }

        private void HandleGameStateChanged(GameStateEnum previousState, GameStateEnum newState)
        {
            // Fade out all panels first
            FadeOutPanel(_mainMenuPanel);
            FadeOutPanel(_hudPanel);
            FadeOutPanel(_pauseMenuPanel);
            FadeOutPanel(_gameOverPanel);
            FadeOutPanel(_settingsPanel);

            // Activate and fade in the relevant panel based on the new state
            switch (newState)
            {
                case GameStateEnum.MainMenu:
                    FadeInPanel(_mainMenuPanel);
                    break;
                case GameStateEnum.InGame:
                    FadeInPanel(_hudPanel);
                    break;
                case GameStateEnum.Paused:
                    FadeInPanel(_pauseMenuPanel);
                    break;
                case GameStateEnum.GameOver:
                    FadeInPanel(_gameOverPanel);
                    break;
                case GameStateEnum.Settings:
                    FadeInPanel(_settingsPanel);
                    break;
                // Add other states as needed
            }
            Debug.Log($"UIManager: Switched to {newState} UI.");
        }

        private void FadeInPanel(CanvasGroup panel)
        {
            if (panel != null)
            {
                panel.gameObject.SetActive(true);
                panel.alpha = 0f;
                StartCoroutine(FadeCanvasGroup(panel, 1f, 0.5f)); // Fade to full opacity in 0.5 seconds
            }
        }

        private void FadeOutPanel(CanvasGroup panel)
        {
            if (panel != null && panel.gameObject.activeSelf)
            {
                StartCoroutine(FadeCanvasGroup(panel, 0f, 0.3f, () => panel.gameObject.SetActive(false))); // Fade out in 0.3 seconds, then deactivate
            }
        }

        private System.Collections.IEnumerator FadeCanvasGroup(CanvasGroup canvasGroup, float targetAlpha, float duration, Action onComplete = null)
        {
            float startAlpha = canvasGroup.alpha;
            float timer = 0f;

            while (timer < duration)
            {
                timer += Time.deltaTime;
                canvasGroup.alpha = Mathf.Lerp(startAlpha, targetAlpha, timer / duration);
                yield return null;
            }
            canvasGroup.alpha = targetAlpha; // Ensure final alpha is set
            onComplete?.Invoke();
        }

        public void UpdateHUD()
        {
            if (GameManager.Instance != null && GameManager.Instance.GameState != null)
            {
                _moneyText.text = $"Money: ${Systems.Finance.FinanceManager.Instance.CurrentMoney}";
                _dayText.text = $"Day: {GameManager.Instance.CurrentDay}, Year: {GameManager.Instance.CurrentYear}";
                _xpText.text = $"XP: {GameManager.Instance.PlayerXp}";
                _levelText.text = $"Level: {GameManager.Instance.PlayerLevel}";
            }
        }

        private void HandlePlayerLevelUp(LevelUpDetails details)
        {
            Debug.Log($"UIManager: Player Leveled Up to {details.NewPlayerLevel}!");
            AudioManager.Instance?.PlayUISFX("level-up-sound"); // Assuming a level-up sound exists
            // Potentially show a level-up animation or modal here
        }

        // UI Interaction Methods (called by Unity UI Buttons/Sliders)
        public void StartNewGame()
        {
            GameManager.Instance?.ResetGameData(); // Reset and then start new
            GameManager.Instance?.SetState(GameStateEnum.InGame);
            AudioManager.Instance?.PlayUISFX("bubble-pop-sound-316482");
        }

        public void LoadGame()
        {
            GameManager.Instance?.LoadGameData();
            GameManager.Instance?.SetState(GameStateEnum.InGame);
            AudioManager.Instance?.PlayUISFX("bubble-pop-sound-316482");
        }

        public void ShowSettings()
        {
            GameManager.Instance?.SetState(GameStateEnum.Settings);
            AudioManager.Instance?.PlayUISFX("bubble-pop-sound-316482");
        }

        public void AdvanceDay()
        {
            GameManager.Instance?.AdvanceDay();
            AudioManager.Instance?.PlayUISFX("cash-register-purchase-87313");
        }

        public void PauseGame()
        {
            GameManager.Instance?.SetState(GameStateEnum.Paused);
            AudioManager.Instance?.PlayUISFX("bubble-pop-sound-316482");
        }

        public void ResumeGame()
        {
            GameManager.Instance?.SetState(GameStateEnum.InGame);
            AudioManager.Instance?.PlayUISFX("bubble-pop-sound-316482");
        }

        public void SaveGame()
        {
            GameManager.Instance?.SaveGameData();
            AudioManager.Instance?.PlayUISFX("bubble-pop-sound-316482");
        }

        public void QuitToMainMenu()
        {
            GameManager.Instance?.SetState(GameStateEnum.MainMenu);
            AudioManager.Instance?.PlayUISFX("bubble-pop-sound-316482");
        }

        public void RestartGame()
        {
            GameManager.Instance?.ResetGameData();
            GameManager.Instance?.SetState(GameStateEnum.MainMenu);
            AudioManager.Instance?.PlayUISFX("bubble-pop-sound-316482");
        }

        public void SetMasterVolume(float volume)
        {
            AudioManager.Instance?.SetMusicVolume(volume); // Assuming master volume controls music for now
            AudioManager.Instance?.SetSFXVolume(volume); // And SFX
            Debug.Log($"Master Volume set to: {volume}");
        }

        public void ShowLevelUpDetails(LevelUpDetails details)
        {
            // Implement level up UI logic
        }
    }
}