using UnityEngine;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;
using RecordingStudioTycoon.GameLogic;

namespace RecordingStudioTycoon.Core
{
    public static class SaveSystem
    {
        private static readonly string SAVE_PATH = Path.Combine(Application.persistentDataPath, "savedata.dat");

        public static void SaveGame(GameState gameState)
        {
            BinaryFormatter formatter = new BinaryFormatter();
            using (FileStream stream = new FileStream(SAVE_PATH, FileMode.Create))
            {
                formatter.Serialize(stream, gameState);
            }
        }

        public static GameState LoadGame()
        {
            if (File.Exists(SAVE_PATH))
            {
                BinaryFormatter formatter = new BinaryFormatter();
                using (FileStream stream = new FileStream(SAVE_PATH, FileMode.Open))
                {
                    return (GameState)formatter.Deserialize(stream);
                }
            }
            return null;
        }
    }
}