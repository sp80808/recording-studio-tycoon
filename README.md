# Recording Studio Tycoon

A comprehensive music production simulation game where you build and manage your own recording studio through different eras of music technology, from analog to streaming.

## Project Overview

Recording Studio Tycoon is an immersive business simulation game that puts you in charge of your own recording studio. Progress through different eras of music technology, manage resources, hire and train staff, and produce music projects while building your reputation in the industry. Experience the evolution of music production from analog tape machines to modern digital workstations.

## Features

### Era Progression
- **Analog Era (1960s-1970s)**: Start with tape machines and analog consoles
- **Digital Era (1980s-1990s)**: Transition to digital recording and MIDI
- **Internet Era (2000s)**: Embrace DAWs and online distribution
- **Streaming Era (2010s-Present)**: Master modern production and streaming platforms

### Core Game Mechanics
- **Studio Management**: Build and upgrade your recording studio with era-appropriate equipment
- **Staff Management**: Hire, train, and manage staff members with unique skills and specializations
- **Project Management**: Handle multiple projects with different requirements, genres, and client types
- **Resource Management**: Manage money, reputation, and staff resources efficiently
- **Skill System**: Develop studio skills (recording, mixing, mastering) that improve efficiency
- **Band Management**: Work with bands and session musicians to create original tracks

### Interactive Minigames
- **Rhythm Timing**: Master timing and rhythm in recording sessions
- **Mixing Board**: Learn the art of mixing and balancing tracks
- **Sound Wave**: Visualize and manipulate audio waveforms
- **Beat Making**: Create and arrange beats for different genres
- **Vocal Recording**: Perfect vocal takes and performances
- **Mastering**: Polish final mixes for release
- **Effect Chain**: Design and implement audio effects chains
- **Acoustic Treatment**: Optimize studio acoustics
- **Instrument Layering**: Create rich, layered arrangements
- **Era-Specific Games**: 
  - Analog: Tape Splicing, Four-Track Recording
  - Digital: MIDI Programming, Digital Mixing
  - Internet: Sample Editing, Sound Design
  - Streaming: Audio Restoration, Modern Production

### Enhanced UI Components
- **Animated Stat Blobs**: Visual feedback for stat gains with animated floating blobs
- **Floating XP Orbs**: Animated orbs that show XP, money, and skill gains
- **Skill Progress Display**: Detailed view of studio skills with progress bars
- **Enhanced Game Header**: Improved header with animated counters and XP progress
- **XP Progress Bar**: Visual representation of XP progress with animations
- **Era Progress**: Track progression through different music eras
- **Charts System**: Monitor music charts and market trends

### Charts and Market System
- Track music charts across different eras
- Monitor market trends and genre popularity
- Discover and work with emerging artists
- Build relationships with established artists
- Release original tracks and manage their chart performance

## Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm (v8 or higher)

### Installation

```sh
# Clone the repository
git clone https://github.com/sp80808/recording-studio-tycoon.git

# Navigate to the project directory
cd recording-studio-tycoon

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run test`: Run tests
- `npm run lint`: Run linter
- `npm run format`: Format code

## Technology Stack

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context + Custom Hooks
- **Testing**: Jest + React Testing Library
- **Animation**: Framer Motion for smooth transitions and effects
- **Audio Processing**: Web Audio API for minigames and sound effects

## Documentation

- [Minigame System](docs/minigames/MINIGAMES.md): Detailed documentation of the minigame system
- [Era Progression](docs/ERA_BASED_PROGRESSION.md): Information about era-based progression
- [Charts System](docs/CHARTS_SYSTEM_DETAILED.md): Details about the charts and market system
- [Roadmap](ROADMAP.md): Development plans and future features
- [Animation Enhancement Plan](docs/ANIMATION_ENHANCEMENT_PLAN.md): Visual and animation improvements
- [Contributing Guidelines](CONTRIBUTING.md): How to contribute to the project

## Deployment

The project can be deployed through Lovable:

1. Open [Lovable Project](https://lovable.dev/projects/fb4096d3-b98e-4381-9c20-873902a5af5d)
2. Click Share -> Publish

### Custom Domain Setup

To connect a custom domain:
1. Navigate to Project > Settings > Domains
2. Click Connect Domain
3. Follow the [domain setup guide](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## License

This project is proprietary and confidential. All rights reserved.
