# Mobile Porting Roadmap for Recording Studio Tycoon

This document outlines a strategic roadmap for porting the web-based "Recording Studio Tycoon" game to native mobile applications for iOS and Android platforms. The goal is to leverage the existing React/TypeScript codebase while delivering a seamless, performant, and engaging mobile experience.

## 1. Overall Strategy & Platform Choice

-   **Platform:** React Native is the recommended primary platform.
    -   **Rationale:** Allows for significant code reuse from the existing React web application, speeding up development. Provides near-native performance and access to native device features. Strong community support and extensive libraries.
-   **Alternative/Fallback:** Capacitor could be considered if React Native presents insurmountable challenges with Web Audio API or specific complex UI views.
    -   **Rationale:** Wraps the existing web app in a WebView, offering faster initial porting but potentially sacrificing some performance and native feel.

## 2. Pre-Production (Months 1-2)

### 2.1. Requirements Analysis & Technical Assessment
-   **Core Functionality Porting:**
    -   Identify all core game mechanics, UI components, and state management logic to be ported.
    -   Assess compatibility of existing React components with React Native.
-   **Touch Controls:**
    -   Design intuitive touch controls for all game interactions, especially minigames (e.g., RhythmTimingGame, MixingBoardGame, and the new GearMaintenanceGame).
    -   Plan for gesture-based interactions (swipes, drags, taps).
-   **Offline Play:**
    -   **State Management:** Replace or augment Supabase cloud saves with local storage for offline play. AsyncStorage (React Native built-in) or a lightweight SQLite database (e.g., via `react-native-sqlite-storage`) are options.
    -   **Data Sync:** Design a system for syncing local state with Supabase when an internet connection is available. Handle potential conflicts.
    -   **Asset Management:** Determine which assets need to be bundled with the app vs. downloaded on demand.
-   **Push Notifications:**
    -   Plan for notifications for key game events (e.g., project completion, chart updates, staff training completion, new artist opportunities).
    -   Evaluate services like Firebase Cloud Messaging (FCM) or OneSignal.
-   **Responsive UI & Screen Sizes:**
    -   Adapt existing Tailwind CSS-based UI for various phone and tablet screen sizes and orientations.
    -   Leverage React Native's Flexbox and platform-specific styling capabilities.
-   **Web Audio API Compatibility:**
    -   **Challenge:** Direct Web Audio API usage might be inconsistent or limited in React Native WebViews or require native modules.
    -   **Solutions:**
        -   Investigate libraries like `react-native-sound`, `react-native-track-player`, or `expo-av` for audio playback.
        -   For complex Web Audio API usage (e.g., dynamic sound synthesis in minigames or `GameAudioSystem`), explore using a hidden WebView (`react-native-webview`) dedicated to audio processing if native alternatives are insufficient. This WebView would communicate with the React Native JS thread.
        -   Consider simplifying some audio features if porting proves too complex or performance-impacting.
-   **Performance Targets:**
    -   Target <5s initial load time.
    -   Aim for 60 FPS for UI animations and minigames.
    -   Optimize for low-to-mid-range mobile devices.
-   **Build Tools & CI/CD:**
    -   Set up development environment for React Native (Expo CLI or React Native CLI).
    -   Plan for CI/CD pipelines for automated builds and testing (e.g., EAS Build, App Center, Jenkins).

### 2.2. Game Design Adjustments
-   **UI Simplification:**
    -   Increase tap target sizes for buttons and interactive elements (e.g., in `GameHeader.tsx`, `RightPanel.tsx`).
    -   Consider collapsible panels or tabbed navigation for complex screens to save space.
-   **Mobile-Specific Tutorials:**
    -   Adapt `TutorialProvider` to include tutorials for touch gestures and mobile-specific UI.
-   **Minigame Optimization for Touch:**
    -   Redesign minigame interactions for touch (e.g., swipe for `BeatMakingGame.tsx`, drag-and-drop for staff assignment).
-   **Session Length:**
    -   Consider adjustments for shorter mobile play sessions (e.g., quicker save/resume, more frequent milestones).

### 2.3. UI/UX Mockups & Prototyping
-   Create mobile-specific UI mockups for key screens, focusing on touch-friendliness and responsive layouts.
-   Prototype high-risk interactions (e.g., complex minigames on touchscreens) early.

