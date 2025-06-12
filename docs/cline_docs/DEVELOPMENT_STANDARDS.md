# Development Standards & Version Control Guidelines
*Recording Studio Tycoon - Code Quality & Documentation Standards*

## 📋 File Header Standards

### Required Headers for All Source Files
```typescript
/**
 * @fileoverview [Brief description of file purpose]
 * @version 0.3.0
 * @author Recording Studio Tycoon Development Team
 * @created [YYYY-MM-DD]
 * @modified [YYYY-MM-DD]
 * @lastModifiedBy [Developer Name or Bot]
 */
```

### Example Implementation
```typescript
/**
 * @fileoverview Enhanced charts panel with Billboard-style layout and audio preview
 * @version 0.3.0
 * @author Recording Studio Tycoon Development Team
 * @created 2025-06-08
 * @modified 2025-06-08
 * @lastModifiedBy GitHub Copilot
 */

import React, { useState, useEffect } from 'react';
// ... rest of file
```

---

## 🗂️ Documentation Standards

### Documentation File Headers
```markdown
<!-- 
  File: [filename]
  Purpose: [Brief description]
  Version: 0.3.0
  Created: 2025-06-08
  Last Modified: 2025-06-08
  Status: [Active/Draft/Deprecated]
-->
```

### Change Log Format
Every documentation file should include a change log section:
```markdown
## Change Log
- **2025-06-08**: Initial creation (v0.3.0)
- **2025-06-08**: Added section on X (v0.3.0)
- **Future**: Planned updates for next version
```

---

## 🔧 Code Comment Standards

### Function Documentation
```typescript
/**
 * Calculates artist contact cost based on reputation and level
 * @param artistReputation - Artist's industry reputation (0-100)
 * @param playerLevel - Current player level
 * @param baseModifier - Base cost multiplier (default: 1.0)
 * @returns Contact cost in game currency
 * @since v0.3.0
 * @example
 * const cost = calculateContactCost(85, 10, 1.2);
 */
function calculateContactCost(
  artistReputation: number, 
  playerLevel: number, 
  baseModifier: number = 1.0
): number {
  // Implementation details with inline comments
}
```

### Component Documentation
```typescript
/**
 * Enhanced Charts Panel Component
 * 
 * Displays music industry charts with audio preview functionality,
 * artist contact system, and market trend analysis.
 * 
 * @component
 * @version 0.3.0
 * @since v0.3.0
 * 
 * @param {GameState} gameState - Current game state
 * @param {Function} onContactArtist - Artist contact callback
 * 
 * @features
 * - Billboard-style chart display
 * - 25-second audio previews
 * - Artist contact system
 * - Market trend visualization
 * 
 * @dependencies
 * - Requires audio files in /src/audio/chart_clips/
 * - Uses chartsData utility functions
 * - Integrates with ArtistContactModal
 */
export const ChartsPanel: React.FC<ChartsPanelProps> = ({ gameState, onContactArtist }) => {
  // Component implementation
};
```

---

## 📅 Version Tagging System

### Git Commit Message Format
```
type(scope): description [version]

feat(charts): add audio preview system [v0.3.0]
fix(minigames): resolve trigger frequency issues [v0.3.0]
docs(api): update component documentation [v0.3.0]
refactor(ui): consolidate chart panel implementations [v0.3.0]
test(integration): add charts system tests [v0.3.0]
```

### Commit Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Scope Examples
- **charts**: Charts system components
- **minigames**: Minigame implementations
- **ui**: User interface components
- **audio**: Audio system and assets
- **docs**: Documentation updates
- **config**: Configuration changes

---

## 🏗️ File Organization Standards

### Directory Structure Documentation
```
src/
├── components/           # React components
│   ├── charts/          # Charts-related components
│   ├── minigames/       # Minigame implementations
│   ├── modals/          # Modal dialogs
│   ├── animations/      # Animation components
│   └── ui/              # Reusable UI components
├── contexts/            # React contexts
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
├── data/                # Static data and configurations
└── audio/               # Audio assets
    ├── chart_clips/     # Chart preview audio files
    ├── ui_sfx/         # UI sound effects
    └── music/          # Background music
```

### Naming Conventions
- **Components**: PascalCase (e.g., `ChartsPanel.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useBackgroundMusic.ts`)
- **Utils**: camelCase (e.g., `minigameUtils.ts`)
- **Types**: PascalCase (e.g., `GameState`, `ChartEntry`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `MAX_CHART_ENTRIES`)

---

## 📊 Code Quality Standards

### TypeScript Strict Mode
All files must comply with strict TypeScript settings:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Component Size Guidelines
- **Maximum 500 lines per component**
- **Split large components into smaller, focused modules**
- **Use composition over inheritance**
- **Implement proper prop interfaces**

### Performance Standards
- **Lazy loading for heavy components**
- **Memoization for expensive calculations**
- **Proper cleanup in useEffect hooks**
- **Optimized re-renders with React.memo where appropriate**

---

## 🧪 Testing Standards

### Test File Naming
- Unit tests: `ComponentName.test.tsx`
- Integration tests: `ComponentName.integration.test.tsx`
- E2E tests: `feature.e2e.test.tsx`

### Test Documentation
```typescript
/**
 * ChartsPanel Component Tests
 * @version 0.3.0
 * @testSuite ChartsPanel
 * @coverage Unit tests for charts panel functionality
 */

describe('ChartsPanel', () => {
  /**
   * @test Audio preview functionality
   * Verifies that audio clips play correctly and track progress
   */
  it('should play audio preview and track progress', () => {
    // Test implementation
  });
});
```

---

## 📝 Review Process

### Code Review Checklist
- [ ] File headers present and correct
- [ ] Functions properly documented
- [ ] TypeScript strict mode compliance
- [ ] Performance considerations addressed
- [ ] Error handling implemented
- [ ] Tests updated/added
- [ ] Documentation updated

### Review Approval Process
1. **Automated checks** pass (linting, TypeScript, tests)
2. **Code review** by team member or senior developer
3. **Documentation review** for public API changes
4. **Performance review** for components >200 lines
5. **Integration testing** for system-wide changes

---

## 🔄 Migration Guidelines

### Version Migration Process
1. **Identify breaking changes** in new version
2. **Create migration scripts** for data/save compatibility
3. **Update version tracking** in SaveSystemContext
4. **Document migration steps** in VERSION_HISTORY.md
5. **Test backward compatibility** with previous saves

### Deprecation Process
1. **Mark as deprecated** with `@deprecated` JSDoc tag
2. **Add deprecation warning** to console in development
3. **Update documentation** with replacement recommendations
4. **Remove in next major version** after adequate notice period

---

*These standards ensure consistent, maintainable, and well-documented code throughout the Recording Studio Tycoon project.*
