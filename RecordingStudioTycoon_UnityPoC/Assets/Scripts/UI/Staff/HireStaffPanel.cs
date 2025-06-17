using UnityEngine;
using UnityEngine.UIElements;
using RecordingStudioTycoon.DataModels.Staff;
using RecordingStudioTycoon.ScriptableObjects;
using RecordingStudioTycoon.GameLogic;

using RecordingStudioTycoon.Systems.Staff;

public class HireStaffPanel : MonoBehaviour
{
    [SerializeField] private UIDocument uiDocument;
    [SerializeField] private StaffManager staffManager;
    [SerializeField] private GameStateSO gameState;
    
    private VisualElement root;
    private VisualElement hirePanel;
    private Button closeButton;
    private VisualElement staffOptionsContainer;

    void OnEnable()
    {
        root = uiDocument.rootVisualElement;
        hirePanel = root.Q<VisualElement>("hire-panel");
        closeButton = root.Q<Button>("close-button");
        staffOptionsContainer = root.Q<VisualElement>("staff-options");

        closeButton.clicked += HidePanel;
        RefreshAvailableStaff();
    }

    void OnDisable()
    {
        closeButton.clicked -= HidePanel;
    }

    public void ShowPanel()
    {
        hirePanel.style.display = DisplayStyle.Flex;
        RefreshAvailableStaff();
    }

    public void HidePanel()
    {
        hirePanel.style.display = DisplayStyle.None;
    }

    private void RefreshAvailableStaff()
    {
        staffOptionsContainer.Clear();

        foreach (StaffType type in System.Enum.GetValues(typeof(StaffType)))
        {
            var cost = staffManager.GetHireCost(type);
            var button = new Button(() => TryHireStaff(type, cost)) {
                text = $"{type} (${cost})",
                style = {
                    unityFontStyleAndWeight = FontStyle.Bold
                }
            };
            
            button.SetEnabled(gameState.CurrentState.finances.balance >= cost);
            staffOptionsContainer.Add(button);
        }
    }

    private void TryHireStaff(StaffType type, int cost)
    {
        if (gameState.CurrentState.finances.balance >= cost)
        {
            staffManager.HireStaff(type);
            HidePanel();
        }
    }
}
