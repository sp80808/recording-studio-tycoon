using UnityEngine;
using System.Collections.Generic;
using System.Linq;
using RecordingStudioTycoon.Core; // For GameState access
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.GameLogic;
using Project = RecordingStudioTycoon.DataModels.Project;

namespace RecordingStudioTycoon.Systems.Staff
{
    public class StaffManagement : MonoBehaviour
    {
        public static StaffManagement Instance { get; private set; }

        [SerializeField] private StaffData staffData; // Reference to ScriptableObject for staff templates

        // private List<StaffMember> staffMembers; // Consider if this list is needed here or managed by GameState
        // private StaffMember selectedStaff; // Keep if UI selection logic will use this

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

        public void HireStaff(StaffMember newStaff)
        {
            // Assuming GameManager exists and holds the GameState
            // This will be integrated properly once GameManager is available.
            if (GameManager.Instance != null)
            {
                GameManager.Instance.CurrentGameState.hiredStaff.Add(newStaff);
                GameManager.Instance.CurrentGameState.availableCandidates.RemoveAll(s => s.Id == newStaff.Id);
                // Placeholder for deducting money - GameManager will handle this
                // GameManager.Instance.AddMoney(-newStaff.Salary); 
                Debug.Log($"Hired staff: {newStaff.Name} ({newStaff.Role})");
            }
            else
            {
                Debug.LogError("GameManager instance not found. Cannot hire staff.");
            }
        }

        public void AssignStaffToProject(StaffMember staff, Project project)
        {
            if (staff == null || project == null)
            {
                Debug.LogError("Cannot assign staff: Staff or Project is null.");
                return;
            }

            // Unassign from previous project if any
            if (!string.IsNullOrEmpty(staff.AssignedProjectId))
            {
                Project oldProject = GameManager.Instance.CurrentGameState.availableProjects.FirstOrDefault(p => p.Id == staff.AssignedProjectId);
                if (oldProject != null)
                {
                    oldProject.AssignedStaffIds.Remove(staff.Id);
                }
            }

            staff.AssignedProjectId = project.Id;
            if (project.AssignedStaffIds == null)
            {
                project.AssignedStaffIds = new List<string>();
            }
            project.AssignedStaffIds.Add(staff.Id);
            Debug.Log($"Assigned {staff.Name} to project: {project.Name}");
        }

        public void UnassignStaffFromProject(StaffMember staff, Project project)
        {
            if (staff == null || project == null)
            {
                Debug.LogError("Cannot unassign staff: Staff or Project is null.");
                return;
            }

            if (staff.AssignedProjectId == project.Id)
            {
                staff.AssignedProjectId = null;
                project.AssignedStaffIds.Remove(staff.Id);
                Debug.Log($"Unassigned {staff.Name} from project: {project.Name}");
            }
            else
            {
                Debug.LogWarning($"{staff.Name} is not assigned to project {project.Name}.");
            }
        }

        public void AdjustStaffMood(StaffMember staff, int amount)
        {
            if (staff == null) return;
            staff.Mood = Mathf.Clamp(staff.Mood + amount, 0, 100);
            Debug.Log($"{staff.Name}'s mood adjusted by {amount}. New mood: {staff.Mood}");
            // TODO: Trigger UI update for staff mood
        }

        public void AdjustStaffEnergy(StaffMember staff, int amount)
        {
            if (staff == null) return;
            staff.Energy = Mathf.Clamp(staff.Energy + amount, 0, 100);
            Debug.Log($"{staff.Name}'s energy adjusted by {amount}. New energy: {staff.Energy}");
            // TODO: Trigger UI update for staff energy
        }

        public void DailyStaffUpdate()
        {
            if (GameManager.Instance == null) return;

            foreach (StaffMember staff in GameManager.Instance.CurrentGameState.hiredStaff)
            {
                // Decrease energy and mood daily
                AdjustStaffEnergy(staff, -5); // Example: Lose 5 energy per day
                AdjustStaffMood(staff, -2); // Example: Lose 2 mood per day

                // If staff is assigned to a project, they might lose more energy/mood
                if (!string.IsNullOrEmpty(staff.AssignedProjectId))
                {
                    AdjustStaffEnergy(staff, -5);
                    AdjustStaffMood(staff, -3);
                }

                // TODO: Implement events or conditions for mood/energy recovery (e.g., rest, perks)
            }
            Debug.Log("Daily staff update completed.");
        }

        public void TrainStaff(StaffMember staff, Training training)
        {
            if (staff == null || training == null)
            {
                Debug.LogError("Cannot train staff: Staff or Training is null.");
                return;
            }

            if (GameManager.Instance == null)
            {
                Debug.LogError("GameManager instance not found. Cannot train staff.");
                return;
            }

            // Deduct training cost (placeholder, GameManager should handle money)
            // GameManager.Instance.AddMoney(-training.Cost);
            Debug.Log($"Training {staff.Name} in {training.Name}. Cost: {training.Cost}. Duration: {training.DurationDays} days.");

            // For simplicity, apply skill increase immediately. In a real game, this would be over time.
            foreach (var skillChange in training.SkillIncreases)
            {
                if (staff.Skills.ContainsKey(skillChange.Key))
                {
                    staff.Skills[skillChange.Key] += skillChange.Value;
                    Debug.Log($"{staff.Name}'s {skillChange.Key} skill increased by {skillChange.Value}. New level: {staff.Skills[skillChange.Key]}");
                }
                else
                {
                    staff.Skills.Add(skillChange.Key, skillChange.Value);
                    Debug.Log($"{staff.Name} gained new skill {skillChange.Key} with level {skillChange.Value}.");
                }
            }

            // Update GameState to reflect changes
            GameManager.Instance.CurrentGameState.hiredStaff.First(s => s.Id == staff.Id).Skills = staff.Skills;
            // TODO: Trigger UI update for staff skills
            // UIManager.Instance.UpdateStaffUI(staff);
        }

        public StaffMember GenerateNewStaffCandidate()
        {
            if (staffData == null || staffData.StaffMemberTemplates == null || staffData.StaffMemberTemplates.Count == 0)
            {
                Debug.LogError("StaffData ScriptableObject is not assigned or contains no templates.");
                return null;
            }

            // For simplicity, pick a random template
            StaffMemberTemplate template = staffData.StaffMemberTemplates[UnityEngine.Random.Range(0, staffData.StaffMemberTemplates.Count)];

            StaffMember newCandidate = new StaffMember
            {
                Id = System.Guid.NewGuid().ToString(),
                Name = template.Name,
                Role = template.Role,
                Level = 1,
                Experience = 0,
                Salary = template.BaseSalary,
                Skills = new SerializableDictionary<StudioSkillType, int>(template.BaseSkills),
                AssignedProjectId = null,
                Mood = template.BaseMood,
                Energy = template.BaseEnergy
            };
            Debug.Log($"Generated new staff candidate: {newCandidate.Name} ({newCandidate.Role})");
            return newCandidate;
        }
    }
}
