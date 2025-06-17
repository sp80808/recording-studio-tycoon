using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;
using RecordingStudioTycoon.GameLogic;

namespace RecordingStudioTycoon.UI
{
    public class UIManager : MonoBehaviour
    {
        // Singleton instance
        private static UIManager _instance;
        public static UIManager Instance
        {
            get { return _instance; }
        }

        // UI Panels and Screens
        public GameObject MainMenuPanel;
        public GameObject InGameUIPanel;
        public GameObject PauseMenuPanel;
        public GameObject GameOverPanel;
        public GameObject SettingsPanel;
        public GameObject LevelUpModal;

        // Current active panel
        private GameObject _currentActivePanel;

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
            // Initialize UI
            InitializeUI();
        }

        private void InitializeUI()
        {
            // Set initial UI state based on game state
            // For now, we'll just log initialization
            Debug.Log("UI Manager initialized.");

            // Hide all panels initially
            HideAllPanels();

            // Show the main menu by default (or based on game state)
            if (MainMenuPanel != null)
            {
                MainMenuPanel.SetActive(true);
                _currentActivePanel = MainMenuPanel;
            }
        }

        private void HideAllPanels()
        {
            if (MainMenuPanel != null) MainMenuPanel.SetActive(false);
            if (InGameUIPanel != null) InGameUIPanel.SetActive(false);
            if (PauseMenuPanel != null) PauseMenuPanel.SetActive(false);
            if (GameOverPanel != null) GameOverPanel.SetActive(false);
            if (SettingsPanel != null) SettingsPanel.SetActive(false);
            if (LevelUpModal != null) LevelUpModal.SetActive(false);
        }

        public void ShowPanel(GameObject panelToShow)
        {
            if (_currentActivePanel != null && _currentActivePanel != panelToShow)
            {
                _currentActivePanel.SetActive(false);
            }

            if (panelToShow != null)
            {
                panelToShow.SetActive(true);
                _currentActivePanel = panelToShow;
            }
        }

        public void ShowMainMenu()
        {
            ShowPanel(MainMenuPanel);
        }

        public void ShowInGameUI()
        {
            ShowPanel(InGameUIPanel);
        }

        public void ShowPauseMenu()
        {
            ShowPanel(PauseMenuPanel);
        }

        public void ShowGameOver()
        {
            ShowPanel(GameOverPanel);
        }

        public void ShowSettings()
        {
            ShowPanel(SettingsPanel);
        }

        public void ShowLevelUpModal()
        {
            if (LevelUpModal != null)
            {
                LevelUpModal.SetActive(true);
                // Note: Modal might overlay on current panel, so we don't hide the current panel
            }
        }

        public void HideLevelUpModal()
        {
            if (LevelUpModal != null)
            {
                LevelUpModal.SetActive(false);
            }
        }

        // Update UI based on game state
        public void UpdateUIForGameState(GameStateEnum gameState)
        {
            switch (gameState)
            {
                case GameStateEnum.MainMenu:
                    ShowMainMenu();
                    break;
                case GameStateEnum.InGame:
                    ShowInGameUI();
                    break;
                case GameStateEnum.Paused:
                    ShowPauseMenu();
                    break;
                case GameStateEnum.GameOver:
                    ShowGameOver();
                    break;
                case GameStateEnum.Settings:
                    ShowSettings();
                    break;
                case GameStateEnum.Tutorial:
                    Debug.Log("Tutorial state UI not implemented yet.");
                    break;
                case GameStateEnum.Loading:
                    Debug.Log("Loading state UI not implemented yet.");
                    break;
                default:
                    Debug.LogWarning("Unhandled game state for UI: " + gameState.ToString());
                    break;
            }
        }
    }
}
