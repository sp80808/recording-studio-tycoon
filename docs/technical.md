# Technical Documentation

## Development Environment and Stack

### Technologies Used
- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **State Management**: Zustand (or React Context API for simpler states)
- **Routing**: React Router DOM
- **Build Tool**: Vite
- **Testing**: Jest, React Testing Library
- **Cloud Integration**: Supabase (for cloud saves, potentially other backend features)
- **Animations**: Framer Motion
- **Charting**: Recharts
- **Internationalization**: i18next (if implemented)

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
- **Component-Based Architecture**: Leveraging React's component model for modular and reusable UI elements.
- **TypeScript**: Enhancing code quality, maintainability, and developer experience through static typing.
- **Atomic Design Principles**: Organizing UI components into atoms, molecules, organisms, templates, and pages for scalability.
- **Functional Components and Hooks**: Utilizing React Hooks for stateful logic and side effects in functional components.
- **Centralized State Management**: Using Zustand for global state to ensure predictable data flow and easy debugging.
- **Responsive Design**: Implementing Tailwind CSS for a mobile-first approach and responsive layouts.
- **Accessibility (A11y)**: Prioritizing accessibility features in UI components and interactions.
- **Modular File Structure**: Organizing code into `src/components`, `src/hooks`, `src/utils`, `src/data`, `src/types`, `src/services`, etc., for clear separation of concerns.
- **Service Layer Architecture**: Implementing dedicated service classes for complex game systems (Market Trends, Relationships, Studio Upgrades).
- **Type-Driven Development**: Extensive use of TypeScript interfaces and types for game entities, ensuring compile-time safety.

### Design Patterns in Use
- **Observer Pattern**: For event handling and state changes (e.g., notifications, game events).
- **Factory Pattern**: For creating instances of game entities (e.g., staff, projects, equipment).
- **Singleton Pattern**: For managing global services like the Audio System or Save System.
- **Strategy Pattern**: For implementing different minigame mechanics or project outcomes.
- **Provider Pattern (React Context)**: For providing global data and functions to component trees without prop drilling.

### Technical Constraints
- **Browser Compatibility**: Targeting modern web browsers (Chrome, Firefox, Safari, Edge).
- **Performance**: Optimizing for smooth animations and responsive UI, especially on lower-end devices.
- **Scalability**: Designing systems to accommodate future content expansions (new eras, equipment, minigames).
- **Maintainability**: Writing clean, well-documented, and testable code.
- **Offline Support**: Limited offline functionality for core gameplay, with cloud sync requiring internet.
