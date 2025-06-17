using UnityEngine;
using UnityEngine.UIElements;
using RecordingStudioTycoon.GameLogic; // Assuming GameManager is in this namespace

namespace RecordingStudioTycoon.UI
{
    public class MainMenuPanel : MonoBehaviour
    {
        [SerializeField] private UIDocument uiDocument;
        private VisualElement root;

        public delegate void GameAction();
        public event GameAction OnStartNewGameClicked;
        public event GameAction OnLoadGameClicked;

        void OnEnable()
        {
            root = uiDocument.rootVisualElement;
            
            // Register button callbacks
            root.Q<Button>("StartNewGameButton")?.RegisterCallback<ClickEvent>(evt => OnStartNewGameClicked?.Invoke());
            root.Q<Button>("LoadGameButton")?.RegisterCallback<ClickEvent>(evt => OnLoadGameClicked?.Invoke());
            // Add other main menu button registrations here
        }

        void OnDisable()
        {
            // Unregister button callbacks to prevent memory leaks
            root.Q<Button>("StartNewGameButton")?.UnregisterCallback<ClickEvent>(evt => OnStartNewGameClicked?.Invoke());
            root.Q<Button>("LoadGameButton")?.UnregisterCallback<ClickEvent>(evt => OnLoadGameClicked?.Invoke());
        }
    }
}