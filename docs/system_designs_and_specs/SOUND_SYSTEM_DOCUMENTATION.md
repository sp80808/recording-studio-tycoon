# Sound System Documentation
*Last Updated: June 10, 2025*

## Overview

The Recording Studio Tycoon game features a comprehensive sound system that provides audio feedback for user interactions, enhancing the overall gaming experience. The system is built with performance and user experience in mind.

## Architecture

### Core Components

#### 1. Sound Utility (`src/utils/soundUtils.ts`)
- **Purpose**: Centralized sound management and playback
- **Features**:
  - Audio caching to prevent re-loading sound files
  - Global mute functionality
  - Volume control per sound effect
  - Error handling for missing or corrupted audio files
  - Preloading capability for performance optimization

#### 2. Audio File Organization
```
/public/audio/
├── ui sfx/                    # UI interaction sounds
│   ├── click.wav             # Button clicks
│   ├── slider.wav            # Slider adjustments
│   ├── success.wav           # Success notifications
│   ├── notification.wav      # General notifications
│   ├── close_modal.wav       # Modal closing
│   ├── start_minigame.wav    # Minigame initiation
│   └── project_complete.wav  # Project completion
├── chart_clips/              # Music chart audio previews
│   ├── 60s-Pop2.mp3
│   ├── 80s-Power-Chord1.mp3
│   └── [various era-specific tracks]
└── bgm/                      # Background music tracks
    ├── bgm1.mp3
    ├── bgm2.mp3
    └── [additional BGM tracks]
```

## Implementation Details

### Sound Utility Functions

#### `playSound(soundName: string, volume: number = 0.7): void`
- Plays a sound effect with specified volume
- Manages audio caching automatically
- Handles browser autoplay restrictions gracefully
- Volume is clamped between 0.0 and 1.0

#### `toggleMuteSounds(): boolean`
- Toggles global mute state for all sound effects
- Returns the new mute state
- Does not affect background music (handled separately)

#### `preloadSounds(soundNames: string | string[]): void`
- Preloads sound files into cache for better performance
- Useful for sounds that need immediate playback
- Handles loading errors gracefully

### Integration Points

#### UI Components
- **Button Clicks**: All primary buttons play `click.wav`
- **Slider Adjustments**: Focus allocation sliders play `slider.wav`
- **Modal Actions**: Modal closing plays `close_modal.wav`
- **Notifications**: Success actions play `success.wav`

#### Minigame System
- **Minigame Start**: Triggers `start_minigame.wav`
- **Minigame Success**: Plays `success.wav` on completion
- **Minigame Close**: Uses `close_modal.wav`

#### Project Workflow
- **Project Completion**: Plays `project_complete.wav`
- **Stage Advancement**: Uses success sound variations
- **Equipment Purchase**: Integrated with success notifications

## Technical Considerations

### Performance Optimization
1. **Audio Caching**: Prevents multiple instances of the same audio file
2. **Lazy Loading**: Audio files are only loaded when first requested
3. **Memory Management**: Old audio instances are properly cleaned up
4. **Error Resilience**: Missing files don't break the game experience

### Browser Compatibility
- **Autoplay Policies**: Handled gracefully with try-catch blocks
- **Audio Format Support**: Uses widely supported formats (WAV, MP3)
- **Error Handling**: Provides fallbacks for unsupported audio

### User Experience
- **Volume Control**: All sounds respect user volume preferences
- **Mute Functionality**: Global mute for all UI sounds
- **Contextual Audio**: Different sounds for different types of actions
- **Non-Intrusive**: Sounds enhance rather than distract from gameplay

## Future Enhancements

### Planned Features
1. **Dynamic Volume**: Adjust volume based on game state
2. **Sound Themes**: Different sound packs for different eras
3. **3D Audio**: Spatial audio for studio environments
4. **Voice Acting**: Character voices for tutorials and interactions
5. **Adaptive Audio**: Sounds that change based on player progress

### Configuration Options
1. **Individual Sound Categories**: Separate volume controls for UI, music, and effects
2. **Sound Quality Settings**: Different quality levels for performance
3. **Accessibility Options**: Visual indicators for audio cues
4. **Custom Sound Packs**: User-importable sound themes

## Usage Examples

### Basic Sound Playback
```typescript
import { playSound } from '@/utils/soundUtils';

// Play a button click sound
playSound('click.wav', 0.5);

// Play success notification
playSound('success.wav', 0.8);
```

### Component Integration
```typescript
const handleButtonClick = () => {
  playSound('click.wav', 0.5);
  // Handle button logic
};

const handleProjectComplete = () => {
  playSound('project_complete.wav', 0.8);
  // Show completion celebration
};
```

### Preloading for Performance
```typescript
useEffect(() => {
  // Preload critical sounds
  preloadSounds([
    'click.wav',
    'success.wav',
    'notification.wav'
  ]);
}, []);
```

## Troubleshooting

### Common Issues
1. **Sounds Not Playing**: Check browser autoplay policies
2. **Performance Issues**: Use preloading for frequently used sounds
3. **Volume Too Low/High**: Adjust volume parameters in code
4. **Missing Files**: Check console for file loading errors

### Debug Information
- All sound operations log to console in development mode
- Error messages indicate specific file loading issues
- Performance metrics available for audio caching efficiency

## Testing Checklist

### Manual Testing
- [ ] All UI interactions have appropriate sound feedback
- [ ] Mute functionality works across all sounds
- [ ] Volume levels are consistent and pleasant
- [ ] No audio delays or glitches during gameplay
- [ ] Sounds work across different browsers

### Automated Testing
- [ ] Sound utility functions handle errors gracefully
- [ ] Audio caching prevents memory leaks
- [ ] Preloading improves performance measurably
- [ ] Integration tests cover all sound trigger points

## Maintenance Notes

### Adding New Sounds
1. Place audio files in appropriate `/public/audio/` subdirectory
2. Use consistent naming conventions
3. Test across different browsers and devices
4. Update this documentation with new sound mappings

### Performance Monitoring
- Monitor audio cache size and cleanup
- Track loading times for audio files
- Measure impact on overall game performance
- Optimize file sizes and formats as needed
