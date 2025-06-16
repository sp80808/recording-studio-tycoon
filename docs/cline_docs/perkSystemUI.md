# Perk System UI Conceptualization

## 1. Overview
This document outlines the UI design for the Studio Perks system, allowing players to view, understand, and unlock perks to enhance their studio capabilities.

## 2. Goals
- Provide a clear and intuitive interface for perk management.
- Visually represent perk dependencies and categories.
- Clearly display perk effects, costs, and unlock conditions.
- Allow easy navigation and interaction.

## 3. UI Structure & Layout

### Main Perk Screen
- **Layout**: A full-screen modal or a dedicated page within the game's management interface.
- **Sections**:
    - **Categories/Tabs (Left/Top)**: Filters perks by `StudioPerkCategory` (e.g., "Acoustics," "Business Operations," "Talent Acquisition"). Selecting a category updates the main display area.
    - **Perk Display Area (Center/Main)**:
        - Shows perks belonging to the selected category.
        - Could be a grid or a branching tree layout if dependencies are complex and numerous. A categorized list/grid might be simpler to implement initially.
        - Each perk is represented by a `PerkCard`.
    - **Player Resources (Top/Side)**: Displays current `Money` and `Perk Points` available.
    - **Selected Perk Detail Panel (Right/Bottom or Modal)**: When a `PerkCard` is clicked, this panel shows detailed information and an unlock button.

## 4. Perk Card (`PerkCard.tsx`)
- **Content**:
    - Perk Icon (if available)
    - Perk Name (`StudioPerk.name`)
    - Perk Tier (`StudioPerk.tier`) - visually indicated (e.g., stars, color-coding)
    - Status Indicator:
        - **Unlocked**: Clearly marked (e.g., highlighted border, checkmark icon).
        - **Available**: Indicates all prerequisites and unlock conditions are met, and the player has enough resources.
        - **Locked (Prerequisites Met, Conditions Not Met)**: Shows conditions not yet met.
        - **Locked (Prerequisites Not Met)**: Dims the card or shows locked icon, indicates missing prerequisite perks.
- **Interaction**:
    - Click to show details in the `Selected Perk Detail Panel`.
    - Hover to show a brief tooltip with `StudioPerk.description`.

## 5. Selected Perk Detail Panel
- **Content**:
    - Perk Icon and Name (larger)
    - Full Perk Description (`StudioPerk.description`)
    - Category (`StudioPerk.category`)
    - Tier (`StudioPerk.tier`)
    - **Effects**: Clearly listed (`StudioPerk.effects[]`).
        - Example: "+5% Recording Quality", "Unlocks: Advanced Mixing Techniques"
    - **Cost**: (`StudioPerk.cost`)
        - Money: `10,000`
        - Perk Points: `2`
    - **Unlock Conditions**: (`StudioPerk.unlockConditions[]`)
        - List each condition and its status (e.g., "Player Level 5 (Met)", "Studio Reputation 50 (Not Met - Current: 45)").
    - **Prerequisites**: (`StudioPerk.prerequisites[]`)
        - List required perks. Clicking a prerequisite could highlight it in the main display area.
    - **Unlock Button**:
        - Enabled if perk is available and player has sufficient resources.
        - Text: "Unlock" or "Upgrade" (if repeatable).
        - Disabled with a tooltip explaining why (e.g., "Not enough money," "Requires 'Basic Acoustics' perk").
- **Repeatable Perks**:
    - If `isRepeatable`, show current unlocked count vs `maxRepeats`.
    - Cost might scale with repeats.

## 6. Visual Design & Flow
- **Tree/Graph View (Optional - Advanced)**: For categories with strong dependencies, a visual tree connecting perks could be useful. Lines would connect prerequisites to subsequent perks.
- **Color Coding**: Use colors to indicate perk status (unlocked, available, locked).
- **Animations**: Subtle animations for unlocking perks or transitioning views.
- **User Flow**:
    1. Player opens Perk Screen.
    2. Player browses categories/tabs.
    3. Player clicks a `PerkCard`.
    4. Detail Panel shows information.
    5. If available and affordable, player clicks "Unlock."
    6. Game state updates, resources are deducted, `applyAllPerkEffects` is called.
    7. UI refreshes to show the perk as unlocked and updates player resources.

## 7. Component Breakdown (Conceptual)
- `PerkScreen.tsx`: Main container.
- `PerkCategoryNavigation.tsx`: Tabs/list for categories.
- `PerkDisplayGrid.tsx` / `PerkDisplayTree.tsx`: Area for showing perk cards.
- `PerkCard.tsx`: Individual perk representation.
- `PerkDetailPanel.tsx`: Shows details of a selected perk.
- `UnlockConditionItem.tsx`: Displays a single unlock condition and its status.
- `EffectListItem.tsx`: Displays a single perk effect.

## 8. Service Integration
- The UI will primarily interact with `studioUpgradeService.ts`:
    - `getAvailablePerks(gameState)`: To populate the display, though the UI might fetch all perks and determine availability client-side for richer display of locked states. More likely, fetch all perks and use `canUnlockPerk` for individual status.
    - `getOwnedPerks(gameState)`: To identify already unlocked perks.
    - `unlockPerk(perkId, gameState)`: Called when the unlock button is pressed. The service handles resource deduction and applying effects.
- The UI needs access to `gameState` to display player resources (money, perk points) and to check conditions dynamically.

## 9. Future Considerations
- Search/Filter functionality within categories.
- "Recommended Perks" section based on player progress or goals.
- Visual indication of how a perk affects specific game mechanics (e.g., highlighting relevant UI elements in the main game when a perk detail is viewed).
