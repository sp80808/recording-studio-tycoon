# Plan for Asset Integration into Unity Project

## 1. Asset Inventory

Based on the provided file list and your clarification, the primary asset types and their potential locations in the web-based codebase (`/Users/user/Downloads/Game - App - Development/Recording Studio Tycoon/`) are:

*   **Audio Files:**
    *   **Types:** `.mp3`, `.wav`
    *   **Directories:**
        *   `src/audio/chart_clips/`
        *   `src/audio/drums/`
        *   `src/audio/music/`
        *   `src/audio/ui sfx/`
*   **Images/Sprites:**
    *   **Types:** Likely `.png`, `.jpg`, `.svg` (potentially inline or base64 encoded).
    *   **Directories:** Directly referenced within:
        *   `src/styles/` (e.g., `src/styles/globals.css`, `src/App.css`, `src/index.css`)
        *   Individual component files within `src/components/` (e.g., `src/components/ui/` components, `src/components/FloatingXPOrb.tsx`).
        *   No dedicated asset directory for images was identified.
*   **Fonts:**
    *   **Types:** Likely `.ttf`, `.otf`, `.woff`, `.woff2` (referenced via `@font-face`).
    *   **Directories:** Directly referenced within:
        *   `src/styles/` (e.g., `src/styles/globals.css`)
        *   No dedicated asset directory for fonts was identified.
*   **3D Models/Animations:**
    *   No indication of 3D models or complex animations in the web-based codebase. The Unity project is a full rebuild, implying 3D elements will be created natively in Unity.

## 2. Integration Strategy per Asset Type

### Audio Files
*   **Import Strategy:** Directly import all `.mp3` and `.wav` files from the identified `src/audio/` subdirectories into the Unity project's `RecordingStudioTycoon_UnityPoC/Assets/Audio/` folder. Unity natively supports these formats.
*   **Usage by `AudioManager.cs`:**
    *   Create `AudioClip` assets in Unity for each imported audio file.
    *   The `AudioManager.cs` (as mentioned in `docs/architecture.md`) will be responsible for managing and playing these audio clips.
    *   Audio clips for background music (BGM), sound effects (SFX), and minigame-specific audio will be assigned to appropriate `AudioSource` components in Unity scenes or dynamically loaded and played via C# scripts.
    *   Consider using Unity's Audio Mixer for better control over volume, effects, and routing of different audio types.

### Images/Sprites
*   **Identification & Extraction:**
    *   Manually inspect CSS files (`src/styles/*.css`, `src/App.css`, `src/index.css`) and TypeScript/React component files (`src/components/**/*.tsx`) for image references (e.g., `url()`, `data:image/`, inline `<svg>`).
    *   Extract any identified image data (e.g., base64 encoded images, SVG code) and save them as individual `.png`, `.jpg`, or `.svg` files.
