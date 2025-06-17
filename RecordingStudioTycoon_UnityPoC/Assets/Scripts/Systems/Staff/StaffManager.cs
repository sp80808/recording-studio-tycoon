using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels.Staff;
using RecordingStudioTycoon.DataModels.Projects;
using RecordingStudioTycoon.DataModels.Skills;
using RecordingStudioTycoon.ScriptableObjects;
using RecordingStudioTycoon.GameLogic; // For GameManager and GameState
using RecordingStudioTycoon.Utils; // For StaffUtils

namespace RecordingStudioTycoon.Systems.Staff
{
    public class StaffManager : MonoBehaviour
    {
        public static StaffManager Instance { get; private set; }

        [SerializeField] private GameStateSO gameStateSO; // Reference to the global GameState ScriptableObject
        [SerializeField] private RecordingStudioTycoon.ScriptableObjects.StaffDataSO staffData;
        
        // Events for UI updates
        public event System.Action OnStaffListChanged;
        public event System.Action<StaffMember> OnStaffHired;
        public event System.Action<StaffMember> OnStaffFired;
        public event System.Action<StaffMember, SkillType, int> OnStaffSkillTrained;

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

        void Start()
        {
            // Staff list is managed directly in GameState.hiredStaff
            // No need for a separate currentStaff list in the manager.
            // LoadInitialStaff(); // This should be handled by GameManager or initial save load
        }

        public int GetHireCost(StaffType type)
        {
            return staffData.GetBaseSalary(type) * 3; // 3 months salary as hiring cost
        }

        public void HireStaff(StaffType type)
        {
            if (gameStateSO == null) return;

            var cost = GetHireCost(type);
            if (gameStateSO.GameState.Money < cost)
            {
                Debug.LogWarning($"Not enough money to hire staff of type {type}. Needed: {cost}, Have: {gameStateSO.GameState.Money}");
                // UIManager.Instance.ShowToast("Insufficient Funds", "You don't have enough money to hire this staff member.", "destructive");
                return;
            }

            StaffMember newStaff = StaffUtils.GenerateSingleCandidate(type, gameStateSO.GameState); // Use StaffUtils to generate a new staff member
            
            gameStateSO.GameState.Money -= cost;
            gameStateSO.GameState.HiredStaff.Add(newStaff);
            
            OnStaffHired?.Invoke(newStaff);
            OnStaffListChanged?.Invoke();
            Debug.Log($"Hired new {type}: {newStaff.Name} (Cost: ${cost})");
        }

        public void AssignToProject(StaffMember staff, RecordingStudioTycoon.DataModels.Projects.Project project)
        {
            if (gameStateSO == null || !gameStateSO.GameState.HiredStaff.Contains(staff)) return;

            staff.AssignedProjectId = project.Id; // Assign project ID
            staff.IsAvailable = false; // Mark as unavailable
            staff.Energy = Mathf.Max(50, staff.Energy - 20); // Assignment consumes energy
            OnStaffListChanged?.Invoke();
            Debug.Log($"Assigned {staff.Name} to project {project.Title}");
        }
        
        public void UnassignFromProject(StaffMember staff)
        {
            if (gameStateSO == null || !gameStateSO.GameState.HiredStaff.Contains(staff)) return;

            staff.AssignedProjectId = null;
            staff.IsAvailable = true;
            OnStaffListChanged?.Invoke();
            Debug.Log($"Unassigned {staff.Name} from project.");
        }

        public void FireStaff(StaffMember staff)
        {
            if (gameStateSO == null || !gameStateSO.GameState.HiredStaff.Contains(staff)) return;

            gameStateSO.GameState.HiredStaff.Remove(staff);
            OnStaffFired?.Invoke(staff);
            OnStaffListChanged?.Invoke();
            Debug.Log($"Fired {staff.Name} ({staff.StaffType})");
        }