## 3. Production (Months 3-6)

### 3.1. Core Codebase Porting
-   **Component Adaptation:** Port existing React components (e.g., `ChartsPanel.tsx`, `EquipmentDetailModal.tsx`) to React Native. This will involve replacing web-specific HTML elements (div, span, button) with React Native equivalents (View, Text, TouchableOpacity).
-   **Styling:** Translate Tailwind CSS utility classes to React Native styling (e.g., using `twrnc` or manually creating StyleSheet objects).
-   **Navigation:** Implement mobile navigation using a library like React Navigation.
-   **State Management:** Ensure `useGameState` and other custom hooks function correctly in the React Native environment.

### 3.2. Native Module Integration
-   Implement native modules or bridges if needed for specific functionalities (e.g., advanced audio processing, specific device APIs).

### 3.3. Feature Implementation
-   **Touch Controls:** Implement designed touch controls across the game.
-   **Offline Support:** Integrate chosen local storage solution and data sync logic.
-   **Push Notifications:** Implement notification system.

### 3.4. Performance Optimization
-   **Asset Compression:** Optimize all assets (images, audio) for mobile to reduce app size and memory usage.
-   **Rendering Optimization:**
    -   Use `FlatList` or `SectionList` for long scrollable lists (e.g., `ProjectList.tsx`, `StaffList.tsx`).
    -   Implement component lazy loading (e.g., `React.lazy` with Suspense, or platform-specific solutions).
    -   Memoize components (`React.memo`) and expensive calculations (`useMemo`, `useCallback`) extensively.
-   **Animation Optimization:**
    -   Evaluate Framer Motion performance on mobile. If needed, leverage `react-native-reanimated` for more performant animations.

## 4. Post-Production & Testing (Months 7-8)

### 4.1. Thorough Testing
-   **Device Testing:** Test on a range of iOS (iPhone, iPad) and Android (various manufacturers, screen sizes) devices, using emulators and physical devices.
-   **Functionality Testing:** Verify all game mechanics, UI interactions, offline mode, data sync, and notifications.
-   **Performance Testing:** Profile app performance, focusing on load times, FPS, memory usage, and battery consumption.
-   **UX Testing:** Gather feedback on mobile usability and overall experience.
-   **Beta Testing:**
    -   Conduct closed beta via TestFlight (iOS) and Google Play Console (Android).
    -   Collect and iterate on player feedback.

### 4.2. App Store Compliance & Preparation
-   Ensure adherence to Apple App Store and Google Play Store guidelines.
-   Prepare store listings (descriptions, screenshots, promo videos).
-   Implement privacy policies, especially regarding Supabase data usage if online sync is enabled.
-   Handle in-app purchases if planned (current model is no IAP, like Game Dev Tycoon).

## 5. Launch & Post-Launch (Months 9+)

### 5.1. Marketing & Launch (Month 9)
-   Coordinate marketing efforts (social media, trailers, press outreach) with app store submissions.
-   Phased rollout or full launch based on beta testing confidence.

### 5.2. Post-Launch Support (Month 10+)
-   **Analytics & Monitoring:** Use analytics tools (e.g., Firebase Analytics, Sentry) to monitor crashes, performance issues, and player behavior.
-   **Bug Fixing:** Prioritize and release updates for critical bugs.
-   **Feature Updates:** Plan and release updates with new content, features, or mobile-specific enhancements based on player feedback and roadmap.

## 6. Estimated Timeline Summary
-   **Months 1-2:** Pre-Production (Platform selection, requirements, UI/UX design, technical assessment)
-   **Months 3-6:** Production (Core porting, touch controls, offline support, feature implementation, optimization)
-   **Months 7-8:** Post-Production & Testing (Device testing, beta testing, iteration, app store prep)
-   **Month 9:** Launch (App store submission, marketing campaign)
-   **Month 10+:** Post-Launch Support (Monitoring, bug fixes, updates)

This roadmap provides a structured approach to porting Recording Studio Tycoon to mobile platforms. Flexibility will be key, and priorities may shift based on technical challenges and opportunities discovered during development.
