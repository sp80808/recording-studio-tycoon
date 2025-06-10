# Store UI Enhancement Plan

## Objective
Clean up the store interface by only showing items that are both unlocked and affordable, creating a more focused shopping experience.

## Implementation Plan

### 1. Store Filtering Logic
```typescript
interface StoreItemFilter {
  isUnlocked: (item: Equipment, gameState: GameState) => boolean;
  isAffordable: (item: Equipment, gameState: GameState) => boolean;
  meetsRequirements: (item: Equipment, gameState: GameState) => boolean;
}

const filterAvailableItems = (
  items: Equipment[],
  gameState: GameState
): Equipment[] => {
  return items.filter(item => 
    isUnlocked(item, gameState) && 
    isAffordable(item, gameState) &&
    meetsRequirements(item, gameState)
  );
};
```

### 2. Required Changes

#### Equipment Display Logic
- Move filtering logic to a separate utility function
- Add price check against player's current money
- Check feature unlock status using existing featureUtils
- Verify skill requirements are met

#### Store UI Components
- Update store layout to handle varying number of items
- Add toggle to "Show All Items" (optional feature)
- Consider adding "Coming Soon" section for nearly unlockable items
- Add sorting options (price, category, etc.)

#### Integration Points
- Hook into progression system for unlock checks
- Monitor player money for affordability updates
- Track skill levels for requirement checks

### 3. UX Improvements
- Clean, focused display of available items
- Clear categorization
- Sort options based on relevant metrics
- Quick purchase workflow
- Visual feedback on why items might be hidden

### 4. Edge Cases to Handle
- Items becoming unaffordable during session
- New items unlocking during play
- Skill requirements being met/unmet
- Feature unlocks affecting availability

## Success Criteria
1. Store only shows truly available items by default
2. Performance remains smooth with filtering
3. Clear feedback on why items are unavailable (if shown)
4. Immediate updates when items become available/unavailable
5. Intuitive organization of available items

## Implementation Steps
1. Create StoreItemFilter utilities
2. Update store component logic
3. Modify UI to handle filtered items
4. Add sorting/categorization
5. Implement real-time updates
6. Test with various game states

## Notes
- Consider caching filter results for performance
- Update tutorial to reflect new store behavior
- Plan for future expansion of store items
- Consider adding wishlist for locked/unaffordable items
