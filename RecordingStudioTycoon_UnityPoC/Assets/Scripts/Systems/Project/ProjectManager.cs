using UnityEngine;
using System.Collections.Generic;
using System.Linq;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.GameLogic;
using RecordingStudioTycoon.Utils; // For SerializableDictionary
using RecordingStudioTycoon.Core; // For RewardType
using RecordingStudioTycoon.Systems.Reward; // For RewardManager
using RecordingStudioTycoon.Systems.Relationship; // For RelationshipManager
using RecordingStudioTycoon.Systems.Market; // For MarketManager
using RecordingStudioTycoon.Systems.Progression; // For ProgressionManager
using RecordingStudioTycoon.Systems.Finance; // For FinanceManager

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

        public RecordingStudioTycoon.DataModels.Projects.Project CreateNewProject(string templateId)
        {
            if (projectData == null || projectData.ProjectTemplates == null || projectData.ProjectTemplates.Length == 0)
            {
                Debug.LogError("ProjectData ScriptableObject is not assigned or contains no templates.");
                return null;
            }

            ProjectTemplate template = Array.Find(projectData.ProjectTemplates, t => t.Id == templateId);
            if (template == null)
            {
                Debug.LogError($"Project template with ID '{templateId}' not found.");
                return null;
            }

            RecordingStudioTycoon.DataModels.Projects.Project newProject = new RecordingStudioTycoon.DataModels.Projects.Project
            {
                Id = Guid.NewGuid().ToString(),
                Title = template.Name, // Renamed from Name to Title for consistency
                Genre = template.Genre,
                Status = "Concept",
                Quality = 0,
                Progress = 0,
                MaxProgress = template.MaxProgress,
                PayoutBase = template.BaseRewardMoney, // Renamed from RewardMoney to PayoutBase
                XpReward = template.BaseRewardXP, // Renamed from RewardXP to XpReward
                RequiredSkills = new List<string>(template.RequiredSkills),
                Difficulty = template.Difficulty,
                CurrentStage = RecordingStudioTycoon.DataModels.Projects.ProjectStage.PreProduction.ToString(), // Set initial stage
                CurrentDayProgress = 0,
                TotalDaysToComplete = template.TotalDaysToComplete,
                IsActive = false,
                AssignedBandId = null,
                GeneratedSongIds = new List<string>(),
                ClientName = template.ClientName,
                ClientSatisfaction = 50, // Default satisfaction
                Budget = template.Budget,
                Milestones = new List<string>(template.Milestones),
                ContractId = Guid.NewGuid().ToString(),
                ContractProviderId = template.ClientName, // Assuming client name is the provider ID for now
                ContractProviderType = "client", // Default to client
                QualityScore = 0, // Initialize quality score
                EndDate = null, // Initialize nullable fields
                DeadlineDay = null // Initialize nullable fields
            };

            if (GameManager.Instance != null && GameManager.Instance.GameState != null)
            {
                GameManager.Instance.GameState.AvailableProjects.Add(newProject);
                Debug.Log($"Created new project: {newProject.Title}");
            }
            else
            {
                Debug.LogError("GameManager or GameState instance not found. Cannot add new project to GameState.");
            }
            return newProject;
        }

        public void ProcessActiveProjects(int currentDay)
        {
            if (GameManager.Instance == null || GameManager.Instance.GameState == null)
            {
                Debug.LogError("GameManager or GameState not found. Cannot process active projects.");
                return;
            }

            // Create a copy to avoid modification during iteration
            List<RecordingStudioTycoon.DataModels.Projects.Project> activeProjects = new List<RecordingStudioTycoon.DataModels.Projects.Project>(
                GameManager.Instance.GameState.AvailableProjects.Where(p => p.IsActive).ToList()
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
                StaffMember staff = GameManager.Instance.GameState.HiredStaff.FirstOrDefault(s => s.Id == staffId);
                if (staff != null)
                {
                    // Example: Staff efficiency and energy contribute to work amount
                    staffEfficiencyBonus += (staff.Efficiency / 100f) * (staff.Energy / 100f) * 5f; // Example calculation
                }
            }
            return baseWork + staffEfficiencyBonus;
        }

        public void StartProject(string projectId) // This should be handled by a MultiProjectManager or similar
        {
            if (GameManager.Instance == null || GameManager.Instance.GameState == null)
            {
                Debug.LogError("GameManager or GameState not found. Cannot start project.");
                return;
            }

            RecordingStudioTycoon.DataModels.Projects.Project projectToStart = GameManager.Instance.GameState.AvailableProjects.FirstOrDefault(p => p.Id == projectId);
            if (projectToStart == null)
            {
                Debug.LogError($"Project with ID '{projectId}' not found in available projects.");
                return;
            }

            // Check max concurrent projects from ProgressionManager
            if (ProgressionManager.Instance != null)
            {
                int maxConcurrent = ProgressionManager.Instance.GetMaxConcurrentProjects();
                int currentActive = GameManager.Instance.GameState.AvailableProjects.Count(p => p.IsActive);
                if (currentActive >= maxConcurrent)
                {
                    Debug.LogWarning($"Cannot start '{projectToStart.Title}'. Maximum concurrent projects ({maxConcurrent}) reached.");
                    // UIManager.Instance.ShowToast("Max projects reached!", "You need to upgrade your studio to handle more projects.", "destructive");
                    return;
                }
            }
            else
            {
                Debug.LogWarning("ProgressionManager not found. Max concurrent projects check skipped.");
                if (GameManager.Instance.GameState.ActiveProject != null)
                {
                    Debug.LogWarning($"Another project '{GameManager.Instance.GameState.ActiveProject.Title}' is already active. Cannot start '{projectToStart.Title}'.");
                    return;
                }
            }

            GameManager.Instance.GameState.ActiveProject = projectToStart;
            projectToStart.IsActive = true;
            projectToStart.Status = "Active";
            projectToStart.StartDate = GameManager.Instance.GameState.CurrentDay; // Set start date
            Debug.Log($"Started project: {projectToStart.Title}");
            // UIManager.Instance.ShowActiveProjectUI(projectToStart); // Assuming UIManager has this method
        }

        public void AdvanceProject(RecordingStudioTycoon.DataModels.Projects.Project project, float workAmount)
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

            Debug.Log($"Advanced project {project.Title}. Progress: {project.Progress}/{project.MaxProgress}, Quality: {project.Quality}");

            // Check for stage transitions
            CheckProjectStageTransition(project);

            if (project.Progress >= project.MaxProgress)
            {
                CompleteProject(project);
            }
        }

        private void CheckProjectStageTransition(RecordingStudioTycoon.DataModels.Projects.Project project)
        {
            RecordingStudioTycoon.DataModels.Projects.ProjectStage currentStageEnum;
            if (Enum.TryParse(project.CurrentStage, out currentStageEnum))
            {
                RecordingStudioTycoon.DataModels.Projects.ProjectStage nextStage = currentStageEnum;

                switch (currentStageEnum)
                {
                    case RecordingStudioTycoon.DataModels.Projects.ProjectStage.PreProduction:
                        if (project.CurrentDayProgress >= 50) // Example condition for stage transition
                        {
                            nextStage = RecordingStudioTycoon.DataModels.Projects.ProjectStage.Recording;
                        }
                        break;
                    case RecordingStudioTycoon.DataModels.Projects.ProjectStage.Recording:
                        if (project.CurrentDayProgress >= 100)
                        {
                            nextStage = RecordingStudioTycoon.DataModels.Projects.ProjectStage.Mixing;
                        }
                        break;
                    case RecordingStudioTycoon.DataModels.Projects.ProjectStage.Mixing:
                        if (project.CurrentDayProgress >= 150)
                        {
                            nextStage = RecordingStudioTycoon.DataModels.Projects.ProjectStage.Mastering;
                        }
                        break;
                    case RecordingStudioTycoon.DataModels.Projects.ProjectStage.Mastering:
                        if (project.CurrentDayProgress >= 200)
                        {
                            nextStage = RecordingStudioTycoon.DataModels.Projects.ProjectStage.Release;
                        }
                        break;
                    case RecordingStudioTycoon.DataModels.Projects.ProjectStage.Release:
                        // Release is typically the final stage before completion
                        break;
                }

                if (nextStage != currentStageEnum)
                {
                    project.CurrentStage = nextStage.ToString();
                    project.CurrentDayProgress = 0; // Reset daily progress for new stage
                    Debug.Log($"Project {project.Title} transitioned to stage: {project.CurrentStage}");
                    // TODO: Trigger UI update for stage change
                }
            }
        }

        private float GetQualityContribution(RecordingStudioTycoon.DataModels.Projects.Project project)
        {
            float totalContribution = 0f;
            if (GameManager.Instance == null || GameManager.Instance.GameState == null) return totalContribution;

            // Staff contribution
            foreach (string staffId in project.AssignedStaffIds)
            {
                StaffMember staff = GameManager.Instance.GameState.HiredStaff.FirstOrDefault(s => s.Id == staffId);
                if (staff != null)
                {
                    // Example: Staff skill and morale/energy influence quality
                    float skillBonus = 0;
                    // Assuming project.CurrentStage maps to a skill type
                    if (Enum.TryParse(project.CurrentStage, true, out StudioSkillType requiredSkillType))
                    {
                        skillBonus = staff.Skills.GetValueOrDefault(requiredSkillType, 0);
                    }
                    
                    float moodFactor = staff.Morale / 100f;
                    float energyFactor = staff.Stamina / 100f;
                    totalContribution += (skillBonus * 0.1f) * moodFactor * energyFactor; // Example calculation
                }
            }

            // Equipment contribution
            // This would involve iterating through ownedEquipment and checking if it's assigned/relevant to the project
            totalContribution += GameManager.Instance.GameState.EquipmentMultiplier;

            // Apply aggregated perk modifiers from StudioUpgradeManager
            if (StudioUpgradeManager.Instance != null)
            {
                AggregatedPerkModifiers modifiers = GameManager.Instance.GameState.AggregatedPerkModifiers;
                totalContribution *= modifiers.GlobalRecordingQualityModifier; // Example for recording stage
                totalContribution *= modifiers.GlobalMixingQualityModifier; // Example for mixing stage
                totalContribution *= modifiers.GlobalMasteringQualityModifier; // Example for mastering stage
                totalContribution += modifiers.ProjectQualityBonus; // Flat bonus
                
                // Apply genre-specific bonuses
                if (modifiers.ProjectAppealModifier.TryGetValue(project.Genre, out float genreAppealModifier))
                {
                    totalContribution *= genreAppealModifier;
                }
            }

            return totalContribution;
        }

        public void CompleteProject(RecordingStudioTycoon.DataModels.Projects.Project project)
        {
            if (project == null)
            {
                Debug.LogError("Cannot complete project: Project is null.");
                return;
            }

            project.IsActive = false;
            project.Status = "Completed";
            project.EndDate = GameManager.Instance.GameState.CurrentDay; // Set completion date
            GameManager.Instance.GameState.ActiveProject = null;
            GameManager.Instance.GameState.AvailableProjects.Remove(project);
            GameManager.Instance.GameState.CompletedProjects.Add(project);

            Debug.Log($"Project {project.Title} completed! Final Quality: {project.Quality}");

            // Calculate final outcome and grant rewards
            ProjectCompletionReport report = CalculateFinalProjectOutcome(project);

            // Unassign staff from this project
            foreach (string staffId in project.AssignedStaffIds)
            {
                StaffMember staff = GameManager.Instance.GameState.HiredStaff.FirstOrDefault(s => s.Id == staffId);
                if (staff != null)
                {
                    staff.AssignedProjectId = null;
                    staff.IsAvailable = true;
                }
            }
            project.AssignedStaffIds.Clear(); // Clear assigned staff IDs from the project

            // Update relationships and progression based on project completion
            if (RelationshipManager.Instance != null)
            {
                RelationshipManager.Instance.ProcessProjectCompletion(project, report, GameManager.Instance.GameState.CurrentDay);
            }
            if (StudioUpgradeManager.Instance != null)
            {
                StudioUpgradeManager.Instance.ProcessProjectCompletionForPrestige(project, report);
            }
            if (ProgressionManager.Instance != null)
            {
                ProgressionManager.Instance.AddXP(report.XpGained); // Grant XP through ProgressionManager
            }
            if (FinanceManager.Instance != null)
            {
                FinanceManager.Instance.AddMoney(report.Earnings, "Project Completion");
            }
        }

        private ProjectCompletionReport CalculateFinalProjectOutcome(RecordingStudioTycoon.DataModels.Projects.Project project)
        {
            if (GameManager.Instance == null) return new ProjectCompletionReport();

            // Example: Rewards based on quality
            float finalMoneyReward = project.PayoutBase;
            int finalXPReward = project.XpReward;
            float finalQualityScore = project.Quality;

            // Apply quality modifiers
            if (project.Quality >= 80)
            {
                finalMoneyReward *= 1.5f;
                finalXPReward = (int)(finalXPReward * 1.5f);
                Debug.Log("Excellent project quality! Bonus rewards granted.");
            }
            else if (project.Quality < 50)
            {
                finalMoneyReward *= 0.5f;
                finalXPReward = (int)(finalXPReward * 0.5f);
                Debug.Log("Poor project quality. Reduced rewards.");
            }

            // Apply perk modifiers to earnings
            if (GameManager.Instance.GameState.AggregatedPerkModifiers != null)
            {
                finalMoneyReward *= GameManager.Instance.GameState.AggregatedPerkModifiers.ContractPayoutModifier;
            }

            // Create a report
            ProjectCompletionReport report = new ProjectCompletionReport
            {
                QualityScore = finalQualityScore,
                FinalScore = finalQualityScore, // Can be different if other factors apply
                Earnings = Mathf.RoundToInt(finalMoneyReward),
                XpGained = finalXPReward,
                CompletionTime = GameManager.Instance.GameState.CurrentDay,
                StageReports = new List<ProjectStageReport>() // Populate with actual stage reports if available
            };

            // Grant rewards via RewardManager (if it exists)
            if (RewardManager.Instance != null)
            {
                RewardManager.Instance.GrantReward(RewardType.Money, report.Earnings);
                RewardManager.Instance.GrantReward(RewardType.XP, report.XpGained);
            }
            else
            {
                Debug.LogWarning("RewardManager not found. Rewards not granted.");
            }

            return report;
        }

        public void CancelProject(string projectId) // This should be handled by a MultiProjectManager or similar
        {
            if (GameManager.Instance == null || GameManager.Instance.GameState == null)
            {
                Debug.LogError("GameManager or GameState not found. Cannot cancel project.");
                return;
            }

            RecordingStudioTycoon.DataModels.Projects.Project projectToCancel = GameManager.Instance.GameState.AvailableProjects.FirstOrDefault(p => p.Id == projectId);
            if (projectToCancel == null)
            {
                Debug.LogError($"Project with ID '{projectId}' not found in available projects.");
                return;
            }

            GameManager.Instance.GameState.AvailableProjects.Remove(projectToCancel);
            if (GameManager.Instance.GameState.ActiveProject == projectToCancel)
            {
                GameManager.Instance.GameState.ActiveProject = null;
            }

            // Unassign staff from this project
            foreach (string staffId in projectToCancel.AssignedStaffIds)
            {
                StaffMember staff = GameManager.Instance.GameState.HiredStaff.FirstOrDefault(s => s.Id == staffId);
                if (staff != null)
                {
                    staff.AssignedProjectId = null;
                    staff.IsAvailable = true;
                }
            }
            projectToCancel.AssignedStaffIds.Clear(); // Clear assigned staff IDs from the project

            Debug.Log($"Project {projectToCancel.Title} cancelled.");
        }
    }
}