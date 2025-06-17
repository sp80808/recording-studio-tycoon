using UnityEngine;
using UnityEngine.UIElements;
using RecordingStudioTycoon.GameLogic;
using RecordingStudioTycoon.Systems.Staff;
using RecordingStudioTycoon.Systems.Project; // For Project
using RecordingStudioTycoon.DataModels.Staff; // For StaffMember
using RecordingStudioTycoon.Systems; // For TextGenerationManager

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
        private VisualElement statusIndicator;
        private Button assignToProjectButton;
        private Button unassignFromProjectButton;
        private VisualElement efficiencyBar;
        private VisualElement moodBar;
        private VisualElement energyBar;
        private Label staffBioLabel;
        private Button regenerateBioButton;

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
            statusIndicator = root.Q<VisualElement>("status-indicator");
            assignToProjectButton = root.Q<Button>("assign-to-project-button");
            unassignFromProjectButton = root.Q<Button>("unassign-from-project-button");
            efficiencyBar = root.Q<VisualElement>("efficiency-bar");
            moodBar = root.Q<VisualElement>("mood-bar");
            energyBar = root.Q<VisualElement>("energy-bar");

            // Add bio label and button
            staffBioLabel = root.Q<Label>("staff-bio-label");
            if (staffBioLabel == null)
            {
                staffBioLabel = new Label("Loading bio...");
                staffBioLabel.name = "staff-bio-label";
                root.Add(staffBioLabel);
            }
            regenerateBioButton = new Button { text = "Regenerate Bio", name = "regenerate-bio-button" };
            if (regenerateBioButton == null)
            {
                root.Add(regenerateBioButton);
            }
            regenerateBioButton.clicked += async () => await FetchAndDisplayBio(true);

            UpdateUI();

            assignToProjectButton?.RegisterCallback<ClickEvent>(OnAssignToProjectButtonClicked);
            unassignFromProjectButton?.RegisterCallback<ClickEvent>(OnUnassignFromProjectButtonClicked);

            // Fetch and display bio
            _ = FetchAndDisplayBio(false);
        }

        public void UpdateUI()
        {
            if (currentStaff == null) return;

            staffNameLabel.text = currentStaff.Name;
            staffRoleLabel.text = currentStaff.Role;
            staffLevelLabel.text = $"Level: {currentStaff.Level}";
            
            // Mood display with color coding
            staffMoodLabel.text = $"Mood: {currentStaff.Mood}%";
            staffMoodLabel.style.color = currentStaff.Mood < 50 ? 
                new Color(1, 0.5f, 0) : // Orange for low mood
                new Color(0, 1, 0);     // Green for good mood

            // Energy display with color coding  
            staffEnergyLabel.text = $"Energy: {currentStaff.Stamina}%";
            staffEnergyLabel.style.color = currentStaff.Stamina < 30 ?
                new Color(1, 0, 0) :    // Red for exhausted
                new Color(0, 1, 0);     // Green for good energy

            // Status message and project assignment
            staffAssignedProjectLabel.text = currentStaff.StatusMessage;
            staffAssignedProjectLabel.style.color = currentStaff.StatusColor;

            // Visual feedback for current state
            root.style.backgroundColor = new StyleColor(currentStaff.StatusColor * 0.2f);
            statusIndicator.style.backgroundColor = currentStaff.StatusColor;
            
            // Update progress bars
            efficiencyBar.style.width = new StyleLength(new Length(currentStaff.Efficiency, LengthUnit.Percent));
            moodBar.style.width = new StyleLength(new Length(currentStaff.Mood, LengthUnit.Percent));
            energyBar.style.width = new StyleLength(new Length(currentStaff.Stamina, LengthUnit.Percent));
            
            // Tooltips for detailed info
            efficiencyBar.tooltip = $"Efficiency: {currentStaff.Efficiency}%";
            moodBar.tooltip = $"Mood: {currentStaff.Mood}%";
            energyBar.tooltip = $"Energy: {currentStaff.Stamina}%";

            // Button visibility
            assignToProjectButton.style.display = 
                currentStaff.AssignedProject == null ? DisplayStyle.Flex : DisplayStyle.None;
            unassignFromProjectButton.style.display = 
                currentStaff.AssignedProject != null ? DisplayStyle.Flex : DisplayStyle.None;
        }

        private string GetAssignedProjectName()
        {
            if (GameManager.Instance != null && !string.IsNullOrEmpty(currentStaff.AssignedProjectId))
            {
                Project assignedProject = GameManager.Instance.CurrentGameState.availableProjects.Find(p => p.Id == currentStaff.AssignedProjectId);
                if (assignedProject != null)
                {
                    return assignedProject.Name;
                }
            }
            return "Unknown Project";
        }

        private void OnDisable()
        {
            if (regenerateBioButton != null)
            {
                regenerateBioButton.clicked -= async () => await FetchAndDisplayBio(true);
            }
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
            if (StaffManager.Instance != null && GameManager.Instance != null && !string.IsNullOrEmpty(currentStaff.AssignedProjectId))
            {
                Project assignedProject = GameManager.Instance.CurrentGameState.availableProjects.Find(p => p.Id == currentStaff.AssignedProjectId);
                if (assignedProject != null)
                {
                    StaffManager.Instance.UnassignStaffFromProject(currentStaff, assignedProject);
                    UpdateUI(); // Update UI after unassignment
                    GameManager.Instance.OnGameStateChanged?.Invoke(); // Notify for broader state change
                }
            }
        }

        private async System.Threading.Tasks.Task FetchAndDisplayBio(bool forceRefresh)
        {
            if (currentStaff == null) return;
            staffBioLabel.text = "Loading bio...";
            string bio = null;
            if (forceRefresh)
            {
                // Bypass cache by using a unique prompt (add timestamp)
                bio = await TextGenerationManager.Instance.GetBio(currentStaff.Name, currentStaff.Role + $" ({System.DateTime.Now.Ticks})", currentStaff.Genre);
            }
            else
            {
                bio = await TextGenerationManager.Instance.GetBio(currentStaff.Name, currentStaff.Role, currentStaff.Genre);
            }
            staffBioLabel.text = !string.IsNullOrEmpty(bio) ? bio : "No bio available.";
        }
    }
}
