using UnityEngine;
using UnityEngine.UIElements;
using RecordingStudioTycoon.GameLogic; // For GameManager
using RecordingStudioTycoon.UI; // For MainMenuPanel and StudioPanel

namespace RecordingStudioTycoon.UI
{
    public class MainUI : MonoBehaviour
    {
        [SerializeField] private UIDocument uiDocument;
        [SerializeField] private SettingsSO settings;
        [SerializeField] private SaveSystem saveSystem;

        // References to UI Panel GameObjects
        [SerializeField] private GameObject mainMenuPanelGameObject;
        [SerializeField] private GameObject studioPanelGameObject;

        private VisualElement root;

        private MainMenuPanel mainMenuPanel;
        private StudioPanel studioPanel;

        void Awake()
        {
            // Get references to the panel scripts from their GameObjects
            mainMenuPanel = mainMenuPanelGameObject.GetComponent<MainMenuPanel>();
            studioPanel = studioPanelGameObject.GetComponent<StudioPanel>();

            if (mainMenuPanel == null) Debug.LogError("MainMenuPanel script not found on mainMenuPanelGameObject.");
            if (studioPanel == null) Debug.LogError("StudioPanel script not found on studioPanelGameObject.");
        }

        void OnEnable()
        {
            root = uiDocument.rootVisualElement;

            // Initialize theme from settings
            UpdateTheme(settings.CurrentTheme);
            settings.OnThemeChanged += UpdateTheme;

            // Register button callbacks for MainMenuPanel
            if (mainMenuPanel != null)
            {
                mainMenuPanel.OnStartNewGameClicked += OnStartNewGame;
                mainMenuPanel.OnLoadGameClicked += OnLoadGame;
            }

            // Show Main Menu initially
            ShowMainMenu();
        }

        void OnDisable()
        {
            settings.OnThemeChanged -= UpdateTheme;

            // Unregister button callbacks
            if (mainMenuPanel != null)
            {
                mainMenuPanel.OnStartNewGameClicked -= OnStartNewGame;
                mainMenuPanel.OnLoadGameClicked -= OnLoadGame;
            }
        }

        private void UpdateTheme(string theme)
        {
            root.ClearClassList();
            root.AddToClassList(theme);
        }

        public void ShowMainMenu()
        {
            mainMenuPanelGameObject.SetActive(true);
            studioPanelGameObject.SetActive(false);
            Debug.Log("Showing Main Menu.");
        }

        public void ShowStudioPanel()
        {
            mainMenuPanelGameObject.SetActive(false);
            studioPanelGameObject.SetActive(true);
            Debug.Log("Showing Studio Panel.");
        }

        private void OnStartNewGame()
        {
            Debug.Log("Start New Game clicked!");
            GameManager.Instance.InitializeGame(); // Call GameManager to start a new game
            ShowStudioPanel(); // Transition to studio panel after starting new game
        }

        private void OnLoadGame()
        {
            Debug.Log("Load Game clicked!");
            // saveSystem.LoadGame(); // Placeholder for loading game
            // After loading, you would likely transition to the StudioPanel
            // ShowStudioPanel();
        }
    }
}
