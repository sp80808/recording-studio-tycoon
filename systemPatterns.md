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
