# Immersion audit: website/idle-clicker feel vs. a real game

Method: played the built game in headless Chromium at 1440x900 and 390x844 (splash, era, producer, tutorial, floor, bookings, gear, crew, career, session), plus a read of `ContextDrawer`, `MainGameContent`, `StudioRoom`, `WebGLCanvas`. Benchmarks: Kairosoft, Game Dev Story, Youtuber's Life.

The isometric room, lighting and dock are already strong. What breaks the spell is what happens when you *do* something.

## Ranked findings

1. **The core loop leaves the world (fixed in this PR, desktop).** Booking opened a ~1400px, blurred, dimmed "At the console" modal that hid the studio. Kairosoft keeps the room and the characters on screen while work happens. The session console now docks to the side on desktop (<=680px) with an undimmed scrim.
2. **No one is in the room (fixed in this PR).** The floor showed generic staff only; the booked artist never appeared. A named artist now steps up to the live-room mic for the session and sways with work intensity (respects reduced motion).
3. **Session screen is a form, not a console (open).** Focus sliders, "96% Match" chips, stage and track bars read as a dashboard. Game Dev Story shows a stats tape plus one big action, with the rest folded away. Suggest: collapse focus allocation behind one "Mix" button, keep meter + Lock Take + artist mood.
4. **Mobile session is a long scroll (open).** At 390px the session stacks ~4 screens of panels; the take button is below the fold. Needs a pinned transport dock.
5. **Takes do not touch the world (open).** Locking a take should flash VU bars, nod the artist, shake the glass, and pop a floating grade over the booth. Today feedback lives inside the modal.
6. **Text-heavy menus (open).** Era/producer pickers and bookings are paragraphs on cards. Add portraits, one-line hooks and icon stats.
7. **Characters are anonymous (open).** Staff share one sprite with colour swaps and no names, moods or speech bubbles. Kairosoft's charm comes from tiny bubbles and emotes.
8. **Time does not pass visibly (open).** Day advances only via buttons; no dawn/dusk beat, no "end of day" summary moment.

## Handoffs (other threads own these)
- Ambient earning / event director (#56): 5, 7, 8 (bubbles, day-end beat).
- Sprite/asset factory (#103): distinct staff and artist sprites for 2 and 7.
- Mobile thread (#97): 4.
