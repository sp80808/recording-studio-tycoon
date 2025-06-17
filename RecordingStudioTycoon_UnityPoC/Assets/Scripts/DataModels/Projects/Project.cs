using System;
using System.Collections.Generic;
using UnityEngine;
using RecordingStudioTycoon.DataModels.Staff;

namespace RecordingStudioTycoon.DataModels.Projects
{
    [System.Serializable]
    public class Project
    {
        [Header("Basic Information")]
        public string id;
        public string name;
        public string description;
        public ProjectType type;
        public ProjectStage currentStage;

        [Header("Timeline")]
        public DateTime startDate;
        public DateTime deadline;
        public int estimatedDuration; // in days
        public int actualDuration; // in days

        [Header("Quality and Progress")]
        public float overallQuality = 0f;
        public float progress = 0f;
        public Dictionary<ProjectStage, float> stageProgress = new Dictionary<ProjectStage, float>();

        [Header("Financial")]
        public int budget;
        public int actualCost;
        public int expectedRevenue;

        [Header("Staff Assignment")]
        public List<StaffMember> assignedStaff = new List<StaffMember>();
        public Dictionary<ProjectStage, List<StaffMember>> stageAssignments = new Dictionary<ProjectStage, List<StaffMember>>();

        [Header("Requirements")]
        public Dictionary<SkillType, int> requiredSkills = new Dictionary<SkillType, int>();
        public List<string> requiredEquipment = new List<string>();

        [Header("Status")]
        public bool isCompleted = false;
        public bool isOnHold = false;
        public ProjectStatus status = ProjectStatus.NotStarted;

        // Visual/UI properties
        public Color ProjectColor { get; set; } = Color.white;
        public string StatusText { get; set; } = "Not Started";

        public Project()
        {
            id = System.Guid.NewGuid().ToString();
            startDate = DateTime.Now;
            InitializeStageProgress();
        }

        public Project(string name, ProjectType type) : this()
        {
            this.name = name;
            this.type = type;
            SetDefaultValues();
        }

        private void InitializeStageProgress()
        {
            foreach (ProjectStage stage in System.Enum.GetValues(typeof(ProjectStage)))
            {
                stageProgress[stage] = 0f;
                stageAssignments[stage] = new List<StaffMember>();
            }
        }

        private void SetDefaultValues()
        {
            switch (type)
            {
                case ProjectType.Recording:
                    estimatedDuration = 14;
                    budget = 10000;
                    expectedRevenue = 15000;
                    break;
                case ProjectType.Mixing:
                    estimatedDuration = 7;
                    budget = 5000;
                    expectedRevenue = 8000;
                    break;
                case ProjectType.Mastering:
                    estimatedDuration = 3;
                    budget = 2000;
                    expectedRevenue = 4000;
                    break;
                case ProjectType.Production:
                    estimatedDuration = 30;
                    budget = 25000;
                    expectedRevenue = 40000;
                    break;
            }

            deadline = startDate.AddDays(estimatedDuration + 5); // Add buffer
        }

        public void AssignStaff(StaffMember staff, ProjectStage stage = ProjectStage.PreProduction)
        {
            if (!assignedStaff.Contains(staff))
            {
                assignedStaff.Add(staff);
                staff.AssignToProject(this);
            }

            if (!stageAssignments[stage].Contains(staff))
            {
                stageAssignments[stage].Add(staff);
            }
        }

        public void UnassignStaff(StaffMember staff)
        {
            if (assignedStaff.Contains(staff))
            {
                assignedStaff.Remove(staff);
                staff.UnassignFromProject();
            }

            // Remove from all stage assignments
            foreach (var stageList in stageAssignments.Values)
            {
                stageList.Remove(staff);
            }
        }

        public void UpdateProgress(float amount)
        {
            stageProgress[currentStage] = Mathf.Clamp01(stageProgress[currentStage] + amount);
            
            // Check if current stage is complete
            if (stageProgress[currentStage] >= 1f)
            {
                AdvanceToNextStage();
            }

            CalculateOverallProgress();
            UpdateStatus();
        }

