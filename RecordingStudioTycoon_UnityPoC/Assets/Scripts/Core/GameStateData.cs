using UnityEngine;
using RecordingStudioTycoon.GameLogic;

namespace RecordingStudioTycoon.Core
{
    [CreateAssetMenu(fileName = "GameStateData", menuName = "Recording Studio Tycoon/Game State Data")]
    public class GameStateData : ScriptableObject
    {
        [SerializeField] private GameState _gameState;
        
        public GameState GameState
        {
            get => _gameState;
            set => _gameState = value;
        }

        private void OnEnable()
        {
            if (_gameState == null)
            {
                _gameState = new GameState();
            }
        }
    }
}
