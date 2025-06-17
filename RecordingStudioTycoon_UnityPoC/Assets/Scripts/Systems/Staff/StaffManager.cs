using UnityEngine;
using System.Collections.Generic;

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

    public void HireStaff(StaffType type)
    {
        var newStaff = new StaffMember {
            staffType = type,
            name = staffData.GetRandomName(),
            skills = staffData.GetSkillsForType(type),
            salary = staffData.GetBaseSalary(type),
            hireDate = gameState.CurrentState.gameDate,
            mood = 100,
            energy = 100
        };
        
        currentStaff.Add(newStaff);
        gameState.UpdateGameState(state => {
            state.finances.balance -= newStaff.salary;
            return state;
        });
        
        Debug.Log($"Hired new {type}: {newStaff.name}");
    }

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
            // Replenish some energy each day
            staff.energy = Mathf.Min(100, staff.energy + 20);
            
            // Pay salaries
            gameState.UpdateGameState(state => {
                state.finances.balance -= staff.salary;
                return state;
            });
        }
    }
}
