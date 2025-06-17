using UnityEngine;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;
using RecordingStudioTycoon.GameLogic;

namespace RecordingStudioTycoon.Core
{
    public class SaveSystem : MonoBehaviour
    {
        // Singleton instance
        private static SaveSystem _instance;
        public static SaveSystem Instance
        {
            get { return _instance; }
        }

        // Save file path
        private string SavePath => Path.Combine(Application.persistentDataPath, "gameSave.dat");

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

        // Save the game state
        public void SaveGame(GameState gameState)
        {
            BinaryFormatter formatter = new BinaryFormatter();
            using (FileStream stream = new FileStream(SavePath, FileMode.Create))
            {
                formatter.Serialize(stream, gameState);
            }
            Debug.Log("Game saved to: " + SavePath);
        }

        // Load the game state
        public GameState LoadGame()
        {
            if (File.Exists(SavePath))
            {
                BinaryFormatter formatter = new BinaryFormatter();
                using (FileStream stream = new FileStream(SavePath, FileMode.Open))
                {
                    GameState gameState = formatter.Deserialize(stream) as GameState;
                    Debug.Log("Game loaded from: " + SavePath);
                    return gameState;
                }
            }
            else
            {
                Debug.LogWarning("No save file found at: " + SavePath);
                return null;
            }
        }

        // Delete the save file
        public void DeleteSave()
        {
            if (File.Exists(SavePath))
            {
                File.Delete(SavePath);
                Debug.Log("Save file deleted: " + SavePath);
            }
            else
            {
                Debug.LogWarning("No save file to delete at: " + SavePath);
            }
        }

        // Check if a save file exists
        public bool HasSaveFile()
        {
            return File.Exists(SavePath);
        }
    }
}
