# Current Task: Staff Assignment UX Improvements

## Status: In Progress
- [ ] Project Window Staff Integration
- [ ] Smart Slider Automation
- [ ] Utility Functions Implementation
- [ ] UX Enhancements
- [ ] System Integration

## Detailed Implementation Plan

### 1. Project Window Staff Integration
- [ ] Create StaffAssignmentSection component
- [ ] Implement StaffCard component
- [ ] Add staff filtering capabilities
- [ ] Enable direct assignment/unassignment
- [ ] Display relevant staff stats and skills

### 2. Smart Slider Automation
- [ ] Implement calculateStaffProjectMatch utility
- [ ] Create getOptimalSliderPositions function
- [ ] Add auto-optimize button and handler
- [ ] Develop visual feedback system

### 3. Utility Functions
- [ ] calculateStaffProjectMatch
  - Input: StaffMember, Project
  - Output: Match score (0-100)
- [ ] getOptimalSliderPositions
  - Input: StaffMember[], ProjectStage
  - Output: Optimal slider positions
- [ ] predictProjectOutcome
  - Input: Current assignments
  - Output: Quality/speed predictions

### 4. UX Improvements
- [ ] Tooltip system for staff suitability
- [ ] Hover states for detailed stats
- [ ] Visual feedback for auto-optimization
- [ ] Quick filter controls

### 5. Integration Points
- [ ] Update useStaffManagement hook
- [ ] Modify useStageWork calculations
- [ ] Adjust project status computations

## Success Criteria
- [ ] Staff assignment workflow reduced to ≤3 clicks
- [ ] Auto-optimization accuracy ≥90%
- [ ] Performance maintains <100ms response time with 20 staff
- [ ] Clear visual feedback on all interactions

## Technical Notes
```tsx
// StaffAssignmentSection Props
interface StaffAssignmentSectionProps {
  projectId: string;
  availableStaff: StaffMember[];
  assignedStaff: StaffMember[];
  onAssign: (staffId: string) => void;
  onUnassign: (staffId: string) => void;
  onAutoOptimize: () => void;
}

// StaffCard Props
interface StaffCardProps {
  staff: StaffMember;
  projectMatch: number;
  isAssigned: boolean;
  onAction: () => void;
}
```

## Next Steps
1. Complete StaffAssignmentSection component
2. Implement core matching algorithms
3. Develop auto-optimization logic
4. Integrate with existing systems
5. Conduct usability testing

## Risks & Mitigation
- Performance issues with many staff:
  - Implement virtual scrolling
  - Add debouncing to calculations
- Complex matching logic:
  - Start with simple scoring
  - Gradually add complexity
- UI clutter:
  - Use progressive disclosure
  - Implement clean, minimal design
