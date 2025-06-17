# Instructions: Setting up Unity and ReactUnity/core PoC

This guide will walk you through setting up a new Unity project and integrating ReactUnity/core for our Proof of Concept.

**Prerequisites:**
- Unity Hub installed.
- Unity Editor (Version 2021.3 or newer, as per ReactUnity/core requirements).
- Node.js (Version 20 or newer, for the React project setup).
- npm (comes with Node.js).

**Steps:**

**IMPORTANT CLARIFICATION:** To create a Unity project, you **must** use the "New project" button in Unity Hub. Do **not** use the "Add" button for this initial creation step, as "Add" is for linking an *already existing and valid* Unity project to the Hub.

1.  **Create a New Unity Project (Using "New project" button):**
    *   Open Unity Hub.
    *   On the "Projects" tab, click the **"New project"** button (usually in the top-right).
    *   Select a template (e.g., "2D Core" or "3D Core" - 2D Core is likely sufficient for UI-focused PoC).
    *   **Project Name:** `RecordingStudioTycoon_UnityPoC` (or similar).
    *   **Location:** Choose a suitable location on your system (this will be separate from your current web project directory).
    *   Ensure the Unity Version is 2021.3 or later.
    *   Click "Create project". Wait for Unity to open and initialize the project.

2.  **Install TextMeshPro Essentials (if not already prompted):**
    *   ReactUnity/core requires TMPro v3.
    *   If Unity prompts you to import TMP Essentials, click "Import TMP Essentials".
    *   If not prompted, you can do this via `Window > TextMeshPro > Import TMP Essential Resources`.

3.  **Install ReactUnity/core Package:**
    *   Once your Unity project is open:
    *   Go to `Window > Package Manager`.
    *   In the Package Manager window, click the `+` (plus) icon in the top-left corner.
    *   Select "Add package from git URL...".
    *   Enter the following URL for the core package:
        ```
        https://github.com/ReactUnity/core.git#latest
        ```
    *   Click "Add". Unity will download and install the package. This might take a few minutes.
    *   **Important:** ReactUnity also often uses a specific JavaScript engine. The installation instructions recommend `com.reactunity.quickjs`. Let's add that too.
    *   Again, click `+`, select "Add package from git URL...", and enter:
        ```
        https://github.com/ReactUnity/quickjs.git#package
        ```
        (Note: The `#package` might be important, or it might be included if you use OpenUPM later. If this direct git URL for quickjs fails, we might need to use OpenUPM as recommended by their docs, or find the correct git URL for the QuickJS binding they use.)
        *Alternatively, if direct git URLs give issues, or for future updates, consider using OpenUPM as ReactUnity's documentation recommends:*
        ```bash
        # Run this in your Unity Project's ROOT directory (outside Assets) via a terminal
        npx openupm-cli add com.reactunity.core com.reactunity.quickjs
        ```
        *This command adds the packages to your project's `manifest.json` and Unity should pick them up.*

4.  **Create the React Project for Unity:**
    *   Open a terminal or command prompt.
    *   Navigate to the **root directory** of your newly created Unity project (e.g., `path/to/RecordingStudioTycoon_UnityPoC`).
    *   Run the following command to create a React project configured for ReactUnity:
        ```bash
        npx @reactunity/create@latest
        ```
    *   This command will likely ask you some questions (e.g., project name for the React app, template).
        *   For project name, you can use something like `react-ui` or `UnityInterface`.
        *   Choose TypeScript if prompted.
    *   Once it's done, it will create a new folder (e.g., `react-ui`) inside your Unity project's root. This folder contains your React application.

5.  **Install React Project Dependencies:**
    *   In your terminal, navigate into the newly created React project folder (e.g., `cd react-ui`).
    *   Install the dependencies:
        ```bash
        npm install
        ```

6.  **Initial Run (Development Mode):**
    *   While still in the React project folder (`react-ui`), start the React development server:
        ```bash
        npm run start
        ```
    *   This will typically start a development server that watches for changes in your React code and recompiles it.

7.  **Set up React Renderer in Unity:**
    *   Go back to the Unity Editor.
    *   Create a new Scene or use the default SampleScene.
    *   In the Hierarchy window, right-click and select `UI > Canvas` to create a new UI Canvas. (If you chose a 2D template, a Canvas might already exist).
    *   Select the Canvas GameObject in the Hierarchy.
    *   In the Inspector window, click "Add Component".
    *   Search for and add the `ReactRendererUGUI` component. This component is provided by ReactUnity/core.
    *   The `ReactRendererUGUI` component will have properties to configure. It should automatically pick up the default script from your `react-ui/src/index.tsx` (or similar entry point). You might need to point it to the correct source file if it doesn't.

8.  **First Test in Unity:**
    *   With the React dev server (`npm run start`) still running in your terminal...
    *   Click the "Play" button in the Unity Editor.
    *   You should see the default ReactUnity welcome/sample UI render on the Canvas in the Game view.

**Next Steps (After this setup is complete and verified):**
Once you confirm that the default ReactUnity sample UI is running in your Unity project, we will proceed to:
1.  Create a simple React component for our PoC (e.g., `StaffListPoc.tsx`) in our main web project's `src/unity_poc_components/` directory.
2.  Copy this component into the `react-ui/src/components/` (or similar) directory of the Unity-React project.
3.  Modify `react-ui/src/index.tsx` to render our `StaffListPoc.tsx` component.
4.  Implement basic C# to React data passing.

Please follow these steps carefully. Let me know if you encounter any issues at any stage, or if any command behaves unexpectedly. Provide any error messages or relevant logs.
