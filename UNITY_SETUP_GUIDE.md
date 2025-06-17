# Unity Setup Guide for Recording Studio Tycoon

This guide provides essential instructions for setting up the Unity project for "Recording Studio Tycoon" to ensure it compiles correctly from a fresh clone. It lists all required Unity packages and necessary project settings, particularly for a Unity 6 environment.

## Required Unity Packages

To resolve missing assembly references and ensure the project compiles, the following packages must be installed via the Unity Package Manager:

- **Input System**: Required for handling input actions such as `PlayerInput` and `InputAction`. This package enables the new input system in Unity, which is used for gameplay and UI interactions.
  - **Installation**: Open Unity Editor, go to `Window > Package Manager`, search for "Input System", and click `Install`.
  - **Version**: Ensure compatibility with Unity 6 by selecting the latest stable version (e.g., 1.7.0 or higher if available).

- **UI Toolkit/UGUI**: Required for UI components like `Button`, `Slider`, and `Image`. This package supports the Unity GUI system used extensively in the project's UI.
  - **Installation**: In the Package Manager, search for "UI Toolkit" or ensure "Unity UI" is installed (it may be included by default in Unity 6).
  - **Version**: Use the version compatible with Unity 6.

- **TextMeshPro**: Required for text rendering components like `TextMeshProUGUI`. This package is essential for UI text elements throughout the game.
  - **Installation**: In the Package Manager, search for "TextMeshPro" and click `Install`.
  - **Version**: Ensure the latest version compatible with Unity 6 is installed (e.g., 3.2.0-pre or higher).

- **DOTween**: Required for UI animations and other tweening effects managed by scripts like `UIAnimationManager.cs`.
  - **Installation**: DOTween is typically a third-party asset. You can install it via the Unity Asset Store or by importing it from a package source. In the Package Manager, if available, search for "DOTween" or follow the official documentation at [DOTween Website](http://dotween.demigiant.com/download.php) to download and import the package.
  - **Version**: Use the latest version compatible with Unity 6.

## Project Settings Configuration

After installing the required packages, configure the following project settings to ensure proper functionality:

- **Input System Setup**:
  - **Enable Input System**: Go to `Edit > Project Settings > Player > Other Settings`, and under `Configuration`, set `Active Input Handling` to `Input System Package (New)`.
  - **Input Actions Asset**: Ensure the project has an `Input Actions` asset configured. If not, create one via `Assets > Create > Input Actions`, and assign it in the `PlayerInput` component of relevant GameObjects (e.g., in `InputManager.cs` setup).
  - **Update Mode**: In `Project Settings > Input System`, set `Update Mode` to `Process Events in Dynamic Update` for optimal performance unless specific requirements dictate otherwise.

- **UI and TextMeshPro Settings**:
  - **TextMeshPro Essentials**: After installing TextMeshPro, import the TMP Essentials if prompted (this includes necessary shaders and resources). Go to `Window > TextMeshPro > Import TMP Essential Resources` if not already done.
  - **UI Canvas Setup**: Ensure that UI canvases in scenes are set to use the correct render mode (typically `Screen Space - Overlay`) and reference the appropriate Event System if using UI Toolkit alongside UGUI.

- **DOTween Setup**:
  - **Initialize DOTween**: After importing DOTween, run the setup wizard if prompted (accessible via `Tools > DOTween Utility Panel`) to configure settings like safe mode and log behavior. Accept the default settings unless specific project needs require customization.

## Verification Steps

Once the packages are installed and settings configured, verify the setup by:

1. **Compiling the Project**: In the Unity Editor, check if the project compiles without errors related to missing namespaces or types. Look for any remaining errors in the Console window.
2. **Testing Input**: Run a scene with input handling (if available) to confirm that input actions are recognized.
3. **Checking UI**: Open or create a UI-heavy scene to ensure UI elements and text render correctly.
4. **Animation Check**: Verify that DOTween animations work as expected in relevant UI components or test with a simple tween if a test scene is available.

## Troubleshooting

If compilation errors persist after following this guide:

- **Check Package Versions**: Ensure all installed packages are compatible with Unity 6. Downgrade or update packages if necessary via the Package Manager.
- **Reimport Assets**: Sometimes, reimporting assets can resolve reference issues. Go to `Assets > Reimport` in the Unity Editor.
- **Check Project Settings**: Double-check that `Active Input Handling` is set correctly and that no conflicting input settings are present.
- **Review Error Logs**: Look for specific error messages in the Unity Console to identify any remaining missing references or configuration issues not covered by this guide.

This setup guide ensures that developers can quickly configure a fresh clone of "Recording Studio Tycoon" to a compilable state, addressing the primary causes of build errors related to missing assembly references.
