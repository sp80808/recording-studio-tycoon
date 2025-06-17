using UnityEngine;
using RecordingStudioTycoon.Core;
using RecordingStudioTycoon.UI;

namespace RecordingStudioTycoon.GameLogic
{
    public class GameManager : MonoBehaviour
    {
        // Singleton instance
        private static GameManager _instance;
        public static GameManager Instance
        {
            get { return _instance; }
        }

        // Game state
        public GameState GameState { get; private set; }

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
            // Initialize game manager
            InitializeGame();
        }

        private void InitializeGame()
        {
            // Get or initialize game state
            GameState = GetComponent<GameState>();
            if (GameState == null)
            {
                GameState = gameObject.AddComponent<GameState>();
            }

            // Check for saved game
            if (SaveSystem.Instance.HasSaveFile())
            {
                // Load saved game state
                GameState = SaveSystem.Instance.LoadGame();
                Debug.Log("Loaded saved game state.");
            }
            else
            {
                // Initialize new game
                GameState.CurrentState = GameStateEnum.MainMenu;
                Debug.Log("Initialized new game state.");
            }

            // Update UI based on game state
            UIManager.Instance.UpdateUIForGameState(GameState.CurrentState);
        }

        // Method to start a new game
        public void StartNewGame()
        {
            // Reset game state to initial values
            GameState = gameObject.AddComponent<GameState>(); // This will reset to default values
            GameState.CurrentState = GameStateEnum.InGame;
            SaveSystem.Instance.SaveGame(GameState);
            UIManager.Instance.UpdateUIForGameState(GameState.CurrentState);
            Debug.Log("Started new game.");
        }

        // Method to load a saved game
        public void LoadGame()
        {
            GameState = SaveSystem.Instance.LoadGame();
            if (GameState != null)
            {
                UIManager.Instance.UpdateUIForGameState(GameState.CurrentState);
                Debug.Log("Loaded saved game.");
            }
            else
            {
                Debug.LogError("Failed to load saved game.");
            }
        }

        // Method to save the current game state
        public void SaveGame()
        {
            SaveSystem.Instance.SaveGame(GameState);
        }

        // Method to pause the game
        public void PauseGame()
        {
            GameState.CurrentState = GameStateEnum.Paused;
            Time.timeScale = 0f; // Pause game time
            UIManager.Instance.UpdateUIForGameState(GameState.CurrentState);
            Debug.Log("Game paused.");
        }

        // Method to resume the game
        public void ResumeGame()
        {
            GameState.CurrentState = GameStateEnum.InGame;
            Time.timeScale = 1f; // Resume game time
            UIManager.Instance.UpdateUIForGameState(GameState.CurrentState);
            Debug.Log("Game resumed.");
        }

        // Method to end the game
        public void GameOver()
        {
            GameState.CurrentState = GameStateEnum.GameOver;
            UIManager.Instance.UpdateUIForGameState(GameState.CurrentState);
            Debug.Log("Game over.");
        }

        // Method to return to main menu
        public void ReturnToMainMenu()
        {
            GameState.CurrentState = GameStateEnum.MainMenu;
            Time.timeScale = 1f; // Ensure game time is running
            UIManager.Instance.UpdateUIForGameState(GameState.CurrentState);
            Debug.Log("Returned to main menu.");
        }

        void Update()
        {
            // Handle game logic updates based on current state
            switch (GameState.CurrentState)
            {
                case GameStateEnum.InGame:
                    // Update game logic here
                    break;
                case GameStateEnum.Paused:
                    // Handle paused state if needed
                    break;
                default:
                    // Other states might not need continuous updates
                    break;
            }
        }
    }
}
