using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels.Staff;
using RecordingStudioTycoon.DataModels.Projects;
using RecordingStudioTycoon.DataModels.Skills;
using RecordingStudioTycoon.ScriptableObjects;

public class StaffManager : MonoBehaviour
{
    [SerializeField] private GameStateSO gameState;
    [SerializeField] private StaffDataSO staffData;
    
    private List<StaffMember> currentStaff = new List<StaffMember>();
    
    public IReadOnlyList<StaffMember> CurrentStaff => currentStaff.AsReadOnly();

    void Start()
    {
        LoadInitialStaff();
    }

    private void LoadInitialStaff()
    {
        currentStaff.Clear();
        
        // Create starting staff based on game state
        foreach (var staffType in staffData.StartingStaff)
        {
            HireStaff(staffType);
        }
    }

    public int GetHireCost(StaffType type) 
    {
        return staffData.GetBaseSalary(type) * 3; // 3 months salary as hiring cost
    }

    public void HireStaff(StaffType type)
    {
        var cost = GetHireCost(type);
        var newStaff = new StaffMember {
            staffType = type,
            name = staffData.GetRandomName(),
            skills = staffData.GetSkillsForType(type),
            salary = staffData.GetBaseSalary(type),
            hireDate = gameState.CurrentState.gameDate,
            mood = 100,
            energy = 100,
            assignedProject = null
        };
        
        currentStaff.Add(newStaff);
        gameState.UpdateGameState(state => {
            state.finances.balance -= cost;
            return state;
        });
        
        OnStaffChanged?.Invoke();
        Debug.Log($"Hired new {type}: {newStaff.name} (Cost: ${cost})");
    }

    public void AssignToProject(StaffMember staff, Project project)
    {
        if (currentStaff.Contains(staff)) 
        {
            staff.assignedProject = project;
            staff.energy = Mathf.Max(50, staff.energy - 20); // Assignment consumes energy
            OnStaffChanged?.Invoke();
        }
    }
    
    public delegate void StaffChangedHandler();
    public event StaffChangedHandler OnStaffChanged;

    public void FireStaff(StaffMember staff)
    {
        if (currentStaff.Contains(staff))
        {
            currentStaff.Remove(staff);
            Debug.Log($"Fired {staff.name} ({staff.staffType})");
        }
    }

    public void TrainStaff(StaffMember staff, SkillType skill)
    {
        if (!currentStaff.Contains(staff)) return;
        
        var cost = staffData.GetTrainingCost(skill);
        if (gameState.CurrentState.finances.balance >= cost)
        {
            staff.skills[skill] += staffData.GetTrainingAmount(skill);
            gameState.UpdateGameState(state => {
                state.finances.balance -= cost;
                return state;
            });
            
            Debug.Log($"{staff.name} trained in {skill} (Cost: {cost})");
        }
    }

    public void DailyStaffUpdate()
    {
        foreach (var staff in currentStaff)
        {
            // Replenish energy (less if overworked)
            float recoveryRate = staff.Stamina < 30 ? 0.5f : 1f;
            staff.Stamina = Mathf.Min(100, staff.Stamina + Mathf.RoundToInt(20 * recoveryRate));
            
            // Morale effects
            if (staff.AssignedProject == null)
            {
                staff.Morale = Mathf.Max(50, staff.Morale - 5); // Boredom penalty
            }
            else if (staff.Stamina < 30)
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
                    (staff.Morale * 0.6f) + (staff.Stamina * 0.4f),
                    30, 150
                )
            );

            // Pay salaries
            gameState.UpdateGameState(state => {
                state.finances.balance -= staff.Salary;
                return state;
            });

            // Visual feedback
            UpdateStaffVisualState(staff);
        }
    }

    private void UpdateStaffVisualState(StaffMember staff)
    {
        if (staff.Stamina < 30)
        {
            staff.StatusMessage = "Exhausted";
            staff.StatusColor = Color.red;
            staff.CurrentAnimationState = "Tired";
        }
        else if (staff.Morale < 50)
        {
            staff.StatusMessage = "Unhappy";
            staff.StatusColor = Color.yellow;
            staff.CurrentAnimationState = "Idle";
        }
        else
        {
            staff.StatusMessage = staff.AssignedProject != null ? "Working" : "Available";
            staff.StatusColor = Color.green;
            staff.CurrentAnimationState = staff.AssignedProject != null ? "Working" : "Idle";
        }
    }
}
