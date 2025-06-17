using UnityEngine;
using UnityEngine.UIElements;
using RecordingStudioTycoon.DataModels;

namespace RecordingStudioTycoon.UI.Project
{
    public class ProjectCardUI : MonoBehaviour
    {
        public VisualTreeAsset projectCardUXML; // Assign in Inspector
        private VisualElement root;

        private Label projectNameLabel;
        private Label projectProgressLabel;
        private Label projectQualityLabel;
        private Label projectStageLabel;
        private Label assignedStaffLabel;
        private Button assignStaffButton;

        private RecordingStudioTycoon.DataModels.Project currentProject;

        public void SetupCard(VisualElement parentElement, RecordingStudioTycoon.DataModels.Project project)
        {
            currentProject = project;

            root = projectCardUXML.Instantiate();
            parentElement.Add(root);

            projectNameLabel = root.Q<Label>("project-name-label");
            projectProgressLabel = root.Q<Label>("project-progress-label");
            projectQualityLabel = root.Q<Label>("project-quality-label");
            projectStageLabel = root.Q<Label>("project-stage-label");
            assignedStaffLabel = root.Q<Label>("assigned-staff-label");
            assignStaffButton = root.Q<Button>("assign-staff-button");

            UpdateUI();

            assignStaffButton?.RegisterCallback<ClickEvent>(OnAssignStaffButtonClicked);
        }

        public void UpdateUI()
        {
            if (currentProject == null) return;

            projectNameLabel.text = currentProject.Name;
            projectProgressLabel.text = $"Progress: {currentProject.Progress}/{currentProject.MaxProgress}";
            projectQualityLabel.text = $"Quality: {currentProject.Quality}";
            projectStageLabel.text = $"Stage: {currentProject.CurrentStage}";
            assignedStaffLabel.text = $"Assigned Staff: {currentProject.AssignedStaffIds.Count}"; // Placeholder
        }

        private void OnAssignStaffButtonClicked(ClickEvent evt)
        {
            Debug.Log($"Assign Staff button clicked for project: {currentProject.Name}");
            // TODO: Trigger a modal or panel for staff assignment
            // UIManager.Instance.ShowStaffAssignmentModal(currentProject);
        }
    }
}