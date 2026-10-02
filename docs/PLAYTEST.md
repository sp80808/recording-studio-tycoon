# External playtest script (#153 release gate)

Purpose: find out whether someone who has never seen the game can start a career, book and finish a paid session, understand why it went the way it did, and choose to play again. This is the Phase 3 gate from #153. The automated slice (`tests/first-career-slice.check.cjs`) proves the path is unblocked; this script proves it is understandable.

## Before you start

- Recruit **5 people who have not followed development**. Phone players first (that is where most will meet it), at least 2 on a phone, ideally 1 on desktop.
- Build: the production URL or a fresh `pnpm run build && pnpm exec vite preview`. Use a private window so each player starts with no save.
- Screen-record if the player agrees. Otherwise the observer keeps the timing sheet below.
- The observer says nothing about the game beyond the opening line. No hints, no "tap that". If the player asks a question, answer "what would you try?" and note it as a confusion.

## Opening line (read exactly)

"This is a game about running a recording studio. Play it however you like. Say out loud what you are thinking. I can't help, but I will take notes. Stop whenever you want."

## Tasks (do not assign them, only watch for them)

1. Starts a career (new studio, era, producer, role).
2. Finds and books the first paid session.
3. Plays the session to its end (takes, review).
4. Reads the result.
5. Decides what to do next (upgrade, hire, book again).

Only if the player has done none of 5 after 3 minutes of idle time, ask: "What would you do next?" Record the answer word for word.

## Timing sheet (one per player)

| Mark | How to read it | Time (mm:ss) |
|---|---|---|
| Studio open | tutorial finished, studio floor visible | |
| First booking | taps Book Session on the first enquiry | |
| First session complete | review dialog appears | |
| Settled | closes the review, money has moved | |
| Second project start | books another session with no prompt | |

The automated slice records the same marks, so the machine time is the floor and the human time is the gap to close.

## Questions after play (ask in order, write the answer)

1. What was the game asking you to do?
2. The last session turned out how it did. Why do you think that happened?
3. What would you upgrade or change next, and why?
4. Was there a moment you were not sure what to tap? Where?
5. Would you play another session now? (note whether they already did)

## Observation checklist (tick what you see, add notes)

- [ ] Hesitates 10s or more on a screen (note which)
- [ ] Taps something that is not a button, or misses a button twice
- [ ] Scrolls looking for something on the core loop
- [ ] Does not notice the Artist route to enquiries
- [ ] Locks takes on purpose, or taps without watching the meter
- [ ] Reads the review, or skips it
- [ ] Can say where money and reputation came from
- [ ] Starts a second project unprompted
- [ ] Stops, and what they said when they stopped

## Pass line (from #153)

- At least 5 players complete one paid session.
- At least 3 of 5 begin a second project without being told to.
- Every confusion below has a triage row. Further simulation breadth resumes only after this report is reviewed.

## Report template

Copy to a new file (docs/playtests/YYYY-MM-DD.md) after the sessions.

### Numbers

| Player | Device | First booking | First complete | Settled | Second project? |
|---|---|---|---|---|---|
| P1 | | | | | |

First-session completion rate: _ / 5. Second-project start rate: _ / 5.

### Confusions and blockers

| # | What happened | Players | Triage (fix / defer / intentional) | Issue |
|---|---|---|---|---|
| 1 | | | | |

### "What would you do next?" answers

One line per player, verbatim.

## What the automated slice covers

`RST_BASE_URL=http://127.0.0.1:5173 node` the check through Playwright with an iPhone profile (see the header of `tests/first-career-slice.check.cjs`). It fails on: horizontal overflow on a phone, an enquiry without booking terms, no review after the take loop, no money change after settlement, no second booking offered, no Continue after reload, or any console error. It does not judge clarity. That is what the five players are for.

## Arc coverage today (honest status, 2026-10-02)

The first-career arc in #153 is `bedroom studio -> first paid client -> gear/staff choices -> harder sessions -> project-room milestone -> prestige/finale session`.

| Step | Automated | Notes |
|---|---|---|
| Start a career | yes | onboarding to studio floor, about 8s |
| First paid booking | yes | one tap from the Artist route, about 16s |
| First session to settlement | yes | phone, 2 takes, about 31s to review, money moves |
| Second booking offered | yes | board still has work, one tap |
| Save and Continue | yes | reload offers Continue studio |
| Gear and staff choices | no | needs a longer scripted run; watch it in the playtest |
| Project-room milestone | no | premises tiers exist (`src/rpg/premises.ts`); the milestone beats are #70 |
| Prestige or finale session | no | campaign endings exist (`src/narrative/endings.ts`); reaching one needs a long run |

Players are not expected to reach the last three rows in a first sitting. Record what they say they would do next instead.
