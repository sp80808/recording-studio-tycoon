using System;
using System.Collections.Generic;
using UnityEngine;
using RecordingStudioTycoon.DataModels.Projects;

namespace RecordingStudioTycoon.DataModels.Staff
{
    [System.Serializable]
    public class StaffMember
    {
        [Header("Basic Information")]
        public string id;
        public string name;
        public StaffType staffType;
        public DateTime hireDate;

        [Header("Skills and Performance")]
        public Dictionary<SkillType, int> skills = new Dictionary<SkillType, int>();
        public int salary;
        public int mood = 100;
        public int energy = 100;

        [Header("Current Status")]
        public Project assignedProject;
        public bool isAvailable = true;

        // Properties for compatibility with old naming conventions
        public int Stamina 
        { 
            get => energy; 
            set => energy = value; 
        }
        
        public int Morale 
        { 
            get => mood; 
            set => mood = value; 
        }

        public int Salary 
        { 
            get => salary; 
            set => salary = value; 
        }

        public Project AssignedProject 
        { 
            get => assignedProject; 
            set => assignedProject = value; 
        }

        public int Efficiency { get; set; } = 100;

        // Visual state properties
        public string StatusMessage { get; set; } = "Available";
        public Color StatusColor { get; set; } = Color.green;
        public string CurrentAnimationState { get; set; } = "Idle";

        public StaffMember()
        {
            id = System.Guid.NewGuid().ToString();
            hireDate = DateTime.Now;
            InitializeSkills();
        }

        public StaffMember(string name, StaffType type)
        {
            this.id = System.Guid.NewGuid().ToString();
            this.name = name;
            this.staffType = type;
            this.hireDate = DateTime.Now;
            InitializeSkills();
        }

        private void InitializeSkills()
        {
            // Initialize all skill types with base values
            foreach (SkillType skillType in System.Enum.GetValues(typeof(SkillType)))
            {
                skills[skillType] = GetBaseSkillValue(skillType);
            }
        }

        private int GetBaseSkillValue(SkillType skillType)
        {
            // Base skill values depending on staff type
            switch (staffType)
            {
                case StaffType.Engineer:
                    return skillType == SkillType.Technical ? 70 : 50;
                case StaffType.Producer:
                    return skillType == SkillType.Creative ? 70 : 50;
                case StaffType.Musician:
                    return skillType == SkillType.Performance ? 70 : 50;
                case StaffType.Intern:
                    return 30;
                default:
                    return 50;
            }
        }

        public int GetSkillLevel(SkillType skillType)
        {
            return skills.ContainsKey(skillType) ? skills[skillType] : 0;
        }

        public void ImproveSkill(SkillType skillType, int amount)
        {
            if (skills.ContainsKey(skillType))
            {
                skills[skillType] = Mathf.Min(100, skills[skillType] + amount);
            }
            else
            {
                skills[skillType] = Mathf.Min(100, amount);
            }
        }

        public float GetOverallSkillLevel()
        {
            if (skills.Count == 0) return 0;

            float total = 0;
            foreach (var skill in skills.Values)
            {
                total += skill;
            }
            return total / skills.Count;
        }

        public bool CanWorkOnProject(Project project)
        {
            if (!isAvailable || assignedProject != null)
                return false;

            if (energy < 20 || mood < 30)
                return false;

            return true;
        }

        public void AssignToProject(Project project)
        {
            assignedProject = project;
            isAvailable = false;
        }

        public void UnassignFromProject()
        {
            assignedProject = null;
            isAvailable = true;
        }

        public void UpdateDailyStatus()
        {
            // Recover energy
            if (assignedProject == null)
            {
                energy = Mathf.Min(100, energy + 25); // Rest day recovery
            }
            else
            {
                energy = Mathf.Max(0, energy - 15); // Work fatigue
            }

            // Update mood based on conditions
            if (energy < 30)
            {
                mood = Mathf.Max(0, mood - 10); // Tired = unhappy
            }
            else if (assignedProject != null)
            {
                mood = Mathf.Min(100, mood + 5); // Working = slightly happier
            }
            else
            {
                mood = Mathf.Max(0, mood - 2); // Idle = slightly bored
            }

            // Calculate efficiency based on mood and energy
            Efficiency = Mathf.RoundToInt((mood * 0.6f + energy * 0.4f) * 1.5f);
            Efficiency = Mathf.Clamp(Efficiency, 30, 150);
        }
    }
}
