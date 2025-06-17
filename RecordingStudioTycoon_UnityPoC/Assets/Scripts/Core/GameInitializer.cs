using UnityEngine;
using UnityEngine.SceneManagement;

public class GameInitializer : MonoBehaviour
{
    [SerializeField] private SettingsSO settings;
    [SerializeField] private GameStateSO gameState;
    [SerializeField] private AudioManager audioManager;
    [SerializeField] private UIDocument mainUI;

    void Start()
    {
        InitializeSystems();
        LoadMainMenu();
    }

    private void InitializeSystems()
    {
        // Initialize audio system
        audioManager.Initialize();
        
        // Initialize interaction listener (equivalent to React's initInteractionListener)
        InputSystem.Instance.Enable();
        
        // Set initial theme
        mainUI.rootVisualElement.AddToClassList(settings.CurrentTheme);
    }

    private void LoadMainMenu()
    {
        SceneManager.LoadScene("MainMenu", LoadSceneMode.Additive);
    }
}
