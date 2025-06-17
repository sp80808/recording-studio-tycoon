using UnityEngine;
using UnityEngine.UIElements;
using RecordingStudioTycoon.GameLogic; // Assuming GameManager is in this namespace
using RecordingStudioTycoon.Systems;

namespace RecordingStudioTycoon.UI
{
    public class StudioPanel : MonoBehaviour
    {
        [SerializeField] private UIDocument uiDocument;
        private VisualElement root;

        // UI elements to display game state
        private Label moneyLabel;
        private Label dayLabel;
        private Label yearLabel;
        private Label studioDescriptionLabel;
        private Button regenerateDescriptionButton;

        public delegate void StudioAction();
        public event StudioAction OnOpenStudioPanelClicked; // Example for a button to open this panel

        void OnEnable()
        {
            root = uiDocument.rootVisualElement;

            // Initialize UI elements
            moneyLabel = root.Q<Label>("MoneyLabel");
            dayLabel = root.Q<Label>("DayLabel");
            yearLabel = root.Q<Label>("YearLabel");

            // Register button callbacks (example: if there's a button to advance day within the studio panel)
            root.Q<Button>("AdvanceDayButton")?.RegisterCallback<ClickEvent>(evt => GameManager.Instance.AdvanceDay());
            
            // Subscribe to GameState changes
            GameManager.OnGameStateChanged += UpdateUI;
            UpdateUI(); // Initial UI update

            // Add description label and button
            studioDescriptionLabel = root.Q<Label>("studio-description-label");
            if (studioDescriptionLabel == null)
            {
                studioDescriptionLabel = new Label("Loading description...");
                studioDescriptionLabel.name = "studio-description-label";
                root.Add(studioDescriptionLabel);
            }
            regenerateDescriptionButton = root.Q<Button>("regenerate-description-button");
            if (regenerateDescriptionButton == null)
            {
                regenerateDescriptionButton = new Button { text = "Regenerate Description", name = "regenerate-description-button" };
                root.Add(regenerateDescriptionButton);
            }
            regenerateDescriptionButton.clicked += async () => await FetchAndDisplayDescription(true);
            _ = FetchAndDisplayDescription(false);
        }

        void OnDisable()
        {
            // Unregister button callbacks
            root.Q<Button>("AdvanceDayButton")?.UnregisterCallback<ClickEvent>(evt => GameManager.Instance.AdvanceDay());

            // Unsubscribe from GameState changes
            GameManager.OnGameStateChanged -= UpdateUI;
        }

        private void UpdateUI()
        {
            if (GameManager.Instance != null && GameManager.Instance.GameState != null)
            {
                moneyLabel.text = $"Money: ${Systems.Finance.FinanceManager.Instance.CurrentMoney}";
                dayLabel.text = $"Day: {GameManager.Instance.GameState.currentDay}";
                yearLabel.text = $"Year: {GameManager.Instance.GameState.currentYear}";
            }
        }

        private async System.Threading.Tasks.Task FetchAndDisplayDescription(bool forceRefresh)
        {
            studioDescriptionLabel.text = "Loading description...";
            string description = null;
            try
            {
                if (forceRefresh)
                {
                    description = await TextGenerationManager.Instance.GetDescription("studio", "Main Studio (" + System.DateTime.Now.Ticks + ")");
                }
                else
                {
                    description = await TextGenerationManager.Instance.GetDescription("studio", "Main Studio");
                }
                studioDescriptionLabel.text = !string.IsNullOrEmpty(description) ? description : "No description available.";
            }
            catch (System.Exception ex)
            {
                studioDescriptionLabel.text = "Error loading description.";
                studioDescriptionLabel.style.color = new UnityEngine.Color(1, 0, 0); // Red for error
                UnityEngine.Debug.LogError($"Error fetching studio description: {ex.Message}");
            }
        }
    }
}