using UnityEngine;
using RecordingStudioTycoon.DataModels.Progression;
using RecordingStudioTycoon.GameLogic;
using UnityEngine.UIElements;
using RecordingStudioTycoon.DataModels;
using RecordingStudioTycoon.ScriptableObjects;
using UnityEngine.UIElements;

public class LevelUpModal : MonoBehaviour
{
    [SerializeField] private UIDocument uiDocument;
    [SerializeField] private GameStateSO gameStateSO;

    private VisualElement root;
    private VisualElement modalContainer;
    private Button closeButton;

    void OnEnable()
    {
        root = uiDocument.rootVisualElement;
        modalContainer = root.Q<VisualElement>("modal-container");
        closeButton = root.Q<Button>("close-button");

        closeButton.clicked += OnClose;
        gameStateSO.OnLevelUp += ShowModal;
        
        HideModal();
    }

    void OnDisable()
    {
        closeButton.clicked -= OnClose;
        gameStateSO.OnLevelUp -= ShowModal;
    }

    public void ShowModal(LevelUpDetails details)
    {
        // Update UI with level up details
        root.Q<Label>("title").text = $"Level Up! ({details.newLevel})";
        root.Q<Label>("description").text = details.description;
        
        modalContainer.style.display = DisplayStyle.Flex;
    }

    public void HideModal()
    {
        modalContainer.style.display = DisplayStyle.None;
    }

    private void OnClose()
    {
        HideModal();
    }
}
