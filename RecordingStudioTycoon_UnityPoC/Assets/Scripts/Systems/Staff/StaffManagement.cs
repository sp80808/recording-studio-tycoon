using UnityEngine;
using System.Collections.Generic;
using System.Linq;
using RecordingStudioTycoon.Core; // For GameState access
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.GameLogic;
using RecordingStudioTycoon.Utils; // For SerializableDictionary

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
                Systems.Finance.FinanceManager.Instance.DeductMoney(newStaff.Salary); // Deduct hiring cost
                Debug.Log($"Hired staff: {newStaff.Name} ({newStaff.Role}). Cost: {newStaff.Salary}");
            }
            else
            {
                Debug.LogError("GameManager instance not found. Cannot hire staff.");
            }
        }

        public void AssignStaffToProject(StaffMember staff, RecordingStudioTycoon.DataModels.Project project)
        {
            if (staff == null || project == null)
            {
                Debug.LogError("Cannot assign staff: Staff or Project is null.");
                return;
            }

            // Unassign from previous project if any
            if (!string.IsNullOrEmpty(staff.AssignedProjectId))
            {
                RecordingStudioTycoon.DataModels.Project oldProject = GameManager.Instance.CurrentGameState.availableProjects.FirstOrDefault(p => p.Id == staff.AssignedProjectId);
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

        public void UnassignStaffFromProject(StaffMember staff, RecordingStudioTycoon.DataModels.Project project)
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

        /// <summary>
        /// Applies a global efficiency bonus to all hired staff.
        /// This could affect their work speed, quality contribution, or energy drain.
        /// </summary>
        /// <param name="bonusAmount">The percentage bonus to apply (e.g., 0.1 for 10%).</param>
        public void ApplyGlobalEfficiencyBonus(float bonusAmount)
        {
            if (GameManager.Instance == null || GameManager.Instance.GameState == null) return;

            // This method is called by perks. We should aggregate this bonus into GameState's global modifiers.
            // For now, we'll just log it as the actual application will happen via GetStaffEfficiencyMultiplier.
            Debug.Log($"Applied {bonusAmount * 100}% efficiency bonus globally. This will be factored into staff work calculations.");
            // The actual effect is applied via GetStaffEfficiencyMultiplier, which reads from GameState.AggregatedPerkModifiers
            // No direct modification to staff members here, as it's a global modifier.
            GameManager.Instance.OnGameDataChanged?.Invoke();
        }

        /// <summary>
        /// Calculates the total efficiency multiplier for a staff member, considering global bonuses,
        /// studio specialization, and industry prestige.
        /// </summary>
        /// <param name="staff">The staff member.</param>
        /// <returns>The total efficiency multiplier.</returns>
        public float GetStaffEfficiencyMultiplier(StaffMember staff)
        {
            if (GameManager.Instance == null || GameManager.Instance.GameState == null || staff == null) return 1.0f;

            float multiplier = 1.0f;

            // 1. Apply global perk modifiers (e.g., from "staffEfficiencyBonus" perk)
            multiplier *= GameManager.Instance.GameState.aggregatedPerkModifiers.staffEfficiencyModifier;

            // 2. Apply general industry prestige bonus
            if (GameManager.Instance.GameState.industryPrestige.TryGetValue("general", out DataModels.Progression.IndustryPrestige generalPrestige))
            {
                multiplier *= generalPrestige.BonusMultiplier;
            }

            // 3. Apply studio specialization bonus if staff's primary skill aligns with a specialized genre
            // This is a simplified example. You might need a more sophisticated mapping of staff skills to genres.
            // For now, let's assume a staff's highest skill could relate to a genre.
            // Or, if a project is assigned, use the project's genre.
            if (!string.IsNullOrEmpty(staff.AssignedProjectId))
            {
                RecordingStudioTycoon.DataModels.Project assignedProject = GameManager.Instance.CurrentGameState.availableProjects.FirstOrDefault(p => p.Id == staff.AssignedProjectId);
                if (assignedProject != null)
                {
                    if (GameManager.Instance.GameState.studioSpecializations.TryGetValue(assignedProject.Genre, out DataModels.Progression.StudioSpecialization specialization))
                    {
                        multiplier *= specialization.BonusMultiplier;
                    }
                }
            }
            // You could also consider staff's highest skill and see if it aligns with a specialized genre
            // For example:
            // StudioSkillType primarySkill = staff.Skills.OrderByDescending(kvp => kvp.Value).FirstOrDefault().Key;
            // MusicGenre genreForSkill = MapSkillToGenre(primarySkill); // You'd need a mapping function
            // if (GameManager.Instance.GameState.studioSpecializations.TryGetValue(genreForSkill, out DataModels.Progression.StudioSpecialization specializationBySkill))
            // {
            //     multiplier *= specializationBySkill.BonusMultiplier;
            // }

            return multiplier;
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
            
            Systems.Finance.FinanceManager.Instance.DeductMoney(training.Cost); // Deduct training cost
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

        /// <summary>
        /// Adds XP to a specific staff member's relevant skill.
        /// </summary>
        /// <param name="staffId">The ID of the staff member.</param>
        /// <param name="skillType">The type of skill to add XP to.</param>
        /// <param name="amount">The amount of XP to add.</param>
        public void AddStaffXP(string staffId, StudioSkillType skillType, int amount)
        {
            StaffMember staff = GameManager.Instance.CurrentGameState.hiredStaff.FirstOrDefault(s => s.Id == staffId);
            if (staff == null)
            {
                Debug.LogWarning($"Staff member with ID '{staffId}' not found. Cannot add XP.");
                return;
            }

            if (staff.Skills.ContainsKey(skillType))
            {
                float finalXpAmount = amount;

                // Apply specialization bonus to XP gain if the skill's genre is specialized
                MusicGenre genreForSkill = ProjectSystem.ProjectManager.Instance.GetGenreForSkill(skillType); // Use ProjectManager's mapping
                if (GameManager.Instance.GameState.studioSpecializations.TryGetValue(genreForSkill, out DataModels.Progression.StudioSpecialization specialization))
                {
                    finalXpAmount *= specialization.BonusMultiplier;
                    Debug.Log($"Applying {specialization.Genre} specialization bonus to XP gain. Original: {amount}, Final: {finalXpAmount}");
                }

                staff.Skills[skillType] += (int)finalXpAmount;
                Debug.Log($"Added {(int)finalXpAmount} XP to {staff.Name}'s {skillType} skill. New XP: {staff.Skills[skillType]}");
                // TODO: Implement skill level up logic for staff if needed
            }
            else
            {
                Debug.LogWarning($"Staff member {staff.Name} does not have skill type {skillType}. Cannot add XP.");
            }
            GameManager.Instance.OnGameDataChanged?.Invoke(); // Notify UI of state changes
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
