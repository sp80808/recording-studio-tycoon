using UnityEngine;
using System.IO;
using System;

namespace RecordingStudioTycoon.Core
{
    public class SaveSystem : MonoBehaviour
    {
        public static SaveSystem Instance { get; private set; }

        private string saveFilePath;

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
                saveFilePath = Path.Combine(Application.persistentDataPath, "savegame.json");
            }
        }

        public void SaveGame(GameState gameState)
        {
            try
            {
                string json = JsonUtility.ToJson(gameState, true); // true for pretty print
                File.WriteAllText(saveFilePath, json);
                Debug.Log("Game saved successfully to: " + saveFilePath);
            }
            catch (Exception e)
            {
                Debug.LogError("Failed to save game: " + e.Message);
            }
        }

        public GameState LoadGame()
        {
            if (File.Exists(saveFilePath))
            {
                try
                {
                    string json = File.ReadAllText(saveFilePath);
                    GameState loadedGameState = JsonUtility.FromJson<GameState>(json);
                    Debug.Log("Game loaded successfully from: " + saveFilePath);
                    return loadedGameState;
                }
                catch (Exception e)
                {
                    Debug.LogError("Failed to load game: " + e.Message);
                    return null;
                }
            }
            else
            {
                Debug.LogWarning("No save file found at: " + saveFilePath);
                return null;
            }
        }
    }
}