using UnityEngine;
using UnityEngine.UIElements;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.Systems;

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
        private Label projectReviewLabel;
        private Button regenerateReviewButton;
        private Label projectDescriptionLabel;
        private Button regenerateDescriptionButton;
        private VisualElement descriptionContainer;
        private Label descriptionHeaderLabel;

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

            // Add review label and button
            projectReviewLabel = root.Q<Label>("project-review-label");
            if (projectReviewLabel == null)
            {
                projectReviewLabel = new Label("Loading review...");
                projectReviewLabel.name = "project-review-label";
                root.Add(projectReviewLabel);
            }
            regenerateReviewButton = root.Q<Button>("regenerate-review-button");
            if (regenerateReviewButton == null)
            {
                regenerateReviewButton = new Button { text = "Regenerate Review", name = "regenerate-review-button" };
                root.Add(regenerateReviewButton);
            }
            regenerateReviewButton.clicked += async () => await FetchAndDisplayReview(true);

            // Add description label and button
            projectDescriptionLabel = root.Q<Label>("project-description-label");
            if (projectDescriptionLabel == null)
            {
                projectDescriptionLabel = new Label("Loading description...");
                projectDescriptionLabel.name = "project-description-label";
                root.Add(projectDescriptionLabel);
            }
            regenerateDescriptionButton = root.Q<Button>("regenerate-description-button");
            if (regenerateDescriptionButton == null)
            {
                regenerateDescriptionButton = new Button { text = "Regenerate Description", name = "regenerate-description-button" };
                root.Add(regenerateDescriptionButton);
            }
            regenerateDescriptionButton.clicked += async () => await FetchAndDisplayDescription(true);

            // Add description section header and container
            descriptionHeaderLabel = root.Q<Label>("description-header-label");
            if (descriptionHeaderLabel == null)
            {
                descriptionHeaderLabel = new Label("🎼 Album Description")
                {
                    name = "description-header-label",
                    style = {
                        unityFontStyleAndWeight = FontStyle.Bold,
                        fontSize = 16,
                        marginTop = 10,
                        marginBottom = 2
                    }
                };
                root.Add(descriptionHeaderLabel);
            }
            descriptionContainer = root.Q<VisualElement>("description-container");
            if (descriptionContainer == null)
            {
                descriptionContainer = new VisualElement { name = "description-container" };
                // Style: rounded corners, light background, padding
                descriptionContainer.style.backgroundColor = new UnityEngine.Color(0.96f, 0.98f, 1f, 1f);
                descriptionContainer.style.borderTopLeftRadius = 8;
                descriptionContainer.style.borderTopRightRadius = 8;
                descriptionContainer.style.borderBottomLeftRadius = 8;
                descriptionContainer.style.borderBottomRightRadius = 8;
                descriptionContainer.style.paddingLeft = 8;
                descriptionContainer.style.paddingRight = 8;
                descriptionContainer.style.paddingTop = 6;
                descriptionContainer.style.paddingBottom = 6;
                descriptionContainer.style.marginBottom = 8;
                root.Add(descriptionContainer);
            }
            // Move the description label into the container
            if (projectDescriptionLabel != null && projectDescriptionLabel.parent != descriptionContainer)
            {
                projectDescriptionLabel.style.fontSize = 15;
                projectDescriptionLabel.style.unityFontStyleAndWeight = FontStyle.Italic;
                descriptionContainer.Add(projectDescriptionLabel);
            }

            UpdateUI();

            assignStaffButton?.RegisterCallback<ClickEvent>(OnAssignStaffButtonClicked);

            // Fetch and display review and description
            _ = FetchAndDisplayReview(false);
            _ = FetchAndDisplayDescription(false);
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

        private async System.Threading.Tasks.Task FetchAndDisplayReview(bool forceRefresh)
        {
            if (currentProject == null) return;
            projectReviewLabel.text = "Loading review...";
            string review = null;
            try
            {
                if (forceRefresh)
                {
                    // Bypass cache by using a unique prompt (add timestamp)
                    review = await TextGenerationManager.Instance.GetReview(currentProject.Name, currentProject.BandName, currentProject.Genre + $" ({System.DateTime.Now.Ticks})");
                }
                else
                {
                    review = await TextGenerationManager.Instance.GetReview(currentProject.Name, currentProject.BandName, currentProject.Genre);
                }
                projectReviewLabel.text = !string.IsNullOrEmpty(review) ? review : "No review available.";
            }
            catch (System.Exception ex)
            {
                projectReviewLabel.text = "Error loading review.";
                projectReviewLabel.style.color = new UnityEngine.Color(1, 0, 0); // Red for error
                UnityEngine.Debug.LogError($"Error fetching review: {ex.Message}");
            }
        }

        private async System.Threading.Tasks.Task FetchAndDisplayDescription(bool forceRefresh)
        {
            if (currentProject == null) return;
            projectDescriptionLabel.text = "Loading description...";
            projectDescriptionLabel.style.opacity = 0f; // For fade-in
            string description = null;
            try
            {
                if (forceRefresh)
                {
                    description = await TextGenerationManager.Instance.GetDescription("album", currentProject.Name + $" ({System.DateTime.Now.Ticks})");
                }
                else
                {
                    description = await TextGenerationManager.Instance.GetDescription("album", currentProject.Name);
                }
                projectDescriptionLabel.text = !string.IsNullOrEmpty(description) ? description : "No description available.";
            }
            catch (System.Exception ex)
            {
                projectDescriptionLabel.text = "Error loading description.";
                projectDescriptionLabel.style.color = new UnityEngine.Color(1, 0, 0); // Red for error
                UnityEngine.Debug.LogError($"Error fetching description: {ex.Message}");
            }
            // Fade-in animation
            FadeIn(projectDescriptionLabel, 0.5f);
        }

        // Fade-in animation for description label
        private async void FadeIn(VisualElement element, float duration)
        {
            float elapsed = 0f;
            while (elapsed < duration)
            {
                float t = elapsed / duration;
                element.style.opacity = t;
                await System.Threading.Tasks.Task.Yield();
                elapsed += UnityEngine.Time.deltaTime;
            }
            element.style.opacity = 1f;
        }
    }
}