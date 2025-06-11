# Polish Features & Localization Plan

**Date:** 2025-06-11
**Version:** 1.0

This document outlines the implementation plan for adding "polish" features to enhance the user experience and for introducing language localization, including Polish.

## Part 1: Polish Features (Game Refinements)

The goal of these features is to make the game feel more responsive, informative, and visually appealing.

### 1.1. Enhanced Tooltips

*   **Objective**: Provide contextual information on hover for various UI elements, reducing clutter and improving clarity.
*   **Implementation Steps**:
    1.  **Identify Targets**: Systematically identify UI elements that would benefit from tooltips (e.g., resource icons in the header, staff statistics, equipment bonuses, complex action buttons).
    2.  **Utilize Existing Components**: Leverage the `TooltipProvider` and `Tooltip` components (likely from `shadcn/ui` which wraps Radix UI).
    3.  **Content Creation**: Define concise and helpful text for each tooltip.
    4.  **Implementation**: Wrap target elements with the `Tooltip` component and provide the appropriate content.
*   **Tools**: `shadcn/ui` Tooltip components, React.

### 1.2. Subtle UI Animations & Transitions

*   **Objective**: Improve the dynamic feel of the UI with smooth transitions and interactive feedback.
*   **Implementation Steps**:
    1.  **Modals**:
        *   Apply `framer-motion`'s `initial`, `animate`, and `exit` props to modal components for smooth fade-in/slide-in effects.
    2.  **Buttons & Interactive Cards**:
        *   Use `framer-motion`'s `whileHover` (e.g., slight scale, shadow change) and `whileTap` (e.g., quick shrink-and-grow) props for immediate interactive feedback.
    3.  **Progress Bars**:
        *   Animate changes to progress bar widths/values using `framer-motion` for a smoother visual update.
*   **Tools**: `framer-motion` library.

### 1.3. Improved Notification System (Toasts)

*   **Objective**: Make notifications more engaging and informative.
*   **Implementation Steps**:
    1.  **Icons**: Add relevant icons (e.g., ℹ️ for info, ✅ for success, ⚠️ for warning, ❌ for error) to toast notifications. The `sonner` library (via `use-toast`) should support rendering custom React components or icons within toasts.
    2.  **Animations (Optional)**: Explore `sonner`'s capabilities for custom entrance/exit animations if the default is not sufficient.
*   **Tools**: `sonner` library, `lucide-react` for icons.

### 1.4. Visual Feedback for Game Actions

*   **Objective**: Provide clear, non-intrusive feedback for common game events.
*   **Implementation Steps**:
    1.  **Day Advance**: Implement a brief, centrally displayed overlay message (e.g., "Day Advanced!") that appears and fades out.
    2.  **Project Stage Completion**: Consider a small, celebratory animation (e.g., a sparkle effect or checkmark animation) near the relevant project UI.
*   **Tools**: React state management, `framer-motion` for animations.

### 1.5. Dynamic Background Elements (Optional - Lower Priority)

*   **Objective**: Enhance immersion by subtly changing background visuals based on game state (e.g., current era).
*   **Implementation Steps**:
    1.  **Simple Approach**: Implement CSS background transitions (e.g., gradient shifts) on the main game layout component, triggered by changes in `gameState.currentEra`.
    2.  **Advanced Approach**: Consider dynamic loading of different background images or animated elements per era.
*   **Tools**: CSS, React state.

## Part 2: Language Selection (Localization)

The goal is to enable players to experience the game in different languages, starting with English (source) and Polish.

### 2.1. Choose an Internationalization (i18n) Library

*   **Recommendation**: `i18next` with `react-i18next`.
*   **Reasoning**: Mature, feature-rich, widely adopted, good community support, handles plurals, context, and interpolation well.

### 2.2. Abstract Text Strings

*   **Process**:
    1.  Identify all user-facing text strings in components, hooks, and utility functions.
    2.  Replace hardcoded strings with translation keys (e.g., `t('myComponent.title')`).
    3.  Use interpolation for dynamic values (e.g., `t('welcomeMessage', { name: playerName })`).

### 2.3. Create Translation Files

*   **Structure**:
    *   `public/locales/en/common.json` (English translations)
    *   `public/locales/pl/common.json` (Polish translations)
    *   Additional namespaces (files) can be created for better organization if needed (e.g., `public/locales/en/minigames.json`).
*   **Content**: JSON objects mapping keys to translated strings.

### 2.4. Implement Language Switching Logic

*   **UI**: Add a language selector (e.g., dropdown) in the game's settings modal.
*   **State Management**:
    *   Store the selected language in `localStorage`.
    *   Manage the selected language via `SettingsContext`.
*   **Initialization**: Configure `i18next` to load the appropriate translation files based on the selected language. Update the language instance when the player changes settings.

### 2.5. Handle Dynamic Content & Formatting

*   **Plurals**: Use `i18next`'s pluralization features.
*   **Dates/Numbers**: Leverage `Date.prototype.toLocaleDateString()`, `Number.prototype.toLocaleString()`, or `Intl` API, driven by the selected language, for locale-specific formatting. `i18next` can also integrate with libraries for this.

### 2.6. Asset Localization (Consideration)

*   If images or other assets contain text, plan for creating localized versions. This might involve conditional asset loading based on the selected language.

### 2.7. Testing and Quality Assurance

*   Thoroughly test all languages:
    *   Check for untranslated strings (fallback to a default language or show keys).
    *   Verify layout integrity (some languages are more verbose).
    *   Ensure correct formatting and pluralization.
    *   Proofread for grammatical accuracy and natural phrasing.

### 2.8. Translation Workflow

*   Establish a process for:
    1.  Extracting new translatable strings from the code.
    2.  Providing source strings to translators.
    3.  Integrating new translations back into the project.
    *   Consider tools like `i18next-parser` to help extract keys.

This plan provides a structured approach to implementing these enhancements. Polish features will be tackled incrementally based on confidence and impact, while localization will be a more systematic effort.
