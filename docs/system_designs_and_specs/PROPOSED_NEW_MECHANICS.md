# Proposed New Game Mechanics

This document outlines three new game mechanics proposed to enhance gameplay depth in Recording Studio Tycoon. These mechanics are designed to integrate with existing systems (staff, projects, charts, eras) and align with the game's core vision.

## 1. Dynamic Artist Contracts

### Mechanic Description
Players can discover and sign artists to their studio. This involves negotiating contract terms based on artist statistics (e.g., fame, skill, genre fit, potential) and current market trends (derived from `ChartsPanel.tsx`). Contract terms can include:
-   **Advance:** Upfront payment to the artist.
-   **Royalty Split:** Percentage of project revenue shared with the artist.
-   **Session Fees:** Payment per recording session or project.
-   **Contract Duration:** Length of the contract in game days or number of projects.
-   **Exclusivity Clauses:** Whether the artist can only work with the player's studio.

Successfully signed artists become available for projects, potentially bringing unique bonuses, higher quality potential, or access to specific project types. Failed negotiations can impact studio reputation.

### Objectives
-   Add a strategic layer to talent acquisition beyond hiring generic staff.
-   Introduce risk/reward decisions in artist investment.
-   Create a more dynamic roster of talent for the player's studio.
-   Allow players to build and manage a portfolio of artists.

### Player Impact
-   Deeper engagement with the "A&R" aspect of running a studio.
-   More significant financial planning required for advances and ongoing royalties.
-   Studio reputation can be enhanced by successful artists or damaged by poor contract management.
-   Adds a long-term progression path as players try to sign bigger artists.

### Integration with Existing Systems
-   **`useStaffManagement` / `useBandManagement`:** Extend to handle artist data, contract status, and negotiations. Artist data could be similar to `StaffMember` but with specific artist-related stats.
-   **New Component: `ContractNegotiationModal.tsx`:** A UI for the negotiation process, showing artist demands, player offers, and negotiation outcomes.
-   **`ChartsPanel.tsx`:** Artist stats (fame, genre) can be influenced by or discovered through chart performance. Market trends from charts can influence artist demands.
-   **`useGameState`:** Track signed artists, contract terms, and royalty payouts.
-   **`projectUtils.ts` / `Project` type:** Projects could now have an "Assigned Artist" field. Artist skills/fame could influence project outcomes (quality, sales, rep).
-   **`progressionUtils.ts`:** Successful contracts or artist achievements could grant XP and reputation.

### Balance and Testing Plan
-   **Artist Stat Balancing:** Ensure a good range of artist tiers, from undiscovered talents to established stars, with appropriately scaled stats and demands.
-   **Contract Term Balancing (`rewardBalancer.ts`):**
    -   Royalty splits vs. session fees: Ensure both are viable under different circumstances.
    -   Advances: Risk vs. reward – higher advances might secure better artists but strain early-game finances.
    -   Market Influence: Artist demands should fluctuate based on their chart success and overall genre popularity.
-   **Negotiation Difficulty:** Implement a negotiation mechanic (e.g., based on player's Business Acumen vs. artist's stubbornness) that is challenging but fair.
-   **Playtesting:**
    -   Test contract negotiation flow for usability (target ≤3-5 clicks for key negotiation actions).
    -   Assess financial impact of royalties and advances on game economy.
    -   Monitor player engagement with discovering and signing artists.

## 2. Live Performance Events

### Mechanic Description
Players can organize and manage live performance events for their signed artists or bands. This involves:
-   **Event Planning:** Choosing an artist/band, venue (unlocks by era/reputation), marketing budget, and ticket price.
-   **Logistics:** Balancing costs (venue rental, marketing, crew, artist fees/cut) against potential revenue (ticket sales, merchandise) and reputation gains.
-   **Event Execution:** A simplified representation of the event, possibly with a small minigame or critical choices that affect outcome (e.g., soundcheck quality, handling technical issues).
-   **Era Progression:** Event types evolve with eras (e.g., local gigs in early eras, stadium tours, online streaming concerts in later eras).

### Objectives
-   Provide an alternative revenue stream and reputation-building activity.
-   Expand project variety beyond studio recording.
-   Offer a way to further develop signed artists' careers and fame.
-   Align with `ROADMAP copy.md`’s suggestion for special events.

### Player Impact
-   Adds event management and promotion gameplay.
-   Introduces new financial risks and rewards.
-   Allows players to actively boost their artists' careers.
-   Creates memorable moments and milestones in an artist's journey.