*   **Import Strategy:** Import extracted image files into Unity's `RecordingStudioTycoon_UnityPoC/Assets/Sprites/` or `RecordingStudioTycoon_UnityPoC/Assets/Textures/` folders.
*   **Replication in Unity:**
    *   **UI Elements:** For UI elements like buttons, panels, and backgrounds, use Unity's UGUI or UI Toolkit components.
        *   Import extracted images as `Sprite (2D and UI)` texture type in Unity.
        *   Use Unity's Sprite Editor to slice sprites from texture atlases if multiple UI elements are combined into one image.
        *   Apply these sprites to `Image` components in the Unity UI.
    *   **In-Game Visuals (2D Sprites):** If any in-game visuals were 2D sprites, import them as `Sprite (2D and UI)` and use `SpriteRenderer` components on GameObjects in the scene.
    *   **Vector Graphics (SVG):** For SVG assets, consider using a Unity package that supports SVG import (e.g., Unity's Vector Graphics package) to maintain scalability and crispness.

### Fonts
*   **Identification & Extraction:**
    *   Manually inspect CSS files (`src/styles/globals.css`, `src/App.css`, `src/index.css`) for `@font-face` declarations to identify custom font file names and paths.
    *   Locate and extract the actual font files (e.g., `.ttf`, `.otf`, `.woff`, `.woff2`) from the web-based codebase.
*   **Import Strategy:** Import extracted font files into Unity's `RecordingStudioTycoon_UnityPoC/Assets/Fonts/` folder.
*   **Usage in Unity:**
    *   For optimal text rendering and control, it is highly recommended to use **TextMeshPro** in Unity.
    *   Import the font files into TextMeshPro to create TextMeshPro Font Assets.
    *   Apply these TextMeshPro Font Assets to `TextMeshProUGUI` components for all UI text elements.

### 3D Models/Animations (if applicable)
*   As per current understanding, the web-based codebase does not contain 3D models or complex animations that need porting. The Unity project is a full rebuild focusing on native Unity 3D capabilities. If any 3D elements are discovered later, they would require conversion to Unity-compatible formats (e.g., `.fbx`, `.obj`, `.gltf`) and import into `Assets/Models/` and `Assets/Animations/`.

### Avoiding Duplication
*   **Direct Import:** For audio, images, and fonts, the strategy involves directly importing the source files into the Unity project's `Assets/` folder. This is the standard and most efficient way to manage assets in Unity.
*   **No External Referencing:** Unity's project structure typically does not support external referencing or symbolic links for assets in a way that maintains full editor functionality and build integrity. Direct import into the `Assets/` folder is the best practice. The "avoiding duplication" primarily refers to not recreating assets from scratch if they already exist in a usable format.

## 3. Initial Scene Setup Plan

```mermaid
graph TD
    A[Unity Project] --> B(Scenes)
    B --> C1[MainMenuScene]
    B --> C2[StudioScene]
    B --> C3[MinigameScene]

    C1 --> D1[GameManager (Singleton)]
    C1 --> D2[UIManager]
    C1 --> D3[AudioManager]
    C1 --> D4[SaveSystem]

    C2 --> D1
    C2 --> D2
    C2 --> D3
    C2 --> D4
    C2 --> E1[Studio Environment (3D)]
    C2 --> E2[Interactive Equipment Placeholders]
    C2 --> E3[Staff Placeholders]

    C3 --> D1
    C3 --> D2
    C3 --> D3
    C3 --> D4
    C3 --> F1[MinigameManager]
    C3 --> F2[Minigame Specific Logic]
```

*   **Creation of Essential Unity Scenes:**
    *   **`MainMenuScene`**: This scene will serve as the entry point of the game. It will contain UI elements for "New Game", "Load Game", "Settings", and "Exit".
    *   **`StudioScene`**: This will be the core gameplay scene, representing the player's recording studio. It will house all interactive elements, staff, and equipment.
    *   **`MinigameScene`**: A dedicated scene for loading and running various minigames. This can be a single scene that dynamically loads minigame-specific content, or a template for multiple minigame scenes.

*   **Instantiation and Configuration of Core System Managers:**
    *   In each of the above scenes, create an empty GameObject named `_Managers`.
    *   Attach the following C# scripts (MonoBehaviours) to this `_Managers` GameObject:
        *   `GameManager.cs`: The central orchestrator (Singleton).
        *   `UIManager.cs`: Manages UI panels, HUD updates, and settings.
        *   `AudioManager.cs`: Handles all in-game audio.
        *   `SaveSystem.cs`: Manages game saving and loading.
        *   `MinigameManager.cs` (primarily in `MinigameScene`): Manages minigame flow and logic.
    *   Ensure `GameManager` is configured as a Singleton as per `docs/technical.md` to be accessible globally.

*   **Basic Layout for `StudioScene`:**
    *   **Environment:** Create a basic 3D environment for the studio (e.g., simple planes for floor, walls, and ceiling).
    *   **Interactive Elements:** Place simple 3D primitives (cubes, cylinders) or 2D sprites as placeholders for interactive equipment (e.g., mixing console, microphones, computers, instrument racks) and staff desks.
    *   **Script Linking:** Attach relevant C# scripts to these placeholders:
        *   `Interactable.cs` (from `RecordingStudioTycoon_UnityPoC/Assets/Scripts/Gameplay/Environment/Interactable.cs`) to define interaction types.
        *   `Equipment.cs` (or similar, if not already defined) to manage equipment-specific logic and link to `EquipmentData` ScriptableObjects.
        *   Placeholder scripts for staff interaction.
    *   **Camera:** Implement a basic camera system that allows the player to navigate and view different parts of the studio.

## 4. Visual Fidelity Replication

*   **Color Palettes and Themes:**
    *   **Extraction:** Analyze `src/styles/colors.ts`, `src/App.css`, `src/index.css`, and `src/styles/globals.css` to identify the core color palette and any defined themes.
    *   **Implementation:**
        *   Create a custom ScriptableObject in Unity (e.g., `ThemeData.asset`) to store color values and other theme-related properties.
        *   Develop a `ThemeManager.cs` script that can apply these colors to UI elements dynamically.
        *   Alternatively, directly set colors on Unity UI components using the extracted RGB/RGBA values.
*   **UI Element Styling (Buttons, Panels, Text Fields):**
    *   **Analysis:** Examine the CSS and component files for specific styling rules (borders, shadows, gradients, hover states, active states, font sizes, padding, margins).
    *   **Replication:**
        *   Use Unity's UGUI or UI Toolkit components.
        *   For UGUI, customize `Button`, `Image` (for panels/backgrounds), and `InputField` components using their inspector properties. Create custom sprites for button states (normal, highlighted, pressed, disabled).
        *   If using UI Toolkit, leverage USS (Unity Style Sheets) to mimic CSS-like styling, allowing for more direct translation of web styles.
        *   Ensure consistent font usage (TextMeshPro recommended) and text styling (color, size, alignment).
*   **Specific Visual Effects or Animations:**
    *   **Identification:** Review `src/App.css`, `src/styles/minigames.css`, `src/styles/staffAssignment.css`, `src/styles/tutorial.scss`, and components like `AnimatedNumber.tsx`, `FloatingRewardOrb.tsx`, `FloatingXPOrb.tsx` for CSS animations, transitions, and JavaScript-driven visual effects.
    *   **Replication:**
        *   **Unity Animation System:** For UI elements and 3D objects, use Unity's Animator component and Animation Clips to recreate transitions, scaling, fading, and movement.
        *   **Particle System:** For effects like floating XP or reward orbs, use Unity's Particle System to create visually similar effects.
        *   **Custom C# Scripts:** For more complex or dynamic visual effects (e.g., waveform visualizations in minigames, dynamic charts), implement custom C# scripts that manipulate UI elements or render custom graphics.

## 5. Prefab Strategy

Key game elements that should be converted into Unity Prefabs for reusability, consistency, and efficient scene management:

*   **Interactive Equipment:**
    *   Each distinct piece of equipment (e.g., "Mixing Console", "Microphone", "Computer", "Synthesizer").
    *   Prefabs will include the 3D model/sprite, `Interactable.cs` script, and any equipment-specific C# components.
*   **Staff Models:**
    *   If staff members have visual representations (e.g., character models or 2D sprites).
    *   Prefabs for different staff archetypes or base models that can be customized.
*   **Collectible Items:**
    *   Any items that can be picked up, placed, or appear in the game world (e.g., "Money Bag", "XP Orb", "Upgrade Part").
*   **Reusable UI Components:**
    *   Custom buttons (e.g., with specific hover/click animations).
    *   Standardized panels and modal dialogs (e.g., "Confirmation Dialog", "Settings Panel").
    *   Progress bars (e.g., "XP Bar", "Project Progress Bar").
    *   Notification elements (e.g., "Toast messages").
    *   Any complex UI widgets that appear multiple times across different scenes.