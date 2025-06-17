using UnityEngine;
using UnityEngine.Events;

[CreateAssetMenu(fileName = "Settings", menuName = "Recording Studio Tycoon/Settings")]
public class SettingsSO : ScriptableObject
{
    public event UnityAction<string> OnThemeChanged = delegate { };

    [SerializeField] private string currentTheme = "sunrise-studio";
    public string CurrentTheme => currentTheme;

    public void SetTheme(string theme)
    {
        if (currentTheme != theme)
        {
            currentTheme = theme;
            OnThemeChanged?.Invoke(theme);
        }
    }

    // Other settings properties would go here
    // e.g. audio volume, language preferences, etc.
}
