using UnityEngine;
using System.Collections.Generic;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.Utils;
using RecordingStudioTycoon.GameLogic;

namespace RecordingStudioTycoon.Systems.Staff
{
    public class StaffManager : MonoBehaviour
    {
        public static StaffManager Instance { get; private set; }

        [SerializeField] private StaffData staffData;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void DailyStaffUpdate(int currentDay)
        {
            if (GameManager.Instance == null) return;

            var gameState = GameManager.Instance.CurrentGameState;

            // Update staff morale, productivity, etc.
            foreach (var staffMember in gameState.staff)
            {
                UpdateStaffMember(staffMember, currentDay);
            }

            Debug.Log("Daily staff update completed");
        }

        private void UpdateStaffMember(StaffMember staffMember, int currentDay)
        {
            // Update morale based on working conditions
            if (staffMember.morale > 0)
            {
                staffMember.morale -= Random.Range(0, 3); // Random morale decay
            }

            // Update productivity based on morale
            if (staffMember.morale > 80)
            {
                staffMember.productivity = Mathf.Min(100, staffMember.productivity + 1);
            }
            else if (staffMember.morale < 30)
            {
                staffMember.productivity = Mathf.Max(0, staffMember.productivity - 1);
            }

            // Update skills slightly over time
            foreach (var skill in staffMember.skills.Keys)
            {
                if (Random.Range(0, 100) < 5) // 5% chance to gain skill experience
                {
                    staffMember.skills[skill] = Mathf.Min(100, staffMember.skills[skill] + 1);
                }
            }

            Debug.Log($"Updated staff member: {staffMember.name} (Morale: {staffMember.morale}, Productivity: {staffMember.productivity})");
        }

        public void RefreshAvailableCandidates(GameState gameState)
        {
            gameState.availableCandidates = StaffUtils.GenerateCandidates(3, gameState);
            Debug.Log("Available candidates refreshed");
        }

        public bool HireStaff(StaffMember candidate)
        {
            if (GameManager.Instance == null) return false;

            var gameState = GameManager.Instance.CurrentGameState;

            // Check if we can afford the hiring cost
            int hiringCost = candidate.salary * 2; // Example: 2x salary as hiring cost
            if (gameState.money < hiringCost) return false;

            // Hire the staff member
            gameState.money -= hiringCost;
            gameState.staff.Add(candidate);

            // Remove from available candidates
            gameState.availableCandidates.Remove(candidate);

            Debug.Log($"Hired {candidate.name} for ${hiringCost}");
            return true;
        }

        public bool FireStaff(StaffMember staffMember)
        {
            if (GameManager.Instance == null) return false;

            var gameState = GameManager.Instance.CurrentGameState;

            if (gameState.staff.Remove(staffMember))
            {
                // Pay severance (optional)
                int severanceCost = staffMember.salary / 2;
                gameState.money -= severanceCost;

                Debug.Log($"Fired {staffMember.name}. Severance: ${severanceCost}");
                return true;
            }

            return false;
        }

        public void AssignStaffToProject(StaffMember staffMember, Project project)
        {
            if (staffMember.assignedProjectId != null)
            {
                Debug.LogWarning($"{staffMember.name} is already assigned to a project");
                return;
            }

            staffMember.assignedProjectId = project.id;
            Debug.Log($"Assigned {staffMember.name} to project {project.name}");
        }

        public void UnassignStaffFromProject(StaffMember staffMember)
        {
            if (staffMember.assignedProjectId == null) return;

            string previousProject = staffMember.assignedProjectId;
            staffMember.assignedProjectId = null;
            Debug.Log($"Unassigned {staffMember.name} from project {previousProject}");
        }

        public List<StaffMember> GetAvailableStaff()
        {
            if (GameManager.Instance == null) return new List<StaffMember>();

            var gameState = GameManager.Instance.CurrentGameState;
            var availableStaff = new List<StaffMember>();

            foreach (var staffMember in gameState.staff)
            {
                if (staffMember.assignedProjectId == null)
                {
                    availableStaff.Add(staffMember);
                }
            }

            return availableStaff;
        }

        public void PromoteStaff(StaffMember staffMember)
        {
            // Increase salary and skills
            staffMember.salary = Mathf.RoundToInt(staffMember.salary * 1.2f);
            
            // Increase all skills slightly
            var skillKeys = new List<StaffSkill>(staffMember.skills.Keys);
            foreach (var skill in skillKeys)
            {
                staffMember.skills[skill] = Mathf.Min(100, staffMember.skills[skill] + 5);
            }

            // Boost morale
            staffMember.morale = Mathf.Min(100, staffMember.morale + 20);

            Debug.Log($"Promoted {staffMember.name}. New salary: ${staffMember.salary}");
        }

        public void TrainStaff(StaffMember staffMember, StaffSkill skill, int amount)
        {
            if (staffMember.skills.ContainsKey(skill))
            {
                staffMember.skills[skill] = Mathf.Min(100, staffMember.skills[skill] + amount);
                Debug.Log($"Trained {staffMember.name} in {skill}. New level: {staffMember.skills[skill]}");
            }
        }
    }
}
