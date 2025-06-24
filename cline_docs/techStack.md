# Tech Stack

This document outlines the key technologies, frameworks, and libraries used in the Recording Studio Tycoon project.

## Frontend
- **Framework:** React
- **Language:** TypeScript
- **Rendering Engine:** PIXI.js for hardware-accelerated graphics.
- **Styling:** Standard CSS with some components potentially using CSS-in-JS if needed.
- **Build Tool:** Vite for fast development and optimized builds.

## Game Logic
- **State Management:** React's `useState` hook for component-level state. A more robust global state solution may be implemented later if needed.
- **Core Mechanics:** Written in TypeScript, organized into a modular `game-mechanics` directory.

## Architecture
- **UI Components:** A clear separation between React components (`components`) and PIXI.js UI components (`pixi-ui`).
- **Data Flow:** A React-to-PIXI bridge (`WebGLCanvas.tsx`) manages the PIXI application and passes data down to PIXI components.
- **Event Handling:** A combination of PIXI's event system for canvas interactions and React's event system for the overall application.
