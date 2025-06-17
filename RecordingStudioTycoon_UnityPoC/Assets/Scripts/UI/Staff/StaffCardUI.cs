using UnityEngine;
using UnityEngine.UIElements;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.GameLogic;
using RecordingStudioTycoon.Systems.Staff;

namespace RecordingStudioTycoon.UI.Staff
{
    public class StaffCardUI : MonoBehaviour
    {
        public VisualTreeAsset staffCardUXML; // Assign in Inspector
        private VisualElement root;

        private Label staffNameLabel;
        private Label staffRoleLabel;
        private Label staffLevelLabel;
        private Label staffMoodLabel;
        private Label staffEnergyLabel;
        private Label staffAssignedProjectLabel;
        private Button assignToProjectButton;
        private Button unassignFromProjectButton;

        private StaffMember currentStaff;

        public void SetupCard(VisualElement parentElement, StaffMember staff)
        {
            currentStaff = staff;

            root = staffCardUXML.Instantiate();
            parentElement.Add(root);

            staffNameLabel = root.Q<Label>("staff-name-label");
            staffRoleLabel = root.Q<Label>("staff-role-label");
            staffLevelLabel = root.Q<Label>("staff-level-label");
            staffMoodLabel = root.Q<Label>("staff-mood-label");
            staffEnergyLabel = root.Q<Label>("staff-energy-label");
            staffAssignedProjectLabel = root.Q<Label>("staff-assigned-project-label");
            assignToProjectButton = root.Q<Button>("assign-to-project-button");
            unassignFromProjectButton = root.Q<Button>("unassign-from-project-button");

            UpdateUI();

            assignToProjectButton?.RegisterCallback<ClickEvent>(OnAssignToProjectButtonClicked);
            unassignFromProjectButton?.RegisterCallback<ClickEvent>(OnUnassignFromProjectButtonClicked);
        }

        public void UpdateUI()
        {
            if (currentStaff == null) return;

            staffNameLabel.text = currentStaff.Name;
            staffRoleLabel.text = currentStaff.Role;
            staffLevelLabel.text = $"Level: {currentStaff.Level}";
            staffMoodLabel.text = $"Mood: {currentStaff.Mood}%";
            staffEnergyLabel.text = $"Energy: {currentStaff.Energy}%";
            staffAssignedProjectLabel.text = string.IsNullOrEmpty(currentStaff.AssignedProjectId) ? "Unassigned" : $"Assigned: {GetAssignedProjectName()}";

            assignToProjectButton.style.display = string.IsNullOrEmpty(currentStaff.AssignedProjectId) ? DisplayStyle.Flex : DisplayStyle.None;
            unassignFromProjectButton.style.display = string.IsNullOrEmpty(currentStaff.AssignedProjectId) ? DisplayStyle.None : DisplayStyle.Flex;
        }

        private string GetAssignedProjectName()
        {
            if (GameManager.Instance != null && !string.IsNullOrEmpty(currentStaff.AssignedProjectId))
            {
                RecordingStudioTycoon.DataModels.Project assignedProject = GameManager.Instance.CurrentGameState.availableProjects.Find(p => p.Id == currentStaff.AssignedProjectId);
                if (assignedProject != null)
                {
                    return assignedProject.Name;
                }
            }
            return "Unknown Project";
        }

        private void OnAssignToProjectButtonClicked(ClickEvent evt)
        {
            Debug.Log($"Assign to Project button clicked for staff: {currentStaff.Name}");
            // TODO: Trigger a modal or panel for project selection
            // UIManager.Instance.ShowProjectSelectionModal(currentStaff);
        }

        private void OnUnassignFromProjectButtonClicked(ClickEvent evt)
        {
            Debug.Log($"Unassign from Project button clicked for staff: {currentStaff.Name}");
            if (StaffManagement.Instance != null && GameManager.Instance != null && !string.IsNullOrEmpty(currentStaff.AssignedProjectId))
            {
                RecordingStudioTycoon.DataModels.Project assignedProject = GameManager.Instance.CurrentGameState.availableProjects.Find(p => p.Id == currentStaff.AssignedProjectId);
                if (assignedProject != null)
                {
                    StaffManagement.Instance.UnassignStaffFromProject(currentStaff, assignedProject);
                    UpdateUI(); // Update UI after unassignment
                    GameManager.Instance.OnGameStateChanged?.Invoke(); // Notify for broader state change
                }
            }
        }
    }
}