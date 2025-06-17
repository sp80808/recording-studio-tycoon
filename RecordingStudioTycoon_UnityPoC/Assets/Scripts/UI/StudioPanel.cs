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
        private VisualElement descriptionContainer;
        private Label descriptionHeaderLabel;

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

            // Add description section header and container
            descriptionHeaderLabel = root.Q<Label>("studio-description-header-label");
            if (descriptionHeaderLabel == null)
            {
                descriptionHeaderLabel = new Label("🏢 Studio Description")
                {
                    name = "studio-description-header-label",
                    style = {
                        unityFontStyleAndWeight = FontStyle.Bold,
                        fontSize = 16,
                        marginTop = 10,
                        marginBottom = 2
                    }
                };
                root.Add(descriptionHeaderLabel);
            }
            descriptionContainer = root.Q<VisualElement>("studio-description-container");
            if (descriptionContainer == null)
            {
                descriptionContainer = new VisualElement { name = "studio-description-container" };
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
            studioDescriptionLabel = root.Q<Label>("studio-description-label");
            if (studioDescriptionLabel != null && studioDescriptionLabel.parent != descriptionContainer)
            {
                studioDescriptionLabel.style.fontSize = 15;
                studioDescriptionLabel.style.unityFontStyleAndWeight = FontStyle.Italic;
                descriptionContainer.Add(studioDescriptionLabel);
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
            studioDescriptionLabel.style.opacity = 0f; // For fade-in
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
            // Fade-in animation
            FadeIn(studioDescriptionLabel, 0.5f);
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