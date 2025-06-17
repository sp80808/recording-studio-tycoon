using UnityEngine;
using RecordingStudioTycoon.GameLogic;
using RecordingStudioTycoon.DataModels;
using LevelUpDetails = RecordingStudioTycoon.DataModels.Progression.LevelUpDetails;
using RecordingStudioTycoon.DataModels.Progression;
using UnityEngine.Events;

[CreateAssetMenu(fileName = "GameState", menuName = "Recording Studio Tycoon/Game State")]
public class GameStateSO : ScriptableObject
{
    public event UnityAction<GameState> OnGameStateChanged = delegate { };
    public event UnityAction<LevelUpDetails> OnLevelUp = delegate { };

    [SerializeField] private GameState currentState;
    public GameState CurrentState => currentState;

    public void SetGameState(GameState newState)
    {
        if (currentState != newState)
        {
            currentState = newState;
            OnGameStateChanged?.Invoke(newState);
        }
    }

    public void UpdateGameState(System.Action<GameState> updater)
    {
        var newState = currentState.Clone();
        updater(newState);
        SetGameState(newState);
    }

    public void TriggerLevelUp(LevelUpDetails details)
    {
        OnLevelUp?.Invoke(details);
    }
}
