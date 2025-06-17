# Album Art Generator UI Setup (Unity UI Toolkit)

## 1. Create the UXML Layout

1. **Open Unity UI Builder** (Window → UI Toolkit → UI Builder).
2. **Create a new UXML file** (e.g., `AlbumArtGenerator.uxml`).
3. **Add the following elements** (with the specified names):

```xml
<ui:UXML xmlns:ui="UnityEngine.UIElements">
  <ui:VisualElement name="album-art-generator-root" style="flex-direction:column; align-items:center; padding:20px;">
    <ui:Label text="Generate Album Art" class="title-label" />
    <ui:TextField name="song-title-field" label="Song Title" />
    <ui:DropdownField name="genre-dropdown" label="Genre" />
    <ui:DropdownField name="style-dropdown" label="Style" />
    <ui:Button name="generate-button" text="Generate Album Art" />
    <ui:VisualElement name="loading-spinner" style="display:none; height:32px; width:32px; align-self:center;">
      <!-- Add a spinner or animated icon here if desired -->
      <ui:Label text="Loading..." />
    </ui:VisualElement>
    <ui:Label name="error-label" text="" style="color:red; display:none;" />
    <ui:Image name="album-art-image" style="width:256px; height:256px; margin:10px;" />
    <ui:Button name="reroll-button" text="Re-roll" style="margin-top:10px;" />
    <ui:Button name="accept-button" text="Accept" style="margin-top:10px;" />
  </ui:VisualElement>
</ui:UXML>
```

- **Note:** You can style these elements further in a USS (UI StyleSheet) file.

---

## 2. Assign the UXML to a UIDocument

1. In your Unity scene, create an empty GameObject (e.g., `AlbumArtGeneratorUI`).
2. Add a `UIDocument` component to it.
3. Assign your `AlbumArtGenerator.uxml` file to the `Source Asset` field of the UIDocument.

---

## 3. Attach the Controller Script

1. Add the `AlbumArtGeneratorUI.cs` script to the same GameObject.
2. In the Inspector, assign the `UIDocument` reference to the script.
3. (Optional) If you have custom VisualTreeAssets for dropdowns or spinners, assign them as well.

---

## 4. Verify Element Names

- Make sure the following element names are set in the UXML and referenced in the script:
  - `song-title-field` (TextField)
  - `genre-dropdown` (DropdownField)
  - `style-dropdown` (DropdownField)
  - `generate-button` (Button)
  - `loading-spinner` (VisualElement)
  - `error-label` (Label)
  - `album-art-image` (Image)
  - `reroll-button` (Button)
  - `accept-button` (Button)

---

## 5. Test the Integration

- Enter a song title, select genre and style, and click "Generate Album Art".
- The UI should show a loading spinner, then display the generated image.
- Use "Re-roll" to generate again, or "Accept" to confirm.

---

## 6. (Optional) Styling

- Use a USS file to style the UI for a polished look.
- Add icons or a spinner animation to the `loading-spinner` element for better feedback.

---

**You can now use the Album Art Generator UI in your Unity project!**

Let me know if you need a sample USS, further UI Builder tips, or want to extend this pattern to other PolAI features. 