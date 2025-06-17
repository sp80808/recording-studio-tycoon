using UnityEngine;
using System.Collections.Generic;
using System.Linq;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.GameLogic;
using RecordingStudioTycoon.Utils; // For SerializableDictionary
using RecordingStudioTycoon.Core; // For RewardType, RewardManager

namespace RecordingStudioTycoon.Systems.Project
{
    public class ProjectManager : MonoBehaviour
    {
        public static ProjectManager Instance { get; private set; }

        [SerializeField] private ProjectData projectData; // Reference to ScriptableObject for project templates

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

        public RecordingStudioTycoon.DataModels.Project CreateNewProject(string templateId)
        {
            if (projectData == null || projectData.ProjectTemplates == null || projectData.ProjectTemplates.Length == 0)
            {
                Debug.LogError("ProjectData ScriptableObject is not assigned or contains no templates.");
                return null;
            }

            ProjectTemplate template = System.Array.Find(projectData.ProjectTemplates, t => t.Id == templateId);
            if (template == null)
            {
                Debug.LogError($"Project template with ID '{templateId}' not found.");
                return null;
            }

            RecordingStudioTycoon.DataModels.Project newProject = new RecordingStudioTycoon.DataModels.Project
            {
                Id = System.Guid.NewGuid().ToString(),
                Name = template.Name,
                Genre = template.Genre,
                Status = "Concept",
                Quality = 0,
                Progress = 0,
                MaxProgress = template.MaxProgress,
                RewardMoney = template.BaseRewardMoney,
                RewardXP = template.BaseRewardXP,
                RequiredSkills = new List<string>(template.RequiredSkills),
                Difficulty = template.Difficulty,
                CurrentStage = RecordingStudioTycoon.DataModels.ProjectStage.PreProduction.ToString(), // Set initial stage
                CurrentDayProgress = 0,
                TotalDaysToComplete = template.TotalDaysToComplete,
                IsActive = false,
                AssignedBandId = null,
                GeneratedSongIds = new List<string>(),
                ClientName = template.ClientName,
                ClientSatisfaction = 50, // Default satisfaction
                Budget = template.Budget,
                Milestones = new List<string>(template.Milestones),
                ContractId = System.Guid.NewGuid().ToString()
            };

            if (GameManager.Instance != null)
            {
                GameManager.Instance.CurrentGameState.availableProjects.Add(newProject);
                Debug.Log($"Created new project: {newProject.Name}");
            }
            else
            {
                Debug.LogError("GameManager instance not found. Cannot add new project to GameState.");
            }
            return newProject;
        }

        public void ProcessActiveProjects()
        {
            if (GameManager.Instance == null)
            {
                Debug.LogError("GameManager not found. Cannot process active projects.");
                return;
            }

            // Create a copy to avoid modification during iteration
            List<RecordingStudioTycoon.DataModels.Project> activeProjects = new List<RecordingStudioTycoon.DataModels.Project>(
                GameManager.Instance.CurrentGameState.availableProjects.Where(p => p.IsActive).ToList()
            );

            foreach (RecordingStudioTycoon.DataModels.Project project in activeProjects)
            {
                // Determine work amount based on assigned staff, player attributes, etc.
                // For now, a simple placeholder. This will be refined.
                float workAmount = CalculateDailyWorkAmount(project);
                AdvanceProject(project, workAmount);
            }
            Debug.Log($"Processed {activeProjects.Count} active projects.");
        }

        private float CalculateDailyWorkAmount(RecordingStudioTycoon.DataModels.Project project)
        {
            float baseWork = 10f; // Base work per day
            float staffEfficiencyBonus = 0f;

            foreach (string staffId in project.AssignedStaffIds)
            {
                StaffMember staff = GameManager.Instance.CurrentGameState.hiredStaff.FirstOrDefault(s => s.Id == staffId);
                if (staff != null)
                {
                    // Example: Staff efficiency and energy contribute to work amount
                    staffEfficiencyBonus += (staff.Efficiency / 100f) * (staff.Energy / 100f) * 5f; // Example calculation
                }
            }
            return baseWork + staffEfficiencyBonus;
        }

