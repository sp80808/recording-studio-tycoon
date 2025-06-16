# Mobile UI Documentation (Recording Studio Tycoon)

**Version:** 1.0
**Date:** June 16, 2025
**Author:** GitHub Copilot (Mobile Web UI/UX Engineer)

## 1. Overview

This document details the mobile-specific user interface (UI) and navigation system implemented in "Recording Studio Tycoon." The primary goal of this system is to provide a seamless, touch-friendly experience on mobile browsers (Android Chrome, iOS Safari) while preserving the existing desktop UI.

The mobile UI replaces the traditional multi-column desktop layout with a single-panel view navigated by prominent arrow buttons and swipe gestures.

## 2. Mobile Detection

The application reliably detects mobile viewports using a custom React hook: `useMediaQuery`.

*   **File:** `src/hooks/useMediaQuery.ts`
*   **Usage:** `const isMobile = useMediaQuery('(max-width: 768px)');`
*   **Mechanism:** This hook utilizes `window.matchMedia()` to listen for changes in viewport size relative to the provided CSS media query (currently `max-width: 768px`). It returns a boolean (`true` if the query matches, `false` otherwise), which components can use for conditional rendering and logic.
*   **Breakpoint:** The current breakpoint for mobile is `768px`. If this needs adjustment, modify the query string passed to `useMediaQuery` in `src/components/MainGameContent.tsx` and any relevant CSS media queries.

## 3. Core Mobile Navigation Components

### 3.1. `MobileArrowNavigation` Component

*   **File:** `src/components/layout/MobileArrowNavigation.tsx`
*   **Purpose:** Renders the top navigation bar for mobile, featuring left/right arrows and the current tab name.
*   **Props:**
    *   `tabs: Tab[]`: An array of `Tab` objects (`{ id: string, name: string }`) representing the navigable sections.
    *   `activeTabId: string`: The `id` of the currently active tab.
    *   `onNavigate: (tabId: string) => void`: A callback function invoked when an arrow is tapped, passing the `id` of the target tab.
*   **Logic:**
    *   Displays the `name` of the `activeTabId`.
    *   Left arrow navigates to the previous tab in the `tabs` array (loops).
    *   Right arrow navigates to the next tab in the `tabs` array (loops).
*   **Styling:** Styled with Tailwind CSS. It is hidden on medium and larger screens (`md:hidden`). Icons are from `lucide-react`.

### 3.2. `MainGameContent.tsx` - Mobile Integration

*   **File:** `src/components/MainGameContent.tsx`
*   **Role:** This component is central to the mobile UI. It orchestrates the display of different game panels based on the `isMobile` flag and `activeMobileTabIndex` state.
*   **Key States for Mobile:**
    *   `isMobile: boolean`: Derived from `useMediaQuery('(max-width: 768px)')`.
    *   `activeMobileTabIndex: number`: An integer representing the index of the currently visible panel (0 for Projects, 1 for Studio, 2 for Management).
    *   `mobileTabs: Tab[]`: An array defining the three main panels available on mobile.
*   **Conditional Rendering:**
    *   If `isMobile` is true, `MobileArrowNavigation` is rendered at the top.
    *   The main content area becomes a swipeable container.
*   **Swipe Navigation:**
    *   Implemented using `onTouchStart`, `onTouchMove`, and `onTouchEnd` handlers on a wrapper `div` (`swipeContainerRef`).
    *   Calculates swipe direction and distance to change `activeMobileTabIndex`.
    *   A `SWIPE_THRESHOLD` prevents accidental tab changes from minor touch movements.
    *   The `swipeContainerRef` uses CSS `transform: translateX()` to visually move between panels.
*   **Panel Structure (Mobile):**
    *   The three main panels (`ProjectList`, `ProgressiveProjectInterface`, `RightPanel`) are rendered horizontally within the swipe container.
    *   Each panel takes up `100% / mobileTabs.length` of the container's width.
    *   `overflow-y-auto` is applied to each panel for independent scrolling.
*   **Desktop View:** If `isMobile` is false, the component reverts to its standard three-column desktop layout. The swipe container and `MobileArrowNavigation` are not active or rendered.

## 4. State Management for Active Tab (Mobile)

*   The `activeMobileTabIndex` state in `MainGameContent.tsx` is the single source of truth for the currently displayed panel on mobile.
*   **Updating `activeMobileTabIndex`:**
    1.  **Arrow Navigation:** `MobileArrowNavigation` calls the `handleMobileNavigate` function (passed as `onNavigate` prop), which updates `activeMobileTabIndex`.
    2.  **Swipe Gestures:** The `handleTouchEnd` function directly updates `activeMobileTabIndex` based on swipe direction.
    3.  **Programmatic Navigation:** For instance, when a project is selected in the `ProjectList` panel on mobile, `activeMobileTabIndex` is set to `1` to automatically switch to the `Studio` panel.
*   The `useEffect` hook listening to `[activeMobileTabIndex, isMobile]` ensures the `swipeContainerRef` visually transitions to the correct panel.

## 5. Styling and CSS

*   **Tailwind CSS:** Used extensively for styling both mobile and desktop views.
*   **Mobile-Specific Styles:**
    *   `MobileArrowNavigation` has `md:hidden` to hide it on screens medium and up.
    *   `MainGameContent.tsx` uses conditional classes and styles:
        *   The swipe container (`swipeContainerRef`) gets specific `width` and `transition` styles when `isMobile` is true.
        *   Individual panels within the swipe container get `width: calc(100% / ${mobileTabs.length})` and `flex-shrink-0` when `isMobile` is true.
        *   Desktop column classes (e.g., `w-1/4`, `w-1/2`) are applied when `isMobile` is false.

## 6. Maintenance and Extension

*   **Adding/Modifying Tabs (Panels):**
    1.  Update the `mobileTabs` array in `MainGameContent.tsx` if the number or order of main panels changes.
    2.  Adjust the `width` calculation for the swipe container and its child panels accordingly (e.g., if you have 4 tabs, it would be `width: '400%'` for the container and `width: 'calc(100% / 4)'` for each panel).
    3.  Ensure any new panel component is added to the JSX within the swipe container in the correct order.
*   **Breakpoint Adjustment:** To change the viewport width at which the UI switches between mobile and desktop, modify the media query string in `useMediaQuery('(max-width: 768px)')` within `MainGameContent.tsx`. Also, update any corresponding CSS media queries if they exist elsewhere.
*   **Testing:**
    *   Thoroughly test on physical Android (Chrome) and iOS (Safari) devices if possible.
    *   Use browser developer tools for mobile emulation, paying attention to touch interactions and viewport resizing.
    *   Verify that arrow navigation, swipe gestures, and programmatic tab changes work as expected.
    *   Ensure the desktop UI remains unaffected.

## 7. Browser Compatibility

*   **Target Browsers:** Modern versions of Chrome on Android and Safari on iOS.
*   **`window.matchMedia`:** Widely supported, but `useMediaQuery` includes fallbacks for older Safari versions' deprecated `addListener`/`removeListener` methods.
*   **CSS Flexbox & Transforms:** Well-supported in target browsers.
*   **Touch Events:** Standard browser feature.

This mobile UI system is designed to be robust and maintainable, providing a good user experience on smaller screens without compromising the desktop interface.
