# Unity Port Fix Plan for Recording Studio Tycoon

This document outlines a comprehensive, step-by-step guide to resolve the compilation errors in the Unity 6 port of "Recording Studio Tycoon." The plan addresses missing assembly references, ambiguous references, and duplicate definitions as identified in the error log summary.

## Dependency Resolution

The following Unity packages must be installed via the Package Manager to address missing assembly references:

- [ ] **Input System**: To resolve missing `UnityEngine.InputSystem` namespace and types like `PlayerInput` and `InputAction`.
- [ ] **UI Toolkit/UGUI**: To resolve missing `UnityEngine.UI` namespace and types like `Button`, `Slider`, and `Image`.
- [ ] **TextMeshPro**: To resolve missing `TMPro` namespace and type `TextMeshProUGUI`.
- [ ] **DOTween**: To resolve missing `DG.Tweening` namespace, assuming `DG` refers to DOTween for animation.

**Action Steps:**
1. Open Unity Editor.
2. Navigate to Window > Package Manager.
3. Search for and install each of the above packages if not already present.
4. Verify installation by checking for the packages in the Package Manager window.

## Code Fix Strategy

This section details the file-by-file changes required to resolve namespace issues, ambiguous references, and duplicate definitions.

### Namespace Additions for Missing References

- **InputManager.cs** (Assumed location: `RecordingStudioTycoon_UnityPoC/Assets/Scripts/Core/` or similar)
  - **Fix**: Add `using UnityEngine.InputSystem;` at the top of the file.
  - **Rationale**: Resolves missing Input System types like `PlayerInput` and `InputAction`.

- **UIAnimationManager.cs** (Location: `RecordingStudioTycoon_UnityPoC/Assets/Scripts/UI/Animation/UIAnimationManager.cs`)
  - **Fix**: Add `using DG.Tweening;`, `using UnityEngine.UI;`, and `using TMPro;` at the top of the file.
  - **Rationale**: Addresses missing namespaces for DOTween animations, UI components, and TextMeshPro.

- **StaffCardUI.cs**, **StaffListUI.cs**, **HireStaffPanel.cs** (Location: `RecordingStudioTycoon_UnityPoC/Assets/Scripts/UI/Staff/`)
  - **Fix**: Add `using UnityEngine.UI;` and `using TMPro;` to each file.
  - **Rationale**: These UI scripts likely use UI components and TextMeshPro for rendering staff information.

- **LevelUpModal.cs** (Location: `RecordingStudioTycoon_UnityPoC/Assets/Scripts/UI/Modals/LevelUpModal.cs`)
  - **Fix**: Add `using UnityEngine.UI;` and `using TMPro;`.
  - **Rationale**: UI modal for level-up likely requires these namespaces for buttons and text.

- **UIManager.cs** (Location: `RecordingStudioTycoon_UnityPoC/Assets/Scripts/UI/UIManager.cs`)
  - **Fix**: Add `using UnityEngine.UI;` and `using TMPro;`.
  - **Rationale**: Central UI manager script will need access to UI and TextMeshPro components.

### Ambiguous Reference Fixes

- **ChartsGenerator.cs** (Location: `RecordingStudioTycoon_UnityPoC/Assets/Scripts/Utils/ChartsGenerator.cs`)
  - **Fix**: Replace ambiguous `Song` references with fully qualified name `RecordingStudioTycoon.DataModels.Songs.Song`.
  - **Rationale**: Disambiguates between potential `Song` types in different namespaces.

- **LevelUpDetails.cs** (Location: `RecordingStudioTycoon_UnityPoC/Assets/Scripts/DataModels/Progression/LevelUpDetails.cs`)
  - **Fix**: Identify and use fully qualified names for `LevelUpDetails` if it exists in multiple namespaces, or adjust namespace if necessary.
  - **Rationale**: Resolves ambiguity by specifying the exact type path.

### Duplicate Definition Resolutions

- **ProgressionData.cs** (Locations: `RecordingStudioTycoon_UnityPoC/Assets/ScriptableObjects/ProgressionData.cs` and potentially elsewhere)
  - **Strategy**: 
    1. Identify both instances of `ProgressionData.cs`.
    2. Compare content to determine if they are identical or if one is outdated.
    3. If identical, delete the duplicate file. If different, merge necessary unique content into one file and then delete the other.
    4. Update any references to the deleted file if necessary.
  - **Rationale**: Eliminates duplicate class definitions causing CS0101 errors by consolidating into a single definition.

- **ProjectData.cs** (Locations: `RecordingStudioTycoon_UnityPoC/Assets/ScriptableObjects/ProjectData.cs` and potentially elsewhere)
  - **Strategy**: 
    1. Identify both instances of `ProjectData.cs`.
    2. Compare content to determine if they are identical or if one is outdated.
    3. If identical, delete the duplicate file. If different, merge necessary unique content into one file and then delete the other.
    4. Update any references to the deleted file if necessary.
  - **Rationale**: Eliminates duplicate class definitions causing CS0101 errors by consolidating into a single definition.

## Implementation Phases

### Phase 1: Code Correction

1. **Fix Namespaces & Ambiguity**:
   - Open each identified C# file in the Unity Editor or VSCode.
   - Add the specified `using` directives at the top of each file.
   - Replace ambiguous type references with fully qualified names as outlined.

2. **Resolve Duplicate Definitions**:
   - Locate duplicate files using file search in Unity Editor or VSCode.
   - Execute the strategy for `ProgressionData.cs` and `ProjectData.cs` to remove or merge duplicates.
   - Verify that no other duplicates exist by reviewing error logs post-initial fixes.

### Phase 2: Documentation

1. **Code Comments**:
   - In each modified file, where significant changes are made (e.g., fully qualified names for ambiguity), add a comment like:
     ```csharp
     // Fully qualified to resolve ambiguity between multiple 'Song' types.
     ```
   - This ensures future developers understand the reasoning behind the change.

2. **Create UNITY_SETUP_GUIDE.md**:
   - Draft a comprehensive guide listing all required Unity packages and project settings.
   - Include steps for setting up the Input System if specific configurations are needed.
   - This document will be created post-code fixes to ensure accuracy based on actual resolutions.

## Post-Fix Verification

- After completing Phase 1, attempt to compile the project in Unity Editor.
- Review any remaining errors in the console.
- Iterate on fixes if new issues are identified, updating this plan if necessary.
- Once compilation succeeds, proceed to Phase 2 for documentation.

This plan serves as the roadmap to achieve a compilable state for "Recording Studio Tycoon" in Unity 6, addressing all identified compilation errors systematically.
