# Troubleshooting Guide
*Recording Studio Tycoon - Common Issues & Solutions*

## 🚨 Current Known Issues (June 11, 2025)

### 🔴 Critical Issues

#### SaveSystemContext 500 Error
**Symptoms:**
- Hot Module Reload fails
- Development server returns 500 status
- SaveSystemContext.tsx won't reload

**Temporary Workarounds:**
```bash
# Hard refresh browser
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# Restart development server
npm run dev
# or
bun dev

# Clear browser cache
# Browser Settings > Clear browsing data > Cached files
```

**Status:** Under investigation

#### AudioContext Suspended State
**Symptoms:**
- Background music doesn't play
- Error: "NotAllowedError: play() failed because the user didn't interact with the document first"
- Audio system initialization fails

**Solution:**
```typescript
// User must interact with page first
// Click anywhere in the app to enable audio
// This is a browser security requirement
```

**Workaround:**
1. Load the game
2. Click anywhere on the page
3. Audio should now work properly

---

## 🛠 Development Issues

### Node.js & Dependencies

#### Development Server Won't Start
**Symptoms:**
```
Error: Cannot find module '...'
Port already in use
Module resolution failed
```

**Solutions:**
```bash
# Method 1: Clean install
rm -rf node_modules package-lock.json
npm install
npm run dev

# Method 2: Use different port
npm run dev -- --port 3001

# Method 3: Kill existing processes
lsof -ti:5173 | xargs kill -9
npm run dev

# Method 4: Try Bun (alternative)
bun install
bun dev
```

#### TypeScript Compilation Errors
**Symptoms:**
```
Type '...' is not assignable to type '...'
Property '...' does not exist on type '...'
```

**Solutions:**
```bash
# Check TypeScript configuration
npm run type-check

# Restart TypeScript server in VS Code
# Ctrl+Shift+P -> "TypeScript: Restart TS Server"

# Clear TypeScript cache
rm -rf node_modules/.cache
npm run dev
```

#### Hot Module Reload Not Working
**Symptoms:**
- Changes don't reflect in browser
- Need to manually refresh page
- HMR connection lost

**Solutions:**
```bash
# Check for SaveSystemContext 500 error (known issue)
# Restart development server
npm run dev

# Hard refresh browser
Ctrl + Shift + R

# Check browser console for WebSocket errors
# Disable browser extensions that might interfere
```

### Build & Production Issues

#### Build Fails
**Symptoms:**
```
Build failed with errors
Module not found
Type checking failed
```

**Solutions:**
```bash
# Clean build
rm -rf dist
npm run build

# Check for missing dependencies
npm install

# Verify all imports are correct
npm run type-check
```

#### Large Bundle Size
**Symptoms:**
- Slow loading times
- Build warnings about bundle size

**Solutions:**
```bash
# Analyze bundle
npm run build
npm run preview

# Check for large dependencies
# Consider code splitting for large features
```

---

## 🎮 Game-Specific Issues

### Audio System

#### No Sound Effects
**Symptoms:**
- UI sounds don't play
- Background music silent
- No audio feedback

**Solutions:**
1. **Check User Gesture Requirement:**
   ```typescript
   // User must interact with page first
   // Click anywhere in the app
   ```

2. **Verify Audio Files:**
   ```bash
   # Check files exist
   ls public/audio/
   
   # Common files should include:
   # - purchase-complete.mp3
   # - Various UI sound files
   ```

3. **Check Audio Settings:**
   - Open game settings
   - Verify "Sound Effects" is enabled
   - Check system volume

4. **Browser Audio Permissions:**
   - Check if browser has blocked audio
   - Look for audio permission icon in address bar

#### Background Music Issues
**Symptoms:**
- BGM doesn't start
- Music cuts out
- Audio context errors

**Solutions:**
```typescript
// Known issue: AudioContext requires user gesture
// Click somewhere in the app first

// Check useBackgroundMusic hook is working
// Verify AudioContext is properly initialized
```

### Tutorial System

#### Tutorial Not Showing
**Symptoms:**
- New game starts without tutorial
- Tutorial modal doesn't appear
- Era-specific tutorials missing

**Solutions:**
1. **Check Era Compatibility:**
   ```typescript
   // Recently fixed - era ID mapping
   // Supported eras: classic_rock, golden_age, digital_age, modern
   ```

2. **Reset Tutorial Status:**
   ```javascript
   // In browser console:
   localStorage.removeItem('recordingStudioTycoon_tutorialCompleted');
   localStorage.removeItem('recordingStudioTycoon_hasPlayed');
   // Refresh page
   ```

3. **Verify Settings:**
   - Check if tutorial is disabled in settings
   - Reset game settings if necessary

### Save/Load System

#### Save Game Not Working
**Symptoms:**
- Game doesn't save progress
- Load game button disabled
- SaveSystemContext errors

