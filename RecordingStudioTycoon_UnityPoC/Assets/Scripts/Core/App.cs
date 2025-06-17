using UnityEngine;
using System.Collections;

namespace RecordingStudioTycoon.Core
{
    public class App : MonoBehaviour
    {
        // Singleton instance
        private static App _instance;
        public static App Instance
        {
            get { return _instance; }
        }

        // Game state and settings
        public GameState GameState;
        public SettingsManager SettingsManager;

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
            // Initialize game systems
            InitializeGame();
        }

        private void InitializeGame()
        {
            // Initialize settings
            SettingsManager = GetComponent<SettingsManager>();
            if (SettingsManager == null)
            {
                SettingsManager = gameObject.AddComponent<SettingsManager>();
            }

            // Initialize game state
            GameState = GetComponent<GameState>();
            if (GameState == null)
            {
                GameState = gameObject.AddComponent<GameState>();
            }

            // Load initial scene or main menu
            StartCoroutine(LoadInitialScene());
        }

        private IEnumerator LoadInitialScene()
        {
            // Placeholder for loading initial scene
            yield return new WaitForSeconds(0.5f);
            Debug.Log("Loading initial scene...");
            // SceneManager.LoadScene("MainMenu");
        }

        void Update()
        {
            // Handle global game updates if needed
        }

        // Method to handle game state changes
        public void SetGameState(GameStateEnum newState)
        {
            GameState.CurrentState = newState;
            Debug.Log("Game state changed to: " + newState.ToString());
        }
    }
}
