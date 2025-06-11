# Quick Start Guide
*Recording Studio Tycoon - Developer Setup*

## 🚀 Prerequisites

### Required Software
- **Node.js 18+** or **Bun** (latest)
- **Git**
- **VS Code** (recommended with extensions)

### Recommended VS Code Extensions
- TypeScript and JavaScript Language Features
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Auto Rename Tag
- Bracket Pair Colorizer

## ⚡ Quick Setup (5 minutes)

### 1. Clone and Install
```bash
# Clone the repository
git clone <repository-url>
cd recording-studio-tycoon

# Install dependencies (choose one)
npm install
# OR
bun install
```

### 2. Start Development Server
```bash
# Start the development server (choose one)
npm run dev
# OR
bun dev
```

### 3. Open in Browser
- Navigate to `http://localhost:5173`
- The app should load with the splash screen

## 🎮 First Run Experience

### Expected Behavior
1. **Splash Screen** appears with "Start New Game" and "Load Game" options
2. **Era Selection** modal opens when starting new game
3. **Tutorial Modal** appears for first-time users
4. **Main Game Interface** loads with studio management view

### If Something Goes Wrong
- Check the browser console for errors
- Verify all dependencies installed correctly
- See [Troubleshooting](#troubleshooting) section below

## 📁 Project Structure Overview

```
recording-studio-tycoon/
├── src/
│   ├── components/          # React components
│   │   ├── modals/         # Modal dialogs
│   │   ├── minigames/      # Interactive games
│   │   └── ui/             # Reusable UI components
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── data/               # Game data and configurations
├── docs/                   # Documentation
├── memory-bank/            # AI context files
└── public/                 # Static assets
```

## 🔧 Development Commands

### Essential Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Check code style
npm run type-check   # TypeScript validation

# Testing
npm run test         # Run test suite (when available)
```

### Using Bun (Alternative)
```bash
bun dev             # Start development server
bun run build       # Build for production
bun run lint        # Lint code
```

## 🎯 Key Development Areas

### 1. Game Systems
- **Main Entry**: `src/pages/Index.tsx`
- **Game State**: `src/hooks/useGameState.ts`
- **Game Logic**: `src/hooks/useGameLogic.ts`

### 2. UI Components
- **Layout**: `src/components/GameLayout.tsx`
- **Main Content**: `src/components/MainGameContent.tsx`
- **Modals**: `src/components/modals/`

### 3. Game Features
- **Multi-Project**: `src/components/multi-project/`
- **Staff Management**: `src/components/staff/`
- **Equipment**: `src/components/equipment/`
- **Minigames**: `src/components/minigames/`

## 🐛 Troubleshooting

### Common Issues

#### Development Server Won't Start
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

#### TypeScript Errors
```bash
# Check TypeScript configuration
npm run type-check

# Common fix - restart TypeScript server in VS Code
# Command Palette (Ctrl+Shift+P) -> "TypeScript: Restart TS Server"
```

#### Hot Module Reload Not Working
- Check for SaveSystemContext 500 errors in console
- Try hard refresh (Ctrl+Shift+R)
- Restart development server

#### Audio Not Playing
- Click anywhere in the app first (user gesture requirement)
- Check browser audio permissions
- Verify audio files exist in `public/audio/`

### Current Known Issues (June 11, 2025)
1. **SaveSystemContext 500 Error** - Investigating HMR issues
2. **AudioContext Suspension** - Requires user gesture to resume
3. **Tutorial Era Compatibility** - Recently fixed, testing in progress

## 📖 Understanding the Codebase

### State Management
- **Game State**: Centralized in `useGameState` hook
- **Settings**: Managed via `SettingsContext`
- **Save System**: Handled by `SaveSystemContext`

### Key Patterns
- **React Hooks**: Custom hooks for game logic
- **Context Providers**: Global state management
- **Component Composition**: Modular UI components
- **TypeScript**: Strict typing throughout

### Data Flow
1. **Index.tsx** - Main app component
2. **GameLayout** - Layout wrapper
3. **MainGameContent** - Core game interface
4. **Individual Components** - Feature-specific UI

## 🚀 Making Your First Change

### 1. Simple UI Change
Edit `src/components/GameHeader.tsx` to modify the header:
```tsx
// Change the studio name display
<h1 className="text-xl font-bold">
  My Amazing Studio
</h1>
```

### 2. Add New Feature
1. Create component in appropriate `src/components/` subdirectory
2. Add to parent component imports and JSX
3. Update TypeScript types if needed
4. Test in development server

### 3. Modify Game Logic
1. Find relevant hook in `src/hooks/`
2. Add your logic following existing patterns
3. Update TypeScript interfaces in `src/types/`
4. Test thoroughly

## 📚 Next Steps

### Learn the Game Systems
1. **[Multi-Project System](../features/multi-project/)** - Advanced project management
2. **[Audio System](../features/audio-system/)** - Sound and music
3. **[Work Progression](../features/WORK_PROGRESSION_ENHANCEMENT.md)** - Focus allocation

### Read the Documentation
1. **[Architecture Overview](../architecture/SYSTEM_OVERVIEW.md)** - System design
2. **[Coding Standards](../development/CODING_STANDARDS.md)** - Code conventions
3. **[Current Status](./CURRENT_STATUS.md)** - What's happening now

### Join Development
1. **Check Current Tasks** - See what needs work
2. **Read Contribution Guide** - Understand the workflow
3. **Start with Small Changes** - Build familiarity gradually

## 💡 Pro Tips

### Development Workflow
- Keep the development server running while coding
- Use browser dev tools for debugging
- Check the console for errors regularly
- Test on different screen sizes

### Code Quality
- Follow TypeScript strict mode
- Use meaningful variable names
- Comment complex logic
- Keep components focused and small

### Debugging
- Use `console.log` liberally during development
- Browser dev tools React extension is helpful
- Check network tab for failed requests
- Memory bank files contain helpful context

---

**Ready to start developing?** 🎉

Run `npm run dev` and open `http://localhost:5173` to see the game in action!

*Need help? Check the [troubleshooting guide](../TROUBLESHOOTING.md) or review the [current status](./CURRENT_STATUS.md) for known issues.*