        public void StartProject(string projectId)
        {
            if (GameManager.Instance == null)
            {
                Debug.LogError("GameManager not found. Cannot start project.");
                return;
            }

            RecordingStudioTycoon.DataModels.Project projectToStart = GameManager.Instance.CurrentGameState.availableProjects.FirstOrDefault(p => p.Id == projectId);
            if (projectToStart == null)
            {
                Debug.LogError($"Project with ID '{projectId}' not found in available projects.");
                return;
            }

            if (GameManager.Instance.CurrentGameState.activeProject != null)
            {
                Debug.LogWarning($"Another project '{GameManager.Instance.CurrentGameState.activeProject.Name}' is already active. Cannot start '{projectToStart.Name}'.");
                return;
            }

            GameManager.Instance.CurrentGameState.activeProject = projectToStart;
            projectToStart.IsActive = true;
            projectToStart.Status = "Active";
            Debug.Log($"Started project: {projectToStart.Name}");
            // UIManager.Instance.ShowActiveProjectUI(projectToStart); // Assuming UIManager has this method
        }

        public void AdvanceProject(RecordingStudioTycoon.DataModels.Project project, float workAmount)
        {
            if (project == null || !project.IsActive)
            {
                Debug.LogWarning("Cannot advance project: Project is null or not active.");
                return;
            }

            // Calculate quality contribution from assigned staff and equipment
            float qualityContribution = GetQualityContribution(project);

            project.Progress += (int)workAmount;
            project.Quality += (int)qualityContribution;
            project.CurrentDayProgress += (int)workAmount; // Track daily progress for stage transitions

            Debug.Log($"Advanced project {project.Name}. Progress: {project.Progress}/{project.MaxProgress}, Quality: {project.Quality}");

            // Check for stage transitions
            CheckProjectStageTransition(project);

            if (project.Progress >= project.MaxProgress)
            {
                CompleteProject(project);
            }
        }

        private void CheckProjectStageTransition(RecordingStudioTycoon.DataModels.Project project)
        {
            RecordingStudioTycoon.DataModels.ProjectStage currentStageEnum;
            if (System.Enum.TryParse(project.CurrentStage, out currentStageEnum))
            {
                RecordingStudioTycoon.DataModels.ProjectStage nextStage = currentStageEnum;

                switch (currentStageEnum)
                {
                    case RecordingStudioTycoon.DataModels.ProjectStage.PreProduction:
                        if (project.CurrentDayProgress >= 50) // Example condition for stage transition
                        {
                            nextStage = RecordingStudioTycoon.DataModels.ProjectStage.Recording;
                        }
                        break;
                    case RecordingStudioTycoon.DataModels.ProjectStage.Recording:
                        if (project.CurrentDayProgress >= 100)
                        {
                            nextStage = RecordingStudioTycoon.DataModels.ProjectStage.Mixing;
                        }
                        break;
                    case RecordingStudioTycoon.DataModels.ProjectStage.Mixing:
                        if (project.CurrentDayProgress >= 150)
                        {
                            nextStage = RecordingStudioTycoon.DataModels.ProjectStage.Mastering;
                        }
                        break;
                    case RecordingStudioTycoon.DataModels.ProjectStage.Mastering:
                        if (project.CurrentDayProgress >= 200)
                        {
                            nextStage = RecordingStudioTycoon.DataModels.ProjectStage.Release;
                        }
                        break;
                    case RecordingStudioTycoon.DataModels.ProjectStage.Release:
                        // Release is typically the final stage before completion
                        break;
                }

                if (nextStage != currentStageEnum)
                {
                    project.CurrentStage = nextStage.ToString();
                    project.CurrentDayProgress = 0; // Reset daily progress for new stage
                    Debug.Log($"Project {project.Name} transitioned to stage: {project.CurrentStage}");
                    // TODO: Trigger UI update for stage change
                }
            }
        }

        private float GetQualityContribution(RecordingStudioTycoon.DataModels.Project project)
        {
            float totalContribution = 0f;
            if (GameManager.Instance == null) return totalContribution;

            // Staff contribution
            foreach (string staffId in project.AssignedStaffIds)
            {
                StaffMember staff = GameManager.Instance.CurrentGameState.hiredStaff.FirstOrDefault(s => s.Id == staffId);
                if (staff != null)
                {
                    // Example: Staff skill and morale/energy influence quality
                    float skillBonus = 0;
                    // Assuming project.CurrentStage maps to a skill type
                    if (System.Enum.TryParse(project.CurrentStage, true, out StudioSkillType requiredSkillType))
                    {
                        skillBonus = staff.Skills.GetValueOrDefault(requiredSkillType, 0);
                    }
                    
                    float moodFactor = staff.Morale / 100f;
                    float energyFactor = staff.Stamina / 100f;
                    totalContribution += (skillBonus * 0.1f) * moodFactor * energyFactor; // Example calculation
                }
            }

            // Equipment contribution (placeholder)
            // This would involve iterating through ownedEquipment and checking if it's assigned/relevant to the project
            // totalContribution += GameManager.Instance.CurrentGameState.equipmentMultiplier;

            return totalContribution;
        }