        public void TrainStaff(StaffMember staff, SkillType skill)
        {
            if (gameStateSO == null || !gameStateSO.GameState.HiredStaff.Contains(staff)) return;
            
            var cost = staffData.GetTrainingCost(skill);
            if (gameStateSO.GameState.Money >= cost)
            {
                gameStateSO.GameState.Money -= cost;
                staff.Skills[skill] += staffData.GetTrainingAmount(skill);
                
                OnStaffSkillTrained?.Invoke(staff, skill, staffData.GetTrainingAmount(skill));
                OnStaffListChanged?.Invoke();
                Debug.Log($"{staff.Name} trained in {skill} (Cost: {cost})");
            }
            else
            {
                Debug.LogWarning($"Not enough money to train {staff.Name} in {skill}. Needed: {cost}, Have: {gameStateSO.GameState.Money}");
                // UIManager.Instance.ShowToast("Insufficient Funds", "You don't have enough money for this training.", "destructive");
            }
        }

        public void DailyStaffUpdate(int currentDay)
        {
            if (gameStateSO == null) return;

            // Pay salaries on specific days (e.g., every 7 days)
            if (currentDay % 7 == 0) // Example: weekly salary
            {
                foreach (var staff in gameStateSO.GameState.HiredStaff)
                {
                    // Deduct salary from money
                    if (FinanceManager.Instance != null)
                    {
                        FinanceManager.Instance.DeductMoney(staff.Salary, $"Staff Salary: {staff.Name}");
                    }
                    else
                    {
                        Debug.LogWarning("FinanceManager not found. Cannot deduct staff salary.");
                        gameStateSO.GameState.Money -= staff.Salary; // Fallback
                    }
                }
                Debug.Log($"Paid staff salaries for day {currentDay}.");
            }

            foreach (var staff in gameStateSO.GameState.HiredStaff)
            {
                // Replenish energy (less if overworked)
                float recoveryRate = staff.Energy < 30 ? 0.5f : 1f;
                staff.Energy = Mathf.Min(100, staff.Energy + Mathf.RoundToInt(20 * recoveryRate));
                
                // Morale effects
                if (string.IsNullOrEmpty(staff.AssignedProjectId)) // If not assigned to a project
                {
                    staff.Morale = Mathf.Max(50, staff.Morale - 5); // Boredom penalty
                }
                else if (staff.Energy < 30)
                {
                    staff.Morale = Mathf.Max(30, staff.Morale - 10); // Overwork penalty
                }
                else
                {
                    staff.Morale = Mathf.Min(100, staff.Morale + 5); // Happy to be working
                }

                // Calculate efficiency modifier
                staff.Efficiency = Mathf.RoundToInt(
                    Mathf.Clamp(
                        (staff.Morale * 0.6f) + (staff.Energy * 0.4f),
                        30, 150
                    )
                );

                // Apply perk modifiers to staff happiness/efficiency
                if (gameStateSO.GameState.AggregatedPerkModifiers != null)
                {
                    staff.Morale = Mathf.Min(100, staff.Morale + Mathf.RoundToInt(gameStateSO.GameState.AggregatedPerkModifiers.StaffHappinessModifier));
                    // You could also modify efficiency directly based on other perks
                }

                // Visual feedback (if applicable, might be handled by UI components)
                UpdateStaffVisualState(staff);
            }
            OnStaffListChanged?.Invoke();
        }

        public void RefreshAvailableCandidates(GameState gameState)
        {
            gameState.AvailableCandidates = StaffUtils.GenerateCandidates(3, gameState);
            OnStaffListChanged?.Invoke();
            Debug.Log("Refreshed available staff candidates.");
        }

        private void UpdateStaffVisualState(StaffMember staff)
        {
            // This logic might be better handled by a dedicated UI component that observes staff state
            // For now, it updates internal staff properties that UI can read.
            if (staff.Energy < 30)
            {
                staff.StatusMessage = "Exhausted";
                // staff.StatusColor = Color.red; // Color is not directly serializable in DataModel
                staff.CurrentAnimationState = "Tired";
            }
            else if (staff.Morale < 50)
            {
                staff.StatusMessage = "Unhappy";
                // staff.StatusColor = Color.yellow;
                staff.CurrentAnimationState = "Idle";
            }
            else
            {
                staff.StatusMessage = string.IsNullOrEmpty(staff.AssignedProjectId) ? "Available" : "Working";
                // staff.StatusColor = Color.green;
                staff.CurrentAnimationState = string.IsNullOrEmpty(staff.AssignedProjectId) ? "Idle" : "Working";
            }
        }
    }
}
