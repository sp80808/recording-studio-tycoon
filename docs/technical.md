# Technical Documentation

## Development Environment and Stack

### Technologies Used
- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **State Management**: Zustand (or React Context API for simpler states)
- **Routing**: React Router DOM
- **Build Tool**: Vite
- **Testing**: Jest, React Testing Library
- **Cloud Integration**: Supabase (for cloud saves, advanced save features)
- **Animations**: Framer Motion
- **Charting**: Recharts
- **Internationalization**: i18next (if implemented)
- **UI/UX**: Potential libraries for responsive design, accessibility, and performance optimization.
- **Input Handling**: Libraries for keyboard shortcuts and gamepad support.
- **Multiplayer**: WebSockets (e.g., Socket.IO) or a real-time backend service (e.g., Supabase Realtime, Firebase).
- **Advanced AI**: Machine learning libraries (e.g., TensorFlow.js) for dynamic difficulty, adaptive challenges, and smart NPCs.
- **Virtual Reality**: WebXR API or a VR framework (e.g., A-Frame, React VR).
- **Mobile Platform**: React Native or Capacitor for cross-platform mobile deployment.

### App Icon Implementation
The app uses a music symbol emoji (🎵) as its icon, implemented through an inline SVG in the HTML. This approach:
- Provides consistent appearance across platforms
- Eliminates the need for multiple icon files
- Ensures proper scaling and rendering
- Simplifies maintenance and updates

The implementation uses a data URI in the HTML:
```html
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎵</text></svg>" />
```

### Project Management System
The enhanced project management system includes:

#### ProjectList Component
- **Type Safety**: Improved TypeScript type definitions for genres and subgenres
- **Market Integration**: Enhanced market trend analysis and display
- **Error Handling**: Robust error handling for market trend calculations
- **Performance**: Optimized project refresh functionality
- **State Management**: Streamlined state updates and data flow

#### Key Features
- Dynamic project generation based on player level and era
- Real-time market trend analysis
- Genre and subgenre type safety
- Efficient project refresh mechanism
- Integrated error handling and validation

#### Implementation Details
```typescript
interface ProjectListProps {
  gameState: GameState;
  startProject: (project: Project) => void;
  updateGameState: (updater: (prevState: GameState) => GameState) => void;
}

// Market trend integration
const { getTrendForGenre } = useMarketTrends(updateGameState);

// Project refresh with type safety
const handleRefreshProjects = () => {
  updateGameState(prev => ({ 
    ...prev, 
    availableProjects: [...generateNewProjects(5, prev.playerData.level, prev.currentEra)]
  }));
};
```

### Development Setup
1. **Clone the repository**:
   ```bash
   git clone [repository-url]
   cd recording-studio-tycoon
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Run the development server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173` (or another port if 5173 is in use).

### Key Technical Decisions
- **Component-Based Architecture**: Leveraging React's component model for modular and reusable UI elements
- **TypeScript**: Enhancing code quality, maintainability, and developer experience through static typing
- **Atomic Design Principles**: Organizing UI components into atoms, molecules, organisms, templates, and pages for scalability
- **Functional Components and Hooks**: Utilizing React Hooks for stateful logic and side effects in functional components
- **Type Safety**: Implementing strict type checking for all components and data structures
- **Error Handling**: Comprehensive error handling and validation throughout the application

### Design Patterns in Use
- **Observer Pattern**: For event handling and state changes (e.g., notifications, game events).
- **Factory Pattern**: For creating instances of game entities (e.g., staff, projects, equipment).
- **Singleton Pattern**: For managing global services like the Audio System or Save System.
- **Strategy Pattern**: For implementing different minigame mechanics or project outcomes.
- **Provider Pattern (React Context)**: For providing global data and functions to component trees without prop drilling.

### Technical Constraints
- **Browser Compatibility**: Targeting modern web browsers (Chrome, Firefox, Safari, Edge).
- **Performance**: Optimizing for smooth animations and responsive UI, especially on lower-end devices and mobile platforms.
- **Scalability**: Designing systems to accommodate future content expansions (new eras, equipment, minigames, locations, events) and potential multiplayer features.
- **Maintainability**: Writing clean, well-documented, and testable code.
- **Offline Support**: Enhanced offline functionality for core gameplay, with cloud sync requiring internet.
- **Security**: Implementing encryption for save data and secure communication for multiplayer features.
- **Cross-Platform Compatibility**: Ensuring consistent experience across desktop, web, and mobile (if implemented).
- **Data Management**: Efficient handling of large save files and incremental updates.
