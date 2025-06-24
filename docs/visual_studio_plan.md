# Visual Studio Overhaul Implementation Plan

## 1. Curated Open-Source Asset Library

### Backgrounds & Studio Environments
- **[Isometric Room Pack (CC0)](https://opengameart.org/content/isometric-room-pack)**  
  *License:* CC0 (Public Domain)  
  *Type:* Isometric room backgrounds, furniture, props  
  *Notes:* Modular, recolorable for music studio look
- **[Buildings Collection Top Down Pixel Art (CraftPix)](https://craftpix.net/product/buildings-collection-top-down-pixel-art/)**  
  *License:* CraftPix Free/Premium (check per asset, most free assets are commercial-friendly)  
  *Type:* Top-down rooms, can be adapted for a studio

### Equipment & Instruments
- **[Misc and Tool Items (CC0)](https://opengameart.org/content/misc-and-tool-items)**  
  *License:* CC0 (Public Domain)  
  *Type:* 2D icons/sprites for guitars, keyboards, violin, tambourine, etc.  
  *Notes:* Pixel art, can be upscaled or stylized for consistency
- **[Craft Station Pixel Art Objects (CraftPix)](https://craftpix.net/product/craft-station-pixel-art-objects/)**  
  *License:* CraftPix Free/Premium (check per asset)  
  *Type:* Pixel art objects, some suitable for music studio props
- **[Free Pixel Dungeon Props and Objects Asset Pack (CraftPix)](https://craftpix.net/freebies/free-pixel-dungeon-props-and-objects-asset-pack/)**  
  *License:* Free for commercial use  
  *Type:* Misc props, can be adapted for studio clutter

### UI/Overlay
- **[Free GUI for Cyberpunk Pixel Art (CraftPix)](https://craftpix.net/freebies/free-gui-for-cyberpunk-pixel-art/)**  
  *License:* Free for commercial use  
  *Type:* UI overlays, buttons, and panels

---

## 2. Scene Implementation Blueprint (PixiJS)

### Layer Structure
1. **Background Layer**
   - Render isometric/top-down room as the base.
   - Composite multiple backgrounds for depth (walls, floor, windows).
2. **Static Furniture Layer**
   - Place static props (tables, shelves) from room/furniture packs.
3. **Equipment Layer**
   - For each player-owned equipment:
     - Map equipment type to curated sprite (e.g., `guitar` → `item_guitar.png`).
     - Place at pre-defined (x, y) coordinates for a natural studio layout.
     - Allow for future drag-and-drop rearrangement.
4. **UI Overlay Layer**
   - Render diegetic overlays (e.g., glowing outlines on hover, tooltips on click).
   - Use pixel-art UI elements for consistency.

### Interaction
- **Hover:** Show tooltip with equipment details.
- **Click:** Open modal for upgrades/details.
- **(Optional) Drag:** Rearrange equipment in the studio.

---

## 3. Data Mapping

### Equipment Data Structure Example
```ts
// src/data/equipmentSprites.ts
export const equipmentSpriteMap = {
  'guitar': { sprite: 'item_guitar.png', x: 120, y: 220 },
  'keyboard': { sprite: 'item_keyboard.png', x: 200, y: 240 },
  'violin': { sprite: 'item_violin.png', x: 160, y: 260 },
  // ...more mappings
};
```
- **Player Equipment:** Pulled from game state (e.g., `player.ownedEquipment`).
- **Scene Layout:** Coordinates and layering defined in a config file for easy adjustment.

---

## 4. Documentation Update Strategy

- **Update `docs/open_source_game_assets_analysis.md`:**
  - Add all new assets with direct links, license, and usage notes.
  - For each asset, specify which equipment or scene element it is mapped to.
  - Note any modifications (e.g., recoloring, cropping) for transparency.

- **Maintain/Update this Plan:**
  - Document the full implementation blueprint, asset list, and data mapping.
  - Include a visual diagram (Mermaid or image) of the planned scene layout (to be added after initial integration).
  - Updated background color to `#4c566a`.
  - Added `isometric_room.png` as background sprite.
---

## 5. Step-by-Step Implementation Approach

### Phase 1: Documentation and Data Integration
1. **Update `docs/open_source_game_assets_analysis.md`** with curated assets, links, and license info.
2. **Map new assets** in a config/data file, associating each equipment type with its sprite and (x, y) position.

### Phase 2: Visual Implementation in PixiJS
3. **Build the studio scene** in PixiJS, rendering the new background.
4. **Render player equipment** by iterating through owned items and placing sprites at mapped coordinates.
5. **Ensure visual harmony** by adjusting placement, scale, and tint for a cohesive, immersive look.
6. **Implement interactions** (hover, click, drag) for equipment objects.

---

*This plan will be updated as new assets are integrated or requirements evolve. All code and documentation will be kept in sync for maintainability and legal compliance.* 