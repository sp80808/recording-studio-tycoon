# Save System Documentation

## Overview

The Recording Studio Tycoon save system provides both local and cloud-based save functionality, ensuring players can access their progress across different devices and maintain backup copies of their game state.

## Features

### Local Save System
- Automatic saving of game state
- Manual save functionality
- Save data versioning and migration
- Auto-save intervals (configurable)
- Save data encryption

### Cloud Save System
- Multiple save slots per user
- Cross-device synchronization
- Automatic cloud backup
- Save data versioning
- Play time tracking
- Last played timestamp

## Technical Implementation

### Save Data Structure
```typescript
interface SaveData {
  gameState: GameState;
  timestamp: number;
  version: string;
  buildDate: string;
  phase: string;
  features: string[];
  saveFormat: string;
}

interface CloudSaveData extends SaveData {
  userId: string;
  saveName: string;
  lastPlayed: number;
  playTime: number;
}
```

### Local Storage
- Uses browser's localStorage for persistent storage
- Implements save data versioning for compatibility
- Includes automatic migration for older save formats
- Handles storage quota limits

### Cloud Storage
- Uses Supabase for cloud storage
- Implements user authentication
- Supports multiple save slots
- Handles offline/online synchronization
- Includes conflict resolution

## Usage

### Local Save
```typescript
// Save game state
saveGame(gameState);

// Load game state
const loadedState = loadGame();

// Check for existing save
const hasSave = hasSavedGame();

// Reset game
resetGame();
```

### Cloud Save
```typescript
// Save to cloud
await saveToCloud(userId, saveData, 'Main Save');

// Load from cloud
const cloudSave = await loadFromCloud(userId, 'Main Save');

// List cloud saves
const saves = await listCloudSaves(userId);

// Delete cloud save
await deleteCloudSave(userId, 'Main Save');

// Sync local to cloud
await syncLocalToCloud(userId, localSave);

// Sync cloud to local
const newSave = await syncCloudToLocal(userId);
```

## Auto-Save System

The game implements an automatic save system that triggers:
- Every 30 seconds (configurable)
- After completing a project
- After leveling up
- After significant game events
- When closing the game

## Version Management

The save system includes version management to handle:
- Game updates
- Feature additions
- Breaking changes
- Data structure modifications

Version migration is handled automatically when loading older save files.

## Security

- Save data is encrypted before storage
- Cloud saves require user authentication
- Local saves are protected from tampering
- Version validation prevents loading incompatible saves

## Error Handling

The save system includes comprehensive error handling for:
- Storage quota exceeded
- Network connectivity issues
- Data corruption
- Version incompatibility
- Authentication failures

## Future Enhancements

Planned improvements to the save system:
- Save data compression
- Incremental saves
- Save data export/import
- Save data analytics
- Cloud save conflict resolution
- Save data backup 