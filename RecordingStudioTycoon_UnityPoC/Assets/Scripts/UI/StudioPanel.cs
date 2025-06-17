using UnityEngine;
using UnityEngine.UIElements;
using RecordingStudioTycoon.GameLogic; // Assuming GameManager is in this namespace

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
                moneyLabel.text = $"Money: ${GameManager.Instance.GameState.money}";
                dayLabel.text = $"Day: {GameManager.Instance.GameState.currentDay}";
                yearLabel.text = $"Year: {GameManager.Instance.GameState.currentYear}";
            }
        }
    }
}