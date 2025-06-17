# Unity UI Setup Instructions

## Prerequisites
- Unity 2022.3 or later
- UI Toolkit package installed
- TextMeshPro package installed

## Setup Steps

1. **Create New Scene**
   - Create a new scene named "MainScene"
   - Save it in Assets/Scenes/

2. **Set Up UI Document**
   - Create empty GameObject named "UI Root"
   - Add `UIDocument` component
   - Assign `MainUI.uxml` to Source Asset
   - Assign `MainUI.uss` to Stylesheet

3. **Create ScriptableObjects**
   - Right-click in Project window → Create → Recording Studio Tycoon → Settings
   - Name it "AppSettings"
   - Right-click → Create → Recording Studio Tycoon → Game State  
   - Name it "GameState"

4. **Configure MainUI Component**
   - Add `MainUI` component to UI Root
   - Drag references:
     - UIDocument field: The UIDocument on same object
     - Settings: AppSettings asset
     - SaveSystem: Your existing SaveSystem

5. **Add GameInitializer**
   - Create empty GameObject named "GameSystems"
   - Add `GameInitializer` component
   - Configure references:
     - Settings: AppSettings
     - GameState: GameState asset
     - AudioManager: Your audio manager
     - MainUI: The UIDocument on UI Root

6. **Test Theme Switching**
   - Enter Play Mode
   - In Inspector, select AppSettings asset
   - Change CurrentTheme between:
     - sunrise-studio
     - neon-nights  
     - retro-arcade

7. **Test Level Up Modal**
   - Select GameState asset in Project
   - Click "TriggerLevelUp" button in Inspector
   - Enter test level up details
   - Verify modal appears with correct info

## Troubleshooting

**UI Not Appearing?**
- Verify UIDocument has MainUI.uxml assigned
- Check no errors in Console
- Ensure GameInitializer is running

**Themes Not Working?**
- Verify all theme classes exist in MainUI.uss
- Check USS is assigned to UIDocument
- Confirm SettingsSO.OnThemeChanged is being called

**Need More Views?**
1. Create new .uxml files for each view
2. Add them to the Views/ folder
3. Use MainUI.ShowView() to display them
