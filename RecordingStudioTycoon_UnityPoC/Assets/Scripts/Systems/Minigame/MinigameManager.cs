using UnityEngine;
using System;
using System.Collections.Generic;
using RecordingStudioTycoon.GameLogic; // For GameManager, GameStateEnum
using RecordingStudioTycoon.UI; // For UIManager
using RecordingStudioTycoon.ScriptableObjects; // For MinigameData
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.Core; // For RewardType, RewardManager
using RecordingStudioTycoon.Utils; // For SerializableDictionary

namespace RecordingStudioTycoon.Systems.Minigame
{
    public class MinigameManager : MonoBehaviour
    {
        public static MinigameManager Instance { get; private set; }

        public event Action<MinigameData, RecordingStudioTycoon.DataModels.Project> OnMinigameStarted;
        public event Action<MinigameData, bool, RecordingStudioTycoon.DataModels.Project, object> OnMinigameEnded; // MinigameData, success, project, outcomeData

        [SerializeField] public MinigameData[] availableMinigames; // Array of all MinigameData ScriptableObjects

        private MinigameData _currentMinigame;
        private RecordingStudioTycoon.DataModels.Project _activeProject; // Store the project associated with the current minigame

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
            }
        }

        /// <summary>
        /// Starts a specified minigame for a given project.
        /// </summary>
        /// <param name="minigameId">The ID of the minigame to start.</param>
        /// <param name="project">The project associated with this minigame.</param>
        /// <returns>True if the minigame was successfully started, false otherwise.</returns>
        public bool StartMinigame(string minigameId, RecordingStudioTycoon.DataModels.Project project)
        {
            if (GameManager.Instance == null)
            {
                Debug.LogError("GameManager not found. Cannot start minigame.");
                return false;
            }
            if (GameManager.Instance.CurrentGameState == GameStateEnum.Minigame)
            {
                Debug.LogWarning("A minigame is already active.");
                return false;
            }
            if (project == null)
            {
                Debug.LogError("Cannot start minigame: Project is null.");
                return false;
            }

            MinigameData minigameToStart = Array.Find(availableMinigames, mg => mg.Id == minigameId);
            if (minigameToStart == null)
            {
                Debug.LogError($"Minigame with ID '{minigameId}' not found.");
                return false;
            }

            _currentMinigame = minigameToStart;
            _activeProject = project; // Assign the active project
            GameManager.Instance.SetState(GameStateEnum.Minigame);
            Debug.Log($"Starting minigame: {_currentMinigame.Name} for project {_activeProject.Name}");

            // Notify UI Manager to display minigame UI
            if (UIManager.Instance != null)
            {
                UIManager.Instance.ShowMinigameUI(_currentMinigame); // Assuming UIManager has this method
            }

            OnMinigameStarted?.Invoke(_currentMinigame, _activeProject);

            // Call specific minigame logic based on ID
            switch (minigameId)
            {
                case "rhythm_timing_game":
                    RunRhythmTimingMinigame(_activeProject);
                    break;
                // Add more cases for other minigames
                default:
                    Debug.LogWarning($"No specific logic implemented for minigame ID: {minigameId}. Ending immediately.");
                    EndMinigame(true, _activeProject, 0); // Default to success with 0 bonus
                    break;
            }

            return true;
        }

        /// <summary>
        /// Ends the current minigame and processes its outcome.
        /// </summary>
        /// <param name="success">Whether the minigame was successfully completed.</param>
        /// <param name="project">The project associated with this minigame.</param>
        /// <param name="outcomeData">Optional data related to the minigame's outcome (e.g., score, quality bonus).</param>
        public void EndMinigame(bool success, RecordingStudioTycoon.DataModels.Project project, object outcomeData = null)
        {
            if (_currentMinigame == null || project == null)
            {
                Debug.LogWarning("No minigame is currently active or project is null to end.");
                return;
            }

            Debug.Log($"Ending minigame: {_currentMinigame.Name}. Success: {success} for project {project.Name}");

            // Process minigame outcomes
            ApplyMinigameOutcome(success, project, outcomeData);

            // Notify UI Manager to hide minigame UI
            if (UIManager.Instance != null)
            {
                UIManager.Instance.HideMinigameUI(); // Assuming UIManager has this method
            }

            OnMinigameEnded?.Invoke(_currentMinigame, success, project, outcomeData);
            _currentMinigame = null; // Clear current minigame
            _activeProject = null; // Clear active project
            
            // Return to previous game state (e.g., InGame)
            if (GameManager.Instance != null)
            {
                GameManager.Instance.SetState(GameStateEnum.InGame);
            }
        }

        /// <summary>
        /// Applies the effects of the minigame outcome to game state.
        /// </summary>
        /// <param name="success">Whether the minigame was successful.</param>
        /// <param name="project">The project associated with this minigame.</param>
        /// <param name="outcomeData">Data from the minigame's completion.</param>
        private void ApplyMinigameOutcome(bool success, RecordingStudioTycoon.DataModels.Project project, object outcomeData)
        {
            if (GameManager.Instance == null || project == null) return;

            // Example: Affect project progress, staff skills, or rewards
            if (success)
            {
                if (RewardManager.Instance != null)
                {
                    RewardManager.Instance.GrantReward(RewardType.XP, _currentMinigame.BaseRewardXP);
                    Systems.Finance.FinanceManager.Instance.AddMoney(_currentMinigame.BaseRewardMoney);
                }
                else
                {
                    Debug.LogWarning("RewardManager not found. Minigame rewards not granted.");
                }
                Debug.Log($"Minigame {_currentMinigame.Name} successful! Gained {_currentMinigame.BaseRewardXP} XP and {_currentMinigame.BaseRewardMoney} money.");

                // Apply quality bonus to the project
                int qualityBonus = _currentMinigame.BaseDifficulty * 5; // Example: Difficulty influences quality bonus
                if (outcomeData is int scoreBonus) // If minigame provides a score
                {
                    qualityBonus += scoreBonus / 10; // Example: Score adds to quality
                }
                project.CurrentQuality += qualityBonus;
                Debug.Log($"Applied {qualityBonus} quality bonus to project {project.Name}. New quality: {project.CurrentQuality}");

                // Grant staff XP based on their participation/performance in the minigame
                if (project.AssignedStaffIds != null && project.AssignedStaffIds.Any())
                {
                    int xpPerStaff = _currentMinigame.BaseRewardXP / project.AssignedStaffIds.Count;
                    foreach (string staffId in project.AssignedStaffIds)
                    {
                        // Assuming minigames primarily contribute to a general skill or a skill related to the minigame type
                        // For simplicity, let's grant XP to a generic 'production' skill or a skill related to the minigame's primary focus.
                        // A more complex system might map minigame type to specific skills.
                        Systems.Staff.StaffManagement.Instance?.AddStaffXP(staffId, DataModels.Staff.StudioSkillType.production, xpPerStaff);
                    }
                    Debug.Log($"Granted {xpPerStaff} XP to each of {project.AssignedStaffIds.Count} assigned staff members for minigame success.");
                }
            }
            else
            {
                Debug.Log($"Minigame {_currentMinigame.Name} failed. No rewards.");
                // Potentially apply penalties for failure, e.g., reduce project quality or staff morale
                project.CurrentQuality = Mathf.Max(0, project.CurrentQuality - (_currentMinigame.BaseDifficulty * 2)); // Example penalty
                Debug.Log($"Project {project.Name} quality reduced. New quality: {project.CurrentQuality}");
            }

            // Further logic to affect staff skills, project progress, etc.
            // This would depend on the specific minigame and its intended impact.
        }

        /// <summary>
        /// Placeholder for a basic Rhythm Timing minigame logic.
        /// </summary>
        /// <param name="project">The project associated with this minigame.</param>
        private void RunRhythmTimingMinigame(RecordingStudioTycoon.DataModels.Project project)
        {
            Debug.Log($"Running Rhythm Timing Minigame for project {project.Name}...");
            // Simulate some "gameplay" time
            // In a real scenario, this would involve UI, input, and a timer.
            // For now, we'll just simulate an immediate outcome.

            bool success = UnityEngine.Random.Range(0, 100) < 70; // 70% chance of success
            int score = success ? UnityEngine.Random.Range(50, 100) : UnityEngine.Random.Range(0, 49); // Example score

            // End the minigame after a simulated duration or immediately for this basic version
            // For a real minigame, this would be called when the minigame's internal logic determines it's over.
            EndMinigame(success, project, score);
        }

        /// <summary>
        /// Gets the currently active minigame data.
        /// </summary>
        /// <returns>The MinigameData of the active minigame, or null if none is active.</returns>
        public MinigameData GetCurrentMinigame()
        {
            return _currentMinigame;
        }
    }
}
