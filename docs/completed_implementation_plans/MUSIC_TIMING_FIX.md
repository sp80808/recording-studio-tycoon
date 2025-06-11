# Background Music Timing Optimization

## Problem
Background music was starting too late in the game flow - only after splash screen and tutorial completion, causing a delay in the audio experience.

## Solution Implemented

### 1. Singleton Background Music Hook
- Converted `useBackgroundMusic` hook to use global singleton pattern
- Prevents multiple audio instances when hook is used in different components
- Ensures consistent music state across the application

### 2. Earlier Music Initialization  
- Added background music controls to `SplashScreen` component
- Music now starts on first user interaction (clicking Start New Game or Continue Game)
- Removed dependency on full game initialization

### 3. Optimized Audio Context
- Music initialization happens immediately when settings allow
- Small delay (100ms) added to ensure audio context is ready
- Auto-start effect triggers when music is enabled in settings

## Files Modified

### `/src/hooks/useBackgroundMusic.tsx`
- Implemented global singleton pattern with shared audio instance
- Added immediate initialization effect
- Fixed all references to use global state variables

### `/src/components/SplashScreen.tsx`  
- Added `useBackgroundMusic` hook integration
- Modified button handlers to start music on user interaction
- Ensures music begins during splash screen phase

## Technical Details

### Global State Variables
```typescript
let globalAudioRef: HTMLAudioElement | null = null;
let globalFadeIntervalRef: NodeJS.Timeout | null = null;
let globalCurrentTrack = 1;
let globalIsPlaying = false;
let globalOriginalVolume = 0.5;
```

### User Interaction Trigger
```typescript
const handleStartNewGame = () => {
  // Ensure music starts playing on user interaction
  if (!backgroundMusic.isPlaying) {
    backgroundMusic.playTrack(1);
  }
  setShowEraSelection(true);
};
```

## Result
- Background music now begins as soon as user interacts with splash screen
- No more waiting for tutorial completion
- Consistent audio experience throughout game flow
- Maintains all existing fade/volume control functionality

## Testing
- Music should start when clicking "Start New Game" or "Continue Game"
- Volume controls and settings should work as before
- Minigame audio fading should continue to function properly
- No duplicate audio instances should occur