**Current Status:** Known 500 error under investigation

**Workarounds:**
```javascript
// Manual save via console (emergency):
localStorage.setItem('recordingStudioTycoon_gameState', JSON.stringify(gameState));

// Check saved data:
console.log(localStorage.getItem('recordingStudioTycoon_gameState'));
```

#### Load Game Fails
**Symptoms:**
- Load game returns to splash screen
- Corrupted save data
- Game state reset

**Solutions:**
```javascript
// Clear corrupted save:
localStorage.removeItem('recordingStudioTycoon_gameState');

// Reset all game data:
Object.keys(localStorage)
  .filter(key => key.startsWith('recordingStudioTycoon_'))
  .forEach(key => localStorage.removeItem(key));
```

### Multi-Project System

#### Projects Not Loading
**Symptoms:**
- Multiple projects don't appear
- Staff automation not working
- Project management issues

**Solutions:**
1. **Check Unlock Requirements:**
   ```typescript
   // Multi-project requires:
   // - Player level 3+
   // - Staff count 2+  
   // - 3+ completed projects
   ```

2. **Verify Implementation:**
   - Recently implemented system
   - May need testing across save/load cycles

### Performance Issues

#### Slow Performance
**Symptoms:**
- Laggy UI interactions
- Slow rendering
- High memory usage

**Solutions:**
```bash
# Check browser performance tab
# Disable browser extensions
# Clear browser cache

# Development mode optimizations:
npm run build
npm run preview
```

#### Memory Leaks
**Symptoms:**
- Increasing memory usage over time
- Browser becomes unresponsive
- Tab crashes

**Solutions:**
- Refresh the page periodically
- Close other browser tabs
- Check for infinite loops in console

---

## 🔧 Browser-Specific Issues

### Chrome/Chromium
- **Audio Context:** Usually works well with user gesture
- **Performance:** Good development experience
- **Known Issues:** None currently

### Firefox
- **Audio Context:** May need additional user interaction
- **Performance:** Generally good
- **Known Issues:** Some audio timing differences

### Safari
- **Audio Context:** Stricter user gesture requirements
- **Performance:** Good on newer versions
- **Known Issues:** Audio context may need multiple interactions

### Mobile Browsers
- **Touch Interactions:** May need adjustment for user gestures
- **Performance:** Varies by device
- **Audio:** Limited support for background audio

---

## 📱 Platform-Specific Issues

### Windows
- **Node.js:** Ensure latest LTS version
- **Path Issues:** Watch for backslash vs forward slash
- **Permissions:** May need admin for global installs

### macOS
- **Node.js:** Use nvm for version management
- **Xcode Tools:** Required for some dependencies
- **Permissions:** Check homebrew permissions

### Linux
- **Node.js:** Use package manager or nvm
- **Dependencies:** May need build-essential
- **Audio:** Check PulseAudio/ALSA configuration

---

## 🆘 Getting Help

### Self-Diagnosis Steps
1. **Check Browser Console** - Look for error messages
2. **Verify File Structure** - Ensure all files are in place
3. **Test in Different Browser** - Rule out browser-specific issues
4. **Check Network Tab** - Look for failed requests
5. **Review Recent Changes** - What was changed recently?

### Information to Gather
When reporting issues:
- **Browser and version**
- **Operating system**
- **Node.js/Bun version**
- **Error messages (exact text)**
- **Steps to reproduce**
- **Expected vs actual behavior**

### Documentation Resources
- **[Current Status](./current/CURRENT_STATUS.md)** - Known issues and progress
- **[Memory Bank](../memory-bank/)** - Technical context
- **[Implementation Logs](./logs_and_reports/)** - Recent changes
- **[Architecture Docs](./architecture/)** - System design

### Emergency Resets

#### Complete Reset
```bash
# Nuclear option - reset everything
rm -rf node_modules package-lock.json dist
npm install
npm run dev

# Clear all browser data for localhost
# Browser Settings > Clear browsing data > localhost
```

#### Game State Reset
```javascript
// In browser console:
Object.keys(localStorage)
  .filter(key => key.startsWith('recordingStudioTycoon_'))
  .forEach(key => localStorage.removeItem(key));
// Refresh page
```

---

## 🔄 Regular Maintenance

### Daily Development
- Restart development server occasionally
- Clear browser cache when behavior is odd
- Check console for new warnings/errors

### Weekly
- Update dependencies: `npm update`
- Clear node_modules if issues persist
- Review documentation for updates

### Before Important Work
- Backup current progress
- Ensure all systems are working
- Update to latest code changes

---

*This troubleshooting guide is updated as new issues are discovered and resolved. Last updated: June 11, 2025*

**Still having issues?** Check the [current development status](./current/CURRENT_STATUS.md) for the latest information on known problems and fixes in progress.
