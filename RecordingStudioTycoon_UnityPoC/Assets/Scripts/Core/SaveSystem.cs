using UnityEngine;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;
using System;

public class SaveSystem : MonoBehaviour
{
    [SerializeField] private GameStateSO gameState;
    [SerializeField] private SettingsSO settings;
    
    private string savePath => $"{Application.persistentDataPath}/save.dat";
    private const int CurrentVersion = 1;

    public void SaveGame()
    {
        try
        {
            var state = new SaveData {
                version = CurrentVersion,
                gameState = gameState.CurrentState,
                settings = new SettingsData {
                    theme = settings.CurrentTheme
                },
                timestamp = DateTime.Now
            };

            using (var stream = File.Open(savePath, FileMode.Create))
            {
                var formatter = new BinaryFormatter();
                formatter.Serialize(stream, state);
                Debug.Log($"Game saved successfully to {savePath}");
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"Save failed: {e.Message}");
        }
    }

    public void LoadGame()
    {
        if (!File.Exists(savePath))
        {
            Debug.Log("No save file found");
            return;
        }

        try
        {
            using (var stream = File.Open(savePath, FileMode.Open))
            {
                var formatter = new BinaryFormatter();
                SaveData data = (SaveData)formatter.Deserialize(stream);
                
                // Handle version differences
                if (data.version < CurrentVersion)
                {
                    Debug.LogWarning($"Migrating save from version {data.version} to {CurrentVersion}");
                    // Add migration logic here if needed
                }

                gameState.SetGameState(data.gameState);
                settings.SetTheme(data.settings.theme);
                Debug.Log($"Game loaded from {savePath} (v{data.version})");
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"Load failed: {e.Message}");
            // Optionally create default save if load fails
        }
    }

    [System.Serializable]
    private class SaveData
    {
        public int version;
        public DateTime timestamp;
        public GameState gameState;
        public SettingsData settings;
    }

    [System.Serializable]
    private class SettingsData
    {
        public string theme;
    }

    // Auto-save on application pause/quitting
    private void OnApplicationPause(bool pauseStatus)
    {
        if (pauseStatus) SaveGame();
    }

    private void OnApplicationQuit()
    {
        SaveGame();
    }
}
