# Unity Scene Setup and Prefab Creation Guide

## Overview
This guide provides step-by-step instructions for setting up Unity scenes and creating prefabs for the Recording Studio Tycoon game.

## Scene Structure

### 1. Main Game Scene (GameScene)

#### Scene Hierarchy
```
GameScene
├── GameManagers (Empty GameObject)
│   ├── GameManager
│   ├── AudioManager
│   ├── UIManager
│   ├── StaffManager
│   ├── ProjectManager
│   ├── ProgressionManager
│   ├── StudioUpgradeManager
│   ├── MarketManager
│   ├── RelationshipManager
│   ├── FinanceManager
│   ├── RewardManager
│   ├── MinigameManager
│   └── CollectibleManager
├── Environment
│   ├── Studio3D (3D studio environment)
│   ├── Camera System
│   └── Lighting
├── UI
│   ├── Canvas (Screen Space - Overlay)
│   │   ├── MainHUD
│   │   ├── ModalsContainer
│   │   └── NotificationSystem
│   └── WorldSpaceUI (World Space Canvas)
└── Audio
    ├── BackgroundMusic
    ├── SFXManager
    └── AudioSources Pool
```

#### Manager Setup Instructions

1. **GameManager Setup**
   - Create empty GameObject named "GameManager"
   - Add `GameManager.cs` component
   - Set as singleton instance
   - Configure initial game state

2. **AudioManager Setup**
   - Create empty GameObject named "AudioManager"
   - Add `AudioManager.cs` component
   - Add AudioSource components for music and SFX
   - Configure audio mixer groups

3. **UIManager Setup**
   - Create empty GameObject named "UIManager"
   - Add `UIManager.cs` component
   - Reference main canvas and UI prefabs
   - Configure UI animation settings

### 2. Minigame Scenes

Create separate scenes for each minigame:
- MixingMinigameScene
- AudioEditingMinigameScene
- MasteringMinigameScene
- RecordingMinigameScene

## Prefab Creation Guide

### 1. UI Prefabs

#### StaffCard Prefab
```
StaffCard (UI Panel)
├── Background (Image)
├── Portrait (Image)
├── NameText (TextMeshPro)
├── RoleText (TextMeshPro)
├── SkillBars (Container)
│   ├── TechnicalSkill (Slider)
│   ├── CreativeSkill (Slider)
│   └── PerformanceSkill (Slider)
├── MoodIndicator (Image)
├── EnergyIndicator (Image)
└── ActionButtons (Container)
    ├── AssignButton (Button)
    ├── FireButton (Button)
    └── DetailsButton (Button)
```

**Creation Steps:**
1. Create UI Panel GameObject
2. Add StaffCardUI component
3. Configure layout with ContentSizeFitter
4. Add visual components (Images, TextMeshPro)
5. Configure button events
6. Save as prefab in `Assets/Prefabs/UI/`

#### ProjectCard Prefab
```
ProjectCard (UI Panel)
├── Background (Image)
├── Header (Container)
│   ├── ProjectIcon (Image)
│   ├── ProjectName (TextMeshPro)
│   └── StatusIcon (Image)
├── ProgressSection (Container)
│   ├── ProgressBar (Slider)
│   ├── ProgressText (TextMeshPro)
│   └── DeadlineText (TextMeshPro)
├── StaffSection (Container)
│   ├── AssignedStaffList (ScrollRect)
│   └── AddStaffButton (Button)
└── ActionButtons (Container)
    ├── ViewDetailsButton (Button)
    ├── PauseButton (Button)
    └── CancelButton (Button)
```

#### Modal Prefabs
- LevelUpModal
- ConfirmationDialog
- StaffHirePanel
- ProjectCreationPanel
- UpgradeSelectionPanel

### 2. 3D Environment Prefabs

#### StudioRoom Prefab
```
StudioRoom
├── Floor (Mesh)
├── Walls (Container)
├── Equipment (Container)
│   ├── MixingConsole
│   ├── Monitors
│   ├── Instruments
│   └── RecordingBooth
├── Lighting (Container)
└── InteractionPoints (Container)
```

#### Equipment Prefabs
- MixingConsole
- AudioInterface
- Microphones
- Instruments
- ComputerWorkstation

### 3. Interactive Component Prefabs

#### Staff3D Prefab
```
Staff3D
├── Model (Mesh Renderer)
├── Animator (Animator)
├── Collider (Capsule Collider)
├── InteractionTrigger (Trigger Collider)
├── StatusUI (World Space Canvas)
│   ├── NameTag (TextMeshPro)
│   ├── MoodIcon (Image)
│   └── ActivityText (TextMeshPro)
└── AudioSource (3D Audio)
```

## Asset Organization

### Folder Structure
```
Assets/
├── Prefabs/
│   ├── UI/
│   │   ├── Cards/
│   │   ├── Modals/
│   │   ├── Panels/
│   │   └── HUD/
│   ├── Environment/
│   │   ├── Rooms/
│   │   ├── Equipment/
│   │   └── Props/
│   ├── Characters/
│   │   ├── Staff/
│   │   └── NPCs/
│   └── Audio/
│       ├── Music/
│       ├── SFX/
│       └── Ambient/
├── Materials/
├── Textures/
├── Models/
├── Audio/
└── Animations/
```

### Naming Conventions
- UI Prefabs: `UI_[Component]` (e.g., `UI_StaffCard`)
- 3D Prefabs: `3D_[Object]` (e.g., `3D_MixingConsole`)
- Manager Prefabs: `Manager_[System]` (e.g., `Manager_Audio`)

## Setup Checklist

### Initial Scene Setup
- [ ] Create GameManagers container
- [ ] Add all manager components
- [ ] Configure manager references
- [ ] Set up camera system
- [ ] Create UI canvas hierarchy
- [ ] Configure lighting
- [ ] Add audio systems

### Prefab Creation
- [ ] Create UI card prefabs
- [ ] Create modal prefabs
- [ ] Create environment prefabs
- [ ] Create character prefabs
- [ ] Test prefab functionality
- [ ] Configure prefab variants

### Integration Testing
- [ ] Test manager initialization
- [ ] Verify UI prefab instantiation
- [ ] Test audio system integration
- [ ] Validate save/load functionality
- [ ] Check performance optimization

## Best Practices

### Performance Optimization
1. Use object pooling for frequently spawned objects
2. Implement LOD (Level of Detail) for 3D models
3. Optimize UI elements with Canvas Groups
4. Use TextMeshPro for all text rendering
5. Implement culling for off-screen objects

### Memory Management
1. Unload unused assets
2. Use addressable assets for large content
3. Implement proper cleanup in OnDestroy
4. Monitor memory usage with Profiler

### Code Organization
1. Keep prefabs modular and reusable
2. Use ScriptableObjects for configuration
3. Implement proper event systems
4. Follow Unity coding conventions

## Troubleshooting

### Common Issues
1. **Manager not found**: Ensure proper singleton implementation
2. **UI not displaying**: Check Canvas settings and sorting order
3. **Audio not playing**: Verify AudioMixer configuration
4. **Performance issues**: Use Unity Profiler to identify bottlenecks

### Debug Tools
1. Use Unity Console for error logging
2. Implement debug visualization
3. Add performance monitoring
4. Create editor tools for testing
