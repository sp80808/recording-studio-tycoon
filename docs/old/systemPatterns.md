# System Patterns: Charts System

## System Architecture

The Charts System follows a modular architecture with distinct components for chart generation, artist contact, and trend analysis.

### Key Components

- ChartGenerator: Generates and updates music charts based on various factors.
- ArtistContactSystem: Manages artist availability, contact requests, and response times.
- TrendAnalyzer: Tracks genre popularity, identifies seasonal trends, and predicts future trends.
- ChartDataStore: Stores chart data, historical trends, and player contacts.

## Key Technical Decisions

- Use of TypeScript for type safety and maintainability.
- Modular design for easy extension and modification.
- Data-driven approach for chart generation and trend analysis.
- Caching for performance optimization.

## Design Patterns

- Observer Pattern: The ChartsPanel observes changes in the ChartDataStore and updates the UI accordingly.
- Strategy Pattern: The ChartGenerator uses different strategies for chart generation based on the current era and market conditions.
- Factory Pattern: The ArtistContactSystem uses a factory to create different types of ProjectOpportunity based on the artist's skills and needs.

## Component Relationships

- The ChartGenerator uses data from the TrendAnalyzer to generate realistic chart movements.
- The ArtistContactSystem uses data from the ChartDataStore to determine artist availability and contact costs.
- The ChartsPanel displays data from the ChartDataStore and allows players to interact with the ArtistContactSystem.

## Critical Implementation Paths

1. Chart Generation:
   - The ChartGenerator retrieves genre weights and seasonal factors.
   - It calculates player influence based on recent actions.
   - It applies these factors to generate realistic chart movements.
   - The updated charts are stored in the ChartDataStore.

2. Artist Contact:
   - The player selects an artist from the ChartsPanel.
   - The ArtistContactSystem calculates the contact cost and success probability.
   - The player sends a contact request.
   - The ArtistContactSystem simulates a response time and generates a response.

3. Trend Analysis:
   - The TrendAnalyzer tracks genre popularity based on chart data.
   - It identifies seasonal trends and predicts future trends.
   - The trend data is stored in the ChartDataStore and displayed in the ChartsPanel.

## System Patterns: Minigame System

## System Architecture

The Minigame System follows a modular architecture to support various minigame types and future expansions.

### Key Components

- MinigameManager: Manages the lifecycle of minigames, including starting, updating, and scoring.
- BaseMinigame: An abstract class or interface for defining common minigame properties and methods.
- Specific Minigame Modules: Individual implementations for each minigame type (e.g., VocalTuningGame, LayeringGame, EffectChainGame, AcousticGame, LiveRecordingGame).
- DifficultyManager: Calculates and adjusts minigame difficulty based on player skill, equipment, and staff assistance.
- RewardSystem: Determines and awards player rewards based on minigame performance.
- SkillProgression: Tracks player mastery and unlocks new techniques.

## Key Technical Decisions

- Modular design for easy addition of new minigames.
- Data-driven configuration for minigame parameters and difficulty.
- Real-time audio and visual feedback for engaging gameplay.
- Performance optimization for smooth execution.

## Design Patterns

- Factory Pattern: The MinigameManager uses a factory to create instances of specific minigame modules.
- Observer Pattern: UI components observe the active minigame for updates.
- Strategy Pattern: The DifficultyManager uses different strategies for calculating difficulty.

## Component Relationships

- The MinigameManager interacts with specific minigame modules.
- Minigame modules use data from the DifficultyManager and RewardSystem.
- The UI displays information from the active minigame and SkillProgression.

## Critical Implementation Paths

1. Minigame Initialization:
   - The MinigameManager receives a request to start a minigame with specific configuration.
   - It creates an instance of the requested minigame module using the factory.
   - The minigame module initializes its state and assets based on the configuration.

2. Gameplay Loop:
   - The MinigameManager updates the active minigame based on game time and player input.
   - The minigame module processes input, updates its internal state, and provides real-time feedback.

3. Scoring and Rewards:
   - When the minigame ends, the minigame module calculates the player's score.
   - The RewardSystem determines the appropriate rewards based on the score and other factors.
   - The SkillProgression updates the player's mastery and unlocks any new techniques.