### Integration with Existing Systems
-   **New Component: `LiveEventManager.tsx` / `LiveEventModal.tsx`:** UI for planning, managing, and viewing outcomes of live events.
-   **`useProjectManagement`:** Extend to handle "event" type projects, distinct from recording projects.
-   **`useGameState`:** Track event outcomes, revenue, costs, and impact on artist/studio reputation and fame.
-   **`projectTemplates.ts` (or a new `eventTemplates.ts`):** Define different types of live events, their base costs, potential rewards, and unlock conditions.
-   **`progressionUtils.ts`:** Successful events grant XP, reputation, and potentially unlock new venues or event types. Artist fame increases.
-   **`ChartsPanel.tsx`:** Successful live events could boost an artist's chart performance or marketability.

### Balance and Testing Plan
-   **Cost/Revenue Balancing:** Ensure event costs are significant but potential rewards (financial and reputational) are worthwhile. Use `rewardBalancer.ts` concepts.
-   **Venue Unlocks:** Tie venue size/prestige to studio reputation and era progression.
-   **Marketing Effectiveness:** Marketing budget should have a clear but not overly deterministic impact on attendance/revenue.
-   **Event Frequency:** Balance how often events can be held to avoid them overshadowing studio work.
-   **Playtesting:**
    -   Test event planning UI for clarity and ease of use.
    -   Adjust difficulty of achieving profitable/successful events.
    -   Monitor impact on overall game progression and artist development.

## 3. Gear Maintenance Minigame

### Mechanic Description
Studio equipment requires periodic maintenance to perform optimally. If neglected, equipment can suffer quality degradation, increased noise, or even temporary downtime.
-   **Maintenance Triggers:** Maintenance needs can arise based on equipment age, usage intensity, or randomly (more frequently for older/vintage gear).
-   **Minigame:** When maintenance is due, players can initiate a minigame specific to the equipment type or era (e.g., calibrating a tape machine in Analog Era, cleaning contacts, degaussing heads; or running diagnostics for digital gear).
-   **Outcomes:** Successful minigame completion restores equipment to optimal condition, possibly with a small temporary boost. Failure might worsen the condition or extend downtime. Players can also opt to pay for professional servicing (more expensive, no minigame, guaranteed success but takes time).

### Objectives
-   Enhance the realism and engagement of the equipment system.
-   Introduce a new interactive challenge related to studio upkeep.
-   Add strategic decisions about when and how to maintain gear.
-   Align with `ROADMAP copy.md`’s suggestion for equipment maintenance.

### Player Impact
-   Adds a layer of resource management (time/money for maintenance).
-   Creates consequences for neglecting studio gear.
-   Provides a hands-on way to interact with iconic studio equipment.
-   Introduces a new failure state (temporary equipment downtime) that players must manage.

### Integration with Existing Systems
-   **New Component: `GearMaintenanceGame.tsx`:** A React component for the minigame UI. This will use Framer Motion for animations and Web Audio API for sound effects, similar to existing minigames.
-   **`EquipmentDetailModal.tsx`:** Display equipment condition and provide an option to initiate maintenance.
-   **`useGameState` / `Equipment` type:** Add a `condition` property (e.g., 0-100) to `Equipment` objects in `ownedEquipment`. Track maintenance schedules or triggers.
-   **`gameUtils.ts` / `projectUtils.ts`:** Equipment condition could negatively impact project quality calculations if below a certain threshold.
-   **Web Audio API / Framer Motion:** Used for the minigame's interactivity and visual feedback.

### Balance and Testing Plan
-   **Maintenance Frequency:** Balance how often gear needs maintenance to be engaging but not tedious. Vintage/older gear could require more frequent attention.
-   **Minigame Difficulty:** Minigames should be skill-based but not overly punishing. Difficulty could scale with equipment complexity/value.
-   **Cost of Professional Servicing:** Make it a viable but more expensive alternative to the minigame.
-   **Impact of Poor Condition:** Degradation effects (e.g., reduced quality bonus, increased project time) should be noticeable but not immediately crippling.
-   **Prototyping (Gear Maintenance Minigame):**
    -   Develop a simple UI prototype for one type of maintenance (e.g., tape machine calibration with sliders or button sequences).
    -   Use Framer Motion for visual feedback (e.g., meters moving, lights blinking).
    -   Integrate basic sound effects using Web Audio API via `gameAudio` instance.
-   **Playtesting:**
    -   Test minigame engagement and perceived fairness.
    -   Adjust frequency of maintenance needs.
    -   Target ≤3 clicks for initiating maintenance and key minigame interactions.

---
This GDD section provides a foundation for developing these new mechanics. Further detailed design documents may be created for each mechanic as development progresses.