        private void AdvanceToNextStage()
        {
            switch (currentStage)
            {
                case ProjectStage.PreProduction:
                    currentStage = ProjectStage.Recording;
                    break;
                case ProjectStage.Recording:
                    currentStage = ProjectStage.Editing;
                    break;
                case ProjectStage.Editing:
                    currentStage = ProjectStage.Mixing;
                    break;
                case ProjectStage.Mixing:
                    currentStage = ProjectStage.Mastering;
                    break;
                case ProjectStage.Mastering:
                    currentStage = ProjectStage.PostProduction;
                    break;
                case ProjectStage.PostProduction:
                    CompleteProject();
                    break;
            }
        }

        private void CalculateOverallProgress()
        {
            float totalProgress = 0f;
            int stageCount = System.Enum.GetValues(typeof(ProjectStage)).Length;
            
            foreach (var stageProgressValue in stageProgress.Values)
            {
                totalProgress += stageProgressValue;
            }
            
            progress = totalProgress / stageCount;
        }

        private void UpdateStatus()
        {
            if (isCompleted)
            {
                status = ProjectStatus.Completed;
                StatusText = "Completed";
                ProjectColor = Color.green;
            }
            else if (isOnHold)
            {
                status = ProjectStatus.OnHold;
                StatusText = "On Hold";
                ProjectColor = Color.yellow;
            }
            else if (DateTime.Now > deadline && !isCompleted)
            {
                status = ProjectStatus.Overdue;
                StatusText = "Overdue";
                ProjectColor = Color.red;
            }
            else if (progress > 0f)
            {
                status = ProjectStatus.InProgress;
                StatusText = $"In Progress ({currentStage})";
                ProjectColor = Color.blue;
            }
            else
            {
                status = ProjectStatus.NotStarted;
                StatusText = "Not Started";
                ProjectColor = Color.gray;
            }
        }

        private void CompleteProject()
        {
            isCompleted = true;
            status = ProjectStatus.Completed;
            actualDuration = (int)(DateTime.Now - startDate).TotalDays;
            
            // Calculate final quality based on staff skills and time taken
            CalculateFinalQuality();
            
            // Unassign all staff
            var staffToUnassign = new List<StaffMember>(assignedStaff);
            foreach (var staff in staffToUnassign)
            {
                UnassignStaff(staff);
            }
        }

        private void CalculateFinalQuality()
        {
            float skillBonus = 0f;
            float timeBonus = 0f;
            
            // Calculate skill bonus based on assigned staff
            if (assignedStaff.Count > 0)
            {
                float totalSkill = 0f;
                foreach (var staff in assignedStaff)
                {
                    totalSkill += staff.GetOverallSkillLevel();
                }
                skillBonus = (totalSkill / assignedStaff.Count) / 100f;
            }
            
            // Calculate time bonus/penalty
            float timeRatio = (float)actualDuration / estimatedDuration;
            if (timeRatio <= 0.8f)
            {
                timeBonus = 0.2f; // Finished early bonus
            }
            else if (timeRatio > 1.2f)
            {
                timeBonus = -0.3f; // Late penalty
            }
            
            overallQuality = Mathf.Clamp01(0.5f + skillBonus + timeBonus);
        }

        public int GetDaysRemaining()
        {
            return Math.Max(0, (int)(deadline - DateTime.Now).TotalDays);
        }

        public float GetTimeProgress()
        {
            var totalTime = (deadline - startDate).TotalDays;
            var elapsedTime = (DateTime.Now - startDate).TotalDays;
            return Mathf.Clamp01((float)(elapsedTime / totalTime));
        }

        public bool IsOverdue()
        {
            return DateTime.Now > deadline && !isCompleted;
        }

        public void SetOnHold(bool onHold)
        {
            isOnHold = onHold;
            UpdateStatus();
        }
    }

    public enum ProjectType
    {
        Recording,
        Mixing,
        Mastering,
        Production
    }

    public enum ProjectStage
    {
        PreProduction,
        Recording,
        Editing,
        Mixing,
        Mastering,
        PostProduction
    }

    public enum ProjectStatus
    {
        NotStarted,
        InProgress,
        OnHold,
        Completed,
        Overdue
    }
}
