using UnityEngine;
using System.Collections.Generic;
using System.Linq;
using RecordingStudioTycoon.Core; // For GameManager, GameState access
using RecordingStudioTycoon.DataModels; // Added for Project, ProjectTemplate, StaffMember, ProjectStage etc.
using RecordingStudioTycoon.ScriptableObjects; // Added for ProjectData
using RecordingStudioTycoon.Systems.Staff; // For StaffManagement interaction
using RecordingStudioTycoon.UI; // For UIManager interaction
using RecordingStudioTycoon.Systems.Scoring; // For RewardType, RewardManager

namespace RecordingStudioTycoon.Systems.ProjectSystem
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

        public RecordingStudioTycoon.DataModels.Project CreateNewProject(ProjectTemplate template)
        {
            if (template == null)
            {
                Debug.LogError("Cannot create new project: ProjectTemplate is null.");
                return null;
            }

            RecordingStudioTycoon.DataModels.Project newProject = new RecordingStudioTycoon.DataModels.Project
            {
                Id = System.Guid.NewGuid().ToString(),
                Name = template.Name,
                Genre = template.Genre,
                Difficulty = template.Difficulty,
                StageProgress = 0, // Initial progress for the current stage
                OverallProgress = 0, // Initial overall project progress
                RequiredQuality = template.RequiredQuality,
                CurrentQuality = 0, // Initial quality
                RewardMoney = template.RewardMoney,
                RewardXP = template.RewardXP,
                AssignedStaffIds = new List<string>(),
                IsActive = false,
                IsCompleted = false,
                Status = "Available",
                DaysRemaining = template.DaysToComplete, // Assuming template has this property
                CurrentStage = ProjectStage.PreProduction // Start at Pre-Production
            };

            if (GameManager.Instance != null)
            {
                GameManager.Instance.CurrentGameState.availableProjects.Add(newProject);
                Debug.Log($"Created new project: {newProject.Name} ({newProject.Genre})");
            }
            else
            {
                Debug.LogError("GameManager instance not found. Cannot add new project to GameState.");
            }
            // Notify UI Manager about new project
            if (UIManager.Instance != null)
            {
                UIManager.Instance.UpdateProjectUI(newProject);
            }
            return newProject;
        }

        public void AdvanceProject(RecordingStudioTycoon.DataModels.Project project, float workAmount)
        {
            if (project == null)
            {
                Debug.LogError("Cannot advance project: Project is null.");
                return;
            }

            if (project.IsCompleted || project.CurrentStage == ProjectStage.Completed)
            {
                Debug.LogWarning($"Project {project.Name} is already completed or in final stage.");
                return;
            }

            // Advance stage progress
            project.StageProgress += (int)workAmount;
            project.CurrentQuality += (int)(workAmount * GetQualityContribution(project)); // Quality calculation

            int progressRequiredForCurrentStage = GetProgressRequiredForStage(project.CurrentStage);

            if (project.StageProgress >= progressRequiredForCurrentStage)
            {
                project.StageProgress = progressRequiredForCurrentStage; // Cap at 100 for current stage
                Debug.Log($"Stage {project.CurrentStage} completed for project {project.Name}.");

                // Transition to next stage
                ProjectStage nextStage = GetNextProjectStage(project.CurrentStage);
                project.CurrentStage = nextStage;
                project.StageProgress = 0; // Reset stage progress for the new stage

                // Update overall progress
                UpdateOverallProjectProgress(project);

                if (project.CurrentStage == ProjectStage.Completed)
                {
                    CompleteProject(project);
                }
                else
                {
                    // Notify UI Manager about stage change
                    if (UIManager.Instance != null)
                    {
                        UIManager.Instance.UpdateProjectUI(project); // Update UI for new stage
                        // Potentially show a notification for stage completion
                        // UIManager.Instance.ShowNotification($"Project {project.Name}: {project.CurrentStage} stage started!");
                    }
                }
            }
            else
            {
                // Only update UI if not transitioning stages (to avoid double update)
                if (UIManager.Instance != null)
                {
                    UIManager.Instance.UpdateProjectUI(project);
                }
            }
            Debug.Log($"Project {project.Name} - Stage: {project.CurrentStage}, Stage Progress: {project.StageProgress}%, Overall Progress: {project.OverallProgress}%");
        }

        private float GetQualityContribution(RecordingStudioTycoon.DataModels.Project project)
        {
            // Placeholder for quality calculation logic
            // This would involve assigned staff skills, equipment, studio perks, etc.
            float quality = 1.0f; // Base quality
            if (project.AssignedStaffIds != null && project.AssignedStaffIds.Any())
            {
                foreach (string staffId in project.AssignedStaffIds)
                {
                    StaffMember staff = GameManager.Instance.CurrentGameState.hiredStaff.FirstOrDefault(s => s.Id == staffId);
                    if (staff != null)
                    {
                        // Add staff's relevant skill level to quality based on current stage
                        quality += GetStaffSkillContribution(staff, project.CurrentStage) * 0.01f;

                        // Factor in staff mood and energy
                        // Assuming mood and energy are 0-100. Normalize to 0-1 range for multiplier.
                        float moodMultiplier = staff.Mood / 100f;
                        float energyMultiplier = staff.Energy / 100f;

                        // Apply a combined multiplier. Adjust weights as needed.
                        quality *= (0.5f + 0.5f * moodMultiplier); // Mood has a significant impact
                        quality *= (0.75f + 0.25f * energyMultiplier); // Energy has a smaller, but noticeable impact
                    }
                }
            }
            // TODO: Add equipment contribution based on assigned equipment to the project
            // TODO: Add minigame performance contribution (this would likely come from MinigameManager directly updating project quality)
            return quality;
        }

        private int GetStaffSkillContribution(StaffMember staff, ProjectStage stage)
        {
            // Example: Map stages to relevant skills
            switch (stage)
            {
                case ProjectStage.PreProduction:
                    return staff.Skills.GetValueOrDefault(StudioSkillType.composition, 0) + staff.Skills.GetValueOrDefault(StudioSkillType.production, 0);
                case ProjectStage.Recording:
                    return staff.Skills.GetValueOrDefault(StudioSkillType.recording, 0) + staff.Skills.GetValueOrDefault(StudioSkillType.soundDesign, 0);
                case ProjectStage.Mixing:
                    return staff.Skills.GetValueOrDefault(StudioSkillType.mixing, 0) + staff.Skills.GetValueOrDefault(StudioSkillType.soundDesign, 0);
                case ProjectStage.Mastering:
                    return staff.Skills.GetValueOrDefault(StudioSkillType.mastering, 0);
                case ProjectStage.Release:
                    return staff.Skills.GetValueOrDefault(StudioSkillType.marketing, 0);
                default:
                    return 0;
            }
        }

        private int GetProgressRequiredForStage(ProjectStage stage)
        {
            // For simplicity, assume each stage requires 100 progress points.
            // This could be made dynamic based on project difficulty, template, etc.
            return 100;
        }

        private ProjectStage GetNextProjectStage(ProjectStage currentStage)
        {
            switch (currentStage)
            {
                case ProjectStage.PreProduction: return ProjectStage.Recording;
                case ProjectStage.Recording: return ProjectStage.Mixing;
                case ProjectStage.Mixing: return ProjectStage.Mastering;
                case ProjectStage.Mastering: return ProjectStage.Release;
                case ProjectStage.Release: return ProjectStage.Completed; // Final state
                default: return ProjectStage.Completed;
            }
        }

        private void UpdateOverallProjectProgress(RecordingStudioTycoon.DataModels.Project project)
        {
            // Assuming 5 active stages (Pre-Production to Release)
            int totalActiveStages = 5;
            int completedActiveStages = (int)project.CurrentStage; // Enum values are 0-indexed

            // Calculate overall progress based on completed stages
            project.OverallProgress = (int)((float)completedActiveStages / totalActiveStages * 100f);
            if (project.CurrentStage == ProjectStage.Completed)
            {
                project.OverallProgress = 100;
            }
        }

        public void CompleteProject(RecordingStudioTycoon.DataModels.Project project)
        {
            if (project == null)
            {
                Debug.LogError("Cannot complete project: Project is null.");
                return;
            }

            if (project.CurrentStage != ProjectStage.Completed)
            {
                Debug.LogWarning($"Project {project.Name} is not in the final 'Completed' stage. Current stage: {project.CurrentStage}");
                return;
            }

            project.IsCompleted = true;
            project.IsActive = false;
            project.Status = "Completed";

            if (GameManager.Instance != null)
            {
                GameManager.Instance.CurrentGameState.availableProjects.RemoveAll(p => p.Id == project.Id);
                GameManager.Instance.CurrentGameState.completedProjects.Add(project);

                // Calculate final project outcome (nuanced calculations)
                float finalQualityMultiplier = CalculateFinalProjectOutcome(project);
                int finalMoneyReward = (int)(project.RewardMoney * finalQualityMultiplier);
                int finalXPReward = (int)(project.RewardXP * finalQualityMultiplier);

                // Add rewards via RewardManager
                if (RewardManager.Instance != null)
                {
                    RewardManager.Instance.GrantReward(RewardType.Money, finalMoneyReward);
                    RewardManager.Instance.GrantReward(RewardType.XP, finalXPReward);
                }
                else
                {
                    Debug.LogWarning("RewardManager not found. Rewards not granted for project completion.");
                }

                Debug.Log($"Project {project.Name} completed! Final Quality: {project.CurrentQuality}. Earned ${finalMoneyReward} and {finalXPReward} XP.");

                // Unassign staff from this project
                foreach (string staffId in project.AssignedStaffIds)
                {
                    StaffMember staff = GameManager.Instance.CurrentGameState.hiredStaff.FirstOrDefault(s => s.Id == staffId);
                    if (staff != null)
                    {
                        StaffManagement.Instance.UnassignStaffFromProject(staff, project);
                        // TODO: Grant staff XP based on their contribution to the project
                    }
                }

                // Notify UI Manager about project completion
                if (UIManager.Instance != null)
                {
                    UIManager.Instance.UpdateProjectUI(project); // Final update
                    // UIManager.Instance.ShowProjectCompletionSummary(project, finalQualityMultiplier);
                }
            }
            else
            {
                Debug.LogError("GameManager instance not found. Cannot complete project or add rewards.");
            }
        }

        private float CalculateFinalProjectOutcome(RecordingStudioTycoon.DataModels.Project project)
        {
            // This is a placeholder for nuanced project outcome calculations.
            // Factors to consider:
            // - project.CurrentQuality vs project.RequiredQuality
            // - Market trends (from MarketManager)
            // - Band reputation (from BandAndSongManager)
            // - Staff specialization and morale during the project
            // - Equipment quality used
            // - Minigame performance
            float outcomeMultiplier = 1.0f;

            // Example: Quality influence
            if (project.CurrentQuality >= project.RequiredQuality)
            {
                outcomeMultiplier *= 1.2f; // Bonus for meeting/exceeding quality
            }
            else
            {
                outcomeMultiplier *= 0.8f; // Penalty for low quality
            }

            // TODO: Integrate MarketManager.Instance.GetCurrentMarketTrends()
            // TODO: Integrate BandAndSongManager.Instance.GetBandReputation(project.BandId)
            // TODO: Integrate staff morale/fatigue impact
            // TODO: Integrate equipment quality impact
            // TODO: Integrate minigame performance impact

            return outcomeMultiplier;
        }

        // Method to generate new project templates (can be moved to ProjectUtils if preferred)
        public ProjectTemplate GenerateNewProjectTemplate()
        {
            if (projectData == null || projectData.ProjectTemplates == null || projectData.ProjectTemplates.Count == 0)
            {
                Debug.LogError("ProjectData ScriptableObject is not assigned or contains no templates.");
                return null;
            }

            // For simplicity, pick a random template
            ProjectTemplate template = projectData.ProjectTemplates[UnityEngine.Random.Range(0, projectData.ProjectTemplates.Count)];
            Debug.Log($"Generated new project template: {template.Name} ({template.Genre})");
            return template;
        }
    }
}