        public void CompleteProject(RecordingStudioTycoon.DataModels.Project project)
        {
            if (project == null)
            {
                Debug.LogError("Cannot complete project: Project is null.");
                return;
            }

            project.IsActive = false;
            project.Status = "Completed";
            GameManager.Instance.CurrentGameState.activeProject = null;
            GameManager.Instance.CurrentGameState.availableProjects.Remove(project);
            GameManager.Instance.CurrentGameState.completedProjects.Add(project);

            Debug.Log($"Project {project.Name} completed! Final Quality: {project.Quality}");

            // Calculate final outcome and grant rewards
            CalculateFinalProjectOutcome(project);

            // Unassign staff from this project
            foreach (string staffId in project.AssignedStaffIds)
            {
                StaffMember staff = GameManager.Instance.CurrentGameState.hiredStaff.FirstOrDefault(s => s.Id == staffId);
                if (staff != null)
                {
                    staff.AssignedProjectId = null;
                    staff.IsAvailable = true;
                }
            }
            project.AssignedStaffIds.Clear(); // Clear assigned staff IDs from the project
        }

        private void CalculateFinalProjectOutcome(RecordingStudioTycoon.DataModels.Project project)
        {
            if (GameManager.Instance == null || RewardManager.Instance == null) return;

            // Example: Rewards based on quality
            int finalMoneyReward = project.RewardMoney;
            int finalXPReward = project.RewardXP;

            if (project.Quality >= 80)
            {
                finalMoneyReward = (int)(finalMoneyReward * 1.5f);
                finalXPReward = (int)(finalXPReward * 1.5f);
                Debug.Log("Excellent project quality! Bonus rewards granted.");
            }
            else if (project.Quality < 50)
            {
                finalMoneyReward = (int)(finalMoneyReward * 0.5f);
                finalXPReward = (int)(finalXPReward * 0.5f);
                Debug.Log("Poor project quality. Reduced rewards.");
            }

            RewardManager.Instance.GrantReward(RewardType.Money, finalMoneyReward);
            RewardManager.Instance.GrantReward(RewardType.XP, finalXPReward);

            // TODO: Update market trends, band reputation, client satisfaction based on project outcome
            // MarketManager.Instance.UpdateMarketTrends(project.Genre, project.Quality);
            // BandAndSongManager.Instance.UpdateBandReputation(project.AssignedBandId, project.Quality);
        }

        public void CancelProject(string projectId)
        {
            if (GameManager.Instance == null)
            {
                Debug.LogError("GameManager not found. Cannot cancel project.");
                return;
            }

            RecordingStudioTycoon.DataModels.Project projectToCancel = GameManager.Instance.CurrentGameState.availableProjects.FirstOrDefault(p => p.Id == projectId);
            if (projectToCancel == null)
            {
                Debug.LogError($"Project with ID '{projectId}' not found in available projects.");
                return;
            }

            GameManager.Instance.CurrentGameState.availableProjects.Remove(projectToCancel);
            if (GameManager.Instance.CurrentGameState.activeProject == projectToCancel)
            {
                GameManager.Instance.CurrentGameState.activeProject = null;
            }

            // Unassign staff from this project
            foreach (string staffId in projectToCancel.AssignedStaffIds)
            {
                StaffMember staff = GameManager.Instance.CurrentGameState.hiredStaff.FirstOrDefault(s => s.Id == staffId);
                if (staff != null)
                {
                    staff.AssignedProjectId = null;
                    staff.IsAvailable = true;
                }
            }
            projectToCancel.AssignedStaffIds.Clear(); // Clear assigned staff IDs from the project

            Debug.Log($"Project {projectToCancel.Name} cancelled.");
        }
    }
}