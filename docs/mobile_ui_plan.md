# Mobile UI Refactoring Plan for Recording Studio Tycoon

**Version:** 1.0
**Date:** June 16, 2025
**Author:** GitHub Copilot (Mobile Web UI/UX Engineer)

## 1. Introduction

This document outlines the plan to refactor the main interface of "Recording Studio Tycoon" to provide a seamless and intuitive touch-first experience on mobile browsers. The primary goal is to implement an arrow-based navigation system that replaces the traditional tab buttons on mobile viewports, while leaving the desktop experience unchanged.

## 2. Mobile Detection Strategy

We will use a combination of CSS media queries and a React hook (`useMediaQuery` or a similar custom hook) to reliably detect mobile viewports.

*   **CSS Media Queries:** Primarily for styling and layout adjustments. We'll define breakpoints (e.g., `max-width: 768px`) to apply mobile-specific styles.
*   **JavaScript (React Hook):** For conditional rendering of components (e.g., showing arrow navigation on mobile and tab navigation on desktop).
    *   The hook will listen to `window.matchMedia('(max-width: 768px)')`.
    *   It will provide a boolean state (e.g., `isMobile`) to components, which will update on viewport size changes.

This dual approach ensures that both styling and component logic are responsive to the viewport size.

## 3. UI Refactoring Blueprint

### 3.1. Current Desktop UI (Conceptual)

```
+------------------------------------------------------+
| Top Bar (Game Title, Resources, etc.)                |
+------------------------------------------------------+
| Tab Button 1 | Tab Button 2 | Tab Button 3 | ...      | <- Current Tab Navigation
+------------------------------------------------------+
|                                                      |
|                                                      |
|             Main Content Area for Active Tab         |
|                                                      |
|                                                      |
+------------------------------------------------------+
| Footer (Optional)                                    |
+------------------------------------------------------+
```

### 3.2. New Mobile UI (Conceptual)

```
+------------------------------------------------------+
| Top Bar (Game Title, Resources, etc.)                |
+------------------------------------------------------+
| <   Current Tab Name (e.g., "Studio")   >            | <- New Arrow Navigation
+------------------------------------------------------+
|                                                      |
|                                                      |
|             Main Content Area for Active Tab         |
|                                                      |
|                                                      |
+------------------------------------------------------+
| Footer (Optional)                                    |
+------------------------------------------------------+
```

*   **`<` (Left Arrow):** Large, easily tappable icon. Navigates to the previous tab.
*   **`>` (Right Arrow):** Large, easily tappable icon. Navigates to the next tab.
*   **`Current Tab Name`:** Clearly displays the name of the active tab.

## 4. Component Logic

### 4.1. Main Application Component (e.g., `App.tsx` or a dedicated layout component)

*   Will use the `isMobile` state from the mobile detection hook.
*   Conditionally renders either the existing desktop tab navigation or the new mobile arrow navigation.

### 4.2. `MobileArrowNavigation` Component (New)

*   **Props:**
    *   `tabs`: An array of tab objects/strings (e.g., `[{ id: 'studio', name: 'Studio' }, { id: 'skills', name: 'Skills' }]`).
    *   `activeTabId`: The ID of the currently active tab.
    *   `onNavigate`: A callback function `(newTabIndex: number) => void` to change the active tab.
*   **State:**
    *   `currentIndex`: The index of the `activeTabId` in the `tabs` array.
*   **Logic:**
    *   Displays the name of the tab at `currentIndex`.
    *   Left arrow click:
        *   Calculates `newIndex = (currentIndex - 1 + tabs.length) % tabs.length`.
        *   Calls `onNavigate(newIndex)`.
    *   Right arrow click:
        *   Calculates `newIndex = (currentIndex + 1) % tabs.length`.
        *   Calls `onNavigate(newIndex)`.
    *   Arrows will be styled to be large and easy to tap.

### 4.3. State Management for Active Tab

*   The state for the active tab (e.g., `activeTabId` or `activeTabIndex`) will continue to be managed in the existing component that currently handles tab switching (likely `App.tsx` or a parent component).
*   The `MobileArrowNavigation` component will receive the active tab and the means to change it via props. This ensures a single source of truth for the active tab across both mobile and desktop views.

## 5. Styling

*   Mobile-specific styles will be applied using CSS media queries.
*   The arrow navigation will be styled for high visibility and ease of use (large tap targets).
*   The existing desktop tab navigation will be hidden on mobile viewports using `display: none;` within a media query.

## 6. Documentation Plan (`MOBILE_UI.md`)

A new document, `MOBILE_UI.md`, will be created in the `/docs` directory. It will include:

*   **Overview:** Purpose of the mobile-specific UI and navigation.
*   **Mobile Detection:**
    *   Explanation of the `useMediaQuery` hook (or equivalent).
    *   How to adjust breakpoints if necessary.
*   **`MobileArrowNavigation` Component:**
    *   Props and their usage.
    *   Internal logic for navigation.
    *   Styling considerations (relevant CSS classes).
*   **Integration with Main Application:**
    *   How the `MobileArrowNavigation` is conditionally rendered.
    *   How tab state is passed and updated.
*   **Maintenance and Extension:**
    *   Guidelines for adding new tabs to ensure they work with both desktop and mobile navigation.
    *   Tips for testing on different mobile browsers (Chrome on Android, Safari on iOS).
    *   Potential future enhancements or considerations.
*   **Browser Compatibility:**
    *   Confirmation of testing and compatibility with standard Android (Chrome) and iOS (Safari) web browsers.

## 7. Implementation Phases

*   **Phase 0: Further Analysis (Internal)**
    *   Read `src/App.tsx` and any relevant components to fully understand the current tab implementation.
*   **Phase 1: Implement Touch-Friendly Navigation**
    *   Create the mobile detection hook (`useMediaQuery`).
    *   Develop the `MobileArrowNavigation` component.
    *   Integrate the new navigation into the main application structure, ensuring it only appears on mobile viewports.
    *   Thoroughly test tab cycling and content display on simulated mobile devices.
*   **Phase 2: Documentation**
    *   Add comprehensive code comments.
    *   Create and populate `MOBILE_UI.md`.

This plan provides a clear path forward for refactoring the UI for mobile devices.
