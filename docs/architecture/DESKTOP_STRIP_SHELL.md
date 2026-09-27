# Recording Studio Tycoon — Desktop Strip Shell

## Goal

Ship the compact Studio Strip as a real desktop companion mode without rewriting the existing React/Vite game.

The browser implementation in `StudioStrip.tsx` is the UX prototype. The desktop shell should reuse the same UI and game state.

## Recommended shell: Tauri 2

Tauri fits the existing stack because the game already uses React, TypeScript and Vite. The web UI can remain the main product while a small Rust shell provides desktop window control.

### Required desktop behaviours

- narrow horizontal window sized to the current monitor,
- positioned against the lower work area,
- decorations disabled,
- resizable off in compact mode,
- optional always-on-top mode,
- expand into the normal management window,
- restore the player's previous window state,
- optional click-through only for explicitly non-interactive decorative regions.

### Relevant Tauri 2 capabilities

Current Tauri window APIs expose:
- `setPosition`
- `setSize`
- `innerPosition`
- `innerSize`
- `setIgnoreCursorEvents`

Window configuration supports disabling native decorations. Tauri's window-state plugin can persist window state.

For the first shell, avoid true transparent-window effects. They add platform-specific complexity, especially on macOS, without improving the core loop enough to justify the risk.

## First implementation

1. Add Tauri 2 to the current Vite project.
2. Keep the existing full-window game as the default view.
3. Add a compact mode command that:
   - gets the current monitor work area,
   - sets height to roughly 150–190 logical pixels,
   - sets width to the monitor work-area width,
   - positions the window at the work-area bottom,
   - disables resizing and native decorations.
4. Expand restores the last full-window size and position.
5. Add an optional "Keep studio above other windows" setting.
6. Persist compact/full preference separately from ordinary game saves.

## Platform rule

Do not attempt OS-level dock/taskbar replacement behaviour. RST should remain an ordinary desktop window that happens to fit neatly against the bottom of the user's screen.

This keeps behaviour predictable across Windows, macOS and Linux.

## Acceptance criteria

- Compact mode uses the real `StudioStrip` component.
- The strip never exceeds the current monitor work area.
- Expand/collapse does not reload game state.
- Moving between monitors recalculates compact placement.
- The player can disable always-on-top.
- The window remains fully interactive in the studio areas.
- Save files remain platform-independent.
- Browser builds continue working without Tauri APIs.

## Later options

Only after the core loop proves enjoyable:
- borderless transparency,
- hide/show on global hotkey,
- launch-at-login,
- system tray controls,
- click-through decorative background,
- separate compact and expanded windows.
